# CoachOS — File 009: State Management, Hooks & Service Layer

> **Purpose:** How to structure Zustand stores, custom hooks (with TanStack Query), and the service layer that talks to Supabase. This is the glue between UI and data.
> **Depends on:** Files 002 (lib files), 007 (database schema), 008 (Edge Functions)

---

## Architecture Overview

```
UI (Screens/Components)
    ↓ uses
Custom Hooks (hooks/)
    ↓ combines
Zustand Stores (stores/)     +     TanStack Query (via services/)
    ↓ manages                           ↓ fetches/caches
Local state (MMKV)                Supabase Client SDK / Edge Functions
```

**Rule of thumb:**
- **Zustand** = client-only state (auth session, UI state, offline queue, current selections)
- **TanStack Query** = server data (students list, attendance records, payments). Handles caching, refetching, pagination, optimistic updates.
- **Hooks** = combine Zustand + TanStack Query into a clean API for screens
- **Services** = raw Supabase calls (queries, inserts, updates, Edge Function calls)

---

## SECTION A: Zustand Stores

---

### A1. Auth Store (`stores/auth-store.ts`)

**Purpose:** Holds the current user's session, profile, and role. This is the SOURCE OF TRUTH for "who is logged in and what can they do."

**State shape:**
```
{
  isAuthenticated: boolean,
  isLoading: boolean,
  session: SupabaseSession | null,
  user: {
    id: string,              // auth user id
    email: string,
    role: 'super_admin' | 'branch_admin' | 'coach' | 'temp_coach' | 'student',
    orgId: string,
    orgName: string,
    branchId: string | null,  // null for super_admin
    branchName: string | null,
    profileId: string,        // staff_profile or student ID
    fullName: string,
    avatarUrl: string | null,
  } | null,
}
```

**Actions:**
- `initialize()` — called on app launch. Checks Supabase session, fetches staff/student profile, populates user state. Also sets up `onAuthStateChange` listener.
- `setSession(session)` — called when auth state changes
- `setUser(user)` — after profile is fetched
- `signOut()` — clears everything, calls supabase.auth.signOut(), clears MMKV
- `switchOrg(orgId)` — for multi-org users: updates orgId, refetches profile for that org

**Persistence:** The Supabase session is persisted by Supabase itself (via SecureStore). The user profile object should be cached in MMKV for instant app launch (hydrate from MMKV first, then refresh from DB in background).

**Important:** The store subscribes to `supabase.auth.onAuthStateChange` in the `initialize` action. When the event is `SIGNED_OUT` or `TOKEN_REFRESHED` fails, it clears the user state and navigates to login.

---

### A2. UI Store (`stores/ui-store.ts`)

**Purpose:** Global UI state — toasts, modals, loading overlays.

**State shape:**
```
{
  toast: {
    visible: boolean,
    message: string,
    variant: 'default' | 'success' | 'error',
    action?: { label: string, onPress: () => void },
  },
  globalLoading: boolean,
  globalLoadingMessage: string,
}
```

**Actions:**
- `showToast(message, variant?, action?)` — shows the toast
- `hideToast()` — hides it
- `showLoading(message?)` — shows a full-screen loading overlay (for major operations like org creation)
- `hideLoading()`

---

### A3. Attendance Store (`stores/attendance-store.ts`)

**Purpose:** Manages the state of an active attendance-taking session (the swipe card flow).

**State shape:**
```
{
  // Session info
  batchId: string | null,
  batchName: string | null,
  date: string,              // ISO date string for today

  // Student cards
  students: StudentCard[],    // full list for this batch
  currentIndex: number,       // which card is showing
  results: Map<string, 'present' | 'absent'>,  // student_id → status

  // Undo
  lastAction: { studentId: string, status: string, index: number } | null,

  // Summary
  isComplete: boolean,
  presentCount: number,
  absentCount: number,
}
```

Where `StudentCard` is a lightweight type:
```
{
  id: string,
  firstName: string,
  lastName: string | null,
  studentIdCode: string,
  avatarUrl: string | null,
  ageGroupName: string | null,
  batchName: string,
  feeStatus: string,
  parentPhone: string | null,
}
```

**Actions:**
- `startSession(batchId, students)` — loads students, resets state
- `markPresent(studentId)` — records present, advances card
- `markAbsent(studentId)` — records absent, advances card
- `undo()` — reverses last action, moves card back
- `goToSummary()` — sets isComplete = true
- `reset()` — clears everything (when leaving attendance)

**This store is client-only.** The actual database writes happen in the service layer, triggered by the custom hook that wraps this store.

---

### A4. Offline Store (`stores/offline-store.ts`)

**Purpose:** Queue of actions that failed due to no connectivity, waiting to be synced.

**State shape:**
```
{
  queue: OfflineAction[],
  isSyncing: boolean,
  lastSyncAt: string | null,
}
```

Where `OfflineAction`:
```
{
  id: string,               // local UUID
  type: string,             // 'attendance.mark', 'student.create', etc.
  payload: Record<string, any>,
  createdAt: string,
  retries: number,
}
```

**Actions:**
- `addToQueue(action)` — adds an action, persists to MMKV
- `processQueue()` — iterates queue, attempts each, removes on success
- `clearQueue()` — empties everything (used on logout after warning)
- `hydrate()` — loads queue from MMKV on app launch

**Persistence:** The queue is always written to MMKV after any mutation. On app launch, `hydrate()` reads from MMKV and restores the queue.

---

## SECTION B: Service Layer

Each file in `services/` is a collection of functions that make Supabase calls. They return raw data — no caching, no state management. The hooks layer adds caching via TanStack Query.

---

### B1. `services/students.ts`

**Functions:**

- `getStudents(branchId, filters?)` — Query students table with optional filters (batch, age group, fee status, enrollment status, search). Joins age_groups and batches for display names. Returns array of Student.

- `getStudent(studentId)` — Single student with all joins (age_group, batch, created_by staff name). Returns Student | null.

- `getStudentsByBatch(batchId, branchId)` — Students for a specific batch, active only. Used by attendance to load the card stack. Returns lightweight StudentCard array.

- `createStudent(data)` — Calls the `create-student` Edge Function. Returns student + credentials.

- `updateStudent(studentId, data)` — Direct Supabase update on students table. Returns updated Student.

- `archiveStudent(studentId)` — Sets enrollment_status = 'archived'. Returns void.

- `requestArchive(studentId, reason)` — For coaches: creates an audit log entry with action 'student.archive_requested'. The actual archive needs admin approval. Returns void.

- `resetPassword(studentId)` — Calls the `reset-student-password` Edge Function. Returns { username, new_password }.

- `completeParentOnboarding(token, data)` — Calls the `parent-onboarding` Edge Function. Returns { success }.

---

### B2. `services/attendance.ts`

**Functions:**

- `getAttendanceForBatch(batchId, date)` — All records for a batch on a specific date. Returns array of AttendanceRecord.

- `getBatchProgress(branchId, date)` — For each batch in the branch: total students and marked count. Used by the batch selector screen. Returns array of { batchId, batchName, startTime, endTime, totalStudents, markedCount }.

- `markAttendance(record)` — Upsert into attendance_records. Input: { student_id, batch_id, date, status, marked_by, org_id, branch_id }. Uses upsert on the unique constraint (student_id, batch_id, date). Returns the created/updated record.

- `markAttendanceBulk(records)` — Batch upsert for syncing offline queue. Accepts array of records. Returns success/failure per record.

- `getAttendanceHistory(branchId, filters)` — Paginated query with date range, batch, status, student search. Joins students and staff_profiles for display names. Returns { data, count, nextCursor }.

- `updateAttendance(recordId, status, notes?)` — Update an existing record (admin only). Returns updated record.

- `getStudentAttendance(studentId, month?)` — All records for a student, optionally filtered by month. Used by student portal. Returns array of AttendanceRecord.

---

### B3. `services/payments.ts`

**Functions:**

- `getPaymentOverview(branchId, month)` — Aggregated stats: total collected, total pending, total overdue, counts. Returns { collected, pending, overdue, counts }.

- `getPayments(branchId, filters)` — List of payments with student joins. Filtered by status, batch, search, month. Paginated. Returns { data, count }.

- `getStudentPayments(studentId)` — All payment records for a student. Returns array of Payment.

- `createPaymentRecords(data)` — Bulk create payment records for a period. Input: { student_ids, amount, period_label, due_date, branch_id }. Skips students who already have a record for this period. Returns { created, skipped }.

- `markPaymentPaid(paymentId, data)` — Update payment to paid/partial. Input: { payment_method, amount, notes }. Calls recalculate_student_fee_status. Returns updated Payment.

- `generatePaymentLink(paymentId)` — Calls `generate-payment-link` Edge Function. Returns { payment_link_url }.

- `getPaymentForRazorpayLink(linkId)` — Lookup by razorpay_payment_link_id. Used internally by webhook.

---

### B4. `services/branches.ts`

**Functions:**

- `getBranches(orgId)` — All branches for an org. Returns array of Branch.
- `getBranch(branchId)` — Single branch. Returns Branch.
- `createBranch(data)` — Insert. Returns Branch.
- `updateBranch(branchId, data)` — Update. Returns Branch.
- `deactivateBranch(branchId)` — Set is_active = false. Returns void.

---

### B5. `services/batches.ts`

**Functions:**

- `getBatchesForBranch(branchId)` — Batches linked to this branch via branch_batches. Returns array of Batch.
- `getAllBatches(orgId)` — All batches in the org. Returns array of Batch with their branch assignments.
- `createBatch(data)` — Insert batch + branch_batches. Returns Batch.
- `updateBatch(batchId, data)` — Update. Returns Batch.
- `deleteBatch(batchId)` — Soft delete (set is_active = false). Returns void.

---

### B6. `services/invites.ts`

**Functions:**

- `createInvite(data)` — Input: { role, branch_id, max_uses?, expiry_hours?, temp_coach_expires_at? }. Generates token, inserts into invites. Returns { token, url, qr_data }.
- `validateInvite(token)` — Check token validity (exists, active, not expired, uses remaining). Returns invite details or null.
- `acceptInvite(token)` — Calls `accept-invite` Edge Function. Returns staff profile.
- `getInvites(orgId)` — List active invites. Returns array of Invite.
- `deactivateInvite(inviteId)` — Set is_active = false. Returns void.

---

### B7. `services/whatsapp.ts`

**Functions:**

- `sendMessage(data)` — Calls `send-whatsapp` Edge Function. Input: { recipient_phone, template_name, template_params, message_type, org_id, branch_id }. Returns { success, message_id? }.
- `sendBulkMessages(data)` — Calls `send-bulk-whatsapp` Edge Function. Returns { total, sent, failed }.
- `getMessageLog(orgId, branchId?, filters?)` — Query whatsapp_logs with filters. Returns paginated log.
- `getMessageCount(phone, date)` — Count messages sent to a phone today (for rate limit check). Returns number.

---

### B8. `services/audit-log.ts`

**Functions:**

- `getAuditLogs(orgId, filters)` — Paginated query with filters (date range, action type, actor). Returns { data, count, nextCursor }.
- `logAction(data)` — Insert into audit_logs. Used by the app for client-side actions. Input: { org_id, branch_id?, action, entity_type, entity_id?, details }. The actor_id and actor_role are auto-populated from the current session.

---

### B9. `services/matches.ts`, `services/notes.ts`, `services/news.ts`

**Follow the same pattern:** CRUD functions for matches (with participants), coach notes, news posts, and reactions. Each uses standard Supabase select/insert/update/delete with appropriate joins.

---

## SECTION C: Custom Hooks

Hooks combine stores + services + TanStack Query into a clean API for screens.

---

### C1. `hooks/useAuth.ts`

**What it provides:**
- `user` — current user object from auth store
- `isAuthenticated` — boolean
- `isLoading` — true during initial auth check
- `signInWithGoogle()` — triggers Google OAuth flow
- `signInAsStudent(username, password)` — student login
- `signOut()` — sign out + clear stores
- `role` — shortcut to user.role

**Implementation:** Wraps the auth store's state and actions. The `signInWithGoogle` action calls `supabase.auth.signInWithOAuth({ provider: 'google' })` and then the store's initialize fetches the profile.

---

### C2. `hooks/useCurrentUser.ts`

**What it provides:**
- `user` — same as useAuth's user but typed as the full user object
- `orgId` — shortcut
- `branchId` — shortcut
- `role` — shortcut
- `can(resource, action)` — shortcut to `hasPermission(role, resource, action)`. Example: `can('student', 'delete')` returns true/false.

This is a convenience hook used everywhere to check permissions inline.

---

### C3. `hooks/useStudents.ts`

**What it provides:**
- `students` — array of Student (from TanStack Query, cached)
- `isLoading` — loading state
- `error` — error state
- `refetch()` — force refresh
- `filters` — current filter state
- `setFilters(newFilters)` — update filters (triggers refetch)
- `searchQuery` — current search text
- `setSearchQuery(text)` — debounced search

**Implementation:** Uses `useQuery` from TanStack Query. The query key includes branchId and all active filters. When filters change, TanStack Query automatically refetches with the new parameters.

```
Query key: ['students', branchId, filters]
Query fn: () => getStudents(branchId, filters)
Stale time: 5 minutes
```

---

### C4. `hooks/useAttendance.ts`

**What it provides:**

For the batch selector:
- `batchProgress` — array of { batchId, batchName, totalStudents, markedCount }
- `isLoading`

For the swipe session:
- `startSession(batchId)` — loads students, initializes the attendance store
- `markPresent(studentId)` — updates store + calls service in background
- `markAbsent(studentId)` — same
- `undo()` — undoes last action in store + deletes record via service
- `currentCard` — the student currently showing
- `progress` — { current, total }
- `isComplete` — all cards swiped
- `results` — Map of student_id → status
- `presentCount`, `absentCount`
- `sendAbsentAlerts()` — sends WhatsApp to all absent students' parents

**Offline handling inside this hook:**
When `markPresent` or `markAbsent` is called:
1. Update the attendance store (instant UI feedback)
2. Try the service call (`markAttendance`)
3. If the call fails due to network error: add to offline queue via offline store
4. If the call succeeds: proceed normally

---

### C5. `hooks/usePayments.ts`

**What it provides:**
- `overview` — aggregated stats for the selected month
- `payments` — filtered/paginated list
- `isLoading`
- `filters` / `setFilters`
- `selectedMonth` / `setSelectedMonth`
- `markAsPaid(paymentId, data)` — mutation that calls service + invalidates cache
- `generateLink(paymentId)` — mutation
- `sendReminder(paymentId)` — sends WhatsApp
- `sendBulkReminders()` — sends to all unpaid

**Uses TanStack Query `useMutation` for write operations,** which automatically invalidates the payments query cache on success, so the list refreshes.

---

### C6. `hooks/useOfflineSync.ts`

**What it provides:**
- `pendingCount` — number of unsynced actions
- `isSyncing` — true when sync is in progress
- `lastSyncAt` — timestamp of last successful sync

**Implementation:**
- On hook mount: hydrate the offline store from MMKV
- Subscribe to network state changes (`NetInfo`)
- When network comes online AND there are pending actions: call `offlineStore.processQueue()`
- The processQueue function iterates the queue and calls the appropriate service function for each action type
- Expose the state for the UI to show a sync indicator

---

### C7. `hooks/usePermissions.ts`

**What it provides:**
- `can(resource, action)` — boolean check
- `canAccessBranch(branchId)` — boolean
- `canInviteRole(role)` — boolean
- `canSeePaymentAmounts` — boolean
- `canSeeRevenueDashboard` — boolean

**Implementation:** Reads role from auth store, delegates to the permission functions in `lib/permissions.ts`.

---

### C8. Other Hooks

- `hooks/useOrg.ts` — org details, settings. `useQuery(['org', orgId], getOrg)`.
- `hooks/useBranch.ts` — branch details. `useQuery(['branch', branchId], getBranch)`.
- `hooks/useBatches.ts` — batches for a branch. `useQuery(['batches', branchId], getBatchesForBranch)`.
- `hooks/useWhatsApp.ts` — `sendMessage`, `sendBulk`, `messageLog` query.
- `hooks/useAuditLogs.ts` — paginated audit log query with filters.

**All hooks that fetch data follow the same pattern:**
1. Use `useQuery` with a descriptive query key that includes all filter/scope parameters
2. Call the corresponding service function
3. Return `{ data, isLoading, error, refetch }` plus any filter state
4. Write operations use `useMutation` + `queryClient.invalidateQueries` on success

---

## SECTION D: Data Fetching Patterns

### D1. Query Key Convention

All TanStack Query keys follow this pattern:
```
[entity, ...scope, ...filters]

Examples:
['students', branchId, { batch: 'morning', status: 'active' }]
['attendance-progress', branchId, todayDate]
['attendance-history', branchId, { dateFrom, dateTo, batchId, status }]
['payments', branchId, { month: '2026-02', status: 'overdue' }]
['student', studentId]    // single entity
['batches', branchId]
['audit-logs', orgId, { dateRange, actionType }]
```

This convention ensures:
- Queries are scoped correctly (changing branch invalidates all branch-scoped queries)
- Filters are part of the key (changing a filter fetches fresh data)
- Easy to invalidate: `queryClient.invalidateQueries({ queryKey: ['students'] })` invalidates ALL student queries

### D2. Stale Time Defaults

| Data Type | Stale Time | Why |
|-----------|------------|-----|
| Students list | 5 minutes | Doesn't change frequently |
| Single student | 5 minutes | Same |
| Attendance progress (batch selector) | 30 seconds | Changes during active session |
| Attendance history | 5 minutes | Historical data |
| Payments overview | 2 minutes | Updated by payment actions |
| Batches, age groups | 30 minutes | Rarely changes |
| Org/branch info | 30 minutes | Rarely changes |
| Audit logs | 1 minute | Admin wants fresh data |
| WhatsApp logs | 1 minute | Same |

### D3. Optimistic Updates

Use optimistic updates for actions where instant feedback matters:

- **Attendance marking:** Update the local attendance store immediately. If the API call fails, the offline queue handles it — no UI rollback.
- **Payment marking as paid:** Optimistically update the payment status in the TanStack Query cache. If the mutation fails, roll back.
- **Sending WhatsApp:** Show "Sent ✓" toast immediately. If the send fails in the background, show "Failed to send" toast later.

### D4. Pagination Pattern

For large lists (attendance history, audit logs, payments):
- Use cursor-based pagination with `created_at` as cursor
- TanStack Query's `useInfiniteQuery` for infinite scroll on mobile
- Or manual pagination with Previous/Next buttons (50 items per page)
- The service function accepts `{ cursor?: string, limit: number }` and returns `{ data, nextCursor: string | null }`

---

## SECTION E: State Initialization Sequence

When the app launches, this is the exact sequence:

1. Root layout mounts → fonts load → splash screen hides
2. `app/index.tsx` runs → calls `authStore.initialize()`
3. `initialize()`:
   a. Check Supabase session (`getSession()`)
   b. If no session → navigate to login. Done.
   c. If session exists → fetch staff_profile (or student record)
   d. If staff_profile found → populate auth store user, navigate to staff dashboard
   e. If student found → populate auth store, navigate to student portal
   f. If neither → navigate to onboarding
4. Set up `onAuthStateChange` listener (handles token refresh, sign out)
5. Hydrate offline store from MMKV → check for pending actions → sync if online
6. Schedule local notifications for attendance reminders
7. App is ready

---

*Next: File 010 covers the Cursor Rules file and project setup instructions.*
