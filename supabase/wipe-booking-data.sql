-- =============================================================================
-- WIPE BOOKING DATA (production reset)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- ⚠️  DESTRUCTIVE: This permanently deletes all booking/payment test data.
--     Cannot be undone. Take a backup first if you need one.
--
-- DELETED:
--   bookings, booked_slots, booking_payment_records, booking_audit_logs
--   booking_sessions, payments, slot_holds
--   email_logs, customer_directory_notes
--   system_audit_logs (booking-related operational history)
--
-- KEPT (unchanged):
--   profiles, admins, business_settings, pricing_rules
--   slot_blocks, slot_holidays (admin slot config)
--   media_assets, promotional_content
--   Supabase Auth users (login accounts)
--
-- Razorpay payment history in the Razorpay Dashboard is NOT affected.
-- =============================================================================

BEGIN;

-- Child tables first (FK order)
DELETE FROM public.booking_audit_logs;
DELETE FROM public.booking_payment_records;
DELETE FROM public.booked_slots;
DELETE FROM public.slot_holds;

-- Core booking + payment flow
DELETE FROM public.bookings;
DELETE FROM public.payments;
DELETE FROM public.booking_sessions;

-- Communication & directory derived from bookings
DELETE FROM public.email_logs;
DELETE FROM public.customer_directory_notes;

-- Optional: remove audit entries tied to bookings / payments testing
DELETE FROM public.system_audit_logs
WHERE booking_id IS NOT NULL
   OR category IN ('booking', 'payment', 'slots')
   OR action ILIKE '%booking%'
   OR action ILIKE '%payment%';

COMMIT;

-- Verify counts (all should be 0)
SELECT 'bookings' AS table_name, COUNT(*) AS rows FROM public.bookings
UNION ALL SELECT 'booked_slots', COUNT(*) FROM public.booked_slots
UNION ALL SELECT 'booking_sessions', COUNT(*) FROM public.booking_sessions
UNION ALL SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL SELECT 'slot_holds', COUNT(*) FROM public.slot_holds
UNION ALL SELECT 'email_logs', COUNT(*) FROM public.email_logs
UNION ALL SELECT 'booking_payment_records', COUNT(*) FROM public.booking_payment_records
UNION ALL SELECT 'booking_audit_logs', COUNT(*) FROM public.booking_audit_logs
ORDER BY table_name;
