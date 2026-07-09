# Production Checklist

## Before first deploy

- [ ] All `supabase/*.sql` migrations applied (including `production-hardening.sql` for slot holds + audit RLS fix)
- [ ] `.env.example` variables set in Vercel (Production + Preview)
- [ ] `NEXT_PUBLIC_APP_URL=https://chandnaindoorground.in`
- [ ] Supabase Site URL + redirect URLs configured
- [ ] Google OAuth redirect URIs updated
- [ ] Razorpay live/test keys match intended mode
- [ ] Razorpay webhook → `/api/payments/webhook`
- [ ] Brevo sender verified
- [ ] Custom domain DNS pointed to Vercel
- [ ] SSL certificate active on domain

## After deploy

- [ ] `GET /api/health` returns `status: "ok"`
- [ ] Customer OTP login works
- [ ] Admin password login (`cigturf@gmail.com`) works
- [ ] Test booking end-to-end (test Razorpay keys first)
- [ ] Confirmation email received
- [ ] Admin dashboard loads with realtime
- [ ] Media/images load on production domain

## Security

- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in server env (never `NEXT_PUBLIC_*`)
- [ ] RLS enabled (`production-security-rls.sql`)
- [ ] No localhost in `NEXT_PUBLIC_APP_URL` (production)
- [ ] Razorpay webhook secret configured

## Ongoing

- [ ] Monitor `/api/health` (uptime)
- [ ] Review audit logs (3-day window)
- [ ] Rotate API keys periodically
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Backup env vars after changes (see `docs/BACKUP.md`)

## CI (GitHub Actions)

Every push/PR runs: install → typecheck → lint → format → tests → build → Playwright e2e.

## Deployment checklist (release)

1. Merge to main
2. Confirm CI green
3. Vercel auto-deploys production
4. Smoke test production URL
5. Verify Razorpay webhook events in dashboard

## Architecture notes

- **Serverless:** Vercel functions; Prisma uses small pool (`max: 1`) with Supabase pooler.
- **Auth:** Supabase SSR cookies; CSRF on mutating API routes.
- **Payments:** Client verify + Razorpay webhook (idempotent).
- **Email:** Brevo with retry; console fallback in dev only.
- **Realtime:** Supabase postgres changes → app events.
- **Environments:** `development` | `preview` | `production` via `VERCEL_ENV`.
