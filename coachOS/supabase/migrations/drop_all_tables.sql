-- ==============================================================================
-- DROP ALL EXISTING TABLES
-- This script will completely remove all CoachOS tables and their data.
-- Run this before pushing a completely fresh set of table schemas.
-- ==============================================================================

-- Drop tables in reverse order of dependencies using CASCADE to ensure all 
-- dependent views, foreign key constraints, and related indices are also removed.

DROP TABLE IF EXISTS public.student_documents CASCADE;
DROP TABLE IF EXISTS public.coach_notes CASCADE;
DROP TABLE IF EXISTS public.news_reactions CASCADE;
DROP TABLE IF EXISTS public.news_posts CASCADE;
DROP TABLE IF EXISTS public.match_participants CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.whatsapp_logs CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.age_groups CASCADE;
DROP TABLE IF EXISTS public.branch_batches CASCADE;
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.staff_profiles CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Also clear out any orphaned storage buckets if you named them specifically (optional)
-- DELETE FROM storage.buckets WHERE id IN ('documents', 'avatars');
-- DELETE FROM storage.objects WHERE bucket_id IN ('documents', 'avatars');
