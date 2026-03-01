# Running CoachOS on Your iPhone (iOS)

This guide explains how to get CoachOS running on your iPhone. You have two main options: **run on a physical device** (using EAS Build) or **run in the iOS Simulator** (using Xcode, no device needed). For "I want to try it on my mobile," use **Option B** (physical device).

---

## Which folder to use

**Run Metro and Xcode from the coachOS folder that has `package.json` and `app.json`.**  
If you see `ConfigError: The expected package.json path ... does not exist`, you're in a source-only copy (e.g. under `Documents/feb 2026/March-eggo/coachOS`). Use the **full project** folder instead, for example:

```bash
cd /Users/nesar/March-eggo/coachOS
```

From there run `npx expo start`, and open `ios/CoachOS.xcworkspace` in Xcode. If you apply code changes in another copy (e.g. Cursor workspace), copy the changed files into this folder so the app you run has your fixes.

---

## Free ways to test on your phone (no TestFlight, no $99)

You can test on your iPhone **without** a paid Apple Developer account or TestFlight:

| Option | Cost | What you get |
|--------|------|----------------|
| **Expo Go** | Free, no Apple account | Run the app inside the Expo Go app; scan a QR code. Easiest. Some native features may be limited. |
| **EAS Build (preview)** | Free Apple ID only | A real installable app: build in the cloud, get a link, install on your phone like an app. No TestFlight. |

- **Expo Go:** See [Expo Go (test on your phone)](#expo-go-test-on-your-phone) below. Install Expo Go from the App Store, run `npx expo start` on your Mac, scan the QR code with your iPhone. Your phone and Mac must be on the same Wi‑Fi (or use `npx expo start --tunnel`).
- **EAS Build (preview):** See [Option B: Run on Your Physical iPhone](#option-b-run-on-your-physical-iphone-real-device). Use a **free** Apple ID. Run `eas build --platform ios --profile preview` from the project folder; when the build finishes, open the link (or scan the QR code) on your iPhone to install the app. No $99 and no TestFlight — you get a direct install link for your device.

---

## Expo Go (test on your phone)

Fastest way to run the app on your **physical iPhone** without building in Xcode:

1. **Install Expo Go** on your iPhone from the [App Store](https://apps.apple.com/app/expo-go/id982107779).
2. **Same Wi‑Fi:** Put your iPhone and Mac on the same Wi‑Fi network.
3. **Start the dev server** from the full project folder:
   ```bash
   cd /Users/nesar/March-eggo/coachOS
   npx expo start
   ```
4. **Open on your phone:**  
   - **iPhone:** Open the **Camera** app and scan the **QR code** shown in the terminal (or in the browser that opened). Tap the banner to open in Expo Go.  
   - Or open **Expo Go** and tap **“Enter URL manually”** if the terminal shows a URL (e.g. `exp://192.168.x.x:8081`).

If your Mac and phone are on different networks or QR doesn’t work, use **tunnel** mode so the phone can reach Metro from anywhere:
   ```bash
   npx expo start --tunnel
   ```
   Wait for the tunnel URL, then scan the new QR code with your iPhone camera.

**Note:** Some native features (e.g. QR generation with Skia) may behave differently or be limited in Expo Go. For full native behavior, use a [development build](#run-in-xcode-open-and-build-from-xcode) or EAS Build.

---

## Quick run (recommended): one command

From the **full project** folder (the one with `package.json`), you can build and run in the simulator **without opening Xcode**. Metro starts automatically and the app loads the latest JS:

```bash
cd /Users/nesar/March-eggo/coachOS
npx expo run:ios
```

This avoids "Connection refused" and ensures the app uses the code in this folder. Pick a simulator when prompted. To run on a physical device, connect the device and run the same command (or use Xcode as below).

**If you use Cursor on a different copy:** copy the fixed `lib/storage.ts` into this folder first so the app doesn’t hit the "prototype of undefined" error:

```bash
cp "/Users/nesar/Documents/feb 2026/March-eggo/coachOS/lib/storage.ts" "/Users/nesar/March-eggo/coachOS/lib/storage.ts"
```

---

## Run in Xcode (open and build from Xcode)

If you want to **open the app in Xcode** and run it from there (simulator or device):

### 1. Generate the native iOS project (if not already done)

In Terminal, from the **coachOS** folder (the one that contains `package.json`):

```bash
cd /Users/nesar/March-eggo/coachOS
npx expo prebuild --platform ios --clean
```

If `pod install` fails (e.g. error about "bad component" or "absolute path"), it is often because the **project path contains spaces** (e.g. `feb 2026`). Fix it by moving the project to a path **without spaces**, then run prebuild again:

```bash
# Example: move to a path without spaces
mv "/Users/nesar/Documents/feb 2026/March-eggo" ~/March-eggo
cd ~/March-eggo/coachOS
npx expo prebuild --platform ios --clean
```

When prebuild finishes successfully, you’ll have `coachOS/ios/` with an Xcode project and (after pods install) a **`.xcworkspace`** file.

### 2. Install CocoaPods dependencies (if needed)

If prebuild didn’t run `pod install` successfully, run it yourself:

```bash
cd coachOS/ios
pod install
```

Use **`CoachOS.xcworkspace`** in Xcode, not the `.xcodeproj`, when pods are in use.

### 3. Start the Metro bundler (required when running from Xcode)

**Run order:** Start Metro **first**, then press Run in Xcode. If you run the app in Xcode before Metro is up, you’ll see **"Connection refused"** (ports 8081/8097) and **"Disconnected from Metro"**. The app then uses an old or empty bundle and may show "prototype of undefined" or "missing default export".

When you run the app from Xcode, the native app loads the JavaScript from **Metro**. If Metro is not running, you’ll see:

- **"No script URL provided"** or **"unsanitizedScriptURLString = (null)"**
- **"Connection refused"** to 127.0.0.1:8081 or 8097
- **"Disconnected from Metro"**

**Fix:** Start Metro **before** you run the app from Xcode.

1. **Copy the fixed storage** (if you edit code in the Cursor workspace):
   ```bash
   cp "/Users/nesar/Documents/feb 2026/March-eggo/coachOS/lib/storage.ts" "/Users/nesar/March-eggo/coachOS/lib/storage.ts"
   ```
2. Open a **separate Terminal** window.
3. Go to the **coachOS** project folder (the one that has `package.json` and `app.json`), e.g.:
   ```bash
   cd /Users/nesar/March-eggo/coachOS
   ```
4. Start the dev server:
   ```bash
   npx expo start --clear
   ```
5. Leave this Terminal window open. **Only then** press Run (⌘R) in Xcode so the app connects to Metro and loads the JS bundle.

**On a physical iPhone:** Your phone and Mac must be on the same Wi‑Fi. If the app still can’t find Metro, in the Terminal where `expo start` is running, press `s` to switch to tunnel mode, or set `REACT_NATIVE_PACKAGER_HOSTNAME` to your Mac’s local IP (e.g. `export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.5` then run `npx expo start` again).

### 4. Open the project in Xcode

- **If `CoachOS.xcworkspace` exists** (after a successful `pod install`):
  - In Finder, go to `coachOS/ios/` and **double‑click `CoachOS.xcworkspace`**, or  
  - In Terminal: `open coachOS/ios/CoachOS.xcworkspace`
- **If only `CoachOS.xcodeproj` exists** (e.g. pods failed):
  - Double‑click `CoachOS.xcodeproj` or run: `open coachOS/ios/CoachOS.xcodeproj`  
  - Building may fail until you fix `pod install` (e.g. by moving the project to a path without spaces and re-running prebuild).

### 5. In Xcode: choose target and run

1. In the top-left of Xcode, open the **scheme** dropdown and select **CoachOS**.
2. Open the **device** dropdown next to it and choose:
   - **Any iPhone Simulator** (e.g. iPhone 15) to run in the simulator, or  
   - **Your iPhone** (when connected) to run on the device.
3. Click the **Run** button (play icon) or press **⌘R**.

Xcode will compile the app and launch it in the simulator or on your device.

### 6. Running on a physical iPhone from Xcode

- Connect your iPhone with a cable.
- Select your **iPhone** as the run destination in the device dropdown.
- First time: Xcode will ask you to set a **Team** for code signing:
  - Click the **CoachOS** project in the left sidebar → select the **CoachOS** target → **Signing & Capabilities**.
  - Under **Team**, choose your Apple ID team (or **Add an Account** and sign in with your Apple ID).
- If the device is untrusted, on the iPhone go to **Settings → General → VPN & Device Management** and trust the developer.
- Press **⌘R** again to build and run on the device.

### 7. After changing JavaScript or app config

The native `ios` folder is generated by Expo. If you change **app.json**, **package.json**, or add/remove native modules, regenerate the iOS project:

```bash
cd coachOS
npx expo prebuild --platform ios --clean
```

Then open **`CoachOS.xcworkspace`** again in Xcode and run.

---

## Prerequisites (do these first)

1. **Mac with Xcode**  
   You said you have Xcode — good. Install the **iOS Simulator** and **Command Line Tools** if you haven’t:
   - Open **Xcode** → **Settings** (or **Preferences**) → **Locations** → set **Command Line Tools** to your Xcode version.
   - In Xcode, go to **Window → Devices and Simulators** and ensure at least one **iOS Simulator** is installed (e.g. iPhone 15).

2. **Node.js**  
   On your Mac, in Terminal:
   ```bash
   node -v   # should be v18 or v20
   ```
   If not installed: install from [nodejs.org](https://nodejs.org) or with `brew install node`.

3. **CoachOS dependencies and env**  
   In Terminal, from the **project root** (the folder that contains `coachOS`):
   ```bash
   cd coachOS
   npm install
   ```
   Create a `.env` file (copy from `.env.example` if it exists) and set at least:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_APP_URL` (e.g. `https://app.cricketcircleacademy.com` for production, or a tunnel URL for dev)

---

## Option A: Run in iOS Simulator (no iPhone, uses Xcode)

This builds the app and runs it in the **iPhone Simulator** on your Mac. You do **not** need to “add” the project to Xcode by hand; the Expo CLI generates the Xcode project and opens the simulator.

1. In Terminal, from the `coachOS` folder:
   ```bash
   cd coachOS
   npx expo run:ios
   ```
2. First time: Xcode may install extra components; allow it.
3. When asked for a **device**, choose a **simulator** (e.g. **iPhone 15**). Do **not** choose “My iPhone” or a physical device here — that’s for Option B.
4. The app will compile and launch in the simulator. You don’t need to open Xcode or “add” any project there for this.

**What you’re not adding in Xcode:**  
You are **not** copying the CoachOS app into Xcode as a new project. `expo run:ios` creates the native iOS project under `coachOS/ios` (if it exists) or uses a temporary build and runs the simulator. You only need Xcode to be installed and the simulator to be available.

---

## Option B: Run on Your Physical iPhone (real device)

CoachOS uses native modules (e.g. MMKV, Skia), so running on a **physical iPhone** is done by building an **iOS app** (`.ipa`) and installing it on the device. The recommended way is **EAS Build** (Expo’s cloud build). You do **not** need to manually add the app in Xcode for this.

### Step 1: Install EAS CLI and log in

In Terminal:

```bash
npm install -g eas-cli
eas login
```

Create an Expo account at [expo.dev](https://expo.dev) if you don’t have one; use that to log in.

### Step 2: Link the project to EAS (one time)

From the **coachOS** folder:

```bash
cd coachOS
eas build:configure
```

If asked, accept the default. This updates `eas.json` / `app.json` if needed. Ensure `app.json` has a valid **iOS bundle identifier** (e.g. `com.coachOS.app` — it already does).

### Step 3: Apple Developer account and device

- **Apple Developer account**  
  To install on a **physical iPhone** you need an **Apple Developer** account (paid, $99/year) for “real” distribution.  
  For **testing only**, you can use a **free Apple ID** with EAS “internal distribution” (ad hoc), which allows installing on a few devices registered in your Apple account.

- **Your iPhone**  
  - Connect the iPhone to the Mac with a cable (optional for EAS; needed only if you later use Xcode to install).  
  - On the iPhone: **Settings → General → VPN & Device Management** (or **Profiles**): if you later install an ad hoc build, you may need to **trust** the developer certificate.

### Step 4: Build for iOS (physical device)

Still in `coachOS`:

```bash
eas build --platform ios --profile preview
```

- **preview** in this project is set up for “internal” distribution (good for testing on your own device).
- EAS will ask you to log in with your **Apple ID** and to create/select **Distribution Certificate** and **Provisioning Profile**. Follow the prompts; EAS can create them for you.
- The build runs in the cloud. When it finishes, EAS gives you a **link** to download the `.ipa` or a **QR code**.

### Step 5: Install the app on your iPhone

- **From the EAS build page:**  
  On your iPhone, open the **build link** (or scan the QR code) in Safari. Follow the instructions to install the app. You may need to go to **Settings → General → VPN & Device Management** and trust the developer.

- **Alternative – install via cable (Xcode):**  
  1. Download the `.ipa` from the EAS build page to your Mac.  
  2. Connect the iPhone.  
  3. Open **Xcode** → **Window → Devices and Simulators** → select your iPhone.  
  4. Drag the `.ipa` onto the **Installed Apps** list (or use **Apple Configurator** / **Finder** for installing an .ipa).  
  This is optional; the link/QR from EAS is usually enough.

### Step 6: Run the app on the device

- The first time, open the app from the home screen. If the app needs to load JS from your Mac (e.g. for development), you’d use a **development build** and point it to your machine; for a **preview** build, the JS is bundled inside the app, so you just tap and use it.

---

## TestFlight: install on your phone via TestFlight

You can install the app on your phone using **TestFlight** so you (and others) get it from the TestFlight app. This requires a **paid Apple Developer account** ($99/year).

### 1. Apple Developer account

- Sign up at [developer.apple.com](https://developer.apple.com) and enroll in the Apple Developer Program ($99/year).
- In [App Store Connect](https://appstoreconnect.apple.com), create an **app** for CoachOS: **My Apps** → **+** → **New App** → iOS, set name and bundle ID to match your `app.json` (e.g. `com.yourapp.coachos`).

### 2. Build for the App Store

From the coachOS folder (the one with `package.json`):

```bash
cd /Users/nesar/March-eggo/coachOS
eas build --platform ios --profile production
```

If you don't have a `production` profile, add one in `eas.json` with `"distribution": "store"` for iOS. EAS will ask for your Apple ID and create/use credentials. The build produces an `.ipa` for the App Store.

### 3. Submit to App Store Connect

After the build finishes:

```bash
eas submit --platform ios --latest
```

The build uploads to App Store Connect and appears under your app.

### 4. Turn on TestFlight and add testers

1. In [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → your CoachOS app → **TestFlight** tab.
2. When the build is processed, complete **Export Compliance** / **Test Information** if prompted.
3. Under **Internal Testing** or **External Testing**, add yourself (and others) by Apple ID email. Testers get an email invite.

### 5. Install on your phone

- On your iPhone, install **TestFlight** from the App Store.
- Open the invite email and tap **View in TestFlight**, or open TestFlight and your build will appear. Tap **Install**.

**Summary:** Apple Developer account → `eas build --platform ios --profile production` → `eas submit --platform ios --latest` → App Store Connect → TestFlight → add testers → install via TestFlight on your phone.

---

## Do I need to “add” something in Xcode?

**Short answer: no**, for normal use.

- **Option A (Simulator):** You run `npx expo run:ios`; Expo/Xcode build and launch the simulator. You don’t add the CoachOS folder as a new project in Xcode.
- **Option B (Device):** You use EAS to build in the cloud and install via link/QR (or by dragging the downloaded `.ipa` in Xcode’s Devices window). You don’t need to “add” the CoachOS source code as an Xcode project for that.

**When you might open the project in Xcode:**

- You want to **run on the simulator** from Xcode: after running `npx expo run:ios` once, a native project is under `coachOS/ios`. You can open `coachOS/ios/coachOS.xcworkspace` (or `.xcodeproj`) in Xcode and hit Run to build and run on the simulator again.
- You need to **change native iOS settings** (e.g. capabilities, signing, bundle ID): open that same `ios` folder in Xcode and edit the project/target settings.
- You are **debugging native crashes**: open the same workspace in Xcode and use the debugger.

For “make it work on my iPhone,” **Option B (EAS Build)** is what you need; no need to add anything in Xcode for the first install.

---

## Quick reference

| Goal                         | Command / action                                      |
|-----------------------------|--------------------------------------------------------|
| Run in iOS Simulator (Mac)  | `cd coachOS && npx expo run:ios` → choose simulator   |
| Build for physical iPhone   | `cd coachOS && eas build --platform ios --profile preview` |
| TestFlight (beta on phone)  | `eas build --platform ios --profile production` then `eas submit --platform ios --latest` → App Store Connect → TestFlight |
| Install on iPhone           | Open EAS build link/QR on the device, or install .ipa via Xcode Devices; or use TestFlight app after submitting to App Store Connect |
| Open native project in Xcode| Open `coachOS/ios/coachOS.xcworkspace` (after `expo run:ios` at least once) |

---

## Troubleshooting

- **“No simulator found”**  
  In Xcode: **Window → Devices and Simulators** → **Simulators** → click **+** and add an iPhone model.

- **“Could not find iPhone”**  
  For simulator: choose an actual simulator, not “My iPhone.” For device: use EAS Build (Option B) and install via the link; or use a cable and Xcode after the build.

- **App installs but won’t open / “Untrusted Developer”**  
  On iPhone: **Settings → General → VPN & Device Management** → your developer account → **Trust**.

- **Build fails with signing errors**  
  In EAS, when prompted, use your Apple ID and let EAS create the certificate and provisioning profile. For “preview” (ad hoc), a free Apple ID can be enough for a few test devices.

- **Supabase / network errors in app**  
  Ensure `.env` has correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and that you’ve run a new EAS build after changing env (env is baked into the build).

Once you’ve done **Option B** once, you can rebuild after code changes with:

```bash
eas build --platform ios --profile preview
```

and install the new build from the new link EAS gives you.
