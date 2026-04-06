# AI Library Backend

This backend powers the real library assistant chat flow with the Gemini API.

## Features

- `POST /api/chat` searches the Supabase `books` table
- sends matched catalog context to Gemini
- returns a grounded assistant reply to the frontend

## Setup

1. Copy `.env.example` to `.env`
2. Set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`

## Run

```bash
npm install
npm run dev
```

Default port is `8000`.

For local development, `FRONTEND_ORIGIN` can be a comma-separated list of allowed frontend URLs such as:

```text
http://127.0.0.1:4173,http://localhost:4173,http://127.0.0.1:5173,http://localhost:5173
```
