# Backup & Recovery

## Database (Supabase Postgres)

**Automatic:** Supabase Pro includes daily backups (retention by plan).  
**Manual:** Supabase Dashboard → Database → Backups → Download.

**Recovery:**
1. Restore backup in Supabase or import SQL dump.
2. Verify RLS policies (`supabase/production-security-rls.sql`).
3. Run `GET /api/health` — `database` should be `ok`.

**Migrations:** Keep `supabase/*.sql` in git as schema source of truth.

## Storage (Supabase Storage)

**Backup:** Periodically export media bucket via Supabase CLI or Dashboard.  
**Recovery:** Re-upload assets; update `media_assets` rows if IDs change.

## Environment variables

**Backup:** Export Vercel env vars (Settings → Environment Variables) to a secure password manager.  
Never commit `.env` to git.

**Recovery:** Re-enter vars in Vercel; redeploy. Confirm `NEXT_PUBLIC_APP_URL` matches live domain.

## Application data not in Postgres

| Data | Location |
|------|----------|
| Audit logs | Postgres — 3-day retention (auto cleanup) |
| Email logs | Postgres (`email_logs`) |
| Rate limits | In-memory (not persisted) |

## Disaster recovery checklist

1. Confirm Supabase project status.
2. Restore database from latest backup if needed.
3. Restore Vercel env vars.
4. Redeploy latest successful build from Vercel.
5. Verify `/api/health`, test booking + payment in test mode.
6. Check Razorpay webhook delivery logs.
7. Send test email from Admin → Communication.

## Recommended schedule

| Task | Frequency |
|------|-----------|
| Verify health endpoint | Daily (uptime monitor) |
| Export env backup | On every secret rotation |
| Review Supabase backups | Weekly |
| Test payment webhook | After each Razorpay config change |
