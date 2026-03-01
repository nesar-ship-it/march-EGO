-- Cron jobs: run via Supabase Dashboard -> Database -> Extensions -> pg_cron (if enabled)
-- Or use Supabase Edge Functions + external cron / Supabase scheduled functions.
-- Optional for v1; app works without these.

-- Example (requires pg_cron extension):
-- SELECT cron.schedule('update-overdue-payments', '30 18 * * *', $$ ... $$);
-- SELECT cron.schedule('expire-temp-coaches', '0 * * * *', $$ ... $$);
-- SELECT cron.schedule('cleanup-audit-logs', '0 21 * * 0', $$ ... $$);
