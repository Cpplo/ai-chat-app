# Deployment Guide

This project is ready to deploy with:

- frontend on Vercel
- backend on Render
- Supabase for auth and books
- Gemini API for the AI assistant

## 1. Prepare Secrets

You will need these values:

### Frontend

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` = your deployed backend URL

### Backend

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` = `gemini-2.5-flash`
- `FRONTEND_ORIGIN` = your deployed frontend URL

## 2. Deploy Backend to Render

1. Push your repo to GitHub.
2. Go to Render.
3. Create a new Web Service from the repo.
4. Set:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add backend environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-2.5-flash`
   - `FRONTEND_ORIGIN=https://your-frontend-domain.vercel.app`
6. Deploy.
7. Open `https://your-backend-domain.onrender.com/health`
8. Confirm it returns JSON with `ok: true`

## 3. Deploy Frontend to Vercel

1. Go to Vercel.
2. Import the same GitHub repo.
3. Use the repository root as the frontend project.
4. Add frontend environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL=https://your-backend-domain.onrender.com`
5. Deploy.

## 4. Update Backend CORS

After Vercel gives you the final frontend URL:

1. Go back to Render.
2. Update:
   - `FRONTEND_ORIGIN=https://your-frontend-domain.vercel.app`
3. Redeploy the backend if needed.

## 5. Test End to End

1. Open the deployed frontend.
2. Log in.
3. Open Library and confirm books load.
4. Open Chat and test:
   - `Do you have python books?`
   - `What books do you recommend for beginners?`

## 6. Important Security Step

Because sensitive keys were exposed during development, rotate these before production:

- Supabase `service_role` key
- Gemini API key

Then update Render env vars with the new keys.

