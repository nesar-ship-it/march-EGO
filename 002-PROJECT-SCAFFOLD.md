# CoachOS — File 002: Project Scaffold & Configuration

> **Purpose:** Set up the Expo project from scratch with all config files. Run these commands and create these files in order.
> **Depends on:** 001-PRD-MASTER.md (read it first for full context)

---

## Step 1: Create Expo Project

```bash
# Create the project with Expo Router template
npx create-expo-app@latest coachOS --template tabs

# Navigate into project
cd coachOS

# Remove default boilerplate files (we'll replace everything)
rm -rf app/ components/ constants/ hooks/ scripts/
mkdir -p app/(auth) app/(auth)/onboarding app/(staff) app/(staff)/(home) app/(staff)/(attendance) app/(staff)/(students) app/(staff)/(payments) app/(staff)/(communicate) app/(staff)/(settings) app/(student) app/(parent-onboarding) app/invite
mkdir -p components/ui components/attendance components/students components/payments components/communication components/navigation components/shared
mkdir -p lib hooks stores services assets/fonts assets/images supabase/migrations supabase/functions
```

---

## Step 2: Install Dependencies

```bash
# Core Expo packages
npx expo install expo-router expo-linking expo-web-browser expo-secure-store expo-image-picker expo-document-picker expo-notifications expo-clipboard expo-haptics expo-splash-screen expo-font expo-constants expo-status-bar react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens react-native-svg react-native-web react-dom

# Supabase
npm install @supabase/supabase-js

# State management
npm install zustand @tanstack/react-query

# Styling
npm install nativewind tailwindcss

# Forms & validation
npm install react-hook-form zod @hookform/resolvers

# UI utilities
npm install lucide-react-native clsx tailwind-merge

# Date handling
npm install date-fns

# QR code generation
npm install react-native-qrcode-skia @shopify/react-native-skia

# Charts (install later when needed)
# npm install victory-native

# Local storage (fast key-value)
npm install react-native-mmkv

# Dev dependencies
npm install -D typescript @types/react @types/react-native eslint prettier jest @testing-library/react-native jest-expo
```

---

## Step 3: Configuration Files

### 3.1 `app.json`

```json
{
  "expo": {
    "name": "CoachOS",
    "slug": "coachOS",
    "version": "0.1.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "coachOS",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFFFFF"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.coachOS.app",
      "infoPlist": {
        "NSCameraUsageDescription": "CoachOS needs camera access to take student photos and scan QR codes.",
        "NSPhotoLibraryUsageDescription": "CoachOS needs photo library access to upload student documents and photos."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.coachOS.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "NOTIFICATIONS"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      "expo-image-picker",
      "expo-document-picker",
      "expo-notifications",
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#FFFFFF",
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

### 3.2 `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"],
      "@/hooks/*": ["hooks/*"],
      "@/stores/*": ["stores/*"],
      "@/services/*": ["services/*"],
      "@/assets/*": ["assets/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ]
}
```

### 3.3 `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Background
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#FAFAFA',
        'bg-tertiary': '#F5F5F5',
        'bg-inverse': '#0A0A0A',

        // Text
        'text-primary': '#0A0A0A',
        'text-secondary': '#666666',
        'text-tertiary': '#999999',

        // Borders
        'border-default': '#E5E5E5',
        'border-hover': '#CCCCCC',
        'border-focus': '#0A0A0A',
        'border-subtle': '#F0F0F0',

        // Semantic
        'status-success': '#22C55E',
        'status-warning': '#F59E0B',
        'status-error': '#EF4444',
        'status-info': '#3B82F6',

        // Interactive
        'interactive-primary': '#0A0A0A',
        'interactive-primary-hover': '#1A1A1A',
        'interactive-danger': '#EF4444',
        'interactive-danger-hover': '#DC2626',
        'interactive-disabled': '#E5E5E5',
        'interactive-disabled-text': '#999999',
      },
      fontFamily: {
        'inter-regular': ['Inter-Regular'],
        'inter-medium': ['Inter-Medium'],
        'inter-semibold': ['Inter-SemiBold'],
        'inter-bold': ['Inter-Bold'],
        'mono': ['monospace'],
      },
      fontSize: {
        'display-lg': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'display-sm': ['30px', { lineHeight: '36px', fontWeight: '700' }],
        'h1': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'h2': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'h3': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-md': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'caption': ['11px', { lineHeight: '16px', fontWeight: '400' }],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 2px 4px rgba(0, 0, 0, 0.06)',
        'lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
      },
    },
  },
  plugins: [],
};
```

### 3.4 `babel.config.js`

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      'react-native-reanimated/plugin', // MUST be last
    ],
  };
};
```

### 3.5 `metro.config.js`

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

### 3.6 `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3.7 `nativewind-env.d.ts`

```typescript
/// <reference types="nativewind/types" />
```

### 3.8 `.env.example`

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Razorpay (test mode)
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# App
EXPO_PUBLIC_APP_URL=https://app.cricketcircleacademy.com
EXPO_PUBLIC_APP_NAME=CoachOS
```

### 3.9 `.env` (create locally, never commit)

```env
# Copy from .env.example and fill in real values
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_RAZORPAY_KEY_ID=
EXPO_PUBLIC_APP_URL=https://app.cricketcircleacademy.com
EXPO_PUBLIC_APP_NAME=CoachOS
```

### 3.10 `.gitignore` (append these lines)

```gitignore
# Environment
.env
.env.local
.env.*.local

# Supabase
supabase/.temp/

# Expo
.expo/
dist/
web-build/

# Native builds
ios/
android/

# Dependencies
node_modules/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
```

### 3.11 `eslint.config.mjs`

```javascript
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const compat = new FlatCompat();

export default [
  js.configs.recommended,
  ...compat.extends('expo'),
  {
    rules: {
      // Enforce consistent imports
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // React Native specific
      'react-native/no-inline-styles': 'warn',

      // Code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
    ignores: ['node_modules/', '.expo/', 'dist/', 'web-build/'],
  },
];
```

### 3.12 `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## Step 4: Core Library Files

### 4.1 `lib/supabase.ts`

```typescript
import 'react-native-url-polyfill/dist/setup';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore adapter for native, localStorage for web
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 4.2 `lib/cn.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind classes with proper conflict resolution.
 * Usage: cn('px-4 py-2', isActive && 'bg-black text-white', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 4.3 `lib/constants.ts`

```typescript
// ─── App Constants ───────────────────────────────────────────────

export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'CoachOS';
export const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://app.cricketcircleacademy.com';

// ─── Roles ───────────────────────────────────────────────────────

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRANCH_ADMIN: 'branch_admin',
  COACH: 'coach',
  TEMP_COACH: 'temp_coach',
  STUDENT: 'student',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ─── Enrollment Status ──────────────────────────────────────────

export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
} as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];

// ─── Fee Status ─────────────────────────────────────────────────

export const FEE_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  OVERDUE: 'overdue',
  PARTIAL: 'partial',
} as const;

export type FeeStatus = (typeof FEE_STATUS)[keyof typeof FEE_STATUS];

// ─── Attendance Status ──────────────────────────────────────────

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

// ─── Payment Status ─────────────────────────────────────────────

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded',
  WAIVED: 'waived',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// ─── Profile Status ─────────────────────────────────────────────

export const PROFILE_STATUS = {
  INCOMPLETE: 'incomplete',
  COMPLETE: 'complete',
} as const;

export type ProfileStatus = (typeof PROFILE_STATUS)[keyof typeof PROFILE_STATUS];

// ─── Sport Types ────────────────────────────────────────────────

export const SPORT_TYPES = [
  { value: 'cricket', label: 'Cricket' },
  { value: 'football', label: 'Football' },
  { value: 'hockey', label: 'Hockey' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'badminton', label: 'Badminton' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'athletics', label: 'Athletics' },
  { value: 'other', label: 'Other' },
] as const;

// ─── Blood Groups ───────────────────────────────────────────────

export const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-',
] as const;

// ─── Days of Week ───────────────────────────────────────────────

export const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
] as const;

// ─── Default Age Groups by Sport ────────────────────────────────

export const DEFAULT_AGE_GROUPS: Record<string, { name: string; minAge: number; maxAge: number }[]> = {
  cricket: [
    { name: 'U14', minAge: 0, maxAge: 13 },
    { name: 'U16', minAge: 14, maxAge: 15 },
    { name: 'U19', minAge: 16, maxAge: 18 },
    { name: 'U23', minAge: 19, maxAge: 22 },
    { name: 'Senior', minAge: 23, maxAge: 99 },
  ],
  football: [
    { name: 'U13', minAge: 0, maxAge: 12 },
    { name: 'U15', minAge: 13, maxAge: 14 },
    { name: 'U17', minAge: 15, maxAge: 16 },
    { name: 'U19', minAge: 17, maxAge: 18 },
    { name: 'Senior', minAge: 19, maxAge: 99 },
  ],
  hockey: [
    { name: 'U14', minAge: 0, maxAge: 13 },
    { name: 'U18', minAge: 14, maxAge: 17 },
    { name: 'U21', minAge: 18, maxAge: 20 },
    { name: 'Senior', minAge: 21, maxAge: 99 },
  ],
};

// ─── Invite Defaults ────────────────────────────────────────────

export const INVITE_DEFAULTS = {
  EXPIRY_HOURS: 72,
  MAX_USES: {
    super_admin: 1,
    branch_admin: 1,
    coach: 5,
    temp_coach: 1,
  },
} as const;

// ─── WhatsApp Message Types ─────────────────────────────────────

export const WHATSAPP_MESSAGE_TYPES = {
  PAYMENT_REMINDER: 'payment_reminder',
  PAYMENT_RECEIVED: 'payment_received',
  ABSENT_ALERT: 'absent_alert',
  CLASS_CANCELLED: 'class_cancelled',
  WELCOME_STUDENT: 'welcome_student',
  MATCH_REMINDER: 'match_reminder',
  CUSTOM_ANNOUNCEMENT: 'custom_announcement',
  CREDENTIALS: 'credentials',
} as const;

// ─── Notification Timing ────────────────────────────────────────

export const NOTIFICATION_TIMING = {
  ATTENDANCE_REMINDER_BEFORE_MINUTES: 30,
  ATTENDANCE_REMINDER_AFTER_MINUTES: 30,
  PAYMENT_REMINDER_BEFORE_DAYS: 3,
  MATCH_REMINDER_BEFORE_DAYS: 1,
} as const;

// ─── Pagination ─────────────────────────────────────────────────

export const PAGE_SIZE = 50;

// ─── Student ID Generation ──────────────────────────────────────

export const STUDENT_ID_LENGTH = 4; // 4-digit codes (1000-9999)
export const STUDENT_ID_MIN = 1000;
export const STUDENT_ID_MAX = 9999;

// ─── Uniform Sizes ──────────────────────────────────────────────

export const UNIFORM_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

// ─── Coach Note Types ───────────────────────────────────────────

export const NOTE_TYPES = [
  { value: 'diet', label: 'Diet Plan' },
  { value: 'practice', label: 'Practice Plan' },
  { value: 'improvement', label: 'Improvement Notes' },
  { value: 'general', label: 'General Notes' },
] as const;

// ─── News Reactions (limited set) ───────────────────────────────

export const ALLOWED_REACTIONS = ['👍', '🔥', '💪', '❤️'] as const;

// ─── Animation Constants ────────────────────────────────────────

export const ANIMATION = {
  SWIPE_THRESHOLD: 120,
  SWIPE_VELOCITY_THRESHOLD: 500,
  CARD_ROTATION_FACTOR: 0.05,
  SPRING_DAMPING: 20,
  SPRING_STIFFNESS: 200,
  SPRING_MASS: 0.5,
  TIMING_FAST: 150,
  TIMING_NORMAL: 250,
  TIMING_SLOW: 400,
  UNDO_TOAST_DURATION: 4000,
} as const;

// ─── Audit Log Retention ────────────────────────────────────────

export const AUDIT_LOG_RETENTION_DAYS = 365; // 1 year default
```

### 4.4 `lib/types.ts`

```typescript
// ─── Database Row Types ─────────────────────────────────────────
// These mirror the Supabase schema exactly. Supabase CLI can auto-generate
// these, but we define them manually for clarity and control.

export interface Organization {
  id: string;
  name: string;
  sport_type: string;
  slug: string;
  logo_url: string | null;
  payment_model: 'pay_first' | 'attend_first';
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffProfile {
  id: string;
  auth_user_id: string;
  org_id: string;
  branch_id: string | null;
  role: 'super_admin' | 'branch_admin' | 'coach' | 'temp_coach';
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  access_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  org_id: string;
  branch_id: string;
  student_id_code: string;
  auth_user_id: string | null;

  first_name: string;
  last_name: string | null;
  date_of_birth: string | null;
  age: number | null;
  blood_group: string | null;

  gender: 'male' | 'female' | 'other' | null;
  school_name: string | null;
  school_grade: string | null;
  address: string | null;
  city: string | null;

  parent_phone: string | null;
  parent_name: string | null;
  guardian_phone: string | null;
  guardian_name: string | null;

  age_group_id: string | null;
  batch_id: string | null;
  uniform_size: string | null;
  uniform_gender: 'boy' | 'girl' | 'unisex' | null;

  health_notes: string | null;
  special_needs: string | null;

  profile_status: 'incomplete' | 'complete';
  enrollment_status: 'active' | 'paused' | 'archived';
  fee_status: 'paid' | 'unpaid' | 'overdue' | 'partial';

  username: string | null;
  parent_onboarding_token: string | null;
  parent_onboarding_completed_at: string | null;

  created_by: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations (optional, populated via select)
  age_group?: AgeGroup | null;
  batch?: Batch | null;
}

export interface Batch {
  id: string;
  org_id: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
  days_of_week: string[];
  is_active: boolean;
  created_at: string;
}

export interface AgeGroup {
  id: string;
  org_id: string;
  name: string;
  min_age: number | null;
  max_age: number | null;
  gender: 'male' | 'female' | 'all';
  sort_order: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  org_id: string;
  branch_id: string;
  batch_id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined
  student?: Student;
  marked_by_staff?: StaffProfile;
}

export interface Payment {
  id: string;
  org_id: string;
  branch_id: string;
  student_id: string;
  amount: number;
  currency: string;
  period_label: string;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  razorpay_payment_id: string | null;
  razorpay_payment_link_id: string | null;
  invoice_url: string | null;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded' | 'waived';
  marked_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined
  student?: Student;
}

export interface Invite {
  id: string;
  org_id: string;
  branch_id: string | null;
  token: string;
  role: 'super_admin' | 'branch_admin' | 'coach' | 'temp_coach';
  created_by: string;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  org_id: string;
  branch_id: string | null;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface WhatsAppLog {
  id: string;
  org_id: string;
  branch_id: string | null;
  sent_by: string | null;
  recipient_phone: string;
  recipient_name: string | null;
  template_name: string | null;
  message_type: string;
  message_body: string | null;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  error_message: string | null;
  whatsapp_message_id: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  org_id: string;
  branch_id: string;
  title: string;
  description: string | null;
  location: string | null;
  match_date: string;
  match_type: string | null;
  preparation_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;

  // Joined
  participants?: Student[];
}

export interface NewsPost {
  id: string;
  org_id: string;
  branch_id: string | null;
  title: string;
  body: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
}

export interface CoachNote {
  id: string;
  org_id: string;
  student_id: string;
  coach_id: string;
  note_type: 'diet' | 'practice' | 'improvement' | 'general';
  title: string | null;
  body: string;
  created_at: string;
  updated_at: string;

  // Joined
  coach?: StaffProfile;
}

export interface StudentDocument {
  id: string;
  student_id: string;
  org_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

// ─── Filter Types ───────────────────────────────────────────────

export interface StudentFilters {
  search?: string;
  batchId?: string;
  ageGroupId?: string;
  feeStatus?: string;
  profileStatus?: string;
  enrollmentStatus?: string;
}

export interface AttendanceFilters {
  dateFrom?: string;
  dateTo?: string;
  batchId?: string;
  status?: string;
  studentId?: string;
}

export interface PaymentFilters {
  status?: string;
  batchId?: string;
  search?: string;
  month?: string; // "2026-02"
}

// ─── Form Types ─────────────────────────────────────────────────

export interface CreateStudentForm {
  first_name: string;
  last_name?: string;
  date_of_birth?: string;
  blood_group?: string;
  parent_phone?: string;
}

export interface ParentOnboardingForm {
  parent_name: string;
  parent_phone: string;
  guardian_name?: string;
  guardian_phone?: string;
  address: string;
  city: string;
  school_name: string;
  school_grade: string;
  gender: 'male' | 'female' | 'other';
  health_notes?: string;
  special_needs?: string;
  uniform_size: string;
  uniform_gender: 'boy' | 'girl' | 'unisex';
}

// ─── Auth Context ───────────────────────────────────────────────

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    email?: string;
    role: StaffProfile['role'] | 'student';
    orgId: string;
    branchId: string | null;
    profile: StaffProfile | Student | null;
  } | null;
}
```

### 4.5 `lib/utils.ts`

```typescript
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { STUDENT_ID_MIN, STUDENT_ID_MAX } from './constants';

/**
 * Generate a random student ID code (4-digit number as string).
 */
export function generateStudentIdCode(): string {
  const id = Math.floor(Math.random() * (STUDENT_ID_MAX - STUDENT_ID_MIN + 1)) + STUDENT_ID_MIN;
  return id.toString();
}

/**
 * Generate a temporary password (8-char alphanumeric).
 */
export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Generate a username from first name + student ID.
 */
export function generateUsername(firstName: string, studentIdCode: string): string {
  const clean = firstName.toLowerCase().replace(/[^a-z]/g, '');
  return `${clean}${studentIdCode}`;
}

/**
 * Generate a secure token (32-char hex string).
 */
export function generateSecureToken(): string {
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Format a date for display.
 */
export function formatDate(dateString: string): string {
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

/**
 * Format a date for short display (e.g., "Feb 28").
 */
export function formatDateShort(dateString: string): string {
  return format(parseISO(dateString), 'MMM d');
}

/**
 * Format relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
}

/**
 * Format time (e.g., "6:00 AM").
 */
export function formatTime(timeString: string): string {
  // timeString is "HH:mm:ss" from PostgreSQL TIME
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format currency (INR).
 */
export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate age from date of birth.
 */
export function calculateAge(dob: string): number {
  const birthDate = parseISO(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calculate profile completion percentage.
 */
export function calculateProfileCompletion(student: {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string | null;
  parent_phone?: string | null;
  parent_name?: string | null;
  address?: string | null;
  school_name?: string | null;
  school_grade?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  uniform_size?: string | null;
}): number {
  const fields = [
    student.first_name,
    student.last_name,
    student.date_of_birth,
    student.parent_phone,
    student.parent_name,
    student.address,
    student.school_name,
    student.school_grade,
    student.gender,
    student.blood_group,
    student.uniform_size,
  ];
  const filled = fields.filter((f) => f != null && f !== '').length;
  return Math.round((filled / fields.length) * 100);
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Get initials from a name (for avatar fallbacks).
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Validate Indian phone number (10 digits).
 */
export function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Format phone for WhatsApp API (add country code).
 */
export function formatPhoneForWhatsApp(phone: string, countryCode = '91'): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith(countryCode)) return cleaned;
  return `${countryCode}${cleaned}`;
}

/**
 * Create the parent onboarding URL.
 */
export function createParentOnboardingUrl(token: string): string {
  const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://app.cricketcircleacademy.com';
  return `${appUrl}/parent-onboarding/${token}`;
}

/**
 * Create a staff invite URL.
 */
export function createInviteUrl(token: string): string {
  const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://app.cricketcircleacademy.com';
  return `${appUrl}/invite/${token}`;
}
```

### 4.6 `lib/validators.ts`

```typescript
import { z } from 'zod';

// ─── Phone validation ───────────────────────────────────────────

const indianPhoneRegex = /^[6-9]\d{9}$/;

const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => indianPhoneRegex.test(val), {
    message: 'Enter a valid 10-digit Indian phone number',
  });

const optionalPhoneSchema = z
  .string()
  .optional()
  .transform((val) => (val ? val.replace(/\D/g, '') : undefined))
  .refine((val) => !val || indianPhoneRegex.test(val), {
    message: 'Enter a valid 10-digit Indian phone number',
  });

// ─── Organization Onboarding ────────────────────────────────────

export const orgDetailsSchema = z.object({
  name: z.string().min(2, 'Academy name must be at least 2 characters').max(100),
  sport_type: z.string().min(1, 'Select a sport type'),
});

export const foundersSchema = z.object({
  has_cofounders: z.boolean(),
  cofounder_emails: z.array(z.string().email('Enter a valid email')).optional(),
});

export const branchSchema = z.object({
  name: z.string().min(2, 'Branch name is required').max(100),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: optionalPhoneSchema,
});

export const branchesFormSchema = z.object({
  branches: z.array(branchSchema).min(1, 'At least one branch is required'),
});

export const batchSchema = z.object({
  name: z.string().min(1, 'Batch name is required').max(50),
  start_time: z.string().optional(), // "HH:mm"
  end_time: z.string().optional(),
  days_of_week: z.array(z.string()).min(1, 'Select at least one day'),
  branch_ids: z.array(z.string()), // empty = all branches
});

export const batchesFormSchema = z.object({
  batches: z.array(batchSchema).min(1, 'At least one batch is required'),
});

export const ageGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(20),
  min_age: z.number().min(0).max(99),
  max_age: z.number().min(0).max(99),
  gender: z.enum(['male', 'female', 'all']).default('all'),
});

export const ageGroupsFormSchema = z.object({
  age_groups: z.array(ageGroupSchema).min(1, 'At least one age group is required'),
});

// ─── Student Creation (Coach minimal form) ──────────────────────

export const createStudentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().max(50).optional(),
  date_of_birth: z.string().optional(), // "YYYY-MM-DD"
  blood_group: z.string().optional(),
  parent_phone: optionalPhoneSchema,
});

// ─── Parent Onboarding Form ─────────────────────────────────────

export const parentOnboardingSchema = z.object({
  // Step 1: Parent details
  parent_name: z.string().min(1, 'Parent name is required').max(100),
  parent_phone: phoneSchema,
  guardian_name: z.string().max(100).optional(),
  guardian_phone: optionalPhoneSchema,

  // Step 2: Student details
  address: z.string().min(1, 'Address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  school_name: z.string().min(1, 'School name is required').max(100),
  school_grade: z.string().min(1, 'Grade/class is required').max(20),
  gender: z.enum(['male', 'female', 'other']),

  // Step 3: Health & Uniform
  health_notes: z.string().max(500).optional(),
  special_needs: z.string().max(500).optional(),
  uniform_size: z.string().min(1, 'Select a size'),
  uniform_gender: z.enum(['boy', 'girl', 'unisex']),
});

// ─── Payment ────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  student_id: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  period_label: z.string().min(1, 'Period is required'), // "January 2026"
  due_date: z.string().optional(),
});

export const markPaymentSchema = z.object({
  payment_method: z.enum(['cash', 'upi', 'bank_transfer']),
  amount: z.number().positive(),
  notes: z.string().max(200).optional(),
});

// ─── Coach Notes ────────────────────────────────────────────────

export const coachNoteSchema = z.object({
  student_id: z.string().uuid(),
  note_type: z.enum(['diet', 'practice', 'improvement', 'general']),
  title: z.string().max(100).optional(),
  body: z.string().min(1, 'Note content is required').max(2000),
});

// ─── Match ──────────────────────────────────────────────────────

export const createMatchSchema = z.object({
  title: z.string().min(1, 'Match title is required').max(100),
  description: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  match_date: z.string().min(1, 'Match date is required'),
  match_type: z.string().optional(),
  preparation_notes: z.string().max(2000).optional(),
  participant_ids: z.array(z.string().uuid()).optional(),
});

// ─── WhatsApp Broadcast ─────────────────────────────────────────

export const broadcastSchema = z.object({
  template_name: z.string().min(1, 'Select a message template'),
  recipient_type: z.enum(['all_parents', 'batch', 'unpaid', 'specific']),
  batch_id: z.string().uuid().optional(),
  student_ids: z.array(z.string().uuid()).optional(),
  custom_message: z.string().max(1000).optional(),
});

// ─── Staff Invite ───────────────────────────────────────────────

export const createInviteSchema = z.object({
  role: z.enum(['branch_admin', 'coach', 'temp_coach']),
  branch_id: z.string().uuid(),
  max_uses: z.number().int().positive().max(10).optional(),
  expiry_hours: z.number().int().positive().max(720).optional(), // max 30 days
});

// ─── Student Login ──────────────────────────────────────────────

export const studentLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
```

### 4.7 `lib/permissions.ts`

```typescript
import type { Role } from './constants';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'request_delete';

export type Resource =
  | 'student'
  | 'attendance'
  | 'payment'
  | 'payment_amounts'
  | 'revenue_dashboard'
  | 'staff'
  | 'branch'
  | 'org_settings'
  | 'audit_log'
  | 'whatsapp'
  | 'match'
  | 'news';

const PERMISSIONS: Record<string, Record<Resource, Action[]>> = {
  super_admin: {
    student: ['create', 'read', 'update', 'delete'],
    attendance: ['create', 'read', 'update', 'delete'],
    payment: ['create', 'read', 'update', 'delete'],
    payment_amounts: ['read'],
    revenue_dashboard: ['read'],
    staff: ['create', 'read', 'update', 'delete'],
    branch: ['create', 'read', 'update', 'delete'],
    org_settings: ['read', 'update'],
    audit_log: ['read'],
    whatsapp: ['create', 'read'],
    match: ['create', 'read', 'update', 'delete'],
    news: ['create', 'read', 'update', 'delete'],
  },
  branch_admin: {
    student: ['create', 'read', 'update', 'delete'],
    attendance: ['create', 'read', 'update'],
    payment: ['create', 'read', 'update'],
    payment_amounts: ['read'],
    revenue_dashboard: ['read'],
    staff: ['create', 'read'],
    branch: ['read', 'update'],
    org_settings: [],
    audit_log: [],
    whatsapp: ['create', 'read'],
    match: ['create', 'read', 'update', 'delete'],
    news: ['create', 'read', 'update', 'delete'],
  },
  coach: {
    student: ['create', 'read', 'update', 'request_delete'],
    attendance: ['create', 'read'],
    payment: ['read'],
    payment_amounts: [],
    revenue_dashboard: [],
    staff: [],
    branch: ['read'],
    org_settings: [],
    audit_log: [],
    whatsapp: ['create'],
    match: ['create', 'read', 'update'],
    news: ['create', 'read'],
  },
  temp_coach: {
    student: ['create', 'read'],
    attendance: ['create', 'read'],
    payment: [],
    payment_amounts: [],
    revenue_dashboard: [],
    staff: [],
    branch: ['read'],
    org_settings: [],
    audit_log: [],
    whatsapp: [],
    match: ['read'],
    news: ['read'],
  },
  student: {
    student: ['read'],
    attendance: ['read'],
    payment: ['read'],
    payment_amounts: ['read'], // own only
    revenue_dashboard: [],
    staff: [],
    branch: [],
    org_settings: [],
    audit_log: [],
    whatsapp: [],
    match: ['read'],
    news: ['read'],
  },
};

/**
 * Check if a role has permission to perform an action on a resource.
 */
export function hasPermission(role: string, resource: Resource, action: Action): boolean {
  return PERMISSIONS[role]?.[resource]?.includes(action) ?? false;
}

/**
 * Check if a user can access a specific branch.
 * Super admins can access all branches. Others can only access their assigned branch.
 */
export function canAccessBranch(
  userBranchId: string | null,
  targetBranchId: string,
  role: string,
): boolean {
  if (role === 'super_admin') return true;
  return userBranchId === targetBranchId;
}

/**
 * Check if a role can convert a temp coach to a full coach.
 * Only super_admin can do this.
 */
export function canConvertTempCoach(role: string): boolean {
  return role === 'super_admin';
}

/**
 * Check if a role can invite a specific target role.
 */
export function canInviteRole(inviterRole: string, targetRole: string): boolean {
  const allowedInvites: Record<string, string[]> = {
    super_admin: ['super_admin', 'branch_admin', 'coach', 'temp_coach'],
    branch_admin: ['coach', 'temp_coach'],
    coach: [],
    temp_coach: [],
    student: [],
  };
  return allowedInvites[inviterRole]?.includes(targetRole) ?? false;
}

/**
 * Check if a role can see payment amounts (not just status).
 */
export function canSeePaymentAmounts(role: string): boolean {
  return hasPermission(role, 'payment_amounts', 'read');
}

/**
 * Check if a role can access the revenue dashboard.
 */
export function canSeeRevenueDashboard(role: string): boolean {
  return hasPermission(role, 'revenue_dashboard', 'read');
}
```

### 4.8 `lib/storage.ts`

```typescript
import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';

/**
 * MMKV instance for fast local storage.
 * Falls back to a simple in-memory map on web.
 */

let storage: {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  getAllKeys: () => string[];
  clearAll: () => void;
};

if (Platform.OS === 'web') {
  // Web fallback using localStorage
  storage = {
    getString: (key: string) => {
      if (typeof window === 'undefined') return undefined;
      return window.localStorage.getItem(key) ?? undefined;
    },
    set: (key: string, value: string) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    },
    delete: (key: string) => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    },
    getAllKeys: () => {
      if (typeof window === 'undefined') return [];
      return Object.keys(window.localStorage);
    },
    clearAll: () => {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
    },
  };
} else {
  const mmkv = new MMKV({ id: 'coachOS-storage' });
  storage = {
    getString: (key) => mmkv.getString(key),
    set: (key, value) => mmkv.set(key, value),
    delete: (key) => mmkv.delete(key),
    getAllKeys: () => mmkv.getAllKeys(),
    clearAll: () => mmkv.clearAll(),
  };
}

export { storage };

// ─── Typed helpers ──────────────────────────────────────────────

export function getJSON<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

// ─── Storage Keys ───────────────────────────────────────────────

export const STORAGE_KEYS = {
  OFFLINE_QUEUE: 'offline-queue',
  LAST_BRANCH_ID: 'last-branch-id',
  LAST_BATCH_ID: 'last-batch-id',
  ATTENDANCE_DRAFT: 'attendance-draft',
  ONBOARDING_STEP: 'onboarding-step',
} as const;
```

---

## Step 5: Root Layout & Entry Point

### 5.1 `app/_layout.tsx`

```tsx
import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FFFFFF' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(staff)" />
          <Stack.Screen name="(student)" />
          <Stack.Screen name="(parent-onboarding)" />
          <Stack.Screen name="invite" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

### 5.2 `app/index.tsx`

```tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

/**
 * Entry point — checks auth state and redirects accordingly.
 */
export default function Index() {
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.replace('/(auth)/login');
      return;
    }

    // Check if user is staff
    const { data: staffProfile } = await supabase
      .from('staff_profiles')
      .select('role, org_id')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (staffProfile) {
      router.replace('/(staff)/(home)');
      return;
    }

    // Check if user is a student
    const { data: student } = await supabase
      .from('students')
      .select('id, org_id')
      .eq('auth_user_id', session.user.id)
      .eq('enrollment_status', 'active')
      .single();

    if (student) {
      router.replace('/(student)');
      return;
    }

    // User is authenticated but has no profile — likely fresh sign-up
    router.replace('/(auth)/onboarding/org-details');
  }

  return (
    <View className="flex-1 items-center justify-center bg-bg-primary">
      <ActivityIndicator size="large" color="#0A0A0A" />
    </View>
  );
}
```

---

## Step 6: Download Inter Fonts

```bash
# Download Inter font files to assets/fonts/
# Option 1: From Google Fonts CDN
curl -o assets/fonts/Inter-Regular.ttf "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf"
curl -o assets/fonts/Inter-Medium.ttf "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf"
curl -o assets/fonts/Inter-SemiBold.ttf "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf"
curl -o assets/fonts/Inter-Bold.ttf "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf"

# Option 2: If curl doesn't work, download from https://fonts.google.com/specimen/Inter
# and place the 4 weight files manually.
```

---

## Verification Checklist

After completing all steps, run:

```bash
# Type check
npx tsc --noEmit

# Start dev server (should open without errors)
npx expo start

# Verify web
npx expo start --web
```

Expected state after this file:
- Project scaffolded with Expo Router
- All config files in place (TypeScript, Tailwind, Babel, Metro)
- Supabase client configured with SecureStore
- All TypeScript types defined
- All Zod validators defined
- All constants and enums defined
- All utility functions defined
- RBAC permission system defined
- Root layout with providers (QueryClient, GestureHandler, fonts)
- Entry point with auth routing
- Ready to build UI components (File 003)

---

*Next file (003) builds the design system UI components: Button, Input, Badge, Card, Table, FilterBar, Sheet, Avatar, and more.*
