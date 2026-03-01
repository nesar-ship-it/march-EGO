# Deploy CoachOS on Vercel + Supabase

This doc covers: (1) **Supabase implementation status**, (2) **Supabase tables and queries** used in the app, and (3) **Deploying the web app on Vercel** with Supabase.

---

## 1. Supabase implementation status

Supabase **is implemented** in CoachOS:

| Area | Status | Notes |
|------|--------|--------|
| **Client** | ✅ | `@/lib/supabase` – createClient with Expo SecureStore (native) / localStorage (web) |
| **Auth** | ✅ | Login (Google OAuth, email/password), sign out, session, `onAuthStateChange` |
| **Tables** | ✅ | All app features use Supabase tables (see below) |
| **RLS** | 📋 | Defined in `007-DATABASE-MIGRATIONS.md` (013_rls_policies) – must be run in your project |
| **Edge Functions** | ✅ | `create-organization`, `create-student`, `accept-invite`, `parent-onboarding`, `reset-student-password` used from app |

**You need to:**

1. Create a [Supabase project](https://supabase.com/dashboard) (if you haven’t).
2. Run all migrations in order. The SQL files are in `coachOS/supabase/migrations/`. Run in numeric order: **001** → **002** → … → **014** → **015** → **017**. Paste each file into the Supabase SQL editor and run, or use `supabase db push` from the project root. (017 adds `parent_relationship` to students; if you use 001–017 from scratch, 005 already includes it.)
3. Deploy Edge Functions: `create-organization`, `create-student`, `accept-invite`, `parent-onboarding`, `reset-student-password` (see `008-EDGE-FUNCTIONS.md`).
4. Set Auth providers (e.g. Google) in Supabase Dashboard → Authentication → Providers.
5. Add env vars (see “Environment variables” below).

---

## 2. Supabase tables and queries reference

### Tables used by the app

| Table | Purpose |
|-------|--------|
| `organizations` | Academy/org name and settings |
| `staff_profiles` | Staff linked to Auth; org/branch/role |
| `students` | Student records; auth link, fee status, parent onboarding |
| `branches` | Branches per org |
| `batches` | Batches per org; linked via `branch_batches` |
| `age_groups` | Age groups per org |
| `invites` | Staff invite tokens and usage |
| `attendance_records` | Daily attendance (present/absent/late/excused) |
| `matches` | Matches; `match_participants` links students |
| `coach_notes` | Notes per student |
| `audit_logs` | Audit trail (who did what) |
| `whatsapp_logs` | WhatsApp message log and queue |
| `payments` | Fee payments (used by app for status/history) |

---

Tables the app uses and the main query patterns.

### Auth (Supabase Auth)

- `supabase.auth.getSession()`
- `supabase.auth.getUser()`
- `supabase.auth.onAuthStateChange(callback)`
- `supabase.auth.signInWithOAuth({ provider: 'google' })`
- `supabase.auth.signInWithPassword({ email, password })`
- `supabase.auth.signOut()`

### organizations

- **Select by id (name for display):**  
  `supabase.from('organizations').select('name').eq('id', orgId).single()`
- **Select many by ids:**  
  `supabase.from('organizations').select('id, name').in('id', orgIds)`

### staff_profiles

- **By auth user (active):**  
  `supabase.from('staff_profiles').select('*').eq('auth_user_id', session.user.id).eq('is_active', true).order('org_id')`
- **By auth user + org (single):**  
  `supabase.from('staff_profiles').select('*').eq('auth_user_id', session.user.id).eq('org_id', orgId).single()`
- **By ids (names):**  
  `supabase.from('staff_profiles').select('id, full_name').in('id', coachIds)`
- **Insert (accept invite):**  
  `supabase.from('staff_profiles').insert({ auth_user_id, org_id, branch_id, role, full_name, email, is_active: true, ... })`

### students

- **Active by org (count):**  
  `supabase.from('students').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('enrollment_status', 'active')` (+ optional `.eq('branch_id', branchId)`)
- **By auth user (active):**  
  `supabase.from('students').select('id, org_id').eq('auth_user_id', session.user.id).eq('enrollment_status', 'active')`
- **By parent token:**  
  `supabase.from('students').select('id, first_name, last_name, student_id_code, parent_phone, parent_onboarding_completed_at').eq('parent_onboarding_token', token).single()`
- **List with relations (service):**  
  `supabase.from('students').select('*, age_group:age_groups(*), batch:batches(*)').eq('org_id', params.org_id).eq('enrollment_status', 'active').order('first_name')` (+ filters)

Student **creation** is done via Edge Function `create-student`, not direct insert.

### branches

- **One per org:**  
  `supabase.from('branches').select('id').eq('org_id', orgId).limit(1).single()`
- **Name by id:**  
  `supabase.from('branches').select('name').eq('id', data.branch_id).single()`

### batches

- **Ids by org (active):**  
  `supabase.from('batches').select('id').eq('org_id', orgId).eq('is_active', true)`
- **Names by org:**  
  `supabase.from('batches').select('id, name').eq('org_id', orgId).eq('is_active', true)`
- **By branch (junction):**  
  `supabase.from('branch_batches').select('batch_id').eq('branch_id', branchId)`

### invites

- **By token:**  
  `supabase.from('invites').select('id, org_id, branch_id, role, expires_at, used_count, max_uses, is_active').eq('token', token).single()`
- **Update after use:**  
  `supabase.from('invites').update({ used_count, is_active }).eq('id', invite.id)`
- **Insert:**  
  `supabase.from('invites').insert({ org_id, branch_id, token, role, created_by, max_uses, used_count: 0, expires_at, is_active: true }).select('id, token, expires_at').single()`

### attendance_records

- **Today’s count by org (and optional branch):**  
  `supabase.from('attendance_records').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('date', todayStr)` (+ optional `.eq('branch_id', branchId)`)
- **Absent today:**  
  `supabase.from('attendance_records').select('student_id').eq('org_id', orgId).eq('date', todayStr).eq('status', 'absent')`

### matches

- **Count by org:**  
  `supabase.from('matches').select('id', { count: 'exact', head: true }).eq('org_id', orgId)`
- **By student (via match_participants):**  
  `supabase.from('match_participants').select('match_id').eq('student_id', studentId)` then  
  `supabase.from('matches').select('id, title, match_date, location').in('id', matchIds).eq('org_id', orgId)`

### coach_notes

- **By student + org:**  
  `supabase.from('coach_notes').select('id, note_type, title, body, created_at, coach_id').eq('student_id', studentId).eq('org_id', orgId)`  
  (staff detail uses `select('*').eq('student_id', id).eq('org_id', orgId)`)

### audit_logs

- **By org (paginated):**  
  `supabase.from('audit_logs').select('*', { count: 'exact' }).eq('org_id', orgId).order('created_at', { ascending: false }).limit(pageSize + 1)` (+ optional filters and cursor)
- **Insert:** from Edge Function / service role: `admin.from('audit_logs').insert({ org_id, action, entity_type, ... })`

### whatsapp_logs

- **Queued count:**  
  `supabase.from('whatsapp_logs').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'queued')`

### Edge Function invocations (from client)

- `supabase.functions.invoke('create-organization', { body })`
- `supabase.functions.invoke('create-student', { body: { first_name, last_name, branch_id, ... } })`
- `supabase.functions.invoke('accept-invite', { body: { token, ... } })`
- `supabase.functions.invoke('parent-onboarding', { body: { token, parent_name, parent_relationship, ... } })`
- `supabase.functions.invoke('reset-student-password', { body: { student_id, ... } })` (if used)

---

## 3. Deploy web app on Vercel

CoachOS is an Expo (React Native) app; the **web** build can be deployed to Vercel.

### 3.1 Build for web

From the **coachOS** folder (the one with `package.json`):

```bash
cd /Users/nesar/March-eggo/coachOS
npx expo export --platform web
```

Output goes to `dist/` (or the path shown in the Expo output). That folder is the **Vercel build output**.

### 3.2 Vercel project setup

1. Push the repo to GitHub (if not already).
2. In [Vercel](https://vercel.com): **Add New Project** → import the repo.
3. **Root directory:** set to the folder that contains `package.json` and `app.json` for CoachOS (e.g. `coachOS` if the repo root is March-eggo).
4. **Build and Output:**
   - Build command: `npx expo export --platform web`
   - Output directory: `dist` (or whatever `expo export -p web` reports).
5. **Environment variables:** add the same env vars the app uses (see below). For production, set `EXPO_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://your-app.vercel.app`).

### 3.3 Environment variables (Vercel + Supabase)

Set these in Vercel (Project → Settings → Environment Variables) and in Supabase (Edge Function secrets / Dashboard) where needed.

| Variable | Where | Description |
|----------|--------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Vercel (and local .env) | Supabase project URL, e.g. `https://xxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Vercel (and local .env) | Supabase anon/public key |
| `EXPO_PUBLIC_APP_URL` | Vercel | Full URL of the app, e.g. `https://coachos.vercel.app` (for redirects and links) |

Supabase Edge Functions use (in Supabase Dashboard → Project Settings → Edge Functions or env):

- `SUPABASE_URL` (often auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side DB and Auth)

Add any other keys your app or functions use (e.g. Razorpay, WhatsApp) in the right place (Vercel for client-visible, Supabase secrets for Edge Functions).

### 3.4 Supabase Auth redirect URLs

In Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL:** your production app URL, e.g. `https://your-app.vercel.app`
- **Redirect URLs:** add `https://your-app.vercel.app/**` (and `http://localhost:8081/**` for local)

So Supabase is already implemented; run migrations and Edge Functions, then deploy the web build to Vercel with the env vars and redirect URLs above.
