# CoachOS — File 006: Payments, Communication, Student Portal, Settings & Everything Else — Build Guide

> **Purpose:** All remaining screens and systems not covered in files 004-005. This covers payments/fees, WhatsApp communication, the student-facing portal, matches/news, settings, and audit logs.
> **Depends on:** Files 001-005
> **Build these AFTER attendance is working.** Attendance is the core loop — get it right first, then layer on payments, comms, and the rest.

---

## SECTION A: Fee Tracking & Payment Status

---

### A1. Payments Overview Screen

**Route:** `app/(staff)/(payments)/index.tsx`

**Purpose:** Show the financial health of the branch at a glance — who's paid, who hasn't, how much is outstanding. Enable bulk reminders.

**Who sees it:**
- Super Admin: sees all branches (with branch filter)
- Branch Admin: sees their branch
- Coach: sees a simplified view (student names + paid/unpaid status ONLY — no amounts, no revenue totals)
- Temp Coach: cannot access this screen at all

---

#### Layout

1. **Month selector:** At the top, a horizontal scrollable row of months. Current month is selected by default and highlighted (black pill). Tapping a month filters all data below. Show 3-4 months visible at once (current month centered, previous months to the left, next month to the right).

2. **Summary cards (Admin/Branch Admin only — hidden from coaches):**
   Three cards in a row:
   - "Collected" — total amount received this month, number of students paid. Green accent.
   - "Pending" — total amount due but not yet paid, number of students. Amber accent.
   - "Overdue" — total amount past due date, number of students. Red accent.

   These numbers come from aggregating the `payments` table for the selected month and branch.

3. **Filter bar (Linear-style chips):**
   - Status: Paid / Pending / Overdue / Partial / Waived / All
   - Batch: dropdown of branch batches
   - Search: search by student name

4. **Student payment table:**

   **Columns (Admin/Branch Admin view):**
   | Column | Content |
   |--------|---------|
   | Student | Name + student ID (small below name) |
   | Batch | Batch name |
   | Amount | Fee amount for this period (e.g., "₹3,000") |
   | Due Date | Date formatted (e.g., "Mar 5") |
   | Status | Badge: Paid (green) / Pending (amber) / Overdue (red) / Partial (amber with amount) |
   | Action | Icon button: phone icon to send reminder, or checkmark to mark as paid |

   **Columns (Coach view — simplified):**
   | Column | Content |
   |--------|---------|
   | Student | Name |
   | Status | Badge: Paid / Not Paid / Overdue |

   Coaches see NO amounts, NO due dates, NO action buttons (they can't manage payments). They only see status so they have context during attendance.

5. **Bulk action button (Admin only):**
   - "Send Reminders ({count})" — sends payment reminders to all students with status = pending or overdue
   - Confirm dialog: "Send payment reminders to {count} parents via WhatsApp?"
   - On confirm: queue WhatsApp messages using the `payment_reminder` template

6. **Floating action button or header button:**
   - "Create Payment Records" — opens a sheet to generate payment records for a new period (see A2)

---

### A2. Creating Payment Records for a Period

**This is how admins set up what each student owes for a month.**

**Flow:**

1. Admin taps "Create Payment Records" on the payments overview
2. A full-screen sheet or new page opens with:
   - **Period label** input: text input, e.g., "March 2026" or "Q1 2026" — free text since different academies bill differently
   - **Amount** input: number input for the default fee amount (e.g., 3000)
   - **Due date** input: date picker for when payment is due
   - **Apply to:** Options:
     - "All active students in this branch" (default)
     - "Specific batch" → batch selector
     - "Select students" → multi-select student list
   - **"Create Records"** button

3. On creation:
   - For each selected student, create a row in the `payments` table:
     - student_id, org_id, branch_id
     - amount (the default amount — can be individually adjusted later)
     - period_label from input
     - due_date from input
     - status: 'pending'
   - Skip students who already have a payment record for this period_label (prevent duplicates)
   - Audit log: `payment.bulk_create`, details: { count, period_label, amount }

4. Show result: "Created 42 payment records for March 2026."

**Edge cases:**
- Student already has a record for this period → skip them, mention in the result: "3 students skipped (already have records for this period)"
- Amount is 0 → allow it (some students might be on scholarship — they still get a record but amount is 0, can be marked as 'waived')
- No students match the selection → show error, don't create anything

---

### A3. Individual Student Payment Detail

**Route:** `app/(staff)/(payments)/[studentId].tsx`

**Purpose:** See a specific student's full payment history and manage their payments.

**Layout:**

1. **Student info header:** Name, ID, batch, branch, current fee status badge
2. **Payment history table:**
   | Period | Amount | Due Date | Status | Paid At | Method | Action |
   Each row is one payment record. Newest first.
3. **Action buttons per row (admin only):**
   - If pending/overdue: "Mark as Paid" button, "Send Reminder" button, "Generate Payment Link" button
   - If paid: "View Invoice" button
   - If partial: "Record Additional Payment" button

---

### A4. Marking a Payment as Paid (Manual — Cash)

**Who:** Super Admin, Branch Admin

**Flow:**

1. Admin taps "Mark as Paid" on a pending payment row
2. A bottom sheet opens:
   - **Payment method** selector: Cash / UPI (manual) / Bank Transfer
   - **Amount received:** pre-filled with the full amount, editable (for partial payments)
   - **Notes** (optional): text input
   - "Confirm Payment" button
3. On confirm:
   - Update the payment record: status = 'paid' (or 'partial' if amount < full), paid_at = now, payment_method, marked_by = current admin
   - Update the student's `fee_status` field: recalculate based on all their payment records (if all paid → 'paid', if any overdue → 'overdue', etc.)
   - Generate invoice (see A6)
   - Audit log: `payment.mark_paid`
   - Toast: "Payment recorded for {student_name}"
4. Optionally: "Send receipt via WhatsApp?" toggle — if on, sends the invoice to the parent after confirmation

---

### A5. Generating a Razorpay Payment Link

**Who:** Super Admin, Branch Admin

**Purpose:** Create a digital payment link that the parent can use to pay via UPI/card/net banking.

**How Razorpay Payment Links work:**
- Razorpay provides an API to create payment links
- Each link has: amount, description, customer details (name, phone), expiry
- The link opens a Razorpay-hosted payment page — no additional PCI compliance needed
- After payment, Razorpay sends a webhook to your server confirming the payment

**Flow:**

1. Admin taps "Generate Payment Link" on a student's pending payment
2. The app calls a Supabase Edge Function: `generate-payment-link`
   - The Edge Function calls Razorpay's Create Payment Link API with:
     - amount (in paise — multiply by 100)
     - currency: "INR"
     - description: "{Academy Name} - {Period Label} fee for {Student Name}"
     - customer: { name: parent_name, contact: parent_phone }
     - notify: { sms: false, email: false } (we send via WhatsApp ourselves)
     - callback_url: a URL that Razorpay redirects to after payment (can be a thank-you page)
     - expire_by: unix timestamp for link expiry (7 days from now)
   - The Edge Function returns the payment link URL and Razorpay's payment_link_id
3. Store the `razorpay_payment_link_id` and link URL on the payment record
4. Show the link to the admin with options:
   - "Send via WhatsApp" — sends the link to parent's WhatsApp with a message: "{Academy Name}: Pay ₹{amount} for {period}. Click here: {link}"
   - "Copy Link" — copies URL to clipboard
5. Payment link is now live — when the parent clicks and pays, the webhook handles the rest (see A7)

**Test mode:**
- In Razorpay test mode, payment links work with test card numbers and test UPI IDs
- No real money moves in test mode
- The webhook still fires (to a test endpoint), so the full flow can be tested
- All this works without company registration — Razorpay test mode is available immediately after signup

---

### A6. Invoice Generation

**When an invoice is generated:**
- After a payment is confirmed (either manual or via Razorpay webhook)

**How to generate:**
- Use a Supabase Edge Function: `generate-invoice`
- The function creates a simple PDF invoice with:
  - Academy name + logo (if uploaded) + branch address
  - "RECEIPT" or "INVOICE" header
  - Student name, student ID
  - Period: "March 2026"
  - Amount: ₹3,000
  - Payment date
  - Payment method
  - A unique invoice number (auto-generated, sequential per org)
  - "This is a computer-generated receipt and does not require a signature."
- PDF is generated using a library available in Deno (the Edge Function runtime). Options: `jspdf` or generating HTML and converting to PDF.
- The PDF is uploaded to Supabase Storage
- The storage URL is saved on the payment record as `invoice_url`

**Invoice delivery:**
- After generation, if WhatsApp sending is enabled, send the invoice to the parent via WhatsApp
- The WhatsApp message uses the `payment_received` template: "Payment of ₹{amount} received for {student_name}. Invoice: {link}"
- The parent taps the link and the PDF downloads/opens in their browser

---

### A7. Razorpay Webhook Handling

**When a parent pays via a Razorpay payment link, Razorpay sends a webhook to your server.**

**Setup:**
- In Razorpay dashboard (test and live), set the webhook URL: `https://{your-supabase-project}.supabase.co/functions/v1/payment-webhook`
- Set a webhook secret for signature verification
- Subscribe to event: `payment_link.paid`

**Edge Function: `payment-webhook`**

When the webhook fires:

1. **Verify the signature:** Razorpay sends a signature header. Verify it using HMAC-SHA256 with your webhook secret. If verification fails, return 400 (ignore the request — it might be spoofed).

2. **Extract payment details:** From the webhook payload, get:
   - `payment_link_id` — matches the `razorpay_payment_link_id` on your payment record
   - `payment_id` — Razorpay's unique payment ID
   - `amount` — amount paid (in paise)
   - `method` — payment method (upi, card, netbanking, etc.)

3. **Find and update the payment record:** Query `payments` where `razorpay_payment_link_id` matches. Update:
   - status: 'paid'
   - paid_at: now
   - razorpay_payment_id: from webhook
   - payment_method: from webhook (e.g., 'upi')

4. **Update student fee_status:** Recalculate based on all their payment records.

5. **Generate invoice:** Call the invoice generation logic.

6. **Send WhatsApp receipt:** Send the invoice link to the parent.

7. **Audit log:** `payment.webhook_received`

8. **Return 200 OK** to Razorpay (important — if you return an error, Razorpay retries the webhook repeatedly).

**Edge cases:**
- Webhook received twice for the same payment (duplicate delivery) → check if payment is already 'paid'. If yes, ignore.
- Partial payment (parent pays less than full amount) → Razorpay doesn't support partial payments on payment links by default. The full amount or nothing. But if you enable partial payments on the link, handle it: set status to 'partial', record the amount.
- Payment link expired → the parent can't pay. The admin should generate a new link.
- Webhook delivery delayed (hours later) → still process it. Check the payment timestamp, not the webhook receipt time.

---

### A8. Automatic Overdue Updates

**A Supabase Edge Function runs daily at midnight (IST) via cron:**

1. Query all payments where `status = 'pending'` AND `due_date < today`
2. Update each to `status = 'overdue'`
3. For each updated payment, update the student's `fee_status` to 'overdue'
4. Audit log: `payment.auto_overdue`, details: { count }

**Another cron job runs at 8 AM (IST) daily:**

1. Query payments that are:
   - Due in 3 days (upcoming reminder)
   - Due today
   - 1 day overdue
2. For each, queue a WhatsApp reminder to the parent (using the appropriate template)
3. Respect the daily message limit (max 5 messages per parent per day)

---

## SECTION B: WhatsApp Communication Hub

**Route:** `app/(staff)/(communicate)/index.tsx`

**Purpose:** Central place for all WhatsApp messaging — broadcasts, reminders, logs.

**Who sees it:** Super Admin, Branch Admin, Coach (limited). Temp Coach: no access.

---

### B1. Communication Hub Layout

1. **Header:** "Messages"

2. **Primary action button:** "Compose Broadcast" — opens the broadcast composer (B2)

3. **Quick actions section:** Four tappable cards/rows for common one-tap actions:
   - **"Payment Reminders ({count})"** — count of students with pending/overdue payments. Tapping opens a confirm dialog, then sends reminders to all of them.
   - **"Absent Alerts ({count})"** — count of students marked absent today. Tapping sends absent notifications to their parents.
   - **"Class Cancelled"** — opens a mini form: select batch, enter reason (optional), confirm → sends cancellation notice to all parents in that batch.
   - **"Schedule Change"** — opens a mini form: select batch, enter new time/details, confirm → sends to all parents in that batch.

4. **Recent Messages section:** A reverse-chronological list of recent WhatsApp messages sent from this branch. Each row shows:
   - Date/time
   - Message type (icon + label: "Payment Reminder", "Absent Alert", etc.)
   - Recipient count: "Sent to 12 parents"
   - Status: "Delivered" / "Sent" / "Failed ({count})"
   - Tapping a row expands it to show individual recipient statuses

5. **"View All Messages" link** → navigates to a full message log with filters (date range, type, status)

---

### B2. Broadcast Composer

**Opens as:** Full screen page or a large bottom sheet

**Layout:**

1. **Recipient selector:**
   - Radio options: "All parents in branch" / "Specific batch" / "Students with unpaid fees" / "Select individual students"
   - If "Specific batch" → show batch dropdown
   - If "Select individual students" → show a searchable multi-select list of students (with checkboxes)
   - Show count: "This will be sent to 42 parents"

2. **Template selector:**
   - A list of pre-defined message templates (cards with preview):
     - Payment Reminder — "Reminder: Fee of ₹{amount} is due..."
     - Absent Alert — "{student_name} was absent today..."
     - Class Cancelled — "Class is cancelled for {batch}..."
     - Schedule Change — "Schedule update for {batch}..."
     - Custom Message — free text field
   - Tapping a template selects it and shows a preview below

3. **Message preview:**
   - Shows exactly what the WhatsApp message will look like
   - If using a template with variables, show them filled in with example data: "Reminder: Fee of ₹3,000 is due on March 5 for Rahul Kumar."
   - For custom messages: show the text area with the academy name auto-appended

4. **"Send" button:**
   - Confirm dialog: "Send this message to {count} parents via WhatsApp?"
   - On confirm: queue all messages via the `send-whatsapp` Edge Function
   - Show progress: "Sending... 12/42" → "All sent ✓" or "38 sent, 4 failed"
   - Each message is logged in `whatsapp_logs`

---

### B3. WhatsApp Technical Architecture

**How messages actually get sent:**

1. The app calls a Supabase Edge Function: `send-whatsapp`
2. The Edge Function receives: recipient phone, template name, template parameters, org_id, sent_by
3. It calls the Meta WhatsApp Business Cloud API:
   - Endpoint: `https://graph.facebook.com/v21.0/{phone_number_id}/messages`
   - Auth: Bearer token (stored in Supabase secrets)
   - Body: template message with parameters filled in
4. Meta's API returns a message ID and status
5. The Edge Function logs the result in `whatsapp_logs`
6. For bulk sends, the Edge Function processes messages one at a time with a small delay (to avoid rate limits)

**Rate limits and safety:**
- Meta allows 1,000 free service conversations per month
- Rate limit: max 80 messages per second (way more than needed)
- App-level limit: max 5 messages per parent per day (enforced by querying `whatsapp_logs` before sending)
- All messages must use pre-approved templates (Meta requires template approval for Business API)
- Custom messages: these go through Meta's template system too. Create a "custom_announcement" template with a single variable for the message body.

**Setting up WhatsApp (one-time, done by Super Admin in Settings):**
- Register on Meta Business Platform (free, no company registration needed — personal ID works for testing)
- Create a WhatsApp Business Account
- Add a phone number (can be a personal number for testing)
- Create message templates and submit for approval (approval takes 24-48 hours)
- Get the Phone Number ID and permanent access token
- Enter these in CoachOS Settings → WhatsApp Configuration

---

## SECTION C: Student Portal

**Route group:** `app/(student)/`

**Purpose:** Students log in and see their own data — attendance, payments, notes, matches.

**Who sees it:** Students only (role = 'student')

**Key principle:** This is a READ-MOSTLY experience. Students don't create data (except reactions on news). They consume data that coaches and admins create.

---

### C1. Student Home Screen

**Route:** `app/(student)/index.tsx`

**Layout:**

1. **Greeting:** "Hi, {first_name} 👋" — the one place we use an emoji in the student experience
2. **Academy name** below in text-secondary

3. **Fee Status Card (prominent, top of page):**
   - If paid: green-tinted card, "Fees Paid ✓", period label, amount paid
   - If due: amber-tinted card, "Fee Due: ₹{amount}", due date, "Pay Now" button
   - If overdue: red-tinted card, "Fee Overdue: ₹{amount}", days overdue, "Pay Now" button urgently styled
   - "Pay Now" taps opens the Razorpay payment link in an in-app browser
   - If no payment link exists: "Pay Now" is disabled with note "Contact your academy for payment details"

4. **This Week's Attendance:**
   - A row of 7 day bubbles (Mon-Sun):
     - Green filled = present
     - Red filled = absent
     - Gray outline = no session that day
     - Dot/unfilled = upcoming (not yet happened)
   - Below: "3 of 4 sessions attended this week"

5. **Upcoming Match Card (if any):**
   - Match title, date, time, location
   - Tap to see full match detail

6. **Latest from Coach:**
   - Most recent coach note (truncated to 2 lines)
   - Tap to see all notes

7. **Bottom Tab Bar for Students:**
   - Home | Attendance | Payments | Notes | More
   - "More" opens: Matches, Profile, News

---

### C2. Student Attendance Screen

**Route:** `app/(student)/attendance.tsx`

**Layout:**

1. **Monthly calendar heatmap:**
   - A grid showing the current month
   - Each day cell is color-coded: green (present), red (absent), amber (late), blue (excused), gray (no session), white (future/no data)
   - Month selector: arrows to go to previous/next months
   - Below the calendar: summary for the selected month: "Present: 18 / 22 sessions (82%)"

2. **Detailed list below the calendar:**
   - A table/list of attendance records for the selected month
   - Columns: Date | Batch | Status
   - Sorted newest first

**Data:** Query `attendance_records` where `student_id = current student`, filtered by month. RLS ensures they can only see their own records.

---

### C3. Student Payments Screen

**Route:** `app/(student)/payments.tsx`

**Layout:**

1. **Current status card** (same as the home screen card but larger)
2. **Payment history table:**
   - Period | Amount | Status | Paid Date | Method
   - Each row shows one payment record
   - Paid rows show a "View Invoice" link → opens the invoice PDF
3. **If there's a pending payment with a Razorpay link:** Show a "Pay Now" button prominently

---

### C4. Student Notes Screen

**Route:** `app/(student)/notes.tsx`

**Purpose:** See diet plans, practice plans, and improvement notes from coaches.

**Layout:**

1. **Filter tabs at top:** All | Diet | Practice | Improvement | General
2. **Notes list:** Each note is a card:
   - Note type badge (e.g., "Diet Plan" in a blue badge)
   - Title (if set)
   - Body text (full content or first 3 lines with "Read more")
   - Coach name + date at the bottom in text-tertiary
   - Tapping expands the full note (inline expansion, not a new page)

**Data:** Query `coach_notes` where `student_id = current student`. RLS handles access.

---

### C5. Student Matches Screen

**Route:** `app/(student)/matches.tsx`

**Layout:**

1. **Upcoming matches** (where this student is a participant):
   - Cards showing: title, date, time, location, match type
   - Preparation notes from the coach (expandable)
   - If no upcoming matches: "No upcoming matches"

2. **Past matches** (collapsed/expandable section below)

**Data:** Query `matches` joined with `match_participants` where `student_id = current student`.

---

### C6. Student Profile Screen

**Route:** `app/(student)/profile.tsx`

**Purpose:** View (mostly read-only) personal info.

**Layout:**
- Avatar + name + student ID
- All profile fields in a read-only format (grouped into sections):
  - Personal: DOB, age, gender, blood group, age group
  - Academy: branch, batch
  - School: school name, grade
  - Contact: parent name, parent phone (partially masked: "98****1234")
- Students CANNOT edit their own profile (only parents/admins can)
- "Contact Admin" note at the bottom: "To update your details, ask your coach or academy admin."

---

### C7. News & Reactions

**Where:** A section on the student home screen or a dedicated tab under "More"

**Layout:**
- A feed of news posts from the academy, newest first
- Each post: title, body, image (if any), posted by (coach name), date
- Below each post: reaction buttons (limited set: 👍 🔥 💪 ❤️)
- Tapping a reaction toggles it (one reaction per student per post)
- Reaction counts shown below the buttons

**Data:** Query `news_posts` for the student's org (and branch, or org-wide). Reactions in `news_reactions`.

---

## SECTION D: Matches & Events

**Route:** `app/(staff)/(settings)/` or a dedicated section — match management is done by staff.

**Who creates matches:** Super Admin, Branch Admin, Coach (not temp coach)

---

### D1. Match Creation Flow

1. Staff taps "Create Match" (from the dashboard or a matches section)
2. Form fields:
   - Title (required): "Inter-Academy Tournament"
   - Match Type (optional): Practice / Tournament / Friendly / League / Other
   - Date & Time (required): date + time pickers
   - Location (optional): text input
   - Description (optional): multi-line text
   - Preparation Notes (optional): multi-line text — "What students should bring, practice before, etc."
   - Assign Students: multi-select list of active students in the branch. Searchable. Checkboxes.
3. "Create Match" button
4. On creation:
   - Row in `matches` table
   - Rows in `match_participants` for each selected student
   - Audit log: `match.create`
   - Optionally: send WhatsApp notification to assigned students' parents

---

## SECTION E: Settings

**Route group:** `app/(staff)/(settings)/`

**Who sees it:** Different setting pages visible based on role.

---

### E1. Settings Index

**Route:** `app/(staff)/(settings)/index.tsx`

A list of setting categories. Each is a tappable row that navigates to a detail page:

| Setting | Who Can See | Description |
|---------|-------------|-------------|
| Branches | Super Admin only | Manage branches (add, edit, deactivate) |
| Staff | Super Admin, Branch Admin | View staff list, create invites, deactivate staff |
| Batches | Super Admin, Branch Admin | Add/edit/remove batches |
| Age Groups | Super Admin | Add/edit age groups |
| Payment Configuration | Super Admin | Set default fee amounts, billing frequency, payment model |
| WhatsApp Configuration | Super Admin | Set up WhatsApp Business API credentials |
| Academy Profile | Super Admin | Edit org name, sport type, logo |
| Audit Logs | Super Admin only | View system activity logs |
| Account | Everyone | Personal profile, sign out |

---

### E2. Staff Management

**Route:** `app/(staff)/(settings)/staff.tsx`

**Layout:**

1. **Staff list table:**
   - Columns: Name | Role | Branch | Status | Joined
   - Role shown as a badge (color-coded by role)
   - Status: Active (green dot) / Inactive (gray dot)
   - Tap row to see staff detail

2. **"Invite Staff" button** in the header → opens the invite flow described in File 004, Section C1

3. **Staff detail (tap on row):**
   - Full profile info
   - Role and branch
   - Actions (based on permissions):
     - "Deactivate" — sets is_active to false (Super Admin only for all roles; Branch Admin can deactivate coaches in their branch)
     - "Convert to Coach" — only for temp_coach, only Super Admin can do this
     - "Change Branch" — reassign to a different branch (Super Admin only)

---

### E3. Batches Management

**Route:** `app/(staff)/(settings)/batches.tsx`

**Layout:**
- List of existing batches (as cards or table rows)
- Each shows: name, time range, days, applied-to branches
- Edit button on each → opens edit form (same fields as onboarding step 4)
- "Add Batch" button → same form, empty
- Delete/deactivate option (with confirmation)

---

### E4. WhatsApp Configuration

**Route:** `app/(staff)/(settings)/whatsapp-config.tsx`

**Who:** Super Admin only

**Layout:**
1. **Status indicator:** "WhatsApp: Connected ✓" or "WhatsApp: Not configured"
2. **Configuration form:**
   - Phone Number ID (text input) — from Meta Business Platform
   - Access Token (password input, masked) — from Meta
   - Webhook Verify Token (text input) — a string you define for webhook verification
   - "Save" button
3. **Test section:**
   - "Send Test Message" button — sends a test WhatsApp message to the admin's own number
   - Shows result: success or error with details
4. **Template status:**
   - List of required templates with their approval status
   - Each template: name, status (Approved ✓ / Pending ⏳ / Rejected ✗)
   - Link to Meta Business Platform to manage templates

---

### E5. Audit Logs

**Route:** `app/(staff)/(settings)/audit-logs.tsx`

**Who:** Super Admin only

**Purpose:** Full transparency into everything that's happened in the system.

**Layout:**

1. **Search bar:** Search across all fields (actor name, action, entity type, details)

2. **Filter chips:**
   - Date range: Today / This Week / This Month / Custom
   - Action type: User Management / Attendance / Payments / Communication / Settings / All
   - Actor: dropdown of staff names

3. **Log table:**
   | Timestamp | Actor | Action | Entity | Details |
   Each row is an audit log entry.
   - Timestamp: formatted as "Feb 28, 2:30 PM"
   - Actor: staff name + role badge
   - Action: human-readable (e.g., "Marked attendance" not "attendance.mark")
   - Entity: what was affected (e.g., "Student: Rahul Kumar")
   - Details: expandable — shows full JSON details (before/after values)

4. **Pagination:** Same as attendance history — 50 per page, cursor-based

**Human-readable action labels:**
| Raw Action | Display Label |
|------------|---------------|
| student.create | Created student |
| student.edit | Updated student |
| student.archive | Archived student |
| attendance.mark | Marked attendance |
| attendance.edit | Edited attendance |
| payment.mark_paid | Recorded payment |
| payment.bulk_create | Created payment records |
| payment.webhook_received | Payment received (online) |
| invite.create | Created invite link |
| staff.invite_accepted | Staff joined |
| staff.deactivate | Deactivated staff |
| whatsapp.send | Sent WhatsApp message |
| org.create | Created organization |
| branch.create | Created branch |
| match.create | Created match |

---

## SECTION F: Navigation Architecture

---

### F1. Staff Navigation (Mobile)

**Bottom Tab Bar — 5 tabs:**
| Tab | Icon | Label | Route |
|-----|------|-------|-------|
| 1 | House | Home | /(staff)/(home)/ |
| 2 | CheckSquare | Attendance | /(staff)/(attendance)/ |
| 3 | Users | Students | /(staff)/(students)/ |
| 4 | IndianRupee (or Wallet) | Payments | /(staff)/(payments)/ |
| 5 | MoreHorizontal | More | Opens a bottom sheet |

**"More" bottom sheet contains:**
- Messages (Communication hub)
- Matches
- Settings
- Audit Logs (Super Admin only)
- Sign Out

**Active tab styling:** Black icon + black label text. Inactive: gray icon + gray text. No color indicators — monochrome only.

**Tab bar height:** 56px on iOS (with safe area), 48px on Android. Tab items centered vertically.

---

### F2. Staff Navigation (Web — 768px+ width)

**Switch from bottom tabs to a left sidebar.** The layout component should detect screen width and switch:
- Below 768px: bottom tab bar (mobile)
- 768px and above: left sidebar (desktop/tablet)

**Sidebar contents:** Same items as the tabs + more sheet, but all visible at once in a vertical list. See the wireframe in File 001 Section 9.2.2.

**Sidebar width:** 240px. Collapsible to 64px (icon-only) on medium screens (768-1024px). Always expanded on large screens (1024px+).

---

### F3. Student Navigation (Mobile)

**Bottom Tab Bar — 5 tabs:**
| Tab | Icon | Label | Route |
|-----|------|-------|-------|
| 1 | House | Home | /(student)/ |
| 2 | CheckSquare | Attendance | /(student)/attendance |
| 3 | Wallet | Payments | /(student)/payments |
| 4 | FileText | Notes | /(student)/notes |
| 5 | MoreHorizontal | More | Sheet: Matches, Profile, News |

---

## SECTION G: Cross-Cutting Concerns

---

### G1. Loading States

Every screen that fetches data should show:
- **Skeleton loading** (not spinners) on first load. Use the Skeleton component for each content area.
- **Pull-to-refresh** on mobile for list screens (student list, attendance history, payment overview). Use React Native's RefreshControl.
- **Inline loading** for actions (button becomes loading state while API call is in flight).
- **Stale data indicator:** If data is from cache and a refresh is happening in the background, show a subtle "Updating..." text at the top.

### G2. Error States

- **Network error on data fetch:** Show a retry card: "Couldn't load data. Check your connection." with a "Retry" button.
- **Permission error (403 from RLS):** Show: "You don't have access to this data." This shouldn't happen in normal flow but serves as a safety net.
- **Not found (404):** Show: "This item doesn't exist or has been removed."
- **Server error (500):** Show: "Something went wrong on our end. Please try again." with retry button.

### G3. Empty States

Every list/table screen needs a well-designed empty state (using the EmptyState component). Examples:
- Students list empty: "No students yet. Add your first student to get started." + "Add Student" button
- Attendance history empty: "No attendance records found for the selected filters."
- Payments empty: "No payment records yet. Create records when you're ready to track fees."
- Messages empty: "No messages sent yet."

### G4. Haptic Feedback

Use `expo-haptics` for tactile feedback on:
- Attendance swipe (light impact on threshold cross)
- Button taps (selection feedback)
- Destructive actions (notification feedback before confirm dialog)
- Pull-to-refresh activation
- Toggle switches

Keep it subtle — haptics should feel like a quality touch, not annoying vibrations.

### G5. Deep Linking

Set up Expo Router deep links so:
- Invite links (`/invite/{token}`) open directly in the app if installed, or in the browser
- Parent onboarding links (`/parent-onboarding/{token}`) always open in the browser (no app install needed)
- Payment links open Razorpay (external)
- Push notification taps navigate to the relevant screen (e.g., attendance reminder → batch selector)

Configure the `scheme` in app.json and set up universal links for the web domain.

---

## Complete Build Order (All Files Combined)

This is the recommended sequence for building the entire app:

**Phase 1: Foundation (Files 002-003)**
1. Scaffold Expo project, install dependencies, configure everything
2. Build all UI components (design system)

**Phase 2: Auth & Access (File 004)**
3. Login screen (Google OAuth + student username/password)
4. Session management and auth routing
5. Org onboarding wizard (5 steps)
6. Completion screen

**Phase 3: Core Loop — Attendance (File 005)**
7. Batch selector screen
8. Swipe card component and gesture system
9. Card stack manager with undo
10. Attendance summary screen
11. Offline queue for attendance
12. Attendance history with filters

**Phase 4: Students (File 004 — student onboarding parts)**
13. Student list screen with Linear-style filters and table
14. Add student form (coach minimal)
15. Share screen with QR code and credentials
16. Parent onboarding public form
17. Student detail screen with tabs

**Phase 5: Payments (File 006 — Section A)**
18. Payments overview screen
19. Create payment records
20. Mark as paid (manual)
21. Razorpay payment link generation
22. Payment webhook handler
23. Invoice generation

**Phase 6: Communication (File 006 — Section B)**
24. Communication hub screen
25. Broadcast composer
26. WhatsApp Edge Function
27. Quick actions (payment reminders, absent alerts, etc.)

**Phase 7: Student Portal (File 006 — Section C)**
28. Student home screen
29. Student attendance (calendar heatmap)
30. Student payments
31. Student notes
32. Student profile

**Phase 8: Settings & Admin (File 006 — Sections D-E)**
33. Settings index
34. Staff management + invite flow
35. Batch/age group management
36. WhatsApp configuration
37. Audit logs

**Phase 9: Polish**
38. Notifications (local push for reminders)
39. Deep linking
40. Offline sync improvements
41. Error boundaries and crash handling
42. Performance optimization
43. Web deployment to Vercel
44. Mobile builds via EAS

---

*This is the final instructional file. Files 001-006 together form the complete specification for CoachOS. Feed them to Cursor in order and build phase by phase.*
