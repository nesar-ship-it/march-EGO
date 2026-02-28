# CoachOS — Master PRD & Technical Specification

> **Version:** 1.0.0
> **Last Updated:** 2026-02-28
> **Status:** Foundation Document — Feed this into Cursor as the project's source of truth.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Project Structure](#3-project-structure)
4. [Design System](#4-design-system)
5. [Component Library](#5-component-library)
6. [Authentication & Security](#6-authentication--security)
7. [Database Schema](#7-database-schema)
8. [RBAC — Role-Based Access Control](#8-rbac--role-based-access-control)
9. [Screen-by-Screen Specification](#9-screen-by-screen-specification)
10. [Core Workflows & Edge Cases](#10-core-workflows--edge-cases)
11. [API Contracts](#11-api-contracts)
12. [Background Jobs & Notifications](#12-background-jobs--notifications)
13. [WhatsApp Integration](#13-whatsapp-integration)
14. [Payments Integration](#14-payments-integration)
15. [Offline & Field-Use Patterns](#15-offline--field-use-patterns)
16. [Deployment & Infrastructure](#16-deployment--infrastructure)
17. [Testing Strategy](#17-testing-strategy)

---

## 1. Product Overview

### 1.1 One-Line Summary

CoachOS is a mobile-first attendance, fee-tracking, payments, and WhatsApp-automation platform for sports academies, with strict branch isolation, RBAC, and coach-initiated student onboarding completed by parents.

### 1.2 Problem Statement

Sports academies currently juggle attendance on paper, fee tracking in spreadsheets, payments via manual UPI, and parent communication via personal WhatsApp groups. CoachOS consolidates all of this into one clean system.

### 1.3 Target Audience (Priority Order)

1. **Sports academies** (cricket primary, then football, hockey, tennis, etc.)
2. Small institutions / academies
3. Small schools
4. Custom solutions for large schools and colleges (future)

### 1.4 Platform Requirements

| Platform | Type | Priority |
|----------|------|----------|
| iOS | Native mobile app (via Expo) | P0 |
| Android | Native mobile app (via Expo) | P0 |
| Web (Windows) | Browser app | P0 |
| Web (macOS) | Browser app | P0 |
| macOS Desktop | Electron or PWA (future) | P2 |

### 1.5 Cost Constraint

**$0 to start.** Every tool must have a usable free tier. No government registration, GST, or company formation required to begin building and testing.

### 1.6 Temporary Domain

`app.cricketcircleacademy.com` — this is the temporary web deployment target.

---

## 2. Tech Stack & Dependencies

### 2.1 Core Stack Decision Matrix

| Layer | Choice | Why |
|-------|--------|-----|
| **Cross-platform framework** | Expo (SDK 52) + React Native 0.76 | Single codebase → iOS, Android, Web. Expo Router for file-based navigation. New Architecture enabled. |
| **Language** | TypeScript 5.6 | Type safety, editor support, fewer runtime bugs. |
| **Navigation** | Expo Router v4 | File-based routing, deep links, web support built-in. |
| **State management** | Zustand 5.x | Minimal boilerplate, TypeScript-native, no provider wrappers. |
| **Server state / caching** | TanStack Query (React Query) v5 | Caching, background refresh, offline support, pagination. |
| **Backend / Database** | Supabase (PostgreSQL) | Free tier: 500MB DB, 1GB storage, 50K monthly active users. Auth, Realtime, Edge Functions, Row Level Security. |
| **Auth** | Supabase Auth (Google OAuth for staff, username/password for students) | Free tier covers all needs. Google login for staff, custom credentials for students. |
| **File storage** | Supabase Storage | Free 1GB. Student photos, documents, invoices. |
| **Edge Functions** | Supabase Edge Functions (Deno) | Background jobs, WhatsApp API calls, payment webhooks. |
| **Payments** | Razorpay (Standard plan) | No company registration needed for test mode. UPI-first. 2% transaction fee in live mode. Free to integrate and test. |
| **WhatsApp** | WhatsApp Business Cloud API via Meta | Free tier: 1,000 service conversations/month. Requires Meta Business account (no company registration needed). |
| **Styling** | NativeWind v4 (Tailwind CSS for React Native) | Consistent styling across platforms, Tailwind utility classes. |
| **Animations** | React Native Reanimated 3.16+ | 60fps gesture-driven animations for swipe cards. |
| **Gestures** | React Native Gesture Handler 2.20+ | Swipe, pan, tap detection for attendance cards. |
| **Forms** | React Hook Form v7 + Zod validation | Performant forms, schema validation, TypeScript integration. |
| **Icons** | Lucide React Native | Monochrome icon set, tree-shakeable, consistent with design system. |
| **Date/Time** | date-fns v4 | Lightweight, tree-shakeable, no Moment.js bloat. |
| **QR Code** | react-native-qrcode-skia | Generate QR codes for parent onboarding links. |
| **Charts** | Victory Native v41 | Charts for dashboards (attendance trends, payment stats). |
| **Linting** | ESLint v9 (flat config) + Prettier | Code consistency. |
| **Testing** | Jest + React Native Testing Library | Unit and integration tests. |

### 2.2 Exact Dependencies — `package.json`

```json
{
  "name": "coachOS",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "eslint .",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-linking": "~7.0.0",
    "expo-web-browser": "~14.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-image-picker": "~16.0.0",
    "expo-document-picker": "~13.0.0",
    "expo-notifications": "~0.29.0",
    "expo-clipboard": "~7.0.0",
    "expo-haptics": "~14.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-font": "~13.0.0",
    "expo-constants": "~17.0.0",
    "react": "18.3.1",
    "react-native": "0.76.6",
    "react-dom": "18.3.1",
    "react-native-web": "~0.19.13",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-safe-area-context": "~4.14.0",
    "react-native-screens": "~4.4.0",
    "react-native-svg": "~15.9.0",
    "@supabase/supabase-js": "^2.47.0",
    "@tanstack/react-query": "^5.62.0",
    "zustand": "^5.0.0",
    "nativewind": "^4.1.0",
    "react-hook-form": "^7.54.0",
    "zod": "^3.24.0",
    "@hookform/resolvers": "^3.9.0",
    "lucide-react-native": "^0.468.0",
    "date-fns": "^4.1.0",
    "react-native-qrcode-skia": "^1.1.0",
    "@shopify/react-native-skia": "^1.8.0",
    "victory-native": "^41.12.0",
    "react-native-mmkv": "^3.2.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@babel/core": "^7.26.0",
    "@types/react": "~18.3.0",
    "@types/react-native": "~0.73.0",
    "typescript": "~5.6.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^9.17.0",
    "prettier": "^3.4.0",
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.9.0",
    "jest-expo": "~52.0.0"
  }
}
```

### 2.3 Why Each Choice

**Expo over bare React Native:** Managed workflow means zero Xcode/Android Studio setup. `expo run:ios` and `expo run:android` handle builds. Web support is built-in via `expo start --web`. The user explicitly said they don't know Xcode — Expo eliminates that requirement.

**Supabase over Firebase:** PostgreSQL gives proper relational queries (critical for branch isolation, RBAC, audit logs). Row Level Security (RLS) enforces access control at the database level. Free tier is generous. No vendor lock-in — it's all standard PostgreSQL.

**NativeWind over StyleSheet:** Tailwind utility classes work identically on iOS, Android, and Web. Faster to style, consistent output, and matches the Vercel/Linear aesthetic we're targeting.

**MMKV over AsyncStorage:** 30x faster reads/writes. Used for local caching of attendance state, user session, and offline queue.

---

## 3. Project Structure

```
coachOS/
├── app/                          # Expo Router — file-based routing
│   ├── _layout.tsx               # Root layout (providers, auth gate)
│   ├── index.tsx                 # Entry redirect (→ auth or dashboard)
│   ├── (auth)/                   # Auth group (no tab bar)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding/
│   │       ├── _layout.tsx
│   │       ├── org-details.tsx
│   │       ├── founders.tsx
│   │       ├── branches.tsx
│   │       ├── batches.tsx
│   │       ├── age-groups.tsx
│   │       └── complete.tsx
│   ├── (staff)/                  # Staff dashboard group (tab bar)
│   │   ├── _layout.tsx           # Tab navigator layout
│   │   ├── (home)/
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx         # Dashboard home
│   │   ├── (attendance)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # Batch selector → swipe cards
│   │   │   ├── take.tsx          # Swipe-card attendance
│   │   │   └── history.tsx       # Attendance records table
│   │   ├── (students)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # Student list (Linear-style table)
│   │   │   ├── [id].tsx          # Student detail
│   │   │   ├── add.tsx           # Add student (coach minimal form)
│   │   │   └── onboarding-link.tsx  # QR + share link screen
│   │   ├── (payments)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # Payment status overview
│   │   │   ├── [studentId].tsx   # Student payment detail
│   │   │   └── collect.tsx       # Generate payment link
│   │   ├── (communicate)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # WhatsApp broadcast dashboard
│   │   │   └── templates.tsx     # Message templates
│   │   └── (settings)/
│   │       ├── _layout.tsx
│   │       ├── index.tsx
│   │       ├── branches.tsx
│   │       ├── staff.tsx
│   │       ├── batches.tsx
│   │       ├── age-groups.tsx
│   │       ├── payments-config.tsx
│   │       ├── whatsapp-config.tsx
│   │       └── audit-logs.tsx
│   ├── (student)/                # Student portal group
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Student home
│   │   ├── attendance.tsx
│   │   ├── payments.tsx
│   │   ├── notes.tsx             # Diet + practice notes
│   │   ├── matches.tsx
│   │   └── profile.tsx
│   ├── (parent-onboarding)/      # Public route — no auth required
│   │   ├── _layout.tsx
│   │   └── [token].tsx           # Complete student profile
│   └── invite/
│       └── [token].tsx           # Staff invite acceptance
├── components/                   # Reusable components
│   ├── ui/                       # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Sheet.tsx             # Bottom sheet
│   │   ├── Toast.tsx
│   │   ├── Avatar.tsx
│   │   ├── Table.tsx             # Linear-style table
│   │   ├── TableRow.tsx
│   │   ├── FilterBar.tsx         # Linear-style filter chips
│   │   ├── SearchInput.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Skeleton.tsx          # Loading skeleton
│   │   ├── Divider.tsx
│   │   ├── Switch.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Radio.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── StatusDot.tsx
│   │   ├── IconButton.tsx
│   │   └── index.ts              # Barrel export
│   ├── attendance/
│   │   ├── SwipeCard.tsx          # Attendance swipe card
│   │   ├── SwipeCardStack.tsx     # Card stack manager
│   │   ├── AttendanceActions.tsx  # Bottom action buttons
│   │   ├── AttendanceSummary.tsx
│   │   └── BatchSelector.tsx
│   ├── students/
│   │   ├── StudentRow.tsx
│   │   ├── StudentFilters.tsx
│   │   ├── FeeStatusBadge.tsx
│   │   ├── ProfileCompletionBadge.tsx
│   │   └── QRCodeCard.tsx
│   ├── payments/
│   │   ├── PaymentStatusCard.tsx
│   │   ├── InvoiceCard.tsx
│   │   └── PaymentLinkButton.tsx
│   ├── communication/
│   │   ├── BroadcastComposer.tsx
│   │   ├── TemplateSelector.tsx
│   │   └── MessageLog.tsx
│   ├── navigation/
│   │   ├── TabBar.tsx            # Custom bottom tab bar
│   │   ├── Header.tsx            # Screen header
│   │   └── Sidebar.tsx           # Web sidebar (hidden on mobile)
│   └── shared/
│       ├── RoleGate.tsx           # Conditional render by role
│       ├── BranchGate.tsx         # Conditional render by branch
│       ├── ConfirmDialog.tsx
│       └── ErrorBoundary.tsx
├── lib/                          # Utilities & core logic
│   ├── supabase.ts               # Supabase client init
│   ├── auth.ts                   # Auth helpers
│   ├── constants.ts              # App constants, enums
│   ├── types.ts                  # Global TypeScript types
│   ├── utils.ts                  # General utilities
│   ├── cn.ts                     # clsx + tailwind-merge helper
│   ├── permissions.ts            # RBAC permission checks
│   ├── storage.ts                # MMKV local storage helpers
│   ├── offline-queue.ts          # Offline action queue
│   └── validators.ts             # Zod schemas
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useCurrentUser.ts
│   ├── useOrg.ts
│   ├── useBranch.ts
│   ├── useStudents.ts
│   ├── useAttendance.ts
│   ├── usePayments.ts
│   ├── usePermissions.ts
│   ├── useOfflineSync.ts
│   └── useWhatsApp.ts
├── stores/                       # Zustand stores
│   ├── auth-store.ts
│   ├── attendance-store.ts
│   ├── ui-store.ts               # Modals, sheets, toasts
│   └── offline-store.ts
├── services/                     # API service layer
│   ├── students.ts
│   ├── attendance.ts
│   ├── payments.ts
│   ├── branches.ts
│   ├── batches.ts
│   ├── invites.ts
│   ├── whatsapp.ts
│   ├── audit-log.ts
│   └── file-upload.ts
├── supabase/                     # Supabase project config
│   ├── migrations/               # SQL migrations
│   │   ├── 001_create_orgs.sql
│   │   ├── 002_create_branches.sql
│   │   ├── 003_create_users_profiles.sql
│   │   ├── 004_create_students.sql
│   │   ├── 005_create_batches_age_groups.sql
│   │   ├── 006_create_attendance.sql
│   │   ├── 007_create_payments.sql
│   │   ├── 008_create_invites.sql
│   │   ├── 009_create_audit_logs.sql
│   │   ├── 010_create_whatsapp_logs.sql
│   │   ├── 011_create_matches_news.sql
│   │   ├── 012_create_coach_notes.sql
│   │   └── 013_rls_policies.sql
│   └── functions/                # Edge Functions (Deno)
│       ├── send-whatsapp/
│       ├── generate-invoice/
│       ├── payment-webhook/
│       ├── send-reminders/
│       └── cleanup-logs/
├── assets/
│   ├── fonts/
│   │   ├── Inter-Regular.ttf
│   │   ├── Inter-Medium.ttf
│   │   ├── Inter-SemiBold.ttf
│   │   └── Inter-Bold.ttf
│   └── images/
│       ├── logo.svg
│       └── onboarding/
├── tailwind.config.js
├── app.json                      # Expo config
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── .env.example
```

---

## 4. Design System

### 4.1 Design Philosophy

**Follow Vercel.com (light mode) and Linear.app exactly.** Monochrome. Clean. No decorative icons. No color accents except semantic status colors. Every pixel intentional.

### 4.2 Color Tokens

```typescript
// lib/constants.ts — Design Tokens

export const colors = {
  // Backgrounds
  bg: {
    primary:    '#FFFFFF',      // Main background
    secondary:  '#FAFAFA',      // Cards, secondary surfaces
    tertiary:   '#F5F5F5',      // Hover states, subtle fills
    elevated:   '#FFFFFF',      // Modals, sheets
    inverse:    '#0A0A0A',      // Dark surfaces (toasts)
  },

  // Foreground / Text
  text: {
    primary:    '#0A0A0A',      // Headings, body
    secondary:  '#666666',      // Descriptions, labels
    tertiary:   '#999999',      // Placeholders, disabled
    inverse:    '#FFFFFF',      // Text on dark bg
    link:       '#0A0A0A',      // Links (underlined, not blue)
  },

  // Borders
  border: {
    default:    '#E5E5E5',      // Cards, inputs, dividers
    hover:      '#CCCCCC',      // Hover state
    focus:      '#0A0A0A',      // Focus ring
    subtle:     '#F0F0F0',      // Very light separators
  },

  // Semantic Status (ONLY place color is used)
  status: {
    success:    '#22C55E',      // Paid, present
    warning:    '#F59E0B',      // Due, partial
    error:      '#EF4444',      // Overdue, absent
    info:       '#3B82F6',      // Informational badges
  },

  // Interactive
  interactive: {
    primary:    '#0A0A0A',      // Primary buttons (black)
    primaryHover: '#1A1A1A',
    secondary:  '#FFFFFF',      // Secondary buttons (white + border)
    secondaryHover: '#FAFAFA',
    danger:     '#EF4444',      // Destructive actions
    dangerHover:'#DC2626',
    disabled:   '#E5E5E5',
    disabledText: '#999999',
  },
} as const;
```

### 4.3 Typography

Font: **Inter** (Google Fonts, free, matches Linear/Vercel aesthetic).

```typescript
export const typography = {
  // Display — onboarding hero text
  displayLg:   { fontSize: 36, lineHeight: 44, fontWeight: '700', fontFamily: 'Inter-Bold' },
  displaySm:   { fontSize: 30, lineHeight: 36, fontWeight: '700', fontFamily: 'Inter-Bold' },

  // Headings
  h1:          { fontSize: 24, lineHeight: 32, fontWeight: '600', fontFamily: 'Inter-SemiBold' },
  h2:          { fontSize: 20, lineHeight: 28, fontWeight: '600', fontFamily: 'Inter-SemiBold' },
  h3:          { fontSize: 16, lineHeight: 24, fontWeight: '600', fontFamily: 'Inter-SemiBold' },

  // Body
  bodyLg:      { fontSize: 16, lineHeight: 24, fontWeight: '400', fontFamily: 'Inter-Regular' },
  bodyMd:      { fontSize: 14, lineHeight: 20, fontWeight: '400', fontFamily: 'Inter-Regular' },
  bodySm:      { fontSize: 13, lineHeight: 18, fontWeight: '400', fontFamily: 'Inter-Regular' },

  // Labels
  labelLg:     { fontSize: 14, lineHeight: 20, fontWeight: '500', fontFamily: 'Inter-Medium' },
  labelMd:     { fontSize: 13, lineHeight: 18, fontWeight: '500', fontFamily: 'Inter-Medium' },
  labelSm:     { fontSize: 12, lineHeight: 16, fontWeight: '500', fontFamily: 'Inter-Medium' },

  // Caption / meta
  caption:     { fontSize: 11, lineHeight: 16, fontWeight: '400', fontFamily: 'Inter-Regular' },

  // Mono (IDs, codes)
  mono:        { fontSize: 13, lineHeight: 18, fontWeight: '400', fontFamily: 'monospace' },
} as const;
```

### 4.4 Spacing Scale

```typescript
export const spacing = {
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;
```

### 4.5 Border Radius

```typescript
export const radius = {
  none: 0,
  sm:   4,    // Small chips, tags
  md:   8,    // Buttons, inputs, cards
  lg:   12,   // Modals, sheets
  xl:   16,   // Large cards
  full: 9999, // Avatars, status dots
} as const;
```

### 4.6 Shadows (Light mode only)

```typescript
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;
```

### 4.7 Animation Constants

```typescript
export const animation = {
  // Swipe card thresholds
  swipeThreshold: 120,           // px to trigger action
  swipeVelocityThreshold: 500,   // velocity to trigger
  cardRotationFactor: 0.05,      // degrees per px

  // Transitions
  springConfig: {
    damping: 20,
    stiffness: 200,
    mass: 0.5,
  },
  timing: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
} as const;
```

---

## 5. Component Library

### 5.1 Design Rules

1. **Every component lives in `components/ui/`** and is imported from `@/components/ui`.
2. **All components accept `className` prop** for NativeWind overrides.
3. **No inline colors.** Always reference design tokens.
4. **No decorative icons** in cards/rows unless they serve a functional purpose (e.g., chevron for navigation).
5. **Tables stay as tables** on mobile. Use horizontal scroll if needed, like Linear does. Do NOT convert tables to cards.
6. **Filter bars** use Linear's chip-based filter pattern (see FilterBar spec below).

### 5.2 Button Component Spec

```
Button
├── Variants: primary | secondary | ghost | danger | link
├── Sizes: sm (32px) | md (36px) | lg (44px)
├── States: default | hover | active | disabled | loading
├── Props:
│   ├── variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
│   ├── size: 'sm' | 'md' | 'lg'
│   ├── disabled?: boolean
│   ├── loading?: boolean
│   ├── icon?: LucideIcon (left position)
│   ├── iconRight?: LucideIcon
│   ├── fullWidth?: boolean
│   └── onPress: () => void
└── Visual:
    ├── primary:   bg-black text-white border-none
    ├── secondary: bg-white text-black border border-gray-200
    ├── ghost:     bg-transparent text-black border-none
    ├── danger:    bg-red-500 text-white border-none
    └── link:      bg-transparent text-black underline
```

### 5.3 Input Component Spec

```
Input
├── Variants: default | error | disabled
├── Sizes: md (40px) | lg (48px)
├── Props:
│   ├── label?: string
│   ├── placeholder?: string
│   ├── error?: string
│   ├── hint?: string
│   ├── icon?: LucideIcon (left)
│   ├── rightElement?: ReactNode
│   └── ...TextInputProps
└── Visual:
    ├── Border: 1px solid #E5E5E5
    ├── Focus: 1px solid #0A0A0A + subtle shadow
    ├── Error: 1px solid #EF4444
    ├── Label: 13px Inter-Medium #666666 above input
    └── Corner radius: 8px
```

### 5.4 Badge Component Spec

```
Badge
├── Variants: default | success | warning | error | info
├── Sizes: sm | md
├── Props:
│   ├── variant
│   ├── size
│   ├── dot?: boolean (show left dot indicator)
│   └── children: string
└── Visual:
    ├── default: bg-gray-100 text-gray-700
    ├── success: bg-green-50 text-green-700
    ├── warning: bg-amber-50 text-amber-700
    ├── error:   bg-red-50 text-red-700
    └── info:    bg-blue-50 text-blue-700
```

### 5.5 Table Component Spec (Linear-style)

```
Table (Mobile-Compatible — this is critical)
├── Components:
│   ├── Table — wrapper with horizontal ScrollView on mobile
│   ├── TableHeader — sticky header row
│   ├── TableRow — data row, pressable for navigation
│   ├── TableCell — cell with alignment control
│   └── TableEmpty — empty state placeholder
├── Props (Table):
│   ├── columns: { key, label, width?, align?, sortable? }[]
│   ├── data: T[]
│   ├── renderRow: (item: T) => TableRow
│   ├── onSort?: (key: string, dir: 'asc' | 'desc') => void
│   ├── loading?: boolean
│   └── emptyMessage?: string
├── Mobile behavior:
│   ├── Horizontal scroll when columns exceed screen width
│   ├── First column (name) stays sticky on scroll (like Linear)
│   ├── Row height: 48px
│   └── Touch targets: full row pressable
└── Visual:
    ├── Header: bg-gray-50 text-gray-500 text-xs uppercase tracking-wide
    ├── Rows: bg-white, border-b border-gray-100
    ├── Hover (web): bg-gray-50
    └── No zebra striping
```

### 5.6 FilterBar Component Spec (Linear-style)

```
FilterBar
├── Components:
│   ├── FilterBar — horizontal scroll container
│   ├── FilterChip — individual filter button
│   ├── FilterDropdown — options popup when chip is pressed
│   └── ActiveFilters — shows active filter count + clear all
├── Props:
│   ├── filters: FilterConfig[]
│   │   ├── key: string
│   │   ├── label: string
│   │   ├── type: 'single' | 'multi' | 'date-range'
│   │   └── options: { value, label }[]
│   ├── activeFilters: Record<string, any>
│   ├── onFilterChange: (key, value) => void
│   └── onClearAll: () => void
├── Behavior:
│   ├── Chips scroll horizontally on mobile
│   ├── Active filters show filled chip style
│   ├── Pressing chip opens dropdown below it
│   ├── "Clear all" appears when any filter is active
│   └── Filter count badge on active chips
└── Visual:
    ├── Inactive chip: bg-white border border-gray-200 text-gray-600
    ├── Active chip: bg-black text-white
    └── Dropdown: bg-white border shadow-md rounded-lg
```

### 5.7 SwipeCard Component Spec (Attendance)

```
SwipeCard (Inspired by Slack "Catch Up")
├── Layout:
│   ├── Card fills ~85% of screen width, centered
│   ├── Rounded corners (16px)
│   ├── Subtle shadow
│   ├── Content:
│   │   ├── Top: Student photo (Avatar 64px) + Name + Student ID
│   │   ├── Middle: Age | Branch | Batch | Age Group (chips/labels)
│   │   ├── Bottom-left: Fee status badge (Paid ✓ / Due ⚠ / Overdue ✗)
│   │   └── Bottom-right: Quick action button ("Send reminder" if unpaid)
│   └── Below card: Action buttons (Mark Present | Skip | Mark Absent)
├── Gestures:
│   ├── Swipe RIGHT → Mark Present (green flash)
│   ├── Swipe LEFT → Mark Absent (red flash)
│   ├── Tap bottom buttons → same actions
│   ├── Undo toast appears for 4 seconds after any swipe
│   └── Cards stack: next card visible behind current (offset + scale)
├── Animation:
│   ├── Card rotates slightly during swipe (rotation = dx * 0.05)
│   ├── Background color tint: green (right) / red (left)
│   ├── Spring back if swipe doesn't cross threshold
│   ├── Card exits screen with velocity-matched animation
│   └── Next card scales up from 0.95 → 1.0
└── State:
    ├── Cards loaded from batch students list
    ├── Progress indicator: "12 / 45 students"
    ├── Can go back to previous card (undo)
    └── Summary screen at end of stack
```

### 5.8 Sheet (Bottom Sheet) Component Spec

```
Sheet
├── Props:
│   ├── isOpen: boolean
│   ├── onClose: () => void
│   ├── snapPoints?: number[] (e.g., [0.5, 0.9])
│   ├── title?: string
│   └── children: ReactNode
├── Behavior:
│   ├── Drag handle at top
│   ├── Snap to defined points
│   ├── Swipe down to close
│   ├── Backdrop overlay (semi-transparent)
│   └── Keyboard-aware (adjusts height)
└── Visual:
    ├── bg-white rounded-t-2xl
    ├── Handle: 36px wide, 4px tall, bg-gray-300, centered
    └── Backdrop: bg-black/40
```

---

## 6. Authentication & Security

### 6.1 Auth Flows

| User Type | Auth Method | Why |
|-----------|-------------|-----|
| Super Admin / Founder | Google OAuth | Staff must be verified. Google handles identity. |
| Co-Founder | Google OAuth via invite link | Same as above. |
| Branch Admin | Google OAuth via invite link | Same as above. |
| Coach | Google OAuth via invite link | Same as above. |
| Temporary Coach | Google OAuth via invite link | Same as above, with time-limited access. |
| Student | Username + Password | Students are minors in many cases. No email/phone auth. |
| Parent (onboarding only) | No auth — public link with secure token | Parent completes form, no account needed. |

### 6.2 Invite Link Security

```
Invite URL structure:
https://app.cricketcircleacademy.com/invite/{token}

Token properties:
- 32-character cryptographic random string (crypto.randomUUID or similar)
- Stored in `invites` table with: org_id, branch_id, role, created_by, expires_at, used_at
- Single-use for Branch Admin invites
- Multi-use (with limit) for Coach invites (e.g., max 5 uses)
- Expires after 72 hours by default (configurable)
- NEVER contains org_id, branch_id, or any guessable info
- QR code encodes the same URL

On acceptance:
1. Token is validated (exists, not expired, not fully used)
2. User authenticates via Google OAuth
3. Profile is created with correct org_id, branch_id, role
4. Token `used_count` increments; `used_at` set if single-use
5. Audit log entry created
```

### 6.3 Student Credentials

```
When a coach creates a student:
1. System generates:
   - Username: lowercase(first_name) + student_id (e.g., "rahul4521")
   - Temporary password: 8-char alphanumeric (e.g., "kP9x2mVn")
2. Credentials are shown to coach on the "Share" screen
3. Coach shares credentials + parent onboarding QR via WhatsApp
4. Student logs in with username + password
5. Password reset: Admin/Coach triggers reset → new password generated → shared via WhatsApp

Password is stored as bcrypt hash in Supabase Auth.
Students CANNOT reset their own password (no email/phone on file for verification).
```

### 6.4 Session Management

```
- Staff sessions: Supabase Auth session with refresh tokens. 30-day expiry.
- Student sessions: Same mechanism, but 7-day expiry.
- Temp Coach sessions: Auto-expire based on `access_expires_at` field.
- On every API call: middleware checks session validity + role + branch scope.
- Revoked staff: `is_active` flag on profile. If false, all API calls rejected.
```

---

## 7. Database Schema

### 7.1 Entity Relationship Overview

```
organizations
  ├── branches (many)
  │     ├── batches (many-to-many via branch_batches)
  │     ├── staff_profiles (many) [branch_id scoped]
  │     ├── students (many)
  │     │     ├── attendance_records (many)
  │     │     ├── payments (many)
  │     │     ├── coach_notes (many)
  │     │     └── student_documents (many)
  │     └── matches (many)
  ├── age_groups (many)
  ├── invites (many)
  ├── whatsapp_logs (many)
  └── audit_logs (many)
```

### 7.2 Core Tables

```sql
-- 001: Organizations
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  sport_type      TEXT NOT NULL DEFAULT 'cricket', -- cricket, football, hockey, tennis, etc.
  slug            TEXT UNIQUE NOT NULL, -- URL-safe identifier
  logo_url        TEXT,
  payment_model   TEXT NOT NULL DEFAULT 'pay_first', -- 'pay_first' | 'attend_first'
  settings        JSONB DEFAULT '{}', -- extensible settings
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 002: Branches
CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  city            TEXT,
  phone           TEXT, -- optional branch phone (WhatsApp contact)
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

-- 003: Staff Profiles (linked to Supabase Auth users)
CREATE TABLE staff_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id), -- NULL for super_admin (sees all branches)
  role            TEXT NOT NULL CHECK (role IN ('super_admin', 'branch_admin', 'coach', 'temp_coach')),
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT, -- for WhatsApp only
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  access_expires_at TIMESTAMPTZ, -- for temp_coach only
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(auth_user_id, org_id)
);

-- 004: Students
CREATE TABLE students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  student_id_code TEXT NOT NULL, -- 4-6 digit unique display ID (e.g., "4521")
  auth_user_id    UUID REFERENCES auth.users(id), -- linked after first login

  -- Basic info (filled by coach)
  first_name      TEXT NOT NULL,
  last_name       TEXT,
  date_of_birth   DATE,
  age             INTEGER, -- computed or manual
  blood_group     TEXT,

  -- Extended info (filled by parent)
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  school_name     TEXT,
  school_grade    TEXT,
  address         TEXT,
  city            TEXT,

  -- Parent/Guardian contacts
  parent_phone    TEXT, -- mandatory for WhatsApp
  parent_name     TEXT,
  guardian_phone   TEXT, -- optional additional contact
  guardian_name    TEXT,

  -- Academy details
  age_group_id    UUID REFERENCES age_groups(id),
  batch_id        UUID REFERENCES batches(id),
  uniform_size    TEXT, -- e.g., "S", "M", "L", "XL"
  uniform_gender  TEXT CHECK (uniform_gender IN ('boy', 'girl', 'unisex')),

  -- Health & notes
  health_notes    TEXT, -- safety/fitness info only
  special_needs   TEXT,

  -- Status
  profile_status  TEXT NOT NULL DEFAULT 'incomplete' CHECK (profile_status IN ('incomplete', 'complete')),
  enrollment_status TEXT NOT NULL DEFAULT 'active' CHECK (enrollment_status IN ('active', 'paused', 'archived')),
  fee_status      TEXT NOT NULL DEFAULT 'unpaid' CHECK (fee_status IN ('paid', 'unpaid', 'overdue', 'partial')),

  -- Credentials
  username        TEXT UNIQUE,
  -- password managed by Supabase Auth

  -- Onboarding
  parent_onboarding_token TEXT UNIQUE, -- secure token for parent completion link
  parent_onboarding_completed_at TIMESTAMPTZ,

  created_by      UUID REFERENCES staff_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, student_id_code)
);

-- 005: Batches
CREATE TABLE batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL, -- "Morning", "Evening", "1-on-1 Session", etc.
  start_time      TIME,
  end_time        TIME,
  days_of_week    TEXT[] DEFAULT '{}', -- e.g., ['mon','tue','wed','thu','fri']
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Branch-Batch junction (which batches available at which branches)
CREATE TABLE branch_batches (
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  batch_id        UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  PRIMARY KEY (branch_id, batch_id)
);

-- Age Groups
CREATE TABLE age_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL, -- "U14", "U16", "U19", "U23", "Senior"
  min_age         INTEGER,
  max_age         INTEGER,
  gender          TEXT CHECK (gender IN ('male', 'female', 'all')) DEFAULT 'all',
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

-- 006: Attendance
CREATE TABLE attendance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  branch_id       UUID NOT NULL REFERENCES branches(id),
  batch_id        UUID NOT NULL REFERENCES batches(id),
  student_id      UUID NOT NULL REFERENCES students(id),
  date            DATE NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by       UUID NOT NULL REFERENCES staff_profiles(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, batch_id, date) -- one record per student per batch per day
);

-- 007: Payments
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  branch_id       UUID NOT NULL REFERENCES branches(id),
  student_id      UUID NOT NULL REFERENCES students(id),
  amount          DECIMAL(10,2) NOT NULL,
  currency        TEXT DEFAULT 'INR',
  period_label    TEXT NOT NULL, -- "January 2026", "Q1 2026", etc.
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  payment_method  TEXT, -- 'upi', 'cash', 'bank_transfer', 'razorpay'
  razorpay_payment_id  TEXT,
  razorpay_payment_link_id TEXT,
  invoice_url     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'refunded', 'waived')),
  marked_by       UUID REFERENCES staff_profiles(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 008: Invites
CREATE TABLE invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  branch_id       UUID REFERENCES branches(id), -- NULL for org-level invites (co-founder)
  token           TEXT UNIQUE NOT NULL, -- 32-char cryptographic random
  role            TEXT NOT NULL CHECK (role IN ('super_admin', 'branch_admin', 'coach', 'temp_coach')),
  created_by      UUID NOT NULL REFERENCES staff_profiles(id),
  max_uses        INTEGER DEFAULT 1,
  used_count      INTEGER DEFAULT 0,
  expires_at      TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 009: Audit Logs
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  branch_id       UUID REFERENCES branches(id),
  actor_id        UUID, -- staff or system
  actor_role      TEXT,
  action          TEXT NOT NULL, -- 'student.create', 'attendance.mark', 'payment.update', etc.
  entity_type     TEXT NOT NULL, -- 'student', 'attendance', 'payment', 'staff', etc.
  entity_id       UUID,
  details         JSONB DEFAULT '{}', -- before/after values, metadata
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
-- Index for efficient querying
CREATE INDEX idx_audit_logs_org_created ON audit_logs(org_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- 010: WhatsApp Message Logs
CREATE TABLE whatsapp_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  branch_id       UUID REFERENCES branches(id),
  sent_by         UUID REFERENCES staff_profiles(id),
  recipient_phone TEXT NOT NULL,
  recipient_name  TEXT,
  template_name   TEXT, -- WhatsApp template ID
  message_type    TEXT NOT NULL, -- 'payment_reminder', 'absent_alert', 'announcement', 'invoice', 'credentials'
  message_body    TEXT,
  status          TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  error_message   TEXT,
  whatsapp_message_id TEXT, -- from Meta API response
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 011: Matches & News
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  branch_id       UUID NOT NULL REFERENCES branches(id),
  title           TEXT NOT NULL,
  description     TEXT,
  location        TEXT,
  match_date      TIMESTAMPTZ NOT NULL,
  match_type      TEXT, -- 'practice', 'tournament', 'friendly', etc.
  preparation_notes TEXT,
  created_by      UUID NOT NULL REFERENCES staff_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE match_participants (
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  notes           TEXT, -- individual instructions
  PRIMARY KEY (match_id, student_id)
);

CREATE TABLE news_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  branch_id       UUID REFERENCES branches(id), -- NULL = org-wide
  title           TEXT NOT NULL,
  body            TEXT,
  image_url       TEXT,
  created_by      UUID NOT NULL REFERENCES staff_profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE news_reactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_post_id    UUID NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reaction        TEXT NOT NULL, -- '👍', '🔥', '💪', '❤️' (limited set)
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(news_post_id, student_id) -- one reaction per student per post
);

-- 012: Coach Notes
CREATE TABLE coach_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id        UUID NOT NULL REFERENCES staff_profiles(id),
  note_type       TEXT NOT NULL CHECK (note_type IN ('diet', 'practice', 'improvement', 'general')),
  title           TEXT,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 013: Student Documents
CREATE TABLE student_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id),
  document_type   TEXT NOT NULL, -- 'birth_certificate', 'school_id', 'medical_certificate', 'photo', 'other'
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL, -- Supabase Storage URL
  file_size       INTEGER,
  uploaded_by     UUID, -- staff or parent (via onboarding)
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 7.3 Row Level Security (RLS) Policy Summary

```sql
-- Key RLS principles:
-- 1. Staff can only access data within their org_id
-- 2. Branch-scoped staff (branch_admin, coach, temp_coach) can only access their branch_id
-- 3. Super admins can access all branches within their org
-- 4. Students can only access their own records
-- 5. Coaches cannot delete students (soft-delete request only)

-- Example: students table RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Super admin: see all students in their org
CREATE POLICY "super_admin_all_students" ON students
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Branch staff: see only their branch's students
CREATE POLICY "branch_staff_own_students" ON students
  FOR SELECT TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM staff_profiles
      WHERE auth_user_id = auth.uid()
        AND role IN ('branch_admin', 'coach', 'temp_coach')
        AND is_active = true
        AND (access_expires_at IS NULL OR access_expires_at > now())
    )
  );

-- Students: see only themselves
CREATE POLICY "student_own_record" ON students
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- Similar patterns for all other tables...
```

---

## 8. RBAC — Role-Based Access Control

### 8.1 Permission Matrix

| Action | Super Admin | Branch Admin | Coach | Temp Coach | Student |
|--------|:-----------:|:------------:|:-----:|:----------:|:-------:|
| **Organization** |
| Edit org settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all branches | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create branch | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Branch** |
| Edit branch settings | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| View branch data | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ❌ |
| **Staff** |
| Invite branch admin | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite coach | ✅ | ✅ (own branch) | ❌ | ❌ | ❌ |
| Invite temp coach | ✅ | ✅ (own branch) | ❌ | ❌ | ❌ |
| Convert temp → coach | ✅ | ❌ | ❌ | ❌ | ❌ |
| Deactivate staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Students** |
| Create student | ✅ | ✅ | ✅ | ✅ (if allowed) | ❌ |
| Edit student | ✅ | ✅ | ✅ (limited) | ❌ | ❌ |
| Delete/archive student | ✅ | ✅ | ❌ (request only) | ❌ | ❌ |
| View student list | ✅ | ✅ (own branch) | ✅ (own branch) | ✅ (own branch) | ❌ |
| **Attendance** |
| Take attendance | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit past attendance | ✅ | ✅ | ❌ | ❌ | ❌ |
| View attendance history | ✅ | ✅ (own branch) | ✅ (own branch) | ✅ (own branch) | ✅ (own) |
| **Payments** |
| Mark payment received | ✅ | ✅ | ❌ | ❌ | ❌ |
| View fee status | ✅ | ✅ | ✅ (status only) | ❌ | ✅ (own) |
| View revenue dashboard | ✅ | ✅ (own branch) | ❌ | ❌ | ❌ |
| Generate payment link | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Communication** |
| Send WhatsApp broadcast | ✅ | ✅ (own branch) | ✅ (own batch) | ❌ | ❌ |
| View message logs | ✅ | ✅ (own branch) | ❌ | ❌ | ❌ |
| **Audit Logs** |
| View audit logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Matches & News** |
| Create match/news | ✅ | ✅ | ✅ | ❌ | ❌ |
| View matches | ✅ | ✅ (own branch) | ✅ (own branch) | ✅ (own branch) | ✅ (assigned) |

### 8.2 Permission Check Implementation

```typescript
// lib/permissions.ts

export type Role = 'super_admin' | 'branch_admin' | 'coach' | 'temp_coach' | 'student';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'request_delete';
export type Resource = 'student' | 'attendance' | 'payment' | 'staff' | 'branch' | 'org_settings' | 'audit_log' | 'whatsapp' | 'match' | 'news';

const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
  super_admin: {
    student:      ['create', 'read', 'update', 'delete'],
    attendance:   ['create', 'read', 'update', 'delete'],
    payment:      ['create', 'read', 'update', 'delete'],
    staff:        ['create', 'read', 'update', 'delete'],
    branch:       ['create', 'read', 'update', 'delete'],
    org_settings: ['read', 'update'],
    audit_log:    ['read'],
    whatsapp:     ['create', 'read'],
    match:        ['create', 'read', 'update', 'delete'],
    news:         ['create', 'read', 'update', 'delete'],
  },
  branch_admin: {
    student:      ['create', 'read', 'update', 'delete'],
    attendance:   ['create', 'read', 'update'],
    payment:      ['create', 'read', 'update'],
    staff:        ['create', 'read'], // can invite coach/temp for own branch
    branch:       ['read', 'update'], // own branch only
    org_settings: [],
    audit_log:    [],
    whatsapp:     ['create', 'read'],
    match:        ['create', 'read', 'update', 'delete'],
    news:         ['create', 'read', 'update', 'delete'],
  },
  coach: {
    student:      ['create', 'read', 'update', 'request_delete'],
    attendance:   ['create', 'read'],
    payment:      ['read'], // status only, not amounts (configurable)
    staff:        [],
    branch:       ['read'],
    org_settings: [],
    audit_log:    [],
    whatsapp:     ['create'], // own batch only
    match:        ['create', 'read', 'update'],
    news:         ['create', 'read'],
  },
  temp_coach: {
    student:      ['create', 'read'],
    attendance:   ['create', 'read'],
    payment:      [],
    staff:        [],
    branch:       ['read'],
    org_settings: [],
    audit_log:    [],
    whatsapp:     [],
    match:        ['read'],
    news:         ['read'],
  },
  student: {
    student:      ['read'], // own record only
    attendance:   ['read'], // own records only
    payment:      ['read'], // own records only
    staff:        [],
    branch:       [],
    org_settings: [],
    audit_log:    [],
    whatsapp:     [],
    match:        ['read'], // assigned matches only
    news:         ['read'],
  },
};

export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  return PERMISSIONS[role]?.[resource]?.includes(action) ?? false;
}

export function canAccessBranch(userBranchId: string | null, targetBranchId: string, role: Role): boolean {
  if (role === 'super_admin') return true;
  return userBranchId === targetBranchId;
}
```

---

## 9. Screen-by-Screen Specification

### 9.1 Auth Screens

#### 9.1.1 Login Screen — `/login`

```
┌──────────────────────────────────┐
│                                  │
│         CoachOS                  │  ← Logo + wordmark, centered
│                                  │
│   Manage your academy,           │  ← Tagline, text-secondary
│   effortlessly.                  │
│                                  │
│  ┌──────────────────────────┐    │
│  │  ○ Continue with Google  │    │  ← Primary button (staff login)
│  └──────────────────────────┘    │
│                                  │
│  ─────── or ────────             │  ← Divider with "or"
│                                  │
│  Username                        │  ← Input field
│  ┌──────────────────────────┐    │
│  │                          │    │
│  └──────────────────────────┘    │
│                                  │
│  Password                        │  ← Input field
│  ┌──────────────────────────┐    │
│  │                          │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │     Sign In              │    │  ← Secondary button (student login)
│  └──────────────────────────┘    │
│                                  │
│  Don't have an academy account?  │
│  Set up your academy →           │  ← Link to /signup
│                                  │
└──────────────────────────────────┘
```

**Behavior:**
- Google button → Supabase Google OAuth flow → on success, check if user has a staff_profile → if yes, route to dashboard. If no, show "No academy linked to this account" error.
- Username/password → Supabase email auth (username mapped to email internally) → check if student → route to student portal.
- "Set up your academy" → routes to org onboarding flow.

**Edge cases:**
- User clicks Google but has no staff_profile → Show: "No academy found for this account. If you were invited, use your invite link first."
- Invalid student credentials → Show inline error, no page navigation.
- Account deactivated → Show: "Your account has been deactivated. Contact your academy admin."
- Temp coach expired → Show: "Your access has expired. Contact your academy admin."

---

#### 9.1.2 Org Onboarding Flow — `/onboarding/*`

**Step 1: Sport Type — `/onboarding/org-details`**

```
┌──────────────────────────────────┐
│  ← Back                         │
│                                  │
│  Step 1 of 5                     │  ← Progress indicator
│  ━━━━━░░░░░░░░░░░░░░░           │
│                                  │
│  What sport does your            │
│  academy focus on?               │
│                                  │
│  ┌──────────┐  ┌──────────┐     │
│  │ Cricket  │  │ Football │     │  ← Selectable cards (single select)
│  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐     │
│  │  Hockey  │  │  Tennis  │     │
│  └──────────┘  └──────────┘     │
│  ┌──────────┐                    │
│  │  Other   │                    │
│  └──────────┘                    │
│                                  │
│  Academy Name                    │
│  ┌──────────────────────────┐    │
│  │  Cricket Circle Academy  │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │     Continue              │    │  ← Primary button (black)
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

**Step 2: Founders — `/onboarding/founders`**

```
Content:
- "Do you have co-founders?"
- Toggle: Yes / No
- If Yes: email input fields for each co-founder
  - "+ Add another co-founder" link
  - Each entry: email + "Remove" button
- Note: "Co-founders will receive an invite link with full admin access."
- Continue button
```

**Step 3: Branches — `/onboarding/branches`**

```
Content:
- "How many branches does your academy have?"
- List of branch cards (add/remove):
  Each card:
  - Branch name (input)
  - Address (input)
  - City (input)
  - Phone (optional input, labeled "Branch WhatsApp number (optional)")
- "+ Add another branch" button
- Minimum 1 branch required
- Continue button
```

**Step 4: Batches — `/onboarding/batches`**

```
Content:
- "Set up your training batches"
- List of batch cards:
  Each card:
  - Batch name (input) — e.g., "Morning Batch"
  - Start time (time picker)
  - End time (time picker)
  - Days of week (multi-select chips: Mon Tue Wed Thu Fri Sat Sun)
  - Apply to: (multi-select) All branches / specific branches
- "+ Add another batch" button
- Pre-populated suggestions: "Morning", "Evening" (editable)
- Continue button
```

**Step 5: Age Groups — `/onboarding/age-groups`**

```
Content:
- "Define your age groups"
- Pre-populated based on sport type:
  Cricket: U14, U16, U19, U23, Senior
  Football: U13, U15, U17, U19, Senior
  (editable + add custom)
- Each row: Name | Min Age | Max Age | Gender (All/Male/Female)
- "+ Add age group" button
- Continue button → Confetti screen
```

**Step 6: Complete — `/onboarding/complete`**

```
┌──────────────────────────────────┐
│                                  │
│         🎉                       │  ← Confetti animation
│                                  │
│  Welcome to CoachOS!             │
│                                  │
│  Cricket Circle Academy          │
│  is all set up.                  │
│                                  │
│  Next steps:                     │
│  • Invite your branch admins     │
│  • Invite your coaches           │
│  • Start adding students         │
│                                  │
│  ┌──────────────────────────┐    │
│  │   Go to Dashboard        │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

---

### 9.2 Staff Dashboard

#### 9.2.1 Tab Bar (Bottom — Mobile)

```
┌─────┬──────────┬──────────┬──────────┬─────────┐
│ Home│Attendance│ Students │ Payments │   More  │
│  ⌂  │    ✓     │    👤    │    ₹     │   ···   │
└─────┴──────────┴──────────┴──────────┴─────────┘
```

- 5 tabs maximum on mobile (Linear pattern)
- "More" opens a bottom sheet with: Communication, Settings, Audit Logs
- Icons: Lucide icons only (House, CheckSquare, Users, IndianRupee, MoreHorizontal)
- Active tab: black icon + black text. Inactive: gray.

#### 9.2.2 Web Layout (Sidebar — 768px+ width)

```
┌──────────────┬───────────────────────────────────────┐
│              │                                       │
│  CoachOS     │  [Header: Page title + actions]       │
│              │                                       │
│  ─────────── │  ┌───────────────────────────────────┐│
│  Home        │  │                                   ││
│  Attendance  │  │        Page Content                ││
│  Students    │  │                                   ││
│  Payments    │  │                                   ││
│  Messages    │  │                                   ││
│              │  │                                   ││
│  ─────────── │  └───────────────────────────────────┘│
│  Settings    │                                       │
│  Audit Logs  │                                       │
│              │                                       │
│  ─────────── │                                       │
│  Branch:     │                                       │
│  [Selector]  │  ← Super admin sees branch switcher   │
└──────────────┴───────────────────────────────────────┘
```

- Sidebar: 240px wide, bg-white, border-right
- Monochrome icons in sidebar (Lucide, 18px)
- Active item: bg-gray-100, text-black, font-medium
- Inactive item: text-gray-600
- Super admin: branch selector dropdown at bottom of sidebar
- Branch staff: branch name shown (not selectable)

---

#### 9.2.3 Dashboard Home — `/(staff)/(home)/index`

```
┌──────────────────────────────────┐
│  Good morning, Rahul              │  ← Greeting with user name
│  Cricket Circle Academy           │  ← Org name, text-secondary
│                                  │
│  ┌─────────────────────────────┐ │
│  │ Today's Overview            │ │
│  │                             │ │
│  │  Attendance    Fees Due     │ │
│  │  32/45 ✓       12 students  │ │
│  │  71%           ₹36,000     │ │
│  │                             │ │
│  │  Upcoming      Messages     │ │
│  │  2 matches     5 pending    │ │
│  └─────────────────────────────┘ │
│                                  │
│  Quick Actions                   │
│  ┌──────────┐ ┌──────────┐      │
│  │Take      │ │Add       │      │
│  │Attendance│ │Student   │      │
│  └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐      │
│  │Send      │ │Collect   │      │
│  │Reminder  │ │Payment   │      │
│  └──────────┘ └──────────┘      │
│                                  │
│  Recent Activity                 │
│  ─ Attendance taken for Morn... │
│  ─ Payment received: Arjun K.   │
│  ─ New student: Priya S.        │
│                                  │
└──────────────────────────────────┘
```

**Data sources:**
- Attendance: today's records for user's branch (or all branches for super admin)
- Fees due: count of students with fee_status = 'unpaid' or 'overdue'
- Upcoming: matches in next 7 days
- Messages: queued/pending WhatsApp messages
- Recent activity: last 10 audit log entries for the branch

**Role-based visibility:**
- Coach: sees attendance stats + quick actions (Take Attendance, Add Student). No revenue numbers.
- Branch Admin: sees all stats for their branch.
- Super Admin: sees aggregate across all branches, with branch filter.

---

#### 9.2.4 Attendance — Take Attendance — `/(staff)/(attendance)/take`

**Entry point:** User taps "Attendance" tab → sees batch selector → selects batch → enters swipe card mode.

**Batch Selector Screen:**

```
┌──────────────────────────────────┐
│  ← Attendance                    │
│                                  │
│  Select a batch                  │
│  February 28, 2026               │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ Morning Batch               │ │
│  │ 6:00 AM – 8:00 AM          │ │
│  │ 45 students · 0 marked     │ │  ← Shows progress
│  └─────────────────────────────┘ │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ Evening Batch               │ │
│  │ 4:00 PM – 6:00 PM          │ │
│  │ 32 students · 32 marked ✓  │ │  ← Completed indicator
│  └─────────────────────────────┘ │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ 1-on-1 Session             │ │
│  │ By appointment              │ │
│  │ 3 students · 1 marked      │ │
│  └─────────────────────────────┘ │
└──────────────────────────────────┘
```

**Swipe Card Mode (after batch selection):**

```
┌──────────────────────────────────┐
│  ← Morning Batch    12/45       │  ← Back + progress counter
│                                  │
│                                  │
│      ┌────────────────────┐      │
│      │                    │      │
│      │   [Avatar 64px]    │      │
│      │                    │      │
│      │   Rahul Kumar      │      │  ← Student name
│      │   ID: 4521         │      │  ← Student ID code
│      │                    │      │
│      │   U16 · Morning    │      │  ← Age group · Batch
│      │                    │      │
│      │  ┌──────────────┐  │      │
│      │  │ ⚠ Fee Due    │  │      │  ← Fee status badge
│      │  └──────────────┘  │      │
│      │                    │      │
│      │  [Send Reminder →] │      │  ← Quick action (if unpaid)
│      │                    │      │
│      └────────────────────┘      │
│                                  │
│    ┌────────┐  ┌──┐  ┌────────┐  │
│    │ Absent │  │⟲│  │Present │  │  ← Bottom action buttons
│    │   ✗    │  │  │  │   ✓    │  │     Center: Undo
│    └────────┘  └──┘  └────────┘  │
│                                  │
│  ┌──────────────────────────┐    │
│  │ Undo: Arjun marked pre… │    │  ← Undo toast (4s, dismissible)
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

**Swipe mechanics:**
- Swipe RIGHT (≥120px or velocity ≥500) → Mark PRESENT → green flash overlay → card exits right → next card animates in
- Swipe LEFT (≥120px or velocity ≥500) → Mark ABSENT → red flash overlay → card exits left → next card
- Partial swipe (< threshold) → spring back to center
- Card rotation during swipe: rotation = horizontalOffset × 0.05 degrees
- Background tint: green gradient (right) or red gradient (left) scales with swipe distance
- Next card visible behind: scale 0.95, translateY +8px → animates to 1.0 and 0px when current card exits

**After all cards swiped — Summary Screen:**

```
┌──────────────────────────────────┐
│  ← Morning Batch                 │
│                                  │
│  Attendance Complete ✓           │
│  February 28, 2026               │
│                                  │
│  Present    Absent    Total      │
│  38         7         45         │
│  ━━━━━━━━━━━━━░░░░░             │  ← Visual bar
│                                  │
│  Absent Students:                │
│  ┌─────────────────────────────┐ │
│  │ Arjun K.  │ ⚠ Fee Due │ 📱│ │  ← Tap 📱 = send absent alert
│  │ Priya S.  │ ✓ Paid    │ 📱│ │
│  │ ...       │           │   │ │
│  └─────────────────────────────┘ │
│                                  │
│  ┌──────────────────────────┐    │
│  │  Send Absent Alerts (7)  │    │  ← Bulk action: WhatsApp
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │  Done                    │    │  ← Returns to batch selector
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

**Edge cases for attendance:**
- Student added mid-session: appears at end of card stack.
- Duplicate swipe attempt: prevented by UNIQUE constraint (student_id, batch_id, date).
- Offline: actions queued in MMKV, synced when online (see Section 15).
- Coach tries to edit past attendance: blocked (only branch_admin/super_admin can).
- Attendance for a paused/archived student: student does not appear in card stack.
- "Send Reminder" on card: immediately queues WhatsApp message to parent_phone.
- Timer alert: 30 minutes before batch start_time, push notification: "Time to take attendance for Morning Batch."
- 30 minutes after batch start_time if attendance not started: second notification: "Morning Batch attendance hasn't been taken yet."

---

#### 9.2.5 Attendance History — `/(staff)/(attendance)/history`

**Linear-style table view with filters:**

```
┌──────────────────────────────────┐
│  Attendance History              │
│                                  │
│  [Filter chips - horizontal scroll]
│  ┌───────┐ ┌──────┐ ┌─────────┐ │
│  │ Date ▼│ │Batch▼│ │Status ▼ │ │
│  └───────┘ └──────┘ └─────────┘ │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ Date       │ Student  │ St │ │  ← Table header
│  │────────────│──────────│────│ │
│  │ Feb 28     │ Rahul K. │ ✓  │ │
│  │ Feb 28     │ Arjun S. │ ✗  │ │
│  │ Feb 27     │ Rahul K. │ ✓  │ │
│  │ Feb 27     │ Priya M. │ ✓  │ │
│  │ ...        │          │    │ │
│  └─────────────────────────────┘ │
│                                  │
│  Showing 1-50 of 1,200          │
│  [← Prev] [Next →]              │
└──────────────────────────────────┘
```

**Filters (Linear-style chips):**
- Date: date range picker (today, yesterday, this week, this month, custom)
- Batch: dropdown of branch batches
- Status: present / absent / late / excused
- Student: search by name

**Table columns:** Date | Student Name | Student ID | Batch | Status | Marked By | Time
- Tap row → opens student detail with attendance tab
- Horizontal scroll on mobile if columns overflow
- First column (Date or Student Name) sticky on mobile

---

#### 9.2.6 Students List — `/(staff)/(students)/index`

```
┌──────────────────────────────────┐
│  Students              [+ Add]   │  ← Header with add button
│                                  │
│  🔍 Search students...           │  ← Search input
│                                  │
│  [Filter chips]                  │
│  ┌──────┐ ┌────────┐ ┌────────┐ │
│  │Batch▼│ │Age Grp▼│ │Fee St.▼│ │
│  └──────┘ └────────┘ └────────┘ │
│  ┌───────────┐ ┌──────────────┐  │
│  │Profile St▼│ │Enrollment ▼ │  │
│  └───────────┘ └──────────────┘  │
│                                  │
│  ┌─────────────────────────────┐ │
│  │Name     │Batch │Fee  │Prof.│ │
│  │─────────│──────│─────│─────│ │
│  │Rahul K. │Morn. │ ✓   │100% │ │  ← Tap row → student detail
│  │Arjun S. │Morn. │ ⚠   │ 60% │ │
│  │Priya M. │Eve.  │ ✗   │100% │ │
│  │Kiran P. │Morn. │ ✓   │ 40% │ │  ← 40% = incomplete profile
│  │...      │      │     │     │ │
│  └─────────────────────────────┘ │
│                                  │
│  45 students                     │
└──────────────────────────────────┘
```

**Filters:**
- Batch: Morning / Evening / 1-on-1 / All
- Age Group: U14 / U16 / U19 / U23 / Senior / All
- Fee Status: Paid / Unpaid / Overdue / Partial / All
- Profile Status: Complete / Incomplete / All
- Enrollment: Active / Paused / Archived / All

**Table columns:** Name | Student ID | Batch | Age Group | Fee Status | Profile Completion
- Fee Status column: Badge component (green/amber/red)
- Profile Completion: percentage or "Complete ✓"
- Sort by any column header (tap to toggle asc/desc)
- Tap row → navigates to student detail

**Role visibility:**
- Coach: sees all columns except fee amounts
- Branch Admin: sees all columns
- Super Admin: sees all + branch column

---

#### 9.2.7 Add Student — `/(staff)/(students)/add`

```
┌──────────────────────────────────┐
│  ← Add Student                   │
│                                  │
│  Quick add — parents will        │
│  complete the rest.              │
│                                  │
│  First Name *                    │
│  ┌──────────────────────────┐    │
│  │                          │    │
│  └──────────────────────────┘    │
│                                  │
│  Last Name                       │
│  ┌──────────────────────────┐    │
│  │                          │    │
│  └──────────────────────────┘    │
│                                  │
│  Date of Birth *                 │
│  ┌──────────────────────────┐    │
│  │  DD / MM / YYYY          │    │  ← Date picker
│  └──────────────────────────┘    │
│                                  │
│  Blood Group                     │
│  ┌──────────────────────────┐    │
│  │  Select...           ▼   │    │  ← Dropdown: A+/A-/B+/B-/O+/O-/AB+/AB-
│  └──────────────────────────┘    │
│                                  │
│  Parent Phone (WhatsApp) *       │
│  ┌──────────────────────────┐    │
│  │  +91                     │    │  ← Country code prefix
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │     Create Student       │    │  ← Primary button
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

**On create:**
1. Validate: first_name required, DOB or age required, parent_phone recommended but form submits without.
2. Auto-generate: student_id_code (4-6 digit, unique within org), username, temporary password.
3. Auto-assign: age_group based on DOB (with admin override later).
4. Auto-assign: branch_id = coach's branch.
5. Generate parent_onboarding_token (32-char random).
6. Navigate to "Share" screen with QR code + link.
7. Audit log: `student.create` action.

**Share Screen — `/(staff)/(students)/onboarding-link`**

```
┌──────────────────────────────────┐
│  ← Student Created ✓            │
│                                  │
│  Rahul Kumar                     │
│  ID: 4521                        │
│                                  │
│  ─────────────────────────────── │
│                                  │
│  Student Login Credentials       │
│  Username: rahul4521             │
│  Password: kP9x2mVn             │
│                                  │
│  [Copy Credentials]              │  ← Copy to clipboard
│                                  │
│  ─────────────────────────────── │
│                                  │
│  Share with Parent               │
│  Scan QR or share the link for   │
│  the parent to complete the      │
│  student's profile.              │
│                                  │
│      ┌──────────────┐            │
│      │   [QR CODE]   │            │
│      │              │            │
│      └──────────────┘            │
│                                  │
│  ┌──────────────────────────┐    │
│  │   Share via WhatsApp     │    │  ← Opens WhatsApp with pre-filled message
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │   Copy Link              │    │  ← Secondary button
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │   Done                   │    │  ← Navigate to students list
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

**WhatsApp share message template:**
```
Welcome to Cricket Circle Academy! 🏏

Your child *{student_name}* has been registered.

Student ID: {student_id}
Username: {username}
Password: {password}

Please complete the profile here:
{onboarding_link}

— Cricket Circle Academy
```

---

#### 9.2.8 Student Detail — `/(staff)/(students)/[id]`

**Tabbed view (Linear-style tabs):**

```
┌──────────────────────────────────┐
│  ← Rahul Kumar          [···]   │  ← More menu (edit, archive, etc.)
│  ID: 4521 · U16 · Morning       │
│  ┌───────────────────────────┐   │
│  │ Profile │ Attend │ Pay │ Notes│  ← Horizontal tab bar
│  └───────────────────────────┘   │
│                                  │
│  [Tab content below]             │
│                                  │
└──────────────────────────────────┘
```

**Profile tab:** Full student info. Incomplete fields highlighted in amber. Edit button for admins.

**Attendance tab:** Calendar heatmap (green/red/gray for present/absent/no-session) + table of records.

**Payments tab:** List of payment records. Status badges. "Generate Payment Link" button (admin only).

**Notes tab:** Coach notes list (diet, practice, improvement). "Add Note" button for coaches.

**[···] More menu options:**
- Edit Student (admin/coach)
- Reset Password (admin/coach)
- Pause Enrollment (admin)
- Request Archive (coach) / Archive (admin)
- View Documents
- Send WhatsApp to Parent

---

#### 9.2.9 Payments Overview — `/(staff)/(payments)/index`

```
┌──────────────────────────────────┐
│  Payments                        │
│                                  │
│  February 2026                   │  ← Month selector
│                                  │
│  ┌──────────┬──────────┬───────┐ │
│  │ Collected│  Pending │Overdue│ │  ← Summary cards
│  │ ₹1,20,000│ ₹36,000 │₹8,000│ │
│  │ 33 paid  │ 8 due   │ 4    │ │
│  └──────────┴──────────┴───────┘ │
│                                  │
│  [Filter chips]                  │
│  ┌────────┐ ┌──────┐ ┌────────┐ │
│  │Status▼ │ │Batch▼│ │Search  │ │
│  └────────┘ └──────┘ └────────┘ │
│                                  │
│  ┌─────────────────────────────┐ │
│  │Student  │Amount│Status│Act.│ │
│  │─────────│──────│──────│────│ │
│  │Rahul K. │₹3000 │ Paid │    │ │
│  │Arjun S. │₹3000 │ Due  │ 📱│ │  ← Send reminder
│  │Priya M. │₹3000 │Ovdue │ 📱│ │
│  │Kiran P. │₹3000 │ Paid │    │ │
│  └─────────────────────────────┘ │
│                                  │
│  ┌──────────────────────────┐    │
│  │ Send All Reminders (12)  │    │  ← Bulk WhatsApp
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

**Coach view:** Sees student names + paid/unpaid status only. No amounts, no revenue summary.

**Filters:** Status (Paid/Pending/Overdue/Partial/All) | Batch | Search by name

---

#### 9.2.10 Communication Hub — `/(staff)/(communicate)/index`

```
┌──────────────────────────────────┐
│  Messages                        │
│                                  │
│  ┌──────────────────────────┐    │
│  │  Compose Broadcast       │    │  ← Primary action button
│  └──────────────────────────┘    │
│                                  │
│  Quick Actions                   │
│  ┌─────────────────────────────┐ │
│  │ 📱 Payment Reminders (12)  │ │  ← One-tap bulk actions
│  │ 📱 Absent Alerts (7)       │ │
│  │ 📱 Class Cancelled          │ │
│  │ 📱 Schedule Change          │ │
│  └─────────────────────────────┘ │
│                                  │
│  Recent Messages                 │
│  ┌─────────────────────────────┐ │
│  │ Feb 28 │ Payment reminder  │ │
│  │ 10:30  │ Sent to 12 parents│ │
│  │────────│───────────────────│ │
│  │ Feb 27 │ Absent alert      │ │
│  │ 18:45  │ Sent to 5 parents │ │
│  └─────────────────────────────┘ │
└──────────────────────────────────┘
```

**Broadcast Composer (opens as full screen):**
- Recipient selector: All parents | Specific batch | Specific students | Unpaid parents
- Template selector: Payment reminder | Absent alert | Custom message | Class cancelled
- Preview message before sending
- Confirm dialog: "Send to 12 parents via WhatsApp?"
- All sends logged in whatsapp_logs table

---

### 9.3 Student Portal

#### 9.3.1 Student Home — `/(student)/index`

```
┌──────────────────────────────────┐
│  Hi, Rahul 👋                    │
│  Cricket Circle Academy          │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ Fee Status                  │ │
│  │ ⚠ Due: ₹3,000              │ │
│  │ Due by: March 5, 2026       │ │
│  │ [Pay Now]                   │ │  ← Razorpay payment link
│  └─────────────────────────────┘ │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ This Week                   │ │
│  │ Mon ✓  Tue ✓  Wed ✗        │ │  ← Mini attendance view
│  │ Thu ·  Fri ·  Sat ·        │ │     · = upcoming
│  └─────────────────────────────┘ │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ Upcoming Match              │ │
│  │ Inter-Academy Tournament    │ │
│  │ March 2, 2026 · 9:00 AM    │ │
│  │ Shivaji Stadium             │ │
│  └─────────────────────────────┘ │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ Latest from Coach           │ │
│  │ Practice Plan updated       │ │
│  │ 2 hours ago                 │ │
│  └─────────────────────────────┘ │
│                                  │
│  [Attendance] [Payments] [Notes] │  ← Bottom tab bar
│  [Matches] [Profile]             │
└──────────────────────────────────┘
```

---

### 9.4 Parent Onboarding (Public Route)

**Route:** `/(parent-onboarding)/[token]`

No authentication required. Token validates access.

```
┌──────────────────────────────────┐
│                                  │
│  Cricket Circle Academy          │
│  Complete {student_name}'s       │
│  profile                         │
│                                  │
│  [Multi-step form]               │
│                                  │
│  Step 1: Parent Details          │
│  - Parent/Guardian name          │
│  - Relationship (Father/Mother/  │
│    Guardian)                     │
│  - Phone (pre-filled if exists)  │
│  - Additional guardian phone     │
│                                  │
│  Step 2: Student Details         │
│  - Address                       │
│  - City                          │
│  - School name                   │
│  - Grade/Class                   │
│  - Gender                        │
│                                  │
│  Step 3: Health & Uniform        │
│  - Health notes (optional)       │
│  - Special needs (optional)      │
│  - Uniform size (T-shirt size)   │
│  - Uniform gender (Boy/Girl)     │
│                                  │
│  Step 4: Documents (optional)    │
│  - Upload birth certificate      │
│  - Upload school ID              │
│  - Upload photo                  │
│                                  │
│  [Submit]                        │
│                                  │
│  → "Thank you! Profile complete."│
│  → Sets profile_status = complete│
│  → Sets parent_onboarding_       │
│    completed_at                  │
└──────────────────────────────────┘
```

**Edge cases:**
- Token expired or invalid → "This link has expired. Please contact your academy."
- Token already used (profile already complete) → Show profile summary with "Update Details" option.
- Form partially filled + browser closed → Form state persisted in localStorage, restored on return.
- Parent enters invalid phone → inline validation, prevent submit.

---

## 10. Core Workflows & Edge Cases

### 10.1 Student Lifecycle

```
Coach creates → profile_status: 'incomplete'
                enrollment_status: 'active'
                fee_status: 'unpaid'
         ↓
Parent completes onboarding → profile_status: 'complete'
         ↓
Normal operations (attendance, payments, notes)
         ↓
Pause enrollment → enrollment_status: 'paused'
  (student doesn't appear in attendance cards)
  (fee billing stops or is adjusted)
         ↓
Resume → enrollment_status: 'active'
         ↓
Archive → enrollment_status: 'archived'
  (soft delete — data retained, student hidden from active lists)
  (coach can request, admin approves)
```

### 10.2 Payment Lifecycle

```
Admin creates payment record for month
  → status: 'pending', due_date set
         ↓
Payment reminder sent via WhatsApp (before due date)
         ↓
Due date passes → status auto-updates to 'overdue'
  (cron job / Supabase Edge Function runs daily)
         ↓
Student/parent pays via Razorpay link
  → Razorpay webhook → status: 'paid', paid_at set
  → Invoice generated (PDF via Edge Function)
  → Invoice sent to parent via WhatsApp
         ↓
OR: Admin manually marks as 'paid' (cash payment)
  → marked_by = admin ID, payment_method = 'cash'
         ↓
OR: Partial payment received
  → status: 'partial', amount recorded
```

### 10.3 Attendance Edge Cases

| Scenario | Behavior |
|----------|----------|
| Coach takes attendance but connectivity drops mid-session | Actions queued locally in MMKV. Synced when online. Conflict resolution: server timestamp wins if duplicate. |
| Student enrolled mid-month | Appears in card stack from enrollment date. Previous dates: no record (not absent). |
| Student paused | Does not appear in attendance cards. No records created. |
| Duplicate attendance for same student+batch+date | DB UNIQUE constraint prevents. UI shows "Already marked" if attempted. |
| Coach tries to edit yesterday's attendance | Blocked. Toast: "Only admins can edit past attendance." |
| Admin edits past attendance | Allowed. Audit log records old_value and new_value. |
| Batch has 0 students | Empty state: "No students in this batch. Add students to get started." |

### 10.4 Invite Link Edge Cases

| Scenario | Behavior |
|----------|----------|
| Link opened after expiry | Error page: "This invite has expired. Ask your admin for a new link." |
| Link opened but user cancels Google auth | Returns to invite page. Link not consumed. |
| Single-use link opened twice | Second attempt: "This invite has already been used." |
| User accepts invite but is already in another org | Creates second staff_profile for new org. User sees org switcher. |
| Non-Google-auth user tries staff invite | Only Google auth shown. No username/password option for staff. |

---

## 11. API Contracts

### 11.1 API Pattern

All data access goes through Supabase client SDK (no custom REST API needed for v1).

```typescript
// Pattern: services/students.ts
import { supabase } from '@/lib/supabase';

export async function getStudents(branchId: string, filters?: StudentFilters) {
  let query = supabase
    .from('students')
    .select('*, age_groups(*), batches(*)')
    .eq('branch_id', branchId)
    .eq('enrollment_status', 'active')
    .order('first_name');

  if (filters?.batchId) query = query.eq('batch_id', filters.batchId);
  if (filters?.feeStatus) query = query.eq('fee_status', filters.feeStatus);
  if (filters?.search) query = query.ilike('first_name', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
```

RLS policies enforce branch isolation at the database level, so the service layer doesn't need explicit branch checks — the DB returns only what the user is allowed to see.

### 11.2 Edge Functions (Server-side only)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `send-whatsapp` | HTTP POST from app | Queue and send WhatsApp message via Meta API |
| `generate-invoice` | After payment confirmed | Generate PDF invoice, upload to Storage, return URL |
| `payment-webhook` | Razorpay webhook POST | Update payment status, trigger invoice generation |
| `send-reminders` | Cron (daily at 8 AM) | Check overdue payments, send reminders |
| `cleanup-logs` | Cron (weekly) | Delete audit logs older than retention period |
| `expire-temp-coaches` | Cron (hourly) | Deactivate temp coaches past access_expires_at |
| `update-overdue-payments` | Cron (daily at midnight) | Set status = 'overdue' where due_date < today and status = 'pending' |

---

## 12. Background Jobs & Notifications

### 12.1 Push Notifications

| Event | Recipient | Timing | Message |
|-------|-----------|--------|---------|
| Attendance reminder | Coach | 30 min before batch start | "Time to take attendance for {batch_name}" |
| Attendance not taken | Coach | 30 min after batch start | "{batch_name} attendance hasn't been taken yet" |
| Payment due soon | Parent (WhatsApp) | 3 days before due date | "Fee of ₹{amount} due on {date} for {student_name}" |
| Payment due today | Parent (WhatsApp) | On due date (8 AM) | "Fee of ₹{amount} is due today for {student_name}" |
| Payment overdue | Parent (WhatsApp) | 1 day after due date | "Fee of ₹{amount} is overdue for {student_name}" |
| Student absent | Parent (WhatsApp) | After attendance taken | "{student_name} was marked absent today" |
| Match upcoming | Student + Parent | 1 day before match | "Reminder: {match_title} tomorrow at {time}" |
| Match updated | Assigned students | Immediately | "Match update: {match_title} — {change}" |
| Invite accepted | Inviter (admin) | On acceptance | "{name} has joined as {role}" |
| Profile completed | Creator (coach) | On parent submission | "{student_name}'s profile has been completed by parent" |

### 12.2 Cron Schedule (Supabase Edge Functions)

```
0 0 * * *    → update-overdue-payments (midnight IST)
0 8 * * *    → send-reminders (8 AM IST)
0 * * * *    → expire-temp-coaches (every hour)
0 3 * * 0    → cleanup-logs (Sunday 3 AM IST)
```

---

## 13. WhatsApp Integration

### 13.1 Architecture

```
App → Supabase Edge Function (send-whatsapp)
   → Meta WhatsApp Business Cloud API
   → WhatsApp message delivered to parent
   → Webhook callback → update whatsapp_logs status
```

### 13.2 Setup Requirements (No Company Registration Needed)

1. Create Meta Business account (free, personal ID sufficient for testing)
2. Add WhatsApp Business API (free tier: 1,000 conversations/month)
3. Register a phone number for the business
4. Create message templates (must be approved by Meta)
5. Get API token → store in Supabase secrets

### 13.3 Message Templates (Pre-approved)

| Template Name | Parameters | Use Case |
|---------------|------------|----------|
| `payment_reminder` | {student_name}, {amount}, {due_date}, {payment_link} | Fee reminders |
| `payment_received` | {student_name}, {amount}, {invoice_link} | Payment confirmation + invoice |
| `absent_alert` | {student_name}, {date}, {batch_name} | Absence notification |
| `class_cancelled` | {date}, {batch_name}, {reason} | Schedule changes |
| `welcome_student` | {student_name}, {student_id}, {username}, {password}, {onboarding_link} | New student credentials + profile link |
| `match_reminder` | {student_name}, {match_title}, {date}, {location} | Match reminders |
| `custom_announcement` | {academy_name}, {message} | General announcements |

### 13.4 Rate Limiting & Safety

- Maximum 5 messages per parent per day (app-enforced)
- All messages logged in whatsapp_logs with sender, recipient, template, status
- Failed sends retried 3 times with exponential backoff
- Admin can view full message log filtered by branch

---

## 14. Payments Integration

### 14.1 Razorpay Setup (Test Mode — No Company Registration)

1. Sign up at razorpay.com with personal email
2. Access test mode immediately (no KYC needed)
3. Test API keys available instantly
4. Test UPI payments work with Razorpay's test credentials
5. When ready for live: complete KYC (PAN card sufficient for individual)

### 14.2 Payment Flow

```
Admin creates payment record (amount, student, period, due date)
  → App generates Razorpay Payment Link via API
  → Payment link URL stored in payments table
  → Link sent to parent via WhatsApp

Parent clicks link → Razorpay payment page (UPI/Card/NetBanking)
  → Pays via UPI
  → Razorpay webhook → Edge Function (payment-webhook)
  → Update payment status to 'paid'
  → Generate invoice PDF
  → Send invoice via WhatsApp to parent
```

### 14.3 Manual Payment (Cash)

```
Admin opens student payment → "Mark as Paid"
  → Select method: Cash
  → Enter amount received
  → Confirm
  → status: 'paid', payment_method: 'cash', marked_by: admin
  → Invoice generated
  → Optional: send receipt via WhatsApp
```

---

## 15. Offline & Field-Use Patterns

### 15.1 Offline Queue (MMKV-based)

Coaches often take attendance on outdoor fields with poor connectivity.

```typescript
// stores/offline-store.ts
interface OfflineAction {
  id: string;
  type: 'attendance.mark' | 'student.create' | 'note.create';
  payload: Record<string, any>;
  createdAt: string;
  synced: boolean;
  retries: number;
}

// On action (e.g., swipe attendance):
// 1. Write to local MMKV immediately (instant UI feedback)
// 2. Attempt Supabase write
// 3. If offline: queue action in offline store
// 4. On reconnect: sync queue in order, mark as synced
// 5. Conflict resolution: server timestamp wins for duplicates
```

### 15.2 Optimistic UI

- Attendance swipe → card animates immediately → API call in background
- If API fails → action queued → card stays swiped (no jarring rollback)
- Sync status indicator in header: 🟢 Online | 🟡 Syncing | 🔴 Offline (X pending)

---

## 16. Deployment & Infrastructure

### 16.1 Mobile Apps

```
iOS: Expo EAS Build → TestFlight → App Store
Android: Expo EAS Build → Internal Testing → Play Store
Cost: EAS Build free tier = 30 builds/month (sufficient for dev)
```

### 16.2 Web App

```
Deploy to: Vercel (free tier)
Domain: app.cricketcircleacademy.com (CNAME to Vercel)
Framework: Expo Web output (static/SSR via Expo Router)
```

### 16.3 Backend

```
Supabase hosted (free tier):
- Database: 500MB PostgreSQL
- Auth: 50K MAU
- Storage: 1GB
- Edge Functions: 500K invocations/month
- Realtime: 200 concurrent connections
```

### 16.4 Environment Variables

```env
# .env.example
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx  # server-side only
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx        # server-side only
WHATSAPP_PHONE_NUMBER_ID=xxxxx
WHATSAPP_ACCESS_TOKEN=xxxxx      # server-side only
META_WEBHOOK_VERIFY_TOKEN=xxxxx
```

---

## 17. Testing Strategy

### 17.1 Unit Tests

- All Zod validators
- Permission checks (hasPermission, canAccessBranch)
- Utility functions (date formatting, ID generation)
- Zustand store actions

### 17.2 Integration Tests

- Auth flows (Google login, student login, invite acceptance)
- CRUD operations with RLS (verify branch isolation)
- Payment webhook processing
- Offline queue sync

### 17.3 E2E Tests (Future)

- Full onboarding flow (org → branches → batches → invite → student)
- Attendance swipe flow (select batch → swipe all → summary → WhatsApp)
- Payment flow (create → send link → webhook → invoice)

---

## Appendix A: File Naming Conventions

```
Components:  PascalCase.tsx        (e.g., SwipeCard.tsx)
Hooks:       camelCase.ts          (e.g., useAttendance.ts)
Services:    kebab-case or camelCase.ts  (e.g., students.ts)
Stores:      kebab-case.ts         (e.g., auth-store.ts)
Types:       camelCase.ts          (e.g., types.ts)
Utils:       camelCase.ts          (e.g., utils.ts)
Routes:      kebab-case.tsx        (e.g., age-groups.tsx)
SQL:         NNN_description.sql   (e.g., 001_create_orgs.sql)
```

## Appendix B: Git Branch Strategy

```
main           → production (auto-deploy to Vercel)
develop        → integration branch
feature/xxx    → feature branches (e.g., feature/attendance-swipe)
fix/xxx        → bug fixes
```

## Appendix C: Immediate Next Steps (Build Order)

1. **Scaffold Expo project** with TypeScript, NativeWind, Expo Router
2. **Set up Supabase** project, run migrations, enable RLS
3. **Build design system** (components/ui/ — all primitives)
4. **Auth flow** (Google login + student login + session management)
5. **Org onboarding** flow (5-step wizard)
6. **Staff invite** flow (generate links, accept, assign role)
7. **Student list** + add student + parent onboarding link
8. **Attendance** (batch selector → swipe cards → summary)
9. **Payments** (status tracking → Razorpay integration)
10. **WhatsApp** integration (templates → sending → logging)
11. **Student portal** (attendance, payments, notes, matches)
12. **Audit logs** + settings pages
13. **Testing** + polish + deploy

---

*This is the master PRD. Every screen, component, database table, permission rule, and edge case is specified above. Feed this to Cursor and build file by file.*
