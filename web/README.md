# Autoclipper Frontend (Next.js)

Frontend dashboard untuk menjalankan alur Autoclipper:

- Landing page production
- Login page (cookie-based auth)
- Dashboard protected route (`/dashboard`)
- Terms of Service (`/terms`)
- Privacy Policy (`/privacy`)
- Discover -> analyze/by-video -> render workflow

## Environment

Copy file environment:

```bash
cp .env.example .env.local
```

Isi variable:

```dotenv
AUTOCLIPPER_API_BASE_URL=https://virarero-be-clipper.hf.space
AUTH_SECRET=replace-with-a-long-random-secret
AUTH_ADMIN_EMAIL=admin@example.com
AUTH_ADMIN_PASSWORD=replace-with-strong-password
```

Frontend memakai API proxy internal di route `/api/autoclipper/*`, dan route ini meminta session login valid.

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Lalu buka `http://localhost:3000`.

## Deploy ke Vercel

1. Import repository ini ke Vercel.
2. Set Root Directory menjadi `web`.
3. Tambahkan Environment Variable:
   - `AUTOCLIPPER_API_BASE_URL` = URL backend production kamu.

4. Deploy.

Jika backend bersifat private, endpoint backend harus bisa diakses dari Vercel server runtime (atau tambahkan mekanisme auth di proxy).
