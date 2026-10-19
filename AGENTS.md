# Project Rules

- The site served at `www.dfhennesa.com` is hosted on Vercel as a **direct upload** (no Git repository connected), so changes made in this Lovable project do not reach it automatically. Deployment changes to that host must be applied through the Vercel API/CLI with a user-provided token.
- `vercel.json` exists to proxy the backend at the same origin (`/sb-api/*` → the Supabase host) so that clients in mainland China do not have to reach `*.supabase.co` directly. Keep the proxy path and the rewrite rule together; changing one without the other breaks sign-in.
- The Lovable-hosted build must keep using the real backend URL from the auto-generated `.env`. Only the Vercel production build should override `VITE_SUPABASE_URL` with the same-origin proxy path, via a Vercel environment variable.
