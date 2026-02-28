# CoachOS — File 004: Auth, Onboarding & Invite Flows — Build Guide

> **Purpose:** Detailed instructions for building every auth, onboarding, and invite screen. No code — just what to build, how it works, what connects to what, every edge case, and exact behavior expectations.
> **Depends on:** Files 001 (PRD), 002 (scaffold + lib files), 003 (UI components)
> **Who this is for:** Feed this to Cursor or any developer/AI. It should be clear enough for a junior engineer to follow.

---

## How to Read This Document

Each screen section contains:
- **Route** — where the file lives in Expo Router
- **Purpose** — what this screen does in one sentence
- **Who sees it** — which users land here
- **Layout** — exact visual structure, top to bottom
- **Elements** — every input, button, text, and interactive piece
- **Behavior** — what happens when users interact
- **Data flow** — what gets read from / written to the database
- **Navigation** — where users go next
- **Edge cases** — every failure state, weird scenario, and fallback
- **Accessibility** — keyboard, screen reader, and touch target notes

---

## SECTION A: Authentication

---

### A1. Login Screen

**Route:** `app/(auth)/login.tsx`

**Purpose:** Single entry point for all user types — staff log in via Google, students log in via username/password.

**Who sees it:** Anyone not currently authenticated. The root `app/index.tsx` redirects here if no active session exists.

**Layout (top to bottom):**

1. **Logo area** — CoachOS wordmark, centered, near top third of screen. No icon/image logo needed yet — just the text "CoachOS" in Inter-Bold, 30px, black. Below it, a one-line tagline in text-secondary: "Manage your academy, effortlessly."

2. **Google login button** — Full-width primary button (black background, white text). Label: "Continue with Google". This is the MAIN action — it should be the most prominent element. Staff (admins, coaches) always use this.

3. **Divider** — A horizontal line with the word "or" centered in it. Uses the Divider component with label.

4. **Student login section** — Two input fields stacked:
   - Username input (text, no autocapitalize, no autocorrect)
   - Password input (secure text entry, show/hide toggle on the right)
   - Below inputs: a secondary button (white bg, black border): "Sign In"

5. **Footer link** — At the bottom: "Don't have an academy account?" followed by a tappable link: "Set up your academy →". This goes to the onboarding flow.

**Behavior — Google Login:**

1. User taps "Continue with Google"
2. Trigger Supabase Auth Google OAuth flow. On mobile this opens an in-app browser (use `expo-web-browser`). On web it redirects.
3. On successful Google auth, Supabase returns a session with user ID
4. Immediately query `staff_profiles` table: look for a row where `auth_user_id` matches AND `is_active` is true
5. **If staff profile found:** Check the role.
   - If role is `temp_coach`, also check `access_expires_at`. If expired, show error: "Your temporary access has expired. Contact your academy admin." and sign them out.
   - Otherwise, navigate to `/(staff)/(home)/`
6. **If NO staff profile found:** This could mean two things:
   - They're a brand new user who wants to create an academy → navigate to `/(auth)/onboarding/org-details`
   - They were invited but haven't used their invite link yet → Show a message: "No academy found for this account. If you were invited, please use your invite link first." with a "Try Again" button and a "Set up a new academy" link.
   - Important: do NOT auto-create an org for them. They must either use an invite or go through onboarding explicitly.

**Behavior — Student Login:**

1. User types username and password, taps "Sign In"
2. The username field is NOT an email. However, Supabase Auth requires email-based login. So internally, the app converts the username to a pseudo-email: `{username}@students.coachOS.internal` (this is never shown to the user, it's just for Supabase Auth's email field)
3. Call Supabase Auth `signInWithPassword` with this pseudo-email and the password
4. On success, query `students` table where `auth_user_id` matches AND `enrollment_status` is `active`
5. **If student found:** Navigate to `/(student)/`
6. **If student NOT found but auth succeeded:** Their enrollment may be paused or archived. Show: "Your account is currently inactive. Contact your academy."
7. **If auth fails (wrong password):** Show inline error below the password field: "Invalid username or password." Do NOT say which one is wrong.

**Edge Cases:**

- **No internet:** Show a toast: "No internet connection. Please check your network." Don't attempt the auth call.
- **Google OAuth cancelled:** User closes the browser mid-flow. Nothing happens — they stay on the login screen. No error shown.
- **Google OAuth error:** Show toast: "Sign in failed. Please try again."
- **Multiple orgs:** A staff member might belong to multiple organizations. After Google login, if the query returns multiple staff_profiles, show an org selector screen (a simple list of org names, tap to select). Store the selected org ID for the session. This is a rare case but must be handled.
- **Account exists but deactivated (`is_active` = false):** Show: "Your account has been deactivated. Contact your academy admin." Sign them out.
- **Rate limiting:** If Supabase returns a rate limit error, show: "Too many attempts. Please wait a moment and try again."
- **Keyboard behavior:** On mobile, the login form should scroll up when the keyboard appears so inputs aren't hidden. Use `KeyboardAvoidingView` or equivalent.

**Accessibility:**
- All inputs must have proper labels
- Google button should have accessibilityLabel: "Sign in with Google"
- Touch targets: all buttons at least 44px tall
- Password show/hide toggle needs accessibilityLabel

---

### A2. Session Management (Background Logic, Not a Screen)

**Purpose:** Keep users logged in, handle token refresh, detect expired sessions.

**How it works:**

- Supabase Auth handles session tokens and refresh automatically via the client SDK
- On app launch (in `app/index.tsx`), call `supabase.auth.getSession()` to check if a valid session exists
- Subscribe to auth state changes using `supabase.auth.onAuthStateChange()` in the root layout. This fires when:
  - User signs in
  - Token is refreshed
  - User signs out
  - Session expires
- When auth state changes to `SIGNED_OUT` or session becomes null, redirect to login
- Staff sessions last 30 days (Supabase default). Students should also use the default.
- For temp coaches: on every navigation or API call, the app should check `access_expires_at`. If expired, sign them out and show the expiry message. This check should happen in a global middleware/wrapper, not on every individual screen.

**Storage:**
- Session tokens stored via SecureStore on native (already configured in `lib/supabase.ts`)
- On web, falls back to localStorage
- The current user's role, org_id, and branch_id should be cached in Zustand store AND in MMKV for fast access. Refresh from DB on app launch.

---

## SECTION B: Organization Onboarding

This is a 5-step wizard that only the founding member sees. It creates the organization, branches, batches, and age groups. After completion, the user becomes the `super_admin`.

**Key principles for all onboarding steps:**
- Progress indicator at the top showing current step out of 5
- Back button on steps 2-5 (step 1 has no back — it's the entry)
- "Continue" button at the bottom of each step. Disabled until required fields are filled.
- Form state should persist across steps. If user goes back and forward, their data shouldn't be lost. Use Zustand store or React state in the parent layout to hold all form data across steps.
- On web, the onboarding should be centered in a max-width container (480px) for readability. On mobile, full width with standard padding.
- If the user exits mid-onboarding (closes app, navigates away), their progress should NOT be saved to the database yet. It's all local until the final step. However, you CAN save draft data to MMKV so if they reopen the app, they can resume from where they left off. Store the current step number and all form data.

---

### B1. Step 1: Academy Details

**Route:** `app/(auth)/onboarding/org-details.tsx`

**Purpose:** Capture the sport type and academy name.

**Layout:**

1. Progress bar: "Step 1 of 5" with a visual progress indicator (thin bar, 20% filled)
2. Heading: "What sport does your academy focus on?"
3. Sport type selector: A grid of selectable cards (2 columns). Each card has the sport name only (no icons — remember, minimal decorative elements). Cards: Cricket, Football, Hockey, Tennis, Badminton, Basketball, Swimming, Athletics, Other. Single select — tapping one deselects the previous.
4. If "Other" is selected, show a text input below: "Sport name" — free text.
5. Input field: "Academy Name" — required, minimum 2 characters, maximum 100.
6. "Continue" button — disabled until sport is selected AND academy name is filled.

**Validation:**
- Sport type: must select one
- Academy name: 2-100 characters, trimmed whitespace
- Zod schema: `orgDetailsSchema` from validators

**Edge cases:**
- User selects "Other" then switches to "Cricket" → the "Other" text input should disappear and its value should be cleared
- Very long academy name → enforce max length with character counter
- User tries to continue without selecting sport → button stays disabled, no error toast needed (the disabled state is clear enough)

---

### B2. Step 2: Founders

**Route:** `app/(auth)/onboarding/founders.tsx`

**Purpose:** Ask if there are co-founders and collect their email addresses for invites.

**Layout:**

1. Progress bar: "Step 2 of 5" (40% filled)
2. Back arrow in top-left
3. Heading: "Do you have co-founders?"
4. Description text: "Co-founders get full admin access to your academy, identical to yours."
5. Toggle (Switch component): "Yes, I have co-founders" — default OFF
6. If toggled ON, show a dynamic list of email inputs:
   - Each row: email input + a remove button (X icon) on the right
   - Below the list: "+ Add another co-founder" link/button (ghost style)
   - Start with 1 empty email input. Add more as needed.
7. "Continue" button — always enabled (co-founders are optional). If toggle is ON but emails are empty, show a note: "You can always invite co-founders later from Settings."

**Validation:**
- Each email must be a valid email format
- No duplicate emails
- Cannot enter your own email (the currently logged-in user's email). If they do, show inline error: "This is your email — you're already an admin."
- Empty emails in the list should be ignored (filtered out before saving)

**What happens with co-founder emails:**
- They are NOT invited yet at this step. They are stored locally and invites are created in the final step after the org is created in the database.
- The actual invite flow: after org creation, the system generates secure invite tokens with `role: super_admin` and sends invite links. For now, the links are generated and shown to the user — WhatsApp/email sending comes later.

**Edge cases:**
- User adds 10 co-founders → allow it, but maybe show a hint after 5: "That's a lot of co-founders! You can always add more later."
- User togles ON, adds emails, then toggles OFF → clear the email list and proceed without co-founders
- Invalid email format → show inline error under that specific input

---

### B3. Step 3: Branches

**Route:** `app/(auth)/onboarding/branches.tsx`

**Purpose:** Create all physical branches/locations of the academy.

**Layout:**

1. Progress bar: "Step 3 of 5" (60% filled)
2. Back arrow
3. Heading: "Set up your branches"
4. Description: "Add each physical location where you run training sessions."
5. A list of branch cards. Each card contains:
   - Branch name input (required) — e.g., "Shivaji Park Branch"
   - Address input (optional) — full address
   - City input (optional)
   - Phone input (optional) — labeled "Branch WhatsApp number (optional)". Show hint: "Only used for WhatsApp communication. Not for OTP or calls."
   - If there's more than 1 branch: a remove button (trash icon or X) in the card's top-right corner
6. Below the cards: "+ Add another branch" button
7. "Continue" button — disabled until at least 1 branch has a name

**The first branch card should be pre-populated with the city/address if available from the user's Google account, but don't make assumptions — leave blank and let them fill it.**

**Validation:**
- At least 1 branch required
- Each branch must have a name (2-100 chars)
- Branch names must be unique within this org (case-insensitive comparison)
- Phone number: if provided, must be a valid 10-digit Indian number
- Address and city: optional, no special validation

**Edge cases:**
- User tries to remove the last remaining branch → don't allow it. Either disable the remove button when there's only 1 branch, or show a toast: "You need at least one branch."
- User adds branches, goes back to step 2, then returns to step 3 → branches should still be there (state persisted across steps)
- Duplicate branch names → show inline error: "A branch with this name already exists"

---

### B4. Step 4: Batches

**Route:** `app/(auth)/onboarding/batches.tsx`

**Purpose:** Define training time slots (morning batch, evening batch, etc.).

**Layout:**

1. Progress bar: "Step 4 of 5" (80% filled)
2. Back arrow
3. Heading: "Set up your training batches"
4. Description: "Batches are your recurring training time slots. Students are assigned to a batch when they join."
5. Pre-populated batch cards (user can edit or remove):
   - "Morning Batch" — start time 6:00 AM, end time 8:00 AM, days Mon-Sat
   - "Evening Batch" — start time 4:00 PM, end time 6:00 PM, days Mon-Sat
   These are just suggestions. User can change everything.
6. Each batch card contains:
   - Batch name input (required)
   - Start time picker — native time picker on mobile, input on web
   - End time picker
   - Days of week selector — 7 small chip buttons (Mon through Sun), multi-select. Tapping toggles on/off. Active = black bg. Inactive = white with border.
   - "Apply to" selector: Two options: "All branches" (default) or "Select branches" which shows a multi-select list of branch names from Step 3
   - Remove button (if more than 1 batch)
7. "+ Add another batch" button. When tapped, adds an empty batch card (no pre-populated values).
8. "Continue" button

**Validation:**
- At least 1 batch required
- Each batch needs: name (required), at least 1 day selected
- Start/end time: optional but recommended. If end time is before start time, show warning: "End time is before start time — is this an overnight session?" (don't block, just warn)
- Batch names should be unique within the org

**Time picker behavior:**
- On iOS/Android: use native time picker (hour and minute wheels)
- On web: use a simple time input (`type="time"`)
- Time is stored as "HH:mm" string (24-hour format internally, displayed as 12-hour with AM/PM)

**"Apply to" logic:**
- "All branches" = this batch will be available at every branch. When new branches are added later, they automatically get this batch.
- "Select branches" = only the chosen branches get this batch. New branches won't have it unless explicitly added.
- In the database, this is managed via the `branch_batches` junction table. "All branches" means create a row for every branch. The app should also have a flag or convention to know if a batch was set as "all branches" so future branches auto-get it. One approach: if `branch_batches` contains ALL current branches, treat it as "all branches" mode. Or add a `applies_to_all` boolean on the batch.

**Edge cases:**
- User removes all batches → disable continue, show: "Add at least one batch"
- User selects "Select branches" but doesn't select any → show inline error
- User goes back, adds a new branch in step 3, returns to step 4 → batches set to "All branches" should now include the new branch. Batches set to specific branches keep their selection.

---

### B5. Step 5: Age Groups

**Route:** `app/(auth)/onboarding/age-groups.tsx`

**Purpose:** Define age group classifications for students.

**Layout:**

1. Progress bar: "Step 5 of 5" (100% filled)
2. Back arrow
3. Heading: "Define your age groups"
4. Description: "Students will be automatically assigned to an age group based on their date of birth. You can always override this manually."
5. Pre-populated rows based on the sport selected in Step 1. Use the `DEFAULT_AGE_GROUPS` constant from `lib/constants.ts`. Each row is a compact table-like row:
   - Name (text input, e.g., "U14")
   - Min Age (number input)
   - Max Age (number input)
   - Gender (segmented control or select: All / Male / Female)
   - Remove button (X)
6. "+ Add age group" button below the list
7. Drag handle on the left of each row for reordering (nice-to-have; skip if complex)
8. "Complete Setup" button (primary, black) — this is the FINAL action that creates everything in the database.

**Validation:**
- At least 1 age group
- Name required for each group
- Min age must be less than max age
- Age ranges shouldn't overlap (warn but don't block — some academies have overlapping groups intentionally)
- Gender is optional, defaults to "All"

**What happens when "Complete Setup" is tapped — THE BIG MOMENT:**

This is where all the data from steps 1-5 gets written to the database. Here's the exact sequence:

1. **Create the organization** in `organizations` table:
   - name from step 1
   - sport_type from step 1
   - slug: auto-generate from name (lowercase, hyphens, no special chars). If slug exists, append a random 4-char string.
   - payment_model: default to 'pay_first' (can be changed later in settings)
   - Return the new org ID

2. **Create the staff profile** for the current user in `staff_profiles`:
   - auth_user_id: current Supabase auth user ID
   - org_id: the new org ID
   - branch_id: NULL (super_admin sees all branches)
   - role: 'super_admin'
   - full_name: from Google account
   - email: from Google account
   - Return the staff profile ID

3. **Create branches** in `branches` table:
   - One row per branch from step 3
   - org_id: the new org ID
   - Return all branch IDs

4. **Create batches** in `batches` table:
   - One row per batch from step 4
   - org_id: the new org ID
   - Then create `branch_batches` junction rows to link batches to branches

5. **Create age groups** in `age_groups` table:
   - One row per age group from step 5
   - org_id: the new org ID
   - sort_order: based on their position in the list

6. **Create co-founder invites** (if any from step 2):
   - For each co-founder email, create a row in `invites` table:
     - token: generate secure 32-char token
     - role: 'super_admin'
     - org_id: the new org ID
     - branch_id: NULL (super_admin level)
     - max_uses: 1
     - expires_at: 72 hours from now
   - The invite URLs will be shown on the completion screen

7. **Create audit log entry:**
   - action: 'org.create'
   - entity_type: 'organization'
   - entity_id: new org ID
   - details: include org name, number of branches, number of batches

8. **Clear local draft data** from MMKV

**If any step fails:**
- All operations should ideally be in a transaction. Supabase doesn't support multi-table transactions from the client easily, so use a Supabase Edge Function that accepts all the data and does everything in one PostgreSQL transaction.
- If the edge function fails, show an error: "Something went wrong setting up your academy. Please try again." Keep the form data intact so user doesn't have to re-enter.
- On retry, check if org was partially created (by name + user). If so, clean up and retry.

**After successful creation → Navigate to completion screen.**

---

### B6. Completion Screen

**Route:** `app/(auth)/onboarding/complete.tsx`

**Purpose:** Celebrate the setup, show next steps, and provide co-founder invite links.

**Layout:**

1. Confetti animation — a brief (2-3 second) confetti burst. Use a lightweight confetti library or a Lottie animation. If too complex, skip confetti and just show a checkmark icon with a subtle scale-up animation.

2. Heading: "Welcome to CoachOS!" in display-sm size

3. Academy name in text-secondary below

4. **If co-founders were added:** A section titled "Co-founder Invites" showing:
   - Each co-founder's email
   - The invite link next to it
   - A "Copy" button next to each link
   - A "Share All via WhatsApp" button that composes a WhatsApp message with all invite links
   - Note: "These links expire in 72 hours."

5. **Next steps** section (simple list):
   - "Invite your branch admins" → link to settings/staff page
   - "Invite your coaches" → link to settings/staff page
   - "Start adding students" → link to students/add page
   These are informational — user doesn't have to do them now.

6. "Go to Dashboard" button (primary) → navigates to `/(staff)/(home)/`

**Edge cases:**
- User hits back from this screen → should NOT go back to step 5. The setup is done. Either disable back navigation or redirect to dashboard.
- User refreshes on web → the org is already created, so just show the dashboard. The completion screen is a one-time view.

---

## SECTION C: Staff Invite Flow

This covers how existing admins invite new staff and how invitees accept.

---

### C1. Creating Invites (Settings → Staff Page)

**Route:** This lives inside `app/(staff)/(settings)/staff.tsx` but I'll describe the invite creation flow here.

**Who can create invites:**
- Super Admin: can invite anyone (super_admin, branch_admin, coach, temp_coach)
- Branch Admin: can invite coach and temp_coach for their own branch only
- Coach/Temp Coach: cannot invite anyone

**The "Invite Staff" flow:**

1. User navigates to Settings → Staff Management
2. Taps "Invite" button
3. A bottom sheet (Sheet component) opens with:
   - **Role selector:** Radio buttons or segmented control showing available roles:
     - Super Admin sees: Branch Admin, Coach, Temporary Coach
     - Branch Admin sees: Coach, Temporary Coach
   - **Branch selector:** Dropdown to select which branch this person will be assigned to.
     - Super Admin sees all branches
     - Branch Admin: their branch is pre-selected and locked (can't change)
     - Not shown if inviting a Super Admin (they don't have a branch)
   - **Expiry:** Optional. "Link expires in: 72 hours" (default). Show as a note, not an editable field for v1.
   - **For Temp Coach only:** Additional field: "Access expires on: [date picker]" — this sets the `access_expires_at` date.
   - "Generate Invite Link" button

4. On tap "Generate Invite Link":
   - Create a row in the `invites` table with:
     - Secure token (32-char random)
     - org_id, branch_id, role, created_by, max_uses, expires_at
   - Generate the URL: `https://app.cricketcircleacademy.com/invite/{token}`
   - Show a result sheet with:
     - The invite link (selectable text)
     - QR code of the link
     - "Copy Link" button
     - "Share via WhatsApp" button
     - Note about expiry
   - Log in audit: `invite.create`

**Edge cases for invite creation:**
- Branch with no batches → warn but don't block: "This branch has no batches set up yet."
- Creating multiple invites for the same role+branch → allowed (different tokens)
- Super admin inviting another super admin → allowed, but show a confirm dialog: "This person will have full access to all branches and settings. Continue?"

---

### C2. Accepting Invites

**Route:** `app/invite/[token].tsx`

**Purpose:** When someone opens an invite link, they land here to accept the invitation and create their staff account.

**Flow:**

1. **Extract the token** from the URL parameter

2. **Validate the token** — call the database to check the `invites` table:
   - Does a row with this token exist?
   - Is `is_active` true?
   - Is `expires_at` in the future?
   - Is `used_count` less than `max_uses`?
   - If ANY check fails → show an error screen (see below)

3. **If token is valid**, show the invite acceptance screen:
   - Heading: "You've been invited!"
   - Info card showing:
     - Organization name (looked up from invites → organizations)
     - Role: "Branch Admin" / "Coach" / etc (human-readable)
     - Branch name (if applicable)
   - "Continue with Google" button (primary, black)
   - Note: "You'll sign in with your Google account to accept this invitation."

4. **User taps "Continue with Google":**
   - Run Supabase Google OAuth
   - On success:
     - Check if this Google account already has a staff_profile in THIS org → if yes, show: "You already have an account in this academy." and navigate to dashboard.
     - If no existing profile:
       - Create a `staff_profiles` row:
         - auth_user_id from Google
         - org_id from invite
         - branch_id from invite
         - role from invite
         - full_name from Google
         - email from Google
         - For temp_coach: set `access_expires_at` if specified in invite
       - Update invite: increment `used_count`. If single-use, also set `is_active` = false.
       - Audit log: `staff.invite_accepted`
     - Navigate to a mini onboarding (see C3 below) or directly to dashboard

5. **Show the new staff member a mini-welcome screen:**
   - "Welcome to {Academy Name}!"
   - "You're a {Role} at {Branch Name}"
   - "Go to Dashboard" button

**Error states (invalid token):**

Show a clean error screen (not a raw error). Possible messages:
- Token doesn't exist: "This invite link is invalid. Please ask your admin for a new link."
- Token expired: "This invite has expired. Please ask your admin for a new link."
- Token fully used: "This invite has already been used."
- General error: "Something went wrong. Please try again or ask your admin for a new link."

All error screens should have a "Go to Login" link at the bottom.

**Edge cases:**
- User opens invite link while already logged in as a different user → Sign them out first, then proceed with the invite flow. OR, if they're already in this org, just redirect to dashboard.
- User opens invite link but Google Auth fails → stay on invite screen, show error toast
- User opens invite link on a device without Google account → this is a problem on mobile. On web, Google will show their standard login. On mobile, the OAuth browser handles it.
- Invite link opened multiple times by same person → second time, they already have a profile, so just redirect to dashboard
- Network error during profile creation → show retry button, keep token valid

---

### C3. Staff Mini-Onboarding (Optional Enhancement)

After accepting an invite, you could show 1-2 screens asking the new staff member for:
- Phone number (for WhatsApp — optional)
- Profile photo (optional, can skip)

This is low priority for v1. Just navigate them to the dashboard after invite acceptance.

---

## SECTION D: Student Onboarding (Two-Part Flow)

This is the unique two-part flow: Coach starts on the field → Parent completes at home.

---

### D1. Part 1: Coach Creates Student (Minimal Form)

**Route:** `app/(staff)/(students)/add.tsx`

**Who:** Coaches, Branch Admins, Super Admins

**Purpose:** Quick-add a student on the field with minimal info. Takes 30 seconds max.

**The key principle:** The coach is standing on a cricket ground with a parent and new student. They need to get this done FAST. Don't ask for info the coach doesn't have. Parent details, address, school — all that comes later from the parent.

**Layout:**

1. Header: "Add Student" with back arrow
2. Subheading: "Quick add — parents will complete the rest."
3. Form fields:
   - **First Name** (required) — text input, autocapitalize words
   - **Last Name** (optional) — text input
   - **Date of Birth** (recommended, not strictly required) — date picker. When selected, auto-calculate and show the age and auto-suggest age group. The age group suggestion appears as a read-only badge below the date picker: "Age group: U16 (based on DOB)"
   - **Blood Group** (optional) — Select dropdown with options: A+, A-, B+, B-, O+, O-, AB+, AB-
   - **Parent Phone** (recommended) — phone input with +91 prefix. Label: "Parent's WhatsApp Number". Hint: "Used to send the profile completion link and updates."
4. "Create Student" button (primary, full width)

**What happens on "Create Student":**

1. Validate form (first_name required, phone format if provided)
2. Generate:
   - `student_id_code`: random 4-digit number (1000-9999), unique within the org. If collision, regenerate. Check uniqueness via DB query.
   - `username`: lowercase first_name + student_id_code (e.g., "rahul4521"). If collision (unlikely), append a random char.
   - `password`: random 8-char alphanumeric, avoiding ambiguous characters (no 0/O, 1/l/I)
   - `parent_onboarding_token`: 32-char secure random string
3. Create a Supabase Auth user for the student:
   - email: `{username}@students.coachOS.internal`
   - password: the generated password
   - This should be done via a Supabase Edge Function (since creating users for others requires the service role key, which should never be on the client)
4. Create the student row in `students` table:
   - org_id: from current user's org
   - branch_id: from current user's branch (coach's branch). For super admin, they need to select a branch first (show branch selector if super admin).
   - All the form data
   - profile_status: 'incomplete'
   - enrollment_status: 'active'
   - fee_status: 'unpaid'
   - auth_user_id: from the newly created Supabase Auth user
   - created_by: current staff profile ID
5. Auto-assign age_group_id: based on DOB and the org's age group definitions. Find the age group where student's age falls between min_age and max_age. If no match (or no DOB provided), leave null.
6. Audit log: `student.create`
7. Navigate to the Share screen (D2)

**Edge cases:**
- Student ID collision: regenerate up to 5 times. If still colliding (extremely unlikely with 4-digit range and small orgs), try 5-digit codes.
- Username collision: append random 2-char suffix
- Coach on poor connection: the creation should be attempted. If offline, queue the action and show: "Student will be created when you're back online. Credentials will be generated then." For offline, you can't generate the auth user or get a token — so offline student creation is limited. Show a note: "Creating students requires internet connection."
- Date of birth in the future: validate and reject
- Date of birth makes student older than 99 or younger than 3: warn but allow (the coach might be entering a guardian for 1-on-1 sessions)
- Super admin creating a student: they need to first select which branch this student belongs to. Show a branch selector at the top of the form.

---

### D2. Part 2A: Share Screen (Coach Shares with Parent)

**Route:** `app/(staff)/(students)/onboarding-link.tsx` (navigated to after creation, receives student data via route params or from the just-created record)

**Purpose:** Show the coach the student credentials and a shareable link/QR for the parent.

**Layout:**

1. Header: "Student Created ✓" with green checkmark or success badge
2. Student info card:
   - Name: "Rahul Kumar"
   - Student ID: "4521" (in mono font)
3. **Credentials section** (bordered card):
   - Label: "Student Login Credentials"
   - Username: shown in mono font
   - Password: shown in mono font (temporarily visible — it's the only time this is shown!)
   - "Copy Credentials" button → copies formatted text: "Username: rahul4521 | Password: kP9x2mVn"
   - Note: "Save these credentials — the password cannot be retrieved later."
4. **Parent sharing section:**
   - Label: "Share with Parent"
   - Description: "Send this link to the parent to complete the student's profile."
   - QR code: large, scannable, encoding the parent onboarding URL
   - "Share via WhatsApp" button (primary) → opens WhatsApp with a pre-composed message including student name, credentials, and onboarding link
   - "Copy Link" button (secondary) → copies just the URL
   - The WhatsApp message should include:
     - Welcome greeting with academy name
     - Student name and ID
     - Login credentials
     - Profile completion link
     - (Use the template from the PRD)
5. "Done" button at the bottom → navigates to students list

**Edge cases:**
- Coach accidentally navigates away from this screen → the credentials are still in the database. They can go to the student detail page later and use "Reset Password" to generate new ones. But the original password is gone (hashed in DB). Add a note about this.
- QR code can't be scanned (blurry, small screen) → the WhatsApp share and copy link options serve as fallbacks
- Parent phone wasn't provided → "Share via WhatsApp" button is still shown but opens WhatsApp without a pre-filled number (user manually selects contact). Alternatively, prompt: "Add parent's WhatsApp number to share directly." with an inline phone input.

---

### D3. Part 2B: Parent Completes Profile (Public Route)

**Route:** `app/(parent-onboarding)/[token].tsx`

**Purpose:** The parent opens this link (from WhatsApp or QR scan) and fills in the remaining student details. No login required — the token authenticates this specific form.

**This is a PUBLIC route — no authentication needed.** The secure token in the URL validates that this person should have access to edit this student's profile.

**Flow when the page loads:**

1. Extract `token` from URL
2. Query `students` table where `parent_onboarding_token` matches
3. **If not found:** Show error: "This link is invalid or has expired. Please contact your academy."
4. **If found but `parent_onboarding_completed_at` is already set:** Show the completed profile as a summary with an "Update Details" button (allow edits).
5. **If found and not yet completed:** Show the multi-step form.

**Form layout — 3 steps within this single page (or a mini-stepper):**

**Step 1: Parent/Guardian Details**
- Parent/Guardian Name (required) — text input
- Relationship: Select with options: Father, Mother, Guardian, Other
- Phone number (pre-filled from student record if coach entered it, editable) — required
- Additional Guardian Name (optional)
- Additional Guardian Phone (optional) — labeled: "Driver, family member, or other emergency contact"

**Step 2: Student Details**
- Gender: Radio/segmented (Male / Female / Other) — required
- Address (required) — multi-line text input
- City (required)
- School Name (required)
- Grade/Class (required) — text input, e.g., "8th", "10th", "12th"

**Step 3: Health & Uniform**
- Health Notes (optional) — multi-line text, with hint: "Any medical conditions, allergies, or physical limitations we should know about for safety during training."
- Special Needs (optional) — multi-line text, with hint: "Any accommodations needed."
- Uniform T-shirt Size: Select dropdown (XS, S, M, L, XL, XXL) — required
- Uniform Gender: Radio (Boy / Girl / Unisex) — required

**Optional — Document Uploads (nice-to-have for v1, can skip):**
- Upload birth certificate (image/PDF)
- Upload school ID (image/PDF)
- Upload student photo (image)
- All uploads go to Supabase Storage, URLs stored in `student_documents` table

**Submit behavior:**

1. Validate all required fields
2. Update the `students` row:
   - Fill in all the new fields
   - Set `profile_status` = 'complete'
   - Set `parent_onboarding_completed_at` = now
3. Show success screen: "Thank you! {Student name}'s profile is now complete."
4. No navigation needed (this is a standalone page). Show a "Close" button that doesn't go anywhere (it's a dead end — the parent's job is done).

**Edge cases:**
- Parent starts filling the form, closes the browser, comes back later → the form should preserve state. Use localStorage on web to save form draft keyed by token. On return, detect the draft and pre-fill.
- Token is used by someone who shouldn't have it → we can't prevent this since it's a public link. The token is the only security. Keep tokens long (32 chars) and unguessable.
- Parent submits, then wants to change something → the "already completed" state shows a summary with "Update Details" button. Tapping it reopens the form with pre-filled data.
- Multiple parents/guardians accessing the same link → fine, they can all submit. Last write wins (each submit updates the same student row).
- Form validation error → show inline errors on specific fields. Don't clear the form.
- Image upload fails → show retry button next to that specific upload. Don't block the rest of the form submission — images are optional.
- Very slow connection → show loading state on submit button, disable double-taps

**Important web/mobile note:**
- This page MUST work well on mobile web (parents will open it from WhatsApp on their phones)
- Test on: iPhone Safari, Android Chrome, Samsung Internet
- Make sure the form doesn't break in WebView contexts (some browsers open links in in-app browsers)
- Keep the page lightweight — no heavy animations, minimal JavaScript

---

## SECTION E: Password Reset Flow

**There is NO self-service password reset for students.** This is by design — students don't have email/phone verified for recovery.

**Flow:**

1. Student forgets password → tells their coach or asks their parent
2. Parent/Student contacts coach or admin
3. Coach/Admin opens the student detail page → taps "Reset Password" in the more menu
4. System generates a new random password
5. Screen shows the new password (similar to the share screen after student creation)
6. Coach/Admin shares the new password via WhatsApp (using the share button) or verbally
7. Old password stops working immediately
8. Audit log: `student.password_reset`

**Who can reset:**
- Super Admin: any student in the org
- Branch Admin: any student in their branch
- Coach: any student in their branch
- Temp Coach: cannot reset passwords

---

## SECTION F: Multi-Org Scenario

A single person might be admin of one academy and a coach at another. Handle this:

1. On Google login, query ALL staff_profiles for this auth_user_id
2. If multiple profiles exist across different orgs:
   - Show an "org selector" screen: a simple list of orgs with their names and the user's role in each
   - Tapping one sets the active org in the Zustand store and navigates to the dashboard
   - The active org ID is stored in MMKV so on next app launch, they go directly to their last-used org
3. An org switcher should be accessible from settings (a small dropdown or link: "Switch Academy")
4. Within one org, a user has exactly ONE role. They can't be both a coach and a branch admin in the same org.

---

## SECTION G: Logout

**Location:** Settings page, bottom of the page or sidebar.

**Behavior:**
1. Tap "Sign Out"
2. Confirm dialog: "Are you sure you want to sign out?"
3. On confirm:
   - Call `supabase.auth.signOut()`
   - Clear Zustand stores
   - Clear MMKV cached data (except onboarding drafts)
   - Navigate to login screen
4. If sign-out fails (network error), force-clear local session anyway and navigate to login.

---

## SECTION H: Security Checklist for Auth & Invites

These are things to verify during implementation:

1. **Invite tokens must be cryptographically random** — use `crypto.getRandomValues`, not `Math.random`
2. **Invite tokens must NEVER appear in URLs that get logged** — they're in the path, not query params, which is fine for most servers. But ensure any analytics or error logging tools don't capture full URLs.
3. **Org IDs must NEVER be in invite URLs** — only the token. The org is looked up from the token server-side.
4. **Student passwords must be hashed** — Supabase Auth handles this automatically (bcrypt)
5. **RLS must be enabled on ALL tables** — even during development. Test that:
   - A coach in Branch A cannot query students in Branch B
   - A student can only see their own records
   - A temp coach with expired access gets rejected
6. **Rate limit login attempts** — Supabase Auth has built-in rate limiting. Verify it's working.
7. **Secure token storage** — on native, using SecureStore (already configured). On web, localStorage (acceptable for this use case but not ideal for high-security apps).
8. **CSRF protection** — Supabase handles this for OAuth flows
9. **XSS prevention** — React Native doesn't have traditional XSS risks, but the web app (parent onboarding) needs standard web security. Don't render raw HTML from user input.
10. **Audit everything** — every auth action (login, logout, invite create, invite accept, password reset) must be in the audit log.

---

## Build Order for This File

1. Login screen (A1)
2. Session management logic (A2)
3. Onboarding steps 1-5 (B1-B5) + the completion screen (B6)
4. Student creation form (D1)
5. Student share/QR screen (D2)
6. Parent onboarding form (D3)
7. Invite creation (C1) — this goes in settings, build it when you build settings
8. Invite acceptance (C2)
9. Password reset (E)
10. Multi-org switcher (F) — build when needed
11. Logout (G)

---

*Next file (005) covers the Attendance system: batch selector, swipe card stack, gestures, offline queuing, summary screen, and history table with filters.*
