# Rencana MVP Autoclipper (YouTube → TikTok)

## Tujuan
Membuat MVP autoclipper yang menerima input URL video YouTube + keyword, lalu secara otomatis:
- mengambil transcript YouTube,
- mencari potongan paling relevan berdurasi 15–20 detik,
- merender video vertikal 9:16 dengan subtitle,
- mengunggah hasilnya ke TikTok,
- mencatat status job dan metrik dasar ke spreadsheet/database.

## Scope MVP
Fokus hanya ke alur berikut:
1. Input URL YouTube
2. Input keyword/topik clip
3. Ambil transcript dari YouTube
4. Tentukan timestamp clip 15–20 detik
5. Render video 9:16 + subtitle basic
6. Upload ke TikTok
7. Simpan log hasil upload

Yang **belum masuk MVP**:
- Instagram upload
- multi-clip generation dalam satu job
- AI scoring yang kompleks
- subtitle per kata / karaoke style
- analytics per menit yang detail
- approval UI

## Arsitektur Singkat

### 1) Orchestrator
**n8n**

Fungsi:
- menerima input dari webhook/form
- validasi data
- memanggil Python service via endpoint API
- menerima hasil render
- upload ke TikTok
- update Google Sheets / database
- retry bila ada kegagalan

### 2) Processing Service
**Python + FastAPI**

Fungsi:
- ekstrak `video_id` dari URL YouTube
- ambil transcript YouTube
- cari segmen yang mengandung keyword
- pilih window terbaik 15–20 detik
- download video source
- render vertikal 9:16
- generate subtitle sederhana
- upload hasil ke storage transit
- mengembalikan URL hasil render ke n8n

### 3) Media Tools
- **youtube-transcript-api** → ambil transcript YouTube
- **yt-dlp** → download source video
- **FFmpeg** → trim, resize 9:16, burn subtitle

### 4) Database & Storage
- **Supabase Postgres** → simpan jobs, status, hasil upload
- **Supabase Storage** → simpan file hasil render sementara

### 5) Upload Platform
- **TikTok Content Posting API**

## Alur MVP

### Flow end-to-end
1. User submit:
   - `youtube_url`
   - `keyword`
   - opsional: `title/caption`
2. n8n menerima request
3. n8n membuat record job di database
4. n8n memanggil endpoint Python, misalnya `POST /jobs/clip`
5. Python service:
   - ambil transcript YouTube
   - cari keyword
   - pilih segmen 15–20 detik
   - download video
   - render 9:16 + subtitle
   - upload hasil ke Supabase Storage
   - return signed URL + metadata
6. n8n menerima hasil render
7. n8n upload video ke TikTok
8. n8n update status job ke database dan spreadsheet
9. n8n menjalankan cleanup object/file sementara bila upload sukses

## Keputusan Teknis MVP

### Transcript
Gunakan **transcript YouTube langsung** sebagai sumber utama.

Alasan:
- cepat
- gratis
- cukup untuk clip 15–20 detik
- implementasi sederhana

Catatan:
- bila transcript tidak tersedia, job ditandai gagal dulu pada MVP
- fallback ke Whisper bisa ditambahkan di fase berikutnya

### Clip Selection
Gunakan rule-based approach sederhana:
- cari segmen transcript yang mengandung keyword
- ambil buffer 1–2 detik sebelum keyword
- ambil 2–4 detik sesudah kalimat selesai
- batasi durasi akhir menjadi 15–20 detik

Prioritas pemilihan:
1. keyword match paling relevan
2. kalimat tidak terpotong aneh
3. durasi berada dalam range target

### Rendering
Render menggunakan FFmpeg dengan output:
- rasio **9:16**
- subtitle burned-in
- layout sederhana, misalnya:
  - crop ke vertikal,
  - atau video utama di tengah dengan background blur bila perlu

### Penyimpanan File
Untuk menghindari storage menumpuk:
- hasil render disimpan **sementara** ke Supabase Storage
- bucket dibuat **private**
- n8n membuat signed URL singkat untuk upload/pull
- setelah upload TikTok sukses, object dihapus

Strategi ini lebih aman daripada full streaming dan lebih hemat daripada menyimpan file permanen.

## Rekomendasi Tech Stack

### Core Stack
- **n8n**
- **Python**
- **FastAPI**
- **youtube-transcript-api**
- **yt-dlp**
- **FFmpeg**
- **Supabase Postgres**
- **Supabase Storage**
- **Google Sheets**
- **TikTok Content Posting API**

### Hosting MVP
Pilihan sederhana:
- **n8n**: self-host / cloud
- **FastAPI worker**: VPS / Docker container
- **Supabase**: managed

## Struktur Endpoint Python

### `POST /jobs/clip`
Request body:
```json
{
  "job_id": "uuid",
  "youtube_url": "https://youtube.com/watch?v=...",
  "keyword": "topik yang dicari",
  "duration_target": 20
}
```

Response sukses:
```json
{
  "job_id": "uuid",
  "status": "completed",
  "clip_start": 52.3,
  "clip_end": 69.8,
  "storage_path": "renders/job-uuid/final.mp4",
  "signed_url": "https://...",
  "subtitle_path": "subtitles/job-uuid/final.srt"
}
```

Response gagal:
```json
{
  "job_id": "uuid",
  "status": "failed",
  "reason": "Transcript not available"
}
```

## Struktur Data Database (Supabase)

### Table: `clip_jobs`
Kolom utama:
- `id`
- `youtube_url`
- `keyword`
- `status` (`queued`, `processing`, `completed`, `uploading`, `uploaded`, `failed`)
- `clip_start`
- `clip_end`
- `storage_path`
- `tiktok_post_id`
- `failure_reason`
- `created_at`
- `updated_at`

### Table: `clip_metrics`
Kolom utama:
- `id`
- `job_id`
- `platform`
- `views`
- `likes`
- `comments`
- `shares`
- `snapshot_at`

## Struktur Bucket Supabase Storage
- `renders/` → hasil video final sementara
- `subtitles/` → file `.srt` atau `.ass`
- `thumbs/` → thumbnail opsional

## Workflow n8n (MVP)

### Workflow 1 — Create Clip Job
1. **Webhook Trigger**
2. **Validate Input**
3. **Insert Job to Supabase**
4. **HTTP Request → FastAPI `/jobs/clip`**
5. **Check Response**
6. **If success → Upload to TikTok**
7. **Update Supabase status**
8. **Append row ke Google Sheets**
9. **Trigger cleanup**

### Workflow 2 — Cleanup Temporary Files
1. Trigger setelah upload sukses
2. Hapus object dari Supabase Storage
3. Update field cleanup status

### Workflow 3 — Metrics Polling
1. Cron schedule
2. Ambil list video TikTok yang sudah terupload
3. Call metrics endpoint TikTok
4. Simpan snapshot ke `clip_metrics`
5. Update Google Sheets

## Logging yang Perlu Ada
Minimum logging per job:
- input URL
- keyword
- transcript ditemukan / tidak
- timestamp clip terpilih
- hasil render sukses / gagal
- upload TikTok sukses / gagal
- cleanup sukses / gagal

## Risiko MVP

### 1) Transcript YouTube tidak tersedia
Dampak:
- job gagal diproses

Mitigasi fase berikutnya:
- fallback ke Whisper/faster-whisper

### 2) Keyword match jelek
Dampak:
- clip kurang natural

Mitigasi:
- tambah scoring rule sederhana
- tambah pilihan beberapa kandidat clip

### 3) Crop vertikal kurang bagus
Dampak:
- framing tidak ideal

Mitigasi:
- gunakan template background blur untuk video landscape

### 4) Upload API TikTok gagal
Dampak:
- job berhenti di tahap publish

Mitigasi:
- retry di n8n
- simpan status error detail

## Fase Setelah MVP
Setelah MVP stabil, roadmap berikutnya:
1. fallback Whisper bila transcript tidak ada
2. generate beberapa candidate clips per video
3. subtitle style yang lebih menarik
4. upload ke Instagram
5. analytics yang lebih detail
6. approval flow sebelum publish
7. dashboard internal

## Deliverables MVP
Target output MVP:
- workflow n8n aktif
- FastAPI service aktif
- 1 endpoint clip generation
- render video 9:16 15–20 detik
- subtitle basic burned-in
- upload ke TikTok
- status job tersimpan di Supabase
- log hasil di Google Sheets

## Ringkasan
MVP difokuskan pada jalur paling sederhana dan paling cepat tervalidasi:

**YouTube URL + keyword → transcript YouTube → pilih clip 15–20 detik → render 9:16 + subtitle → upload TikTok → log ke Supabase/Sheets**

Pilihan stack final untuk MVP:
- **n8n** sebagai orchestrator
- **FastAPI** sebagai processing service
- **FFmpeg + yt-dlp + youtube-transcript-api** sebagai engine media
- **Supabase Postgres + Storage** sebagai state dan transit storage
- **TikTok API** sebagai target publish
