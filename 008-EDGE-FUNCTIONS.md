# CoachOS — File 008: Supabase Edge Functions (Server-Side Logic)

> **Purpose:** Instructions for every Edge Function — what it does, inputs, outputs, error handling. These run on Supabase's Deno runtime.
> **Location:** `supabase/functions/{function-name}/index.ts`
> **How to deploy:** `supabase functions deploy {function-name}`

---

## Why Edge Functions

Some operations CANNOT be done from the client app:
- Creating Supabase Auth users for students (requires service role key)
- Calling external APIs with secret keys (Razorpay, WhatsApp)
- Processing webhooks from external services
- Running logic that needs elevated database privileges (bypassing RLS)

---

## Function Index

| Function | Trigger | Purpose |
|----------|---------|---------|
| `create-organization` | HTTP POST from onboarding | Create org + branches + batches + age groups + staff profile in one transaction |
| `create-student` | HTTP POST from coach app | Create student + Supabase Auth user + generate credentials |
| `accept-invite` | HTTP POST from invite page | Validate token + create staff profile |
| `parent-onboarding` | HTTP POST from parent form | Update student profile (bypasses RLS since parent has no account) |
| `reset-student-password` | HTTP POST from staff app | Generate new password for a student |
| `generate-payment-link` | HTTP POST from staff app | Call Razorpay API to create a payment link |
| `payment-webhook` | HTTP POST from Razorpay | Process payment confirmation |
| `send-whatsapp` | HTTP POST from app | Send a WhatsApp message via Meta API |
| `send-bulk-whatsapp` | HTTP POST from app | Send multiple WhatsApp messages (payment reminders, absent alerts) |
| `generate-invoice` | Called internally after payment | Create PDF invoice and upload to Storage |
| `send-reminders` | Cron (daily 8 AM IST) | Check for due/overdue payments and send reminders |
| `update-overdue` | Cron (daily midnight IST) | Mark overdue payments |
| `expire-temp-coaches` | Cron (hourly) | Deactivate expired temp coach accounts |
| `cleanup-logs` | Cron (weekly) | Remove old audit logs |

---

## Function Details

---

### 1. `create-organization`

**Called by:** The org onboarding completion step (File 004, Section B5)

**Input (POST body):**
```
{
  org_name: string,
  sport_type: string,
  branches: [{ name, address, city, phone }],
  batches: [{ name, start_time, end_time, days_of_week, branch_indexes: number[] }],
  age_groups: [{ name, min_age, max_age, gender }],
  cofounder_emails: string[]   // optional
}
```

**The function uses the service role key (from environment) to bypass RLS.**

**Logic sequence (all in one database transaction):**

1. Get the authenticated user from the request's JWT
2. Validate all inputs
3. Generate org slug from name (lowercase, replace spaces with hyphens, remove special chars). If slug exists, append random 4 chars.
4. INSERT into `organizations` → get org_id
5. INSERT into `staff_profiles` for the current user (role: super_admin, branch_id: NULL) → get staff_id
6. For each branch: INSERT into `branches` → collect branch_ids
7. For each batch: INSERT into `batches` → get batch_id. Then for each branch it applies to: INSERT into `branch_batches`.
8. For each age group: INSERT into `age_groups`
9. For each co-founder email: generate secure token, INSERT into `invites` (role: super_admin, expires: 72h)
10. INSERT audit log: action = 'org.create'
11. COMMIT transaction

**Output on success:**
```
{
  org_id: string,
  slug: string,
  invite_links: [{ email, url }]   // co-founder invite URLs
}
```

**Output on error:**
- 400 if validation fails (with field-specific error messages)
- 409 if org slug collision persists after retries
- 500 if transaction fails (rollback happens automatically)

**Why this needs an Edge Function:** Creating an org involves writing to 6+ tables in a transaction. The client SDK can't do multi-table transactions. Also, the first staff_profile creation needs service role access.

---

### 2. `create-student`

**Called by:** The "Add Student" form in the coach's app

**Input:**
```
{
  first_name: string,
  last_name?: string,
  date_of_birth?: string,
  blood_group?: string,
  parent_phone?: string,
  branch_id: string
}
```

**Logic:**

1. Authenticate the caller (must be staff with 'student.create' permission)
2. Get the caller's org_id from their staff_profile
3. Verify branch_id belongs to the caller's org AND the caller has access to it
4. Generate student_id_code using the `generate_student_id_code()` DB function
5. Generate username: lowercase(first_name) + student_id_code
6. Generate temporary password: 8 chars, alphanumeric, no ambiguous characters
7. Create a Supabase Auth user:
   - email: `{username}@students.coachOS.internal`
   - password: the generated password
   - user_metadata: { role: 'student', org_id }
8. If DOB provided: calculate age, auto-assign age_group
9. Generate parent_onboarding_token (32-char secure random)
10. INSERT into `students` with all data
11. Audit log: action = 'student.create'

**Output:**
```
{
  student_id: string,
  student_id_code: string,
  username: string,
  password: string,            // returned ONCE — not stored in plaintext
  parent_onboarding_url: string,
  parent_onboarding_token: string
}
```

**Why Edge Function:** Creating Supabase Auth users requires the service role key. The plain text password must be returned to the coach exactly once and then never stored.

---

### 3. `accept-invite`

**Called by:** The invite acceptance page after Google OAuth

**Input:**
```
{
  token: string,
  // Auth user info comes from the JWT (the user is already authenticated via Google)
}
```

**Logic:**

1. Authenticate the caller from JWT
2. Look up the invite by token
3. Validate: exists, is_active, not expired, used_count < max_uses
4. Check if user already has a staff_profile in this org → if yes, return existing profile (don't create duplicate)
5. Create staff_profile:
   - auth_user_id from JWT
   - org_id, branch_id, role from invite
   - full_name, email from Google auth user metadata
   - For temp_coach: set access_expires_at from invite's temp_coach_expires_at
6. Increment invite used_count. If single-use, set is_active = false.
7. Audit log: action = 'staff.invite_accepted'

**Output:**
```
{
  staff_profile_id: string,
  org_id: string,
  org_name: string,
  role: string,
  branch_name: string | null
}
```

**Error responses:**
- 400: invalid token
- 410: expired token
- 409: already a member of this org

---

### 4. `parent-onboarding`

**Called by:** The parent onboarding form (public, no auth required)

**Input:**
```
{
  token: string,
  parent_name: string,
  parent_phone: string,
  guardian_name?: string,
  guardian_phone?: string,
  address: string,
  city: string,
  school_name: string,
  school_grade: string,
  gender: 'male' | 'female' | 'other',
  health_notes?: string,
  special_needs?: string,
  uniform_size: string,
  uniform_gender: 'boy' | 'girl' | 'unisex'
}
```

**Logic:**

1. No authentication check (this is a public endpoint)
2. Look up student by parent_onboarding_token
3. If not found → 404
4. Validate all required fields
5. Update the student row with all the parent-submitted data
6. Set profile_status = 'complete', parent_onboarding_completed_at = now()
7. Audit log: action = 'student.parent_onboarding_complete'

**Output:** `{ success: true, student_name: string }`

**Security:** The token IS the authentication. It's 32 chars of cryptographic randomness — effectively unguessable. The endpoint is rate-limited (Supabase default) to prevent brute-force token guessing.

---

### 5. `reset-student-password`

**Input:** `{ student_id: string }`

**Logic:**
1. Authenticate caller (must be staff with permission)
2. Verify student belongs to caller's org/branch
3. Generate new 8-char password
4. Update the Supabase Auth user's password (using admin API)
5. Audit log: action = 'student.password_reset'

**Output:** `{ new_password: string, username: string }`

---

### 6. `generate-payment-link`

**Input:** `{ payment_id: string }`

**Logic:**
1. Authenticate caller (must be admin)
2. Fetch the payment record + student + org details
3. Call Razorpay Create Payment Link API:
   - amount in paise
   - description with academy name and period
   - customer name and phone
   - expire_by: 7 days from now
   - callback_url: a thank-you page URL
4. Save razorpay_payment_link_id and link URL on the payment record
5. Audit log

**Output:** `{ payment_link_url: string }`

**Error handling:** If Razorpay API fails (network, auth, validation), return the error to the client with a human-readable message. Don't expose raw Razorpay error details.

---

### 7. `payment-webhook`

**Called by:** Razorpay when a payment is completed

**Input:** Razorpay webhook payload (JSON body) + signature header

**Logic:**
1. Verify webhook signature using HMAC-SHA256 with webhook secret
2. If signature invalid → return 400 (ignore)
3. Extract payment_link_id and payment details from payload
4. Find matching payment record by razorpay_payment_link_id
5. If not found → return 200 (might be from a different integration)
6. If payment already marked as paid → return 200 (duplicate webhook, ignore)
7. Update payment: status = 'paid', paid_at = now, razorpay_payment_id, payment_method
8. Call recalculate_student_fee_status for the student
9. Call generate-invoice internally (or inline the logic)
10. Queue WhatsApp receipt to parent
11. Audit log
12. Return 200 OK (always return 200 unless signature fails — otherwise Razorpay retries endlessly)

---

### 8. `send-whatsapp`

**Input:**
```
{
  recipient_phone: string,
  template_name: string,
  template_params: Record<string, string>,
  org_id: string,
  branch_id?: string,
  message_type: string,
  sent_by?: string
}
```

**Logic:**
1. Check rate limit: query whatsapp_logs for this phone + today → if >= 5, reject
2. Get WhatsApp credentials from org settings (or Supabase secrets)
3. Format the phone number: add country code if missing, remove non-digits
4. Call Meta WhatsApp Business Cloud API:
   - Endpoint: `https://graph.facebook.com/v21.0/{phone_number_id}/messages`
   - Method: POST
   - Headers: Authorization: Bearer {access_token}
   - Body: template message with components filled from template_params
5. Log in whatsapp_logs: status = 'sent' or 'failed'
6. Return the result

**Error handling:**
- Meta API returns specific error codes for invalid phone, template not approved, rate limit, etc.
- Map these to human-readable messages for the app
- Failed messages: set status = 'failed' in whatsapp_logs with error_message

---

### 9. `send-bulk-whatsapp`

**Input:**
```
{
  recipients: [{ phone, name, params }],
  template_name: string,
  message_type: string,
  org_id: string,
  branch_id?: string,
  sent_by: string
}
```

**Logic:**
- Iterate through recipients
- For each: call the same logic as send-whatsapp (single message)
- Add a small delay between messages (100ms) to avoid hitting Meta rate limits
- Return a summary: { total, sent, failed, skipped_rate_limit }

---

### 10. `generate-invoice`

**Input:** `{ payment_id: string }`

**Logic:**
1. Fetch payment + student + org + branch data
2. Generate a PDF with:
   - Header: org name, branch address, logo
   - "RECEIPT" title
   - Invoice number: auto-increment per org (use a counter in org settings, or a sequence)
   - Student name, ID
   - Period, amount, payment date, method
   - Footer: "Computer-generated receipt"
3. Upload PDF to Supabase Storage: `invoices/{org_id}/{payment_id}.pdf`
4. Update payment record with invoice_url
5. Return the invoice URL

**PDF generation in Deno:** Use a library like `jspdf` (available for Deno) or generate HTML and convert. Keep the invoice design simple — no complex layouts, just clean text blocks.

---

### 11-14. Cron Functions

**`send-reminders` (daily 8 AM IST):**
1. Query payments due in 3 days (upcoming), due today, or 1 day overdue
2. For each, queue WhatsApp reminder using appropriate urgency level
3. Respect rate limits

**`update-overdue` (daily midnight IST):**
1. `UPDATE payments SET status = 'overdue', updated_at = now() WHERE status = 'pending' AND due_date < CURRENT_DATE`
2. For each updated student, recalculate fee_status

**`expire-temp-coaches` (hourly):**
1. `UPDATE staff_profiles SET is_active = false WHERE role = 'temp_coach' AND access_expires_at < now() AND is_active = true`
2. Audit log for each

**`cleanup-logs` (weekly Sunday 3 AM):**
1. Delete audit_logs older than retention period (from org settings, default 365 days)
2. Delete whatsapp_logs older than 90 days

---

## Environment Variables (Supabase Secrets)

Set these using `supabase secrets set KEY=VALUE`:

| Secret | Used By | Notes |
|--------|---------|-------|
| SUPABASE_SERVICE_ROLE_KEY | All functions | Auto-available in Supabase Edge Functions |
| RAZORPAY_KEY_ID | generate-payment-link | Test key for dev |
| RAZORPAY_KEY_SECRET | generate-payment-link, payment-webhook | |
| RAZORPAY_WEBHOOK_SECRET | payment-webhook | For signature verification |
| WHATSAPP_PHONE_NUMBER_ID | send-whatsapp | From Meta Business Platform |
| WHATSAPP_ACCESS_TOKEN | send-whatsapp | From Meta |
| APP_URL | create-student, accept-invite | For generating links |

---

## Testing Edge Functions Locally

```bash
# Start Supabase locally
supabase start

# Serve a function locally
supabase functions serve create-student --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/create-student \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Test", "branch_id": "..."}'
```

---

*Next: File 009 covers Zustand stores, hooks, and service layer.*
