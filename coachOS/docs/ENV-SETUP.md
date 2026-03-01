# Where to Put Your Env Keys

## 1. Local development (your Mac)

**Location:** In the **coachOS** project folder (the one with `package.json`), create a file named **`.env`**.

- **Path example:** `/Users/nesar/March-eggo/coachOS/.env`
- Copy from **`.env.example`** in the same folder and replace placeholder values with your real keys.
- **Do not commit `.env`** — it should be in `.gitignore`.

**Required for the app to run:**

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_APP_URL=http://localhost:8081
```

Get **Supabase URL** and **anon key** from: [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings** → **API**.

---

## 2. Vercel (web deploy)

**Location:** Vercel project → **Settings** → **Environment Variables**.

Add the same **EXPO_PUBLIC_*** variables; set `EXPO_PUBLIC_APP_URL` to your live URL (e.g. `https://your-app.vercel.app`).

| Variable | Example |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `EXPO_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

---

## 3. EAS Build (iOS/Android)

**Location:** Either:

- **EAS Secrets:** `eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."` (and same for other vars), or  
- **`eas.json` env:** define in your build profile’s `env` block.

Env vars are baked into the build, so set them before running `eas build`.

---

## 4. Supabase Edge Functions (server-side only)

**Location:** [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings** (gear) → **Edge Functions** → **Secrets** (or **Settings** → **Edge Functions**).

Set these **only** for Edge Functions (never in client `.env`):

| Variable | Used by | Notes |
|----------|--------|--------|
| `SUPABASE_URL` | All functions | Often set automatically by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | create-student, parent-onboarding, accept-invite, etc. | From Dashboard → Settings → API → `service_role` (secret) |

Optional, if you use those features:

- `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`

---

## Quick reference

| Where you run the app | Where to put keys |
|------------------------|--------------------|
| **Local** (`npx expo start`) | `coachOS/.env` (copy from `.env.example`) |
| **Vercel** (web) | Vercel → Project → Settings → Environment Variables |
| **EAS Build** (iOS/Android) | EAS secrets or `eas.json` env |
| **Supabase Edge Functions** | Supabase Dashboard → Project Settings → Edge Functions → Secrets |

**Rule of thumb:** Anything starting with `EXPO_PUBLIC_` is safe in the client (app and Vercel). Never put `SUPABASE_SERVICE_ROLE_KEY` or other server secrets in client env or in the repo.
