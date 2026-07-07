# Deployment Guide

Production deployment for **Chandna Indoor Ground** on Vercel + Supabase.

## Stack

| Service | Purpose |
|---------|---------|
| Vercel | Next.js hosting, CI/CD |
| Supabase | Auth, Postgres, Storage, Realtime |
| Razorpay | Online payments |
| Brevo | Transactional email |
| Google OAuth | Customer sign-in (via Supabase) |

## 1. Environment variables

Copy `.env.example` to `.env` locally. In Vercel → **Settings → Environment Variables**, set the same keys for **Production** and **Preview**.

**Production URL:** `https://chandnaindoorground.in`

Required in production/preview (validated at runtime):

- `DATABASE_URL` — use Supabase **pooler** URL (`:6543`, `?pgbouncer=true`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` — must be `https://chandnaindoorground.in` in production
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`

Optional:

- `RAZORPAY_WEBHOOK_SECRET` — Razorpay Dashboard → Webhooks
- `SENTRY_DSN` — error monitoring (install `@sentry/nextjs` to enable)
- `DIRECT_URL` — direct Postgres for migrations only

## 2. Supabase

1. Create project, run SQL files in `supabase/` (order: manual schema → RLS → feature schemas).
2. Enable **Realtime** on required tables (see `supabase/realtime-schema.sql`).
3. **Authentication → URL configuration:**
   - Site URL: `https://chandnaindoorground.in`
   - Redirect URLs:
     - `http://localhost:3001/auth/callback`
     - `https://chandnaindoorground.in/auth/callback`
     - `https://*.vercel.app/auth/callback` (preview)
4. **Google OAuth:** add authorized redirect URIs matching Supabase callback.
5. Use **connection pooler** for `DATABASE_URL` on Vercel.

## 3. Vercel

1. Import GitHub repo.
2. Framework: Next.js (auto-detected).
3. Set all environment variables.
4. Add custom domain `chandnaindoorground.in` → follow DNS instructions.
5. Health check: `GET /api/health` (use for uptime monitors).

**Runtime:** Payment webhook and health routes use `nodejs` runtime.

## 4. Razorpay

**Test mode:** keys start with `rzp_test_`  
**Live mode:** keys start with `rzp_live_`

1. Set keys in Vercel env vars.
2. **Webhooks:** `https://chandnaindoorground.in/api/payments/webhook`
   - Events: `payment.captured`, `payment.failed`
   - Copy webhook secret → `RAZORPAY_WEBHOOK_SECRET`
3. Client checkout still uses `/api/payments/verify`; webhook is backup for missed callbacks.

## 5. Brevo

1. Create API key with **Send email** permission.
2. Verify sender domain/email.
3. Set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, optional `BREVO_SENDER_NAME`.
4. Without Brevo, dev uses console email provider (not for production).

## 6. Google OAuth

Configure in Supabase (not Vercel). Ensure redirect URLs include production domain and localhost for dev.

## 7. Custom domain & DNS

| Record | Value |
|--------|-------|
| A / CNAME | Vercel-provided target |
| Optional `www` | Redirect to apex |

Set `NEXT_PUBLIC_APP_URL=https://chandnaindoorground.in` after domain is live.

## 8. Optional Sentry

```bash
npm install @sentry/nextjs
```

Set `SENTRY_DSN` and follow [Sentry Next.js docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/). Disabled when `SENTRY_DSN` is unset.

## 9. Verify deployment

```bash
curl https://chandnaindoorground.in/api/health
```

Expect `status: "ok"` and healthy `database`, `storage`, `email`, `razorpay` checks.

## 10. Local production build

```bash
cp .env.example .env
# fill values
npm run build && npm run start
```
