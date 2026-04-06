
# AI Library Chat Box UI/UX

This repository currently contains:

- a React/Vite frontend in the repository root
- a Node/Express backend in `backend/` for the Gemini-powered library assistant
- Supabase Auth for email/password, Google login, email verification, and password recovery
- a real Supabase-backed library browse flow
- a Gemini chat integration path for library-aware recommendations

The original design source is available at https://www.figma.com/design/4wLIhTYUxAKoqrHkbfrbvZ/AI-Library-Chat-Box-UI-UX.

## Frontend

1. Copy `.env.example` to `.env`
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Set `VITE_API_BASE_URL` to your backend origin, for example `http://localhost:8000`
4. Run `npm install`
5. Run `npm run dev`

## Backend

1. Go to [backend/README.md](C:\Users\phyow\OneDrive\Documents\AI%20Library%20Chat%20Box%20UI_UX\backend\README.md)
2. Copy `backend/.env.example` to `backend/.env`
3. Set your Supabase and Gemini API environment values
5. Run `npm install` from `backend/`
6. Run `npm run dev` from `backend/`

## Deployment

For production deployment, use the guide in [DEPLOYMENT.md](C:\Users\phyow\OneDrive\Documents\AI%20Library%20Chat%20Box%20UI_UX\DEPLOYMENT.md).

Recommended stack:

- frontend on Vercel
- backend on Render
- Supabase for auth and books
- Gemini API for AI responses

## Books Schema

To start the real browse-books workflow, run the SQL in `supabase/migrations/20260401_create_books.sql`
inside the Supabase SQL editor.

This creates a `public.books` table designed for the hybrid catalog model:

- metadata-only books imported from Open Library
- manually entered books
- books that also have a real file attached

Required fields for version 1:

- `title`
- `author`
- `source`
- `has_file`
- `is_public`

Conditional rule:

- if `has_file = true`, at least one of `storage_path` or `download_url` must be present

For a quick test setup, run `supabase/seeds/books_seed.sql` after the migration.

## Notes

- The Library page reads real books from Supabase.
- The chat UI now expects the backend service in `backend/` for live Gemini answers.
- The Profile page is still mostly demo data.
  
