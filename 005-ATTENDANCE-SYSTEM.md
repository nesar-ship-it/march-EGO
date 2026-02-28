# CoachOS — File 005: Attendance System — Build Guide

> **Purpose:** Complete instructions for the entire attendance system — from batch selection through swipe-card marking to history and reporting. No code — just what to build, how it behaves, and every edge case.
> **Depends on:** Files 001-004
> **Key principle:** This is the #1 feature of CoachOS. It must be FAST, work on poor connectivity, feel satisfying to use, and never lose data.

---

## Overview of the Attendance Flow

```
Coach opens Attendance tab
  → Batch Selector screen (pick today's batch)
    → Swipe Card Mode (go through each student)
      → Summary Screen (review + send absent alerts)
        → Done (back to batch selector or dashboard)

Separately:
  → Attendance History (table view with filters)
```

---

## SECTION A: Batch Selector Screen

**Route:** `app/(staff)/(attendance)/index.tsx`

**Purpose:** Show all batches available at the coach's branch for today, with progress indicators showing which are already done.

**Who sees it:** Any staff member (super admin, branch admin, coach, temp coach)

**When they land here:** Tapping the "Attendance" tab in the bottom nav, or tapping "Take Attendance" from the dashboard quick actions.

---

### Layout (top to bottom)

1. **Page header:** "Attendance" — left-aligned, h1 size. No back button (this is a tab root).

2. **Date display:** Today's date in a readable format: "Friday, February 28, 2026". This is read-only — coaches take attendance for TODAY only. They cannot select a past or future date from this screen. (Past attendance editing is a separate flow, admin-only.)

3. **Branch indicator (Super Admin only):** If the user is a super admin with access to all branches, show a branch selector dropdown at the top. Default to the branch they last used (stored in MMKV). Branch admins and coaches don't see this — their branch is fixed.

4. **Batch cards list:** A vertical list of cards, one per batch that runs at this branch. Each card shows:
   - **Batch name** — e.g., "Morning Batch" — in h3/label-lg, bold
   - **Time** — e.g., "6:00 AM – 8:00 AM" — in body-sm, text-secondary
   - **Progress indicator** — two possible states:
     - **Not started:** "45 students · Not started" — in body-sm, text-tertiary
     - **In progress:** "12 / 45 students marked" — with a thin progress bar underneath
     - **Completed:** "45 / 45 students ✓" — with a green checkmark badge. The card gets a subtle green-tinted left border or a "Completed" badge in the top-right corner.
   - **Tap action:** tapping a card navigates to the swipe card mode for that batch

5. **Empty state:** If there are no batches for this branch, show the EmptyState component: "No batches set up for this branch. Ask your admin to add batches in Settings."

6. **If all batches are completed:** Show a celebratory note at the top (subtle, not over the top): "All attendance marked for today ✓" in a success-tinted card.

---

### Data Loading

- Query `branch_batches` joined with `batches` to get all active batches for the current branch
- For each batch, count:
  - Total active students assigned to this batch: `SELECT COUNT(*) FROM students WHERE batch_id = X AND branch_id = Y AND enrollment_status = 'active'`
  - Already marked today: `SELECT COUNT(*) FROM attendance_records WHERE batch_id = X AND date = TODAY`
- This gives the progress numbers for each card

**Caching:** Use TanStack Query with a stale time of 30 seconds. When the user returns from the swipe screen, the batch list should refetch to update progress numbers. Use `queryClient.invalidateQueries` when navigating back.

---

### Edge Cases

- **Batch with 0 students:** Show the card but with "0 students" and disable tap. Show hint: "No active students in this batch."
- **Coach assigned to a specific batch only (future feature):** For v1, coaches see all batches in their branch. In the future, you might filter by assigned batches.
- **Multiple attendances per day for the same batch:** The DB has a UNIQUE constraint on (student_id, batch_id, date). If a coach tries to redo attendance for a completed batch, they enter "edit mode" — the swipe cards show the previously marked status, and swiping updates (rather than creates) the record. Show a banner at the top: "Attendance already taken. Swiping will update records."
- **Batches that don't run today (day-of-week check):** Filter batches by `days_of_week`. If today is Sunday and a batch only runs Mon-Sat, don't show it. BUT provide a "Show all batches" toggle at the bottom in case the coach needs to take attendance on an off-day (tournaments, extra sessions, etc.).

---

## SECTION B: Swipe Card Mode

**Route:** `app/(staff)/(attendance)/take.tsx` — receives `batchId` as a route parameter

**Purpose:** The core attendance-taking experience. A stack of student cards that the coach swipes through, marking each as present or absent.

**Inspiration:** Slack's "Catch Up" feature — cards you swipe through to process one at a time.

---

### Screen Layout

The screen has 3 zones, from top to bottom:

**Zone 1: Header Bar**
- Left: Back arrow (returns to batch selector)
- Center: Batch name (e.g., "Morning Batch")
- Right: Progress counter — "12 / 45" showing how many students have been marked out of total. This updates in real-time as the coach swipes.

**Zone 2: Card Area (60-70% of screen height)**
- The current student card, centered
- Behind it, the next card is partially visible (slightly smaller scale, offset down by ~8px) to create a "stack" feel
- Behind that, a third card even smaller, creating depth (optional, but nice)
- When there are no more cards, this area shows the summary

**Zone 3: Action Buttons (bottom of screen)**
- Three buttons in a row:
  - Left: "Absent" button — red-tinted icon (X icon), label below. Sized ~80px wide.
  - Center: "Undo" button — smaller, circular, with a rotate-left icon. Only visible after a swipe has been made.
  - Right: "Present" button — green-tinted icon (check icon), label below. Sized ~80px wide.
- These buttons are the TAP alternative to swiping. Same actions.

---

### Student Card Contents

Each card is a rounded rectangle (~85% of screen width, aspect ratio ~3:4 or whatever fits the content). White background, subtle shadow, 16px border radius.

**Card layout (inside the card):**

1. **Student photo** — Avatar component, size XL (64px). Centered at the top of the card. If no photo, show initials on a gray circle.

2. **Student name** — Full name in h2 size, centered below the avatar. e.g., "Rahul Kumar"

3. **Student ID** — Below the name, in mono font, text-secondary: "ID: 4521"

4. **Info chips row** — A horizontal row of small badges/chips:
   - Age group badge: "U16"
   - Batch badge: "Morning" (redundant but confirms context)
   - If there's additional info like age: "15 yrs"

5. **Fee status badge** — Prominent badge showing payment status:
   - Paid: green badge "Paid ✓"
   - Unpaid: amber badge "Fee Due"
   - Overdue: red badge "Overdue"
   - This is deliberately shown during attendance so the coach has context

6. **Quick action (if unpaid):** If the student has a fee status of 'unpaid' or 'overdue', show a small tappable link below the badge: "Send Payment Reminder →". Tapping this queues a WhatsApp payment reminder to the parent. Show a brief toast: "Reminder sent to parent." This is a one-tap action — no confirmation dialog (speed is key during attendance).

---

### Swipe Gesture Behavior

**The swipe gestures are the most critical UX element in the app. They must feel smooth, responsive, and satisfying.**

**Right swipe → Present:**
- As the user drags the card to the right:
  - The card follows the finger horizontally
  - The card rotates slightly clockwise (rotation = horizontal offset × 0.05 degrees)
  - A green tint/overlay fades in on the card (opacity proportional to drag distance)
  - A "PRESENT" text/icon watermark appears on the card (fading in)
  - The background behind the card subtly shifts to green
- If the drag exceeds the threshold (120px) OR the velocity exceeds 500px/s:
  - The card animates off the right edge of the screen (continue in the swipe direction with momentum)
  - The attendance record is created/updated: status = 'present'
  - The next card animates from its "behind" position to the front (scale from 0.95→1.0, translateY from +8→0)
  - A subtle haptic feedback fires (light impact)
- If the drag does NOT exceed the threshold:
  - The card springs back to center with a bouncy spring animation
  - No record is created

**Left swipe → Absent:**
- Mirror of the right swipe but:
  - Card rotates counter-clockwise
  - Red tint/overlay
  - "ABSENT" watermark
  - Attendance record: status = 'absent'
  - Red haptic feedback (slightly heavier impact)

**Tap buttons (bottom):**
- Tapping "Present" button: the card animates to the right and off screen, same as a completed swipe. Same record creation.
- Tapping "Absent" button: card animates to the left and off screen.
- The animation for button taps should be slightly faster than swipe exits (since there's no momentum to match).

**Undo:**
- After ANY swipe (right or left), an "Undo" toast appears at the bottom of the screen for 4 seconds
- The toast shows: "Undo: {Student Name} marked {present/absent}" with an "Undo" action button
- Tapping "Undo":
  - The previously swiped card animates BACK from the edge to the center (reverse of the exit animation)
  - The current front card moves back behind
  - The attendance record for that student is deleted
  - The progress counter decrements
- The center "Undo" button in the action bar also works — tapping it does the same thing as the toast's undo action
- Only ONE level of undo is supported (can't undo multiple swipes in sequence — only the last one)
- After 4 seconds, the undo option disappears and the record is "committed"

---

### Card Stack Management

**Loading the students:**
- Query all active students for this batch and branch: `students WHERE batch_id = X AND branch_id = Y AND enrollment_status = 'active' ORDER BY first_name`
- Also query existing attendance records for today: `attendance_records WHERE batch_id = X AND date = TODAY`
- Students who already have a record for today are either:
  - Moved to the end of the stack (if re-doing attendance / edit mode)
  - Or shown with their current status pre-filled and a different card appearance (e.g., a small "Previously: Present" label). Swiping again UPDATES the record.

**Card rendering:**
- Only render 3 cards in the DOM/view at a time: current, next, and the one after next
- As the current card exits, shift the pointers: next becomes current, after-next becomes next, load one more as after-next
- This keeps the UI lightweight even with 100+ students

**Order of students:**
- Default: alphabetical by first name
- Future option: randomize order (so coaches don't develop bias for students at the end)
- Students who were absent yesterday could optionally be shown first (a "flagged" mode) — this is a nice-to-have

---

### Recording Attendance (Data Flow)

**When a swipe is committed (threshold met or button tapped):**

1. **Optimistic local update:**
   - Immediately add to a local array/store: `{ student_id, batch_id, date: today, status: 'present'|'absent', marked_by: currentStaffId }`
   - Update the progress counter UI
   - Move to the next card

2. **API call (background):**
   - Upsert into `attendance_records` table (upsert handles both new records and edits)
   - If online: the call happens immediately
   - If offline: the action is queued in the offline queue (see Section E)

3. **Conflict handling:**
   - The UNIQUE constraint on (student_id, batch_id, date) ensures no duplicates
   - If another coach somehow marked the same student (race condition in multi-coach batches), the last write wins. This is acceptable for v1.

4. **Audit log:**
   - Log each attendance mark: action = 'attendance.mark', entity_type = 'attendance', details = { student_id, status, batch_id, date }
   - For bulk efficiency, batch the audit logs and send them after the session is complete rather than per-swipe

---

### Edge Cases for Swipe Mode

| Scenario | Behavior |
|----------|----------|
| Batch has only 1 student | Show the single card. After swiping, go directly to summary. |
| Batch has 0 students | Don't enter swipe mode. Show empty state on batch selector card. |
| Coach accidentally closes app mid-attendance | Already-swiped cards are saved (either to DB or offline queue). On reopen, the batch shows partial progress. Entering the batch again shows remaining unmarked students. |
| Coach's phone dies mid-attendance | Same as above — whatever was committed to DB or offline queue is preserved. |
| Student was added to the batch WHILE attendance is in progress | The newly added student won't appear in the current session (the card stack was loaded at session start). They'll appear next time. This is acceptable for v1. |
| Student was paused/archived while coach is swiping | If the coach reaches that student's card, the swipe still works (the record is created). The student's status change will take effect next session. |
| Internet drops mid-session | Swipes continue to work (offline queue). A "Offline" indicator appears in the header. When connectivity returns, queued swipes sync automatically. |
| Coach tries to take attendance for a batch not in their branch | RLS prevents the database write. Show error: "You don't have access to this batch." This shouldn't happen in normal flow since the batch selector only shows the coach's branch batches. |
| Two coaches take attendance for the same batch simultaneously | Both can proceed. Last write wins per student. The progress counter might be slightly off until both refresh. Acceptable for v1. |
| Card stack is very long (100+ students) | Only render 3 cards at a time (see Card Stack Management). The progress counter keeps them oriented. |
| Coach wants to mark "Late" instead of Present/Absent | For v1, only Present and Absent are available via swipe. "Late" and "Excused" can be set by editing the record later (admin/branch admin). Future: add a long-press or third button option for Late. |

---

## SECTION C: Attendance Summary Screen

**Appears:** Automatically after the last card in the stack is swiped. This is NOT a separate route — it replaces the card area on the same screen.

**Purpose:** Recap what was just recorded. Allow sending absent alerts. Provide an exit point.

---

### Layout

1. **Header** stays the same (batch name + back button)

2. **Summary card (replaces the card stack area):**
   - Heading: "Attendance Complete ✓" (or "Attendance Updated ✓" if this was an edit session)
   - Date: "February 28, 2026"
   - Three stat boxes in a row:
     - Present: count + green accent → e.g., "38"
     - Absent: count + red accent → e.g., "7"
     - Total: count → "45"
   - Visual progress bar below the stats: green portion = present, red portion = absent

3. **Absent students list:**
   - Heading: "Absent Students (7)"
   - A compact list/table showing each absent student:
     - Student name
     - Fee status badge (so coach has context)
     - A phone/message icon button on the right → tapping sends an absent alert to that specific student's parent via WhatsApp
   - If there are 0 absent students: show a positive message: "Everyone's here today! 🎉" (this is one of the rare places an emoji is appropriate)

4. **Bulk action button:**
   - "Send Absent Alerts (7)" — primary button, full width
   - Tapping this sends WhatsApp absent alerts to ALL absent students' parents in one action
   - Show confirm dialog: "Send absent alerts to 7 parents via WhatsApp?"
   - On confirm: queue all messages, show toast: "Absent alerts sent to 7 parents"
   - If a student doesn't have a parent phone number: skip them silently, but show a note after: "2 parents couldn't be notified (no phone number on file)"

5. **"Done" button** — secondary button below the bulk action
   - Navigates back to the batch selector
   - The batch selector should now show this batch as "Completed"

---

### Edge Cases for Summary

- **All students present:** Hide the absent list section. Show "Everyone's here today!" with a happy empty state.
- **All students absent:** Show the full list. This is unusual — maybe show a subtle note: "All students marked absent. Did something go wrong?" This is not blocking, just informational.
- **WhatsApp send fails for some parents:** Show a toast: "3 of 7 alerts sent. 4 failed — check the message log." Failed sends stay in the WhatsApp queue for retry.
- **Coach navigates back from summary to cards:** Allow this via the back button. They re-enter the card stack but all cards are already swiped. They can use "Undo" on the last card if they need to change something. Or they can just tap on a specific student in the summary to change their status (future enhancement — for v1, direct them to the attendance history to edit).

---

## SECTION D: Attendance History

**Route:** `app/(staff)/(attendance)/history.tsx`

**Purpose:** View and search past attendance records in a table format. This is the "records" view, not the "taking" view.

**Who sees it:** All staff (scoped to their branch). Super admin can see all branches.

---

### Layout

1. **Page header:** "Attendance History"

2. **Filter bar (Linear-style chips, horizontal scroll):**

   **Filter: Date Range**
   - Options: Today, Yesterday, This Week, This Month, Last Month, Custom Range
   - "Custom Range" opens a date range picker with two date inputs (From / To)
   - Default: "This Week"

   **Filter: Batch**
   - Options: all batches in the branch + "All Batches"
   - Default: "All Batches"

   **Filter: Status**
   - Options: Present, Absent, Late, Excused, All
   - Default: "All"

   **Filter: Student (search)**
   - This is a search input, not a chip. Placed above or alongside the filter chips.
   - Searches by student name (first or last) or student ID code
   - Debounced input (300ms delay before querying)

3. **Results table (Linear-style):**

   **Columns:**
   | Column | Width | Content | Notes |
   |--------|-------|---------|-------|
   | Date | 90px | Formatted date (e.g., "Feb 28") | Sortable. Default sort: newest first. |
   | Student | flex (takes remaining space) | Full name, truncated if long. Below name in small text: student ID code. | Tappable — navigates to student detail. |
   | Batch | 80px | Batch name (e.g., "Morning") | |
   | Status | 70px | Badge: green "P" for present, red "A" for absent, amber "L" for late, blue "E" for excused | Centered. |
   | Marked By | 100px (hidden on mobile if no space) | Staff name who marked this record | Only visible on wider screens. |
   | Time | 70px (hidden on mobile) | Time the record was created (e.g., "6:32 AM") | Only visible on wider screens. |

   - Table rows are 48px tall
   - First column (Date) is sticky on horizontal scroll (mobile)
   - Tapping a row could either: (a) navigate to the student's detail page with the attendance tab selected, or (b) open a bottom sheet showing the full record details with an edit option (admin only)

4. **Pagination:**
   - Show 50 records per page
   - At the bottom: "Showing 1-50 of 1,200" with Previous/Next buttons
   - Use cursor-based pagination (more efficient than offset for large datasets): use `created_at` as the cursor

5. **Empty state:** "No attendance records found for the selected filters."

---

### Data Query

The query joins `attendance_records` with `students` (for name) and `staff_profiles` (for marked_by name) and `batches` (for batch name):

```
attendance_records
  JOIN students ON student_id
  JOIN staff_profiles ON marked_by
  JOIN batches ON batch_id
WHERE branch_id = current_branch
  AND date BETWEEN filter_start AND filter_end
  AND (batch_id = filter_batch OR no filter)
  AND (status = filter_status OR no filter)
  AND (student name ILIKE search OR student_id_code ILIKE search)
ORDER BY date DESC, created_at DESC
LIMIT 50
```

RLS handles branch isolation automatically.

---

### Editing Past Attendance (Admin Only)

**Who can edit:** Super Admin and Branch Admin only. Coaches CANNOT edit past attendance records.

**How it works:**

1. Admin taps a row in the attendance history table
2. A bottom sheet opens showing:
   - Student name + date + current status
   - A status selector: Present / Absent / Late / Excused
   - A notes field (optional text input): "Add a note about this change"
   - "Update" button + "Cancel" button
3. On "Update":
   - The attendance record is updated with the new status
   - The `updated_at` timestamp is set to now
   - An audit log entry is created: action = 'attendance.edit', details = { old_status, new_status, notes, student_id, date }
   - Toast: "Attendance updated for {student_name}"

**Coach trying to edit:** If a coach taps a row, they see the record details (read-only) but no edit controls. Optionally show a note: "Contact your branch admin to edit past attendance."

---

### Exporting Attendance (Future Feature)

Not for v1, but plan for it:
- "Export" button in the header that generates a CSV or Excel file of the filtered attendance records
- Columns: Date, Student Name, Student ID, Batch, Status, Marked By, Time
- Download on web, share sheet on mobile

---

## SECTION E: Offline Attendance

**This is critical.** Coaches take attendance on open fields, in parks, at grounds with poor or no cellular/WiFi signal.

---

### How Offline Mode Works

**Principle:** The app should work identically whether online or offline. The only difference is when data syncs to the server.

**Detection:**
- Monitor network state using `NetInfo` (from `@react-native-community/netinfo` or Expo's network API)
- Show a subtle indicator in the header when offline: a small amber dot + "Offline" text, or a thin amber bar at the top of the screen

**During attendance swipe (offline):**

1. Each swipe creates a local record in MMKV offline queue:
   ```
   {
     id: unique local ID,
     type: 'attendance.mark',
     payload: { student_id, batch_id, date, status, marked_by, org_id, branch_id },
     created_at: ISO timestamp,
     synced: false,
     retries: 0
   }
   ```
2. The UI behaves exactly the same — cards swipe, counter updates, summary shows
3. The local attendance data is also stored in a separate MMKV key for the current session so the app can show accurate counts even without server data

**When connectivity returns:**

1. The app detects network recovery
2. It processes the offline queue in order (FIFO):
   - For each queued action, make the Supabase upsert call
   - On success: mark as `synced: true`, remove from queue
   - On failure (non-network error like RLS violation): mark as failed, log the error, skip to next
   - On failure (network error): stop processing, will retry next time connectivity is available
3. Show a subtle sync indicator during processing: "Syncing 12 records..." → "All synced ✓"
4. After sync, invalidate the TanStack Query cache so UI refreshes with server data

**Conflict resolution:**
- The server uses UPSERT on the unique constraint (student_id, batch_id, date)
- If a record already exists (e.g., another coach already marked this student), the offline record overwrites it
- Last-write-wins is the strategy. For v1, this is acceptable since typically only one coach takes attendance per batch
- The `updated_at` timestamp shows when the record was last modified

**What if the app is closed while offline queue has items:**
- The queue is in MMKV (persistent storage) — it survives app closes and restarts
- On next app launch, if there are unsynced items, start syncing immediately
- Show a banner on the dashboard: "You have 12 unsent attendance records. They'll sync when you're online."

**What if the user logs out with pending offline data:**
- Warn them: "You have 12 unsynced attendance records. Signing out will lose this data. Continue?" with options to cancel or proceed
- If they proceed: clear the offline queue (data is lost)
- Better option: attempt one final sync before signing out. If it fails, warn and let them decide.

---

## SECTION F: Attendance Notifications & Reminders

**These are background processes, not screens. But they're part of the attendance system.**

---

### Reminder: "Time to Take Attendance"

**Trigger:** 30 minutes before a batch's `start_time` each day the batch runs

**Implementation:**
- Use Expo Notifications for local push notifications on the device
- Schedule notifications when the app launches or when batches are created/modified
- Notification content: "Time to take attendance for Morning Batch" with the academy name
- Tapping the notification opens the app → navigates to the batch selector

**Scheduling logic:**
- For each batch the staff member has access to:
  - Get the batch's `start_time` and `days_of_week`
  - For each upcoming day this week, calculate the reminder time (start_time minus 30 minutes)
  - Schedule local notifications for those times
- Reschedule weekly (on app launch or via a background task)
- Don't send notifications for batches that already have completed attendance for that day

### Reminder: "Attendance Not Taken"

**Trigger:** 30 minutes AFTER a batch's `start_time` if no attendance records exist for that batch today

**Implementation:**
- This is harder to do purely with local notifications (need to check DB state)
- Two approaches:
  1. **Server-side (preferred):** A Supabase Edge Function runs on a cron schedule (every 15 minutes during typical class hours, e.g., 5 AM - 9 PM). It checks each batch: if current time is 30+ minutes past start_time AND no attendance records exist for today AND the batch runs today → send a push notification to the assigned coaches for that branch.
  2. **Client-side fallback:** Schedule a local notification for 30 min after start_time. When it fires, the app (if open) checks if attendance was taken. If yes, dismiss silently. If no, show the notification.
- Notification content: "Morning Batch attendance hasn't been taken yet. Open CoachOS to mark attendance."

### Alert: Student Absent

**Trigger:** After attendance is completed (all students marked) for a batch

**Who receives:** Parents of absent students, via WhatsApp

**Content:** Use the `absent_alert` WhatsApp template: "{student_name} was marked absent from {batch_name} today ({date})."

**This is NOT automatic.** The coach explicitly triggers it from the summary screen (bulk action or per-student). We don't auto-send because:
- The coach might want to correct mistakes first
- The coach might know the student informed them in advance
- Automated messages without human review feel impersonal and can cause issues

---

## SECTION G: Attendance Data Integrity Rules

These rules should be enforced at the database level (constraints + RLS) AND in the application logic:

1. **One record per student per batch per day:** UNIQUE constraint on (student_id, batch_id, date). Upsert handles updates.

2. **Students can only be marked in their assigned batch:** The app should only show students from the selected batch. If someone tries to mark a student in the wrong batch via API, it should still succeed (don't over-validate — the student might be visiting another batch).

3. **Date must be today (for creation via swipe):** The app only creates records for the current date. The date is set server-side (using `CURRENT_DATE` in the SQL or the Edge Function) to prevent clock manipulation.

4. **Marked_by must be a valid, active staff member:** RLS ensures this.

5. **Cannot mark attendance for archived/paused students:** The app filters them out of the card stack. But if someone somehow tries, the record is still created (the enrollment check is in the app layer, not the DB constraint — this is intentional to handle edge cases where status changes mid-session).

6. **Attendance records are never hard-deleted:** Even if a student is archived, their attendance history is preserved. A future "purge" function might clean very old data, but that's admin-controlled.

---

## SECTION H: Dashboard Attendance Widget

**Location:** The staff dashboard home screen has an "Attendance" section in the "Today's Overview" card.

**What it shows:**
- Attendance rate for today across all batches (or for the coach's branch):
  - "32 / 45" with a percentage: "71%"
  - A mini progress bar
- Below: compact list of batches with their individual completion status
- A "Take Attendance" shortcut button

**Data source:** Same query as the batch selector but aggregated: total marked / total students across all batches for today.

---

## Build Order for Attendance

1. **Batch Selector screen** — get the layout right, data loading, progress indicators
2. **Swipe Card component** — build the card layout first (no gestures yet, just static)
3. **Swipe gestures** — add pan gesture handling with Reanimated, get the physics right
4. **Card stack manager** — handle the stack of 3 cards, transitions, progress counter
5. **Action buttons** — wire up Present/Absent buttons as tap alternatives
6. **Undo functionality** — toast + reverse animation + record deletion
7. **Summary screen** — appears after last card, stats, absent list
8. **WhatsApp absent alerts** — button actions on summary screen
9. **Offline queue** — MMKV storage, queue processing, sync indicator
10. **Attendance History** — table with filters, pagination
11. **Edit attendance** — admin-only bottom sheet on history rows
12. **Notifications** — local push for reminders (schedule on app launch)
13. **Dashboard widget** — attendance summary card on the home screen

---

*Next file (006) covers Payments, Invoicing, and the Fee Tracking system.*
