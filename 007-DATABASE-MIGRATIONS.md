# CoachOS — File 007: Database Migrations (Supabase PostgreSQL)

> **Purpose:** Every SQL migration file for the Supabase database. Run these in order. Each migration is a standalone SQL file placed in `supabase/migrations/`.
> **How to run:** Use the Supabase CLI: `supabase db push` or paste into the Supabase Dashboard SQL editor.
> **Depends on:** Files 001-006 for context on what each table does.

---

## Migration Order

Run these in exact numerical order. Each file assumes the previous ones exist.

```
supabase/migrations/
├── 001_create_organizations.sql
├── 002_create_branches.sql
├── 003_create_staff_profiles.sql
├── 004_create_batches_age_groups.sql
├── 005_create_students.sql
├── 006_create_attendance.sql
├── 007_create_payments.sql
├── 008_create_invites.sql
├── 009_create_audit_logs.sql
├── 010_create_whatsapp_logs.sql
├── 011_create_matches_news.sql
├── 012_create_coach_notes_documents.sql
├── 013_rls_policies.sql
├── 014_helper_functions.sql
└── 015_cron_jobs.sql
```

---

## 001_create_organizations.sql

**What this does:** Creates the `organizations` table — the top-level entity. Everything else belongs to an org.

**Table: `organizations`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, auto-generated | |
| name | TEXT | NOT NULL | Academy name |
| sport_type | TEXT | NOT NULL, default 'cricket' | cricket, football, hockey, etc. |
| slug | TEXT | UNIQUE, NOT NULL | URL-safe identifier, auto-generated from name |
| logo_url | TEXT | nullable | Supabase Storage URL |
| payment_model | TEXT | NOT NULL, default 'pay_first' | 'pay_first' or 'attend_first' |
| settings | JSONB | default '{}' | Extensible key-value for future settings |
| created_at | TIMESTAMPTZ | default now() | |
| updated_at | TIMESTAMPTZ | default now() | |

**Indexes:** On `slug` (unique index already from constraint).

**Trigger:** Auto-update `updated_at` on row modification. Create a reusable trigger function `update_updated_at_column()` that sets `updated_at = now()` — apply this trigger to EVERY table that has an `updated_at` column.

---

## 002_create_branches.sql

**Table: `branches`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| org_id | UUID | FK → organizations, NOT NULL, ON DELETE CASCADE | |
| name | TEXT | NOT NULL | |
| address | TEXT | nullable | Full street address |
| city | TEXT | nullable | |
| phone | TEXT | nullable | Branch WhatsApp number |
| is_active | BOOLEAN | default true | Soft-delete flag |
| created_at | TIMESTAMPTZ | default now() | |
| updated_at | TIMESTAMPTZ | default now() | |

**Unique constraint:** (org_id, name) — no two branches with the same name in one org.

**Indexes:** On `org_id` for fast lookups.

**Apply the `updated_at` trigger.**

---

## 003_create_staff_profiles.sql

**Table: `staff_profiles`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| auth_user_id | UUID | FK → auth.users, NOT NULL, ON DELETE CASCADE | Links to Supabase Auth |
| org_id | UUID | FK → organizations, NOT NULL, ON DELETE CASCADE | |
| branch_id | UUID | FK → branches, nullable | NULL for super_admin (sees all branches) |
| role | TEXT | NOT NULL, CHECK IN ('super_admin', 'branch_admin', 'coach', 'temp_coach') | |
| full_name | TEXT | NOT NULL | |
| email | TEXT | NOT NULL | |
| phone | TEXT | nullable | For WhatsApp only |
| avatar_url | TEXT | nullable | |
| is_active | BOOLEAN | default true | |
| access_expires_at | TIMESTAMPTZ | nullable | Only for temp_coach |
| created_at | TIMESTAMPTZ | default now() | |
| updated_at | TIMESTAMPTZ | default now() | |

**Unique constraint:** (auth_user_id, org_id) — one profile per user per org.

**Indexes:**
- On `auth_user_id` — fast lookup on login
- On `org_id` — list staff for an org
- On `(org_id, branch_id)` — list staff for a branch

**Apply the `updated_at` trigger.**

---

## 004_create_batches_age_groups.sql

**Table: `batches`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| org_id | UUID | FK → organizations, NOT NULL, ON DELETE CASCADE | |
| name | TEXT | NOT NULL | "Morning Batch", "Evening Batch", etc. |
| start_time | TIME | nullable | "06:00:00" |
| end_time | TIME | nullable | "08:00:00" |
| days_of_week | TEXT[] | default '{}' | Array: ['mon','tue','wed','thu','fri','sat'] |
| is_active | BOOLEAN | default true | |
| created_at | TIMESTAMPTZ | default now() | |

**Indexes:** On `org_id`.

**Table: `branch_batches`** (junction table)

| Column | Type | Constraints |
|--------|------|-------------|
| branch_id | UUID | FK → branches, ON DELETE CASCADE |
| batch_id | UUID | FK → batches, ON DELETE CASCADE |
| PRIMARY KEY | | (branch_id, batch_id) |

**Table: `age_groups`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| org_id | UUID | FK → organizations, NOT NULL, ON DELETE CASCADE | |
| name | TEXT | NOT NULL | "U14", "U16", etc. |
| min_age | INTEGER | nullable | |
| max_age | INTEGER | nullable | |
| gender | TEXT | CHECK IN ('male', 'female', 'all'), default 'all' | |
| sort_order | INTEGER | default 0 | For display ordering |
| created_at | TIMESTAMPTZ | default now() | |

**Unique constraint:** (org_id, name).

---

## 005_create_students.sql

**Table: `students`**

This is the biggest table. See File 001 Section 7 for full field descriptions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| org_id | UUID | FK → organizations, NOT NULL, ON DELETE CASCADE | |
| branch_id | UUID | FK → branches, NOT NULL, ON DELETE CASCADE | |
| student_id_code | TEXT | NOT NULL | 4-6 digit display ID |
| auth_user_id | UUID | FK → auth.users, nullable | Set after first login |
| first_name | TEXT | NOT NULL | |
| last_name | TEXT | nullable | |
| date_of_birth | DATE | nullable | |
| age | INTEGER | nullable | Can be computed from DOB |
| blood_group | TEXT | nullable | |
| gender | TEXT | CHECK IN ('male', 'female', 'other'), nullable | |
| school_name | TEXT | nullable | |
| school_grade | TEXT | nullable | |
| address | TEXT | nullable | |
| city | TEXT | nullable | |
| parent_phone | TEXT | nullable | Primary WhatsApp contact |
| parent_name | TEXT | nullable | |
| guardian_phone | TEXT | nullable | Additional contact |
| guardian_name | TEXT | nullable | |
| age_group_id | UUID | FK → age_groups, nullable | |
| batch_id | UUID | FK → batches, nullable | |
| uniform_size | TEXT | nullable | XS/S/M/L/XL/XXL |
| uniform_gender | TEXT | CHECK IN ('boy', 'girl', 'unisex'), nullable | |
| health_notes | TEXT | nullable | Safety/fitness info |
| special_needs | TEXT | nullable | |
| profile_status | TEXT | NOT NULL, default 'incomplete', CHECK IN ('incomplete', 'complete') | |
| enrollment_status | TEXT | NOT NULL, default 'active', CHECK IN ('active', 'paused', 'archived') | |
| fee_status | TEXT | NOT NULL, default 'unpaid', CHECK IN ('paid', 'unpaid', 'overdue', 'partial') | |
| username | TEXT | UNIQUE, nullable | For student login |
| parent_onboarding_token | TEXT | UNIQUE, nullable | Secure token for parent form |
| parent_onboarding_completed_at | TIMESTAMPTZ | nullable | |
| created_by | UUID | FK → staff_profiles, nullable | |
| created_at | TIMESTAMPTZ | default now() | |
| updated_at | TIMESTAMPTZ | default now() | |

**Unique constraints:**
- (org_id, student_id_code) — unique display ID per org
- username — globally unique
- parent_onboarding_token — globally unique

**Indexes:**
- On `org_id`
- On `branch_id`
- On `batch_id`
- On `(org_id, enrollment_status)` — fast filtering of active students
- On `auth_user_id` — login lookup
- On `parent_onboarding_token` — parent form lookup

**Apply the `updated_at` trigger.**

---

## 006_create_attendance.sql

**Table: `attendance_records`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| org_id | UUID | FK → organizations, NOT NULL | |
| branch_id | UUID | FK → branches, NOT NULL | |
| batch_id | UUID | FK → batches, NOT NULL | |
| student_id | UUID | FK → students, NOT NULL | |
| date | DATE | NOT NULL | |
| status | TEXT | NOT NULL, CHECK IN ('present', 'absent', 'late', 'excused') | |
| marked_by | UUID | FK → staff_profiles, NOT NULL | |
| notes | TEXT | nullable | |
| created_at | TIMESTAMPTZ | default now() | |
| updated_at | TIMESTAMPTZ | default now() | |

**Unique constraint:** (student_id, batch_id, date) — one record per student per batch per day. This is CRITICAL for data integrity and for the upsert pattern used by the swipe cards.

**Indexes:**
- On `(branch_id, date)` — batch selector progress count
- On `(batch_id, date)` — loading cards for a session
- On `(student_id, date)` — student's own attendance view
- On `(org_id, date)` — dashboard aggregation

**Apply the `updated_at` trigger.**

---

## 007_create_payments.sql

**Table: `payments`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| org_id | UUID | FK → organizations, NOT NULL | |
| branch_id | UUID | FK → branches, NOT NULL | |
| student_id | UUID | FK → students, NOT NULL | |
| amount | DECIMAL(10,2) | NOT NULL | Fee amount |
| currency | TEXT | default 'INR' | |
| period_label | TEXT | NOT NULL | "January 2026", "Q1 2026", etc. |
| due_date | DATE | nullable | |
| paid_at | TIMESTAMPTZ | nullable | |
| payment_method | TEXT | nullable | 'upi', 'cash', 'bank_transfer', 'razorpay' |
| razorpay_payment_id | TEXT | nullable | From Razorpay webhook |
| razorpay_payment_link_id | TEXT | nullable | From payment link creation |
| invoice_url | TEXT | nullable | Supabase Storage URL |
| status | TEXT | NOT NULL, default 'pending', CHECK IN ('pending', 'paid', 'partial', 'overdue', 'refunded', 'waived') | |
| marked_by | UUID | FK → staff_profiles, nullable | Staff who recorded payment |
| notes | TEXT | nullable | |
| created_at | TIMESTAMPTZ | default now() | |
| updated_at | TIMESTAMPTZ | default now() | |

**Indexes:**
- On `(branch_id, status)` — payments overview filtering
- On `(student_id, status)` — student's payment view
- On `razorpay_payment_link_id` — webhook lookup
- On `(org_id, due_date)` — overdue cron job

**Apply the `updated_at` trigger.**

---

## 008_create_invites.sql

**Table: `invites`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| org_id | UUID | FK → organizations, NOT NULL | |
| branch_id | UUID | FK → branches, nullable | NULL for org-level (super_admin) |
| token | TEXT | UNIQUE, NOT NULL | 32-char random |
| role | TEXT | NOT NULL, CHECK IN ('super_admin', 'branch_admin', 'coach', 'temp_coach') | |
| created_by | UUID | FK → staff_profiles, NOT NULL | |
| max_uses | INTEGER | default 1 | |
| used_count | INTEGER | default 0 | |
| expires_at | TIMESTAMPTZ | NOT NULL | |
| is_active | BOOLEAN | default true | |
| temp_coach_expires_at | TIMESTAMPTZ | nullable | When the temp coach's access should expire |
| created_at | TIMESTAMPTZ | default now() | |

**Indexes:** On `token` (unique already).

---

## 009_create_audit_logs.sql

**Table: `audit_logs`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| org_id | UUID | FK → organizations, NOT NULL | |
| branch_id | UUID | FK → branches, nullable | |
| actor_id | UUID | nullable | Staff profile ID or NULL for system actions |
| actor_role | TEXT | nullable | Role at time of action |
| action | TEXT | NOT NULL | 'student.create', 'attendance.mark', etc. |
| entity_type | TEXT | NOT NULL | 'student', 'attendance', 'payment', etc. |
| entity_id | UUID | nullable | ID of the affected row |
| details | JSONB | default '{}' | Before/after, metadata |
| ip_address | TEXT | nullable | |
| created_at | TIMESTAMPTZ | default now() | |

**This table does NOT have `updated_at` — audit logs are immutable. Never update or delete them (only the cleanup cron removes old ones).**

**Indexes:**
- On `(org_id, created_at DESC)` — primary query pattern (recent logs for an org)
- On `(entity_type, entity_id)` — "show me all logs for this student"
- On `(actor_id, created_at DESC)` — "show me everything this person did"
- On `created_at` — for the cleanup cron

**Partitioning consideration (future):** If audit_logs grows very large, consider partitioning by month. For v1, indexes are sufficient.

---

## 010_create_whatsapp_logs.sql

**Table: `whatsapp_logs`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| org_id | UUID | FK → organizations, NOT NULL | |
| branch_id | UUID | FK → branches, nullable | |
| sent_by | UUID | FK → staff_profiles, nullable | |
| recipient_phone | TEXT | NOT NULL | |
| recipient_name | TEXT | nullable | |
| template_name | TEXT | nullable | WhatsApp template ID |
| message_type | TEXT | NOT NULL | 'payment_reminder', 'absent_alert', etc. |
| message_body | TEXT | nullable | Rendered message content |
| status | TEXT | default 'queued', CHECK IN ('queued', 'sent', 'delivered', 'read', 'failed') | |
| error_message | TEXT | nullable | Error details if failed |
| whatsapp_message_id | TEXT | nullable | From Meta API response |
| created_at | TIMESTAMPTZ | default now() | |

**Indexes:**
- On `(org_id, created_at DESC)` — message log view
- On `(recipient_phone, created_at DESC)` — rate limiting check (max 5/day per phone)
- On `status` — finding queued messages to process

---

## 011_create_matches_news.sql

**Table: `matches`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| org_id | UUID | FK → organizations, NOT NULL |
| branch_id | UUID | FK → branches, NOT NULL |
| title | TEXT | NOT NULL |
| description | TEXT | nullable |
| location | TEXT | nullable |
| match_date | TIMESTAMPTZ | NOT NULL |
| match_type | TEXT | nullable |
| preparation_notes | TEXT | nullable |
| created_by | UUID | FK → staff_profiles, NOT NULL |
| created_at | TIMESTAMPTZ | default now() |
| updated_at | TIMESTAMPTZ | default now() |

**Table: `match_participants`**

| Column | Type | Constraints |
|--------|------|-------------|
| match_id | UUID | FK → matches, ON DELETE CASCADE |
| student_id | UUID | FK → students, ON DELETE CASCADE |
| notes | TEXT | nullable |
| PRIMARY KEY | | (match_id, student_id) |

**Table: `news_posts`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| org_id | UUID | FK → organizations, NOT NULL |
| branch_id | UUID | FK → branches, nullable (NULL = org-wide) |
| title | TEXT | NOT NULL |
| body | TEXT | nullable |
| image_url | TEXT | nullable |
| created_by | UUID | FK → staff_profiles, NOT NULL |
| created_at | TIMESTAMPTZ | default now() |

**Table: `news_reactions`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| news_post_id | UUID | FK → news_posts, ON DELETE CASCADE |
| student_id | UUID | FK → students, ON DELETE CASCADE |
| reaction | TEXT | NOT NULL (one of '👍', '🔥', '💪', '❤️') |
| created_at | TIMESTAMPTZ | default now() |
| UNIQUE | | (news_post_id, student_id) |

---

## 012_create_coach_notes_documents.sql

**Table: `coach_notes`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| org_id | UUID | FK → organizations, NOT NULL |
| student_id | UUID | FK → students, ON DELETE CASCADE |
| coach_id | UUID | FK → staff_profiles, NOT NULL |
| note_type | TEXT | NOT NULL, CHECK IN ('diet', 'practice', 'improvement', 'general') |
| title | TEXT | nullable |
| body | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | default now() |
| updated_at | TIMESTAMPTZ | default now() |

**Table: `student_documents`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| student_id | UUID | FK → students, ON DELETE CASCADE |
| org_id | UUID | FK → organizations, NOT NULL |
| document_type | TEXT | NOT NULL ('birth_certificate', 'school_id', 'medical_certificate', 'photo', 'other') |
| file_name | TEXT | NOT NULL |
| file_url | TEXT | NOT NULL |
| file_size | INTEGER | nullable |
| uploaded_by | UUID | nullable |
| created_at | TIMESTAMPTZ | default now() |

---

## 013_rls_policies.sql

**This is the most important migration. RLS (Row Level Security) is what prevents users from seeing data they shouldn't.**

**Enable RLS on every table:**
- organizations, branches, staff_profiles, students, batches, branch_batches, age_groups, attendance_records, payments, invites, audit_logs, whatsapp_logs, matches, match_participants, news_posts, news_reactions, coach_notes, student_documents

**Policy pattern — there are 4 categories of users:**

1. **Super Admin:** Can see everything in their org. Their `staff_profiles.branch_id` is NULL.
2. **Branch Staff (branch_admin, coach, temp_coach):** Can only see data in their branch within their org.
3. **Students:** Can only see their own data.
4. **Anonymous (parent onboarding):** Can only update the specific student matched by the onboarding token.

**How to check the current user's role in RLS:**

Create a helper function that RLS policies call:

```
Function: get_user_org_ids()
  → Returns array of org_ids the current user belongs to
  → Queries staff_profiles WHERE auth_user_id = auth.uid() AND is_active = true

Function: get_user_branch_ids()
  → Returns array of branch_ids the current user can access
  → For super_admin: returns ALL branch_ids in their org(s)
  → For others: returns their specific branch_id

Function: get_user_role(org_id)
  → Returns the role for the current user in a specific org
  → Queries staff_profiles

Function: is_student()
  → Returns true if auth.uid() matches a student's auth_user_id
```

**Policy examples (describe the logic, not the exact SQL):**

**organizations table:**
- SELECT: staff can see orgs they belong to. Students can see their org.
- INSERT: only during onboarding (handled by Edge Function with service role, not client RLS)
- UPDATE: only super_admin of that org
- DELETE: never from client (only via admin panel or Edge Function)

**students table:**
- SELECT for staff: super_admin sees all students in org. Branch staff sees students in their branch.
- SELECT for students: only their own row (WHERE auth_user_id = auth.uid())
- INSERT: staff with 'create' permission on 'student' resource
- UPDATE: staff with 'update' permission. Students cannot update their own record (parent onboarding updates via Edge Function).
- DELETE: only super_admin and branch_admin (soft delete by setting enrollment_status = 'archived')

**attendance_records table:**
- SELECT: staff sees records in their branch (or all for super_admin). Students see only their own.
- INSERT: staff who can take attendance (coach, branch_admin, super_admin, temp_coach)
- UPDATE: only super_admin and branch_admin
- DELETE: only super_admin

**payments table:**
- SELECT: super_admin and branch_admin see all in their scope. Coach sees only student payment status (handled at app level — RLS gives them access to the rows but the app hides amount columns). Students see their own.
- INSERT/UPDATE: super_admin and branch_admin only
- Webhook updates: via Edge Function with service role key (bypasses RLS)

**audit_logs table:**
- SELECT: super_admin only
- INSERT: via Edge Function or service role (the app doesn't insert directly — a helper function or trigger does)
- UPDATE/DELETE: never

**invites table:**
- SELECT: staff who created them, or super_admin
- INSERT: staff with invite permission
- The invite acceptance route uses the service role key (Edge Function) to read/update invites, since the accepting user doesn't have a profile yet.

**Important RLS notes:**
- Temp coaches: add an additional check `(access_expires_at IS NULL OR access_expires_at > now())` to all policies involving temp_coach role
- Edge Functions use the `service_role` key which bypasses RLS — use this for operations where the acting user doesn't have a profile yet (invite acceptance, parent onboarding, webhook processing)
- Test RLS thoroughly: log in as each role type and verify they can't see other branches' data

---

## 014_helper_functions.sql

**Database functions used by the app and Edge Functions:**

**Function: `generate_student_id_code(org_id UUID)`**
- Generates a unique 4-digit code for a student within an org
- Loop: generate random 4-digit number, check if exists in students for this org, if collision regenerate (max 10 tries), if still colliding try 5-digit codes
- Returns TEXT

**Function: `calculate_student_age(dob DATE)`**
- Returns INTEGER age based on date of birth
- Standard age calculation accounting for whether birthday has passed this year

**Function: `auto_assign_age_group(org_id UUID, dob DATE)`**
- Calculates age from DOB, then finds the matching age_group in this org
- Returns the age_group_id or NULL if no match

**Function: `recalculate_student_fee_status(student_id UUID)`**
- Looks at all payment records for this student
- If any are 'overdue' → set fee_status to 'overdue'
- Else if any are 'pending' → 'unpaid'
- Else if any are 'partial' → 'partial'
- Else if all are 'paid' or 'waived' → 'paid'
- Updates the student row

**Function: `log_audit(org_id, branch_id, actor_id, actor_role, action, entity_type, entity_id, details)`**
- Inserts a row into audit_logs
- Called by Edge Functions and optionally by triggers

**Trigger function: `update_updated_at_column()`**
- Sets `updated_at = now()` on every UPDATE
- Applied to: organizations, branches, staff_profiles, students, attendance_records, payments, matches, coach_notes

---

## 015_cron_jobs.sql

**These are scheduled tasks using Supabase's `pg_cron` extension (or implemented as Edge Function crons).**

**Job 1: Update overdue payments**
- Schedule: Daily at midnight IST (18:30 UTC previous day)
- Logic: `UPDATE payments SET status = 'overdue' WHERE status = 'pending' AND due_date < CURRENT_DATE`
- Then for each affected student: call `recalculate_student_fee_status()`

**Job 2: Expire temp coaches**
- Schedule: Every hour
- Logic: `UPDATE staff_profiles SET is_active = false WHERE role = 'temp_coach' AND access_expires_at < now() AND is_active = true`

**Job 3: Cleanup old audit logs**
- Schedule: Weekly (Sunday 3 AM IST)
- Logic: `DELETE FROM audit_logs WHERE created_at < now() - interval '365 days'` (configurable per org via settings, default 1 year)

**Job 4: Cleanup expired invites**
- Schedule: Daily at 2 AM
- Logic: `UPDATE invites SET is_active = false WHERE expires_at < now() AND is_active = true`

---

## Supabase Storage Buckets

Create these storage buckets in the Supabase dashboard or via CLI:

| Bucket | Access | Purpose |
|--------|--------|---------|
| `avatars` | Public (read), Authenticated (write) | Staff and student profile photos |
| `documents` | Authenticated only | Student documents (birth cert, school ID, etc.) |
| `invoices` | Authenticated only | Generated invoice PDFs |
| `org-assets` | Public (read), Authenticated (write) | Org logos, news post images |

**Storage RLS:** Each bucket should have policies ensuring users can only access files for their org. Use folder naming convention: `{org_id}/{entity_type}/{file_name}` to make RLS straightforward.

---

## Verification After Running All Migrations

After running all 15 migrations, verify:

1. All tables exist: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
2. RLS is enabled on all tables: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
3. All foreign keys are correct: `SELECT conname, conrelid::regclass, confrelid::regclass FROM pg_constraint WHERE contype = 'f'`
4. All unique constraints are in place
5. Test RLS: create a test staff user, sign in, try querying another org's data (should return empty)
6. All helper functions exist and work: test `generate_student_id_code`, `calculate_student_age`, etc.

---

*Next: File 008 covers Supabase Edge Functions.*
