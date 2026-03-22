# Autoclipper Frontend

Next.js app untuk workflow dua mode:

- Discover Videos
- Use YouTube Link

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Required Env

- `AUTOCLIPPER_API_BASE_URL`
- `AUTH_SECRET`
- `AUTH_ADMIN_EMAIL`
- `AUTH_ADMIN_PASSWORD`

## Build

```bash
npm run build
npm run start
```

## Docker

```bash
docker build -t autoclipper-web .
docker run --rm -p 3000:3000 --env-file .env autoclipper-web
```
