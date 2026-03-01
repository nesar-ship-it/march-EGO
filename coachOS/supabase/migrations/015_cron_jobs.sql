-- These instructions are meant to be configured if pg_cron is enabled on the Supabase database.

-- Ensure pg_cron extension is enabled first:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job 1: Update overdue payments
-- Schedule: Daily at midnight IST (18:30 UTC previous day)
-- SELECT cron.schedule('update_overdue_payments', '30 18 * * *', $$
--     UPDATE public.payments 
--     SET status = 'overdue' 
--     WHERE status = 'pending' AND due_date < CURRENT_DATE;
-- $$);

-- Job 2: Expire temp coaches
-- Schedule: Every hour
-- SELECT cron.schedule('expire_temp_coaches', '0 * * * *', $$
--     UPDATE public.staff_profiles 
--     SET is_active = false 
--     WHERE role = 'temp_coach' AND access_expires_at < now() AND is_active = true;
-- $$);

-- Job 3: Cleanup old audit logs
-- Schedule: Weekly (Sunday 3 AM IST)
-- SELECT cron.schedule('cleanup_audit_logs', '30 21 * * 6', $$
--     DELETE FROM public.audit_logs 
--     WHERE created_at < now() - interval '365 days';
-- $$);

-- Job 4: Cleanup expired invites
-- Schedule: Daily at 2 AM IST
-- SELECT cron.schedule('cleanup_expired_invites', '30 20 * * *', $$
--     UPDATE public.invites 
--     SET is_active = false 
--     WHERE expires_at < now() AND is_active = true;
-- $$);
