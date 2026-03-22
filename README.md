# Autoclipper MVP (Two-Mode Edition)

Autoclipper sekarang punya dua mode produk utama:

1. Discover Mode
2. Auto Detect from YouTube

Stack:

- Backend: FastAPI + SQLAlchemy + Alembic
- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- Data layer: Supabase Postgres + Supabase Storage
- Optional orchestration lanjut: n8n

## Backend Endpoints

- `GET /health`
- `POST /api/v1/discover-jobs`
- `GET /api/v1/discover-jobs`
- `POST /api/v1/jobs/analyze`
- `GET /api/v1/jobs`
- `GET /api/v1/jobs/{job_id}`
- `POST /api/v1/jobs/{job_id}/render`
- `POST /api/v1/jobs/{job_id}/schedule`

## Data Model

- `clip_jobs`
- `clip_candidates`
- `discover_jobs`
- `clip_metrics`

## Environment Variables (Backend)

Copy `.env.example` menjadi `.env`.

Minimum penting:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_BASE_URL`

## Environment Variables (Frontend)

Copy `web/.env.example` menjadi `web/.env` (atau `web/.env.local`).

Minimum penting:

- `AUTOCLIPPER_API_BASE_URL=http://backend:8000` (docker) atau `http://localhost:8000` (lokal)
- `AUTH_SECRET`
- `AUTH_ADMIN_EMAIL`
- `AUTH_ADMIN_PASSWORD`

## Run Backend (Local)

```bash
python3.11 -m venv .venv311
source .venv311/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Run Frontend (Local)

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

## Run With Docker Compose

```bash
docker compose up --build
```

Services:

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- Postgres: `localhost:5432`

## Testing

```bash
pytest -q
```

## Deploy Notes

- Jalankan migration saat startup/release step: `alembic upgrade head`.
- Pastikan binary `ffmpeg` tersedia di image/host backend.
- Untuk OpenRouter: jika API down, backend otomatis fallback ke ranking rule-based.
- Untuk render ke Supabase Storage: gunakan `SUPABASE_SERVICE_ROLE_KEY`.
