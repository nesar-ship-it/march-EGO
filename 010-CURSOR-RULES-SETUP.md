# CoachOS — File 010: Cursor Rules & Project Setup Checklist

> **Purpose:** The `.cursorrules` file for Cursor IDE, plus a final checklist to ensure everything is set up correctly before building.
> **This file contains TWO things:**
> 1. The contents of `.cursorrules` (copy into your project root)
> 2. A step-by-step setup checklist

---

## PART 1: `.cursorrules` File

**Create this file at the ROOT of your project: `coachOS/.cursorrules`**

Copy everything between the START and END markers below:

---

### --- START .cursorrules ---

```
# CoachOS — Cursor Rules
# This file tells Cursor how to understand and build this project.

## Project Overview
CoachOS is a mobile-first attendance, fee-tracking, payments, and WhatsApp automation platform for sports academies. Built with Expo (React Native) targeting iOS, Android, and Web.

## Tech Stack
- Framework: Expo SDK 52 + React Native 0.76 + Expo Router v4
- Language: TypeScript (strict mode)
- Styling: NativeWind v4 (Tailwind CSS for React Native)
- State: Zustand 5 (client state) + TanStack Query v5 (server state)
- Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Payments: Razorpay (test mode, UPI-first)
- WhatsApp: Meta Business Cloud API
- Forms: React Hook Form v7 + Zod validation
- Animations: React Native Reanimated 3.16 + Gesture Handler 2.20
- Icons: Lucide React Native
- Local Storage: MMKV (native) / localStorage (web)

## Design System Rules — FOLLOW STRICTLY
- Visual style: Vercel.com (light mode) + Linear.app. Monochrome. Clean. Minimal.
- Primary color: #0A0A0A (black). No brand colors, no accent colors except semantic status.
- Status colors ONLY: Success #22C55E, Warning #F59E0B, Error #EF4444, Info #3B82F6
- Font: Inter (Regular 400, Medium 500, SemiBold 600, Bold 700)
- Buttons: Primary = black bg white text. Secondary = white bg black border. No colored buttons.
- No decorative icons. Icons only in sidebar/navigation and functional positions.
- No emojis in UI (exception: news reactions).
- Tables STAY as tables on mobile. Use horizontal scroll. Do NOT convert to cards.
- Filter bars use Linear-style horizontal scrolling chips.
- Border radius: 8px for buttons/inputs/cards. 12px for modals/sheets. 9999px for avatars.
- Shadows: very subtle (opacity 0.04-0.08). No heavy drop shadows.

## Code Rules
- Every component goes in components/ and is reusable.
- UI primitives go in components/ui/ and are imported from @/components/ui.
- All components accept a className prop for NativeWind overrides.
- Never use inline colors. Always use design tokens from tailwind.config.js or lib/constants.ts.
- Never use inline styles for colors or spacing. Use NativeWind classes.
- No dead code. No commented-out code. No console.log in committed code (only console.warn and console.error).
- Use TypeScript strict mode. No `any` types unless absolutely unavoidable.
- All data types are in lib/types.ts. All validation schemas are in lib/validators.ts.
- All constants and enums are in lib/constants.ts.
- File naming: PascalCase for components, camelCase for hooks/utils/services, kebab-case for routes.

## Data Architecture
- All data is scoped to an organization (org_id).
- Branch isolation is MANDATORY: branch_admin, coach, temp_coach can only see their branch's data.
- Super admin can see all branches.
- Students can only see their own data.
- RLS (Row Level Security) is enabled on EVERY table. Never disable it.
- Use Supabase client SDK for data access (not custom REST APIs).
- Use Edge Functions for operations requiring service role key (user creation, external APIs, webhooks).

## RBAC (Role-Based Access Control)
- Roles: super_admin > branch_admin > coach > temp_coach > student
- Use the hasPermission() function from lib/permissions.ts for ALL permission checks.
- Use the RoleGate component to conditionally render UI based on permissions.
- Temp coaches have time-limited access (check access_expires_at).
- Only super_admin can convert temp_coach to coach.
- Coaches CANNOT delete students (only request deletion).
- Coaches CANNOT see revenue numbers or payment amounts.

## Navigation
- Mobile: Bottom tab bar (5 tabs) — Home, Attendance, Students, Payments, More
- Web (768px+): Left sidebar — switches from tabs automatically
- Expo Router file-based routing. Route groups: (auth), (staff), (student), (parent-onboarding), invite
- Staff and student are separate route groups with different tab bars.

## Attendance System
- Swipe cards inspired by Slack "Catch Up" — swipe right = present, left = absent
- Must work offline (MMKV queue, sync on reconnect)
- Progress counter always visible
- Undo available for 4 seconds after each swipe
- Summary screen after all cards processed
- One record per student per batch per day (UNIQUE constraint)

## Payments
- Razorpay for online payments (UPI-first)
- Manual payment recording for cash
- Invoice PDF generation after payment
- Automatic overdue status updates via cron

## WhatsApp
- Meta Business Cloud API for messaging
- All messages use pre-approved templates
- Rate limit: 5 messages per parent per day
- All sends logged in whatsapp_logs

## Offline Support
- Attendance marking works fully offline
- Actions queued in MMKV, synced when online
- Optimistic UI — no loading spinners for swipe actions
- Sync indicator in header: green (online), amber (syncing), red (offline with pending)

## Error Handling
- Show skeleton loading on first data fetch (never spinners)
- Pull-to-refresh on all list screens
- Network errors: show retry card
- Permission errors: show "no access" message
- Every list/table has a designed empty state

## Auth
- Staff: Google OAuth only
- Students: username + password (no email/phone auth)
- Invite links: secure tokens, expiring, single/limited use
- Parent onboarding: public form with token auth (no login required)

## File Structure
app/                    — Expo Router pages
components/ui/          — Design system primitives
components/{feature}/   — Feature-specific components
components/shared/      — Cross-cutting components (RoleGate, ConfirmDialog)
components/navigation/  — Tab bar, header, sidebar
lib/                    — Utilities, constants, types, Supabase client
hooks/                  — Custom React hooks
stores/                 — Zustand stores
services/               — Supabase API calls
supabase/migrations/    — SQL migration files
supabase/functions/     — Edge Functions (Deno)

## When Building a New Screen
1. Check if all needed UI components exist in components/ui/
2. Check if the service function exists in services/
3. Check if the hook exists in hooks/
4. Build the screen using existing components, hooks, and services
5. Add proper loading, error, and empty states
6. Add RoleGate checks for permission-gated elements
7. Test on mobile viewport first, then verify web layout
8. Ensure all user inputs have Zod validation

## When Building a New Component
1. Place in components/ui/ if it's a primitive, or components/{feature}/ if feature-specific
2. Accept className prop
3. Use design tokens only (no hardcoded colors/spacing)
4. Export from the barrel index (components/ui/index.ts)
5. Make it work on iOS, Android, AND web

## Common Mistakes to Avoid
- Do NOT use Firebase. We use Supabase.
- Do NOT use StyleSheet.create for styling. Use NativeWind classes.
- Do NOT hardcode colors. Use tailwind classes or design tokens.
- Do NOT create separate CSS/JS files for web. Everything is single-file components.
- Do NOT use localStorage directly. Use the storage helper from lib/storage.ts.
- Do NOT query the database without considering RLS. If a query returns unexpected results, check RLS policies.
- Do NOT create new types outside of lib/types.ts (keep them centralized).
- Do NOT use console.log. Use console.warn or console.error, or remove the log.
- Do NOT use expo-router's Link component for programmatic navigation. Use router.push() or router.replace().
- Do NOT use images or icons that require network fetch for core UI. Lucide icons are bundled.
```

### --- END .cursorrules ---

---

## PART 2: Project Setup Checklist

Follow this checklist to get from zero to a running project. Do every step in order.

---

### Phase 0: Prerequisites

- [ ] Node.js 20+ installed
- [ ] npm or yarn installed
- [ ] Expo CLI available (`npx expo --version` works)
- [ ] Git initialized
- [ ] Supabase account created (free tier)
- [ ] Supabase CLI installed (`npx supabase --version`)
- [ ] Razorpay account created (test mode active)
- [ ] Meta Business Platform account created (for WhatsApp — can defer this)

---

### Phase 1: Scaffold (File 002)

- [ ] Create Expo project: `npx create-expo-app@latest coachOS --template tabs`
- [ ] Remove boilerplate files
- [ ] Create folder structure (all directories from File 003 project structure)
- [ ] Install all dependencies (exact versions from File 002)
- [ ] Create all config files:
  - [ ] `app.json`
  - [ ] `tsconfig.json`
  - [ ] `tailwind.config.js`
  - [ ] `babel.config.js`
  - [ ] `metro.config.js`
  - [ ] `global.css`
  - [ ] `nativewind-env.d.ts`
  - [ ] `.env.example` and `.env`
  - [ ] `.gitignore` additions
  - [ ] `eslint.config.mjs`
  - [ ] `.prettierrc`
  - [ ] `.cursorrules` (from this file)
- [ ] Download Inter font files to `assets/fonts/`
- [ ] Create all lib files:
  - [ ] `lib/supabase.ts`
  - [ ] `lib/cn.ts`
  - [ ] `lib/constants.ts`
  - [ ] `lib/types.ts`
  - [ ] `lib/utils.ts`
  - [ ] `lib/validators.ts`
  - [ ] `lib/permissions.ts`
  - [ ] `lib/storage.ts`
- [ ] Create root layout `app/_layout.tsx`
- [ ] Create entry point `app/index.tsx`
- [ ] Run `npx tsc --noEmit` — should pass
- [ ] Run `npx expo start` — should launch without errors

---

### Phase 2: Supabase Setup (File 007)

- [ ] Create Supabase project in dashboard
- [ ] Copy project URL and anon key to `.env`
- [ ] Link local project: `npx supabase link --project-ref YOUR_REF`
- [ ] Run all 15 migrations in order
- [ ] Verify all tables exist
- [ ] Verify RLS is enabled on all tables
- [ ] Enable Google OAuth in Supabase Auth dashboard
- [ ] Set redirect URL for Google OAuth: `https://app.cricketcircleacademy.com` and your Expo development URL
- [ ] Create Supabase Storage buckets: avatars, documents, invoices, org-assets
- [ ] Test: create a test org via SQL, then verify RLS works by querying from the client

---

### Phase 3: Design System (File 003)

- [ ] Build all UI components in order specified in File 003
- [ ] Create barrel export `components/ui/index.ts`
- [ ] Create shared components: RoleGate, ConfirmDialog, ErrorBoundary
- [ ] Test: create a temporary test screen that renders every component to verify they all work on iOS, Android, and Web

---

### Phase 4: Auth & Onboarding (File 004)

- [ ] Build login screen
- [ ] Implement Google OAuth flow
- [ ] Implement student username/password login
- [ ] Build auth store (Zustand)
- [ ] Build session management (auth state listener)
- [ ] Build onboarding steps 1-5
- [ ] Deploy `create-organization` Edge Function
- [ ] Build completion screen
- [ ] Test full flow: sign up → create org → land on dashboard

---

### Phase 5: Core Loop — Students + Attendance (Files 004-005)

- [ ] Build student list screen with filters and table
- [ ] Deploy `create-student` Edge Function
- [ ] Build add student form
- [ ] Build share/QR screen
- [ ] Deploy `parent-onboarding` Edge Function
- [ ] Build parent onboarding public form
- [ ] Build student detail screen with tabs
- [ ] Build batch selector screen
- [ ] Build swipe card component with gestures
- [ ] Build card stack manager
- [ ] Build action buttons + undo
- [ ] Build attendance summary screen
- [ ] Implement offline queue
- [ ] Build attendance history with filters
- [ ] Test: full flow from adding a student to taking their attendance

---

### Phase 6: Payments (File 006 Section A)

- [ ] Build payments overview screen
- [ ] Build payment record creation flow
- [ ] Build mark-as-paid flow
- [ ] Deploy `generate-payment-link` Edge Function
- [ ] Set up Razorpay test webhook
- [ ] Deploy `payment-webhook` Edge Function
- [ ] Deploy `generate-invoice` Edge Function
- [ ] Deploy `update-overdue` cron function
- [ ] Test: create payment → generate link → simulate webhook → verify invoice

---

### Phase 7: Communication (File 006 Section B)

- [ ] Build communication hub screen
- [ ] Build broadcast composer
- [ ] Deploy `send-whatsapp` Edge Function
- [ ] Deploy `send-bulk-whatsapp` Edge Function
- [ ] Deploy `send-reminders` cron function
- [ ] Set up WhatsApp templates in Meta dashboard
- [ ] Test: send a test message to your own WhatsApp number

---

### Phase 8: Student Portal (File 006 Section C)

- [ ] Build student home screen
- [ ] Build student attendance calendar
- [ ] Build student payments screen
- [ ] Build student notes screen
- [ ] Build student profile screen
- [ ] Build matches/news screens
- [ ] Test: log in as a student and verify all data is scoped correctly

---

### Phase 9: Settings & Admin (File 006 Sections D-E)

- [ ] Build settings index
- [ ] Build staff management + invite flow
- [ ] Deploy `accept-invite` Edge Function
- [ ] Build batch/age group management
- [ ] Build WhatsApp configuration
- [ ] Build audit logs viewer
- [ ] Deploy `expire-temp-coaches` cron function
- [ ] Deploy `cleanup-logs` cron function

---

### Phase 10: Polish & Deploy

- [ ] Add local push notifications for attendance reminders
- [ ] Set up deep linking (invite URLs, parent onboarding URLs)
- [ ] Add error boundaries to all route groups
- [ ] Test offline mode thoroughly (airplane mode during attendance)
- [ ] Performance audit (no unnecessary re-renders, list virtualization for long lists)
- [ ] Deploy web to Vercel:
  - [ ] Connect GitHub repo
  - [ ] Set environment variables
  - [ ] Configure custom domain: app.cricketcircleacademy.com
- [ ] Build mobile apps via EAS:
  - [ ] `eas build --platform ios`
  - [ ] `eas build --platform android`
  - [ ] Test on physical devices
- [ ] Submit to TestFlight (iOS) and Internal Testing (Android)

---

## File Manifest — All 10 Files

| File | Name | Lines | Content |
|------|------|-------|---------|
| 001 | PRD-MASTER.md | ~2,500 | Complete product spec, tech stack, design tokens, DB schema, RBAC, screen wireframes, API contracts |
| 002 | PROJECT-SCAFFOLD.md | ~1,800 | Expo project setup, all config files, lib files with full code |
| 003 | DESIGN-SYSTEM.md | ~1,900 | All 21 UI components with full implementation code |
| 004 | AUTH-ONBOARDING-INVITES.md | ~800 | Auth flows, 5-step onboarding, invite system, student creation, parent form — all instructional |
| 005 | ATTENDANCE-SYSTEM.md | ~575 | Batch selector, swipe cards, gestures, offline queue, summary, history — all instructional |
| 006 | PAYMENTS-COMMS-PORTAL-SETTINGS.md | ~875 | Payments, WhatsApp, student portal, matches, settings, audit logs, navigation, build order |
| 007 | DATABASE-MIGRATIONS.md | ~550 | All 15 SQL migrations, table schemas, indexes, RLS policy descriptions, helper functions, cron jobs |
| 008 | EDGE-FUNCTIONS.md | ~425 | All 14 Edge Functions with inputs, outputs, logic, error handling |
| 009 | STATE-HOOKS-SERVICES.md | ~475 | Zustand stores, TanStack Query hooks, service layer, data fetching patterns |
| 010 | CURSOR-RULES-SETUP.md | This file | .cursorrules content, complete setup checklist |

**Total:** ~10,000 lines of specification covering every aspect of CoachOS.

---

## How to Use These Files with Cursor

1. Place all .md files in a `docs/` folder at the project root
2. Place `.cursorrules` at the project root
3. When asking Cursor to build something, reference the relevant file: "Build the login screen as described in docs/004-AUTH-ONBOARDING-INVITES.md Section A1"
4. Build in the order specified in the Phase checklist above
5. After each phase, test thoroughly before moving to the next

---

*This is the final file. You now have everything needed to build CoachOS from scratch.*
