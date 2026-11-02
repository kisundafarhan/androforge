# AndroForge Studio

**Professional HTML-to-Android APK & AAB Builder, Android Rebuilder, Keystore Manager & API 36 Upgrade Tool**

AndroForge Studio is a 100% free, local-first desktop and web studio designed to convert local HTML5/CSS/JS websites and online web applications into signed Android APK and Android App Bundle (AAB) releases, inspect compiled Android binaries, and migrate existing Android Studio projects to **Android 16 (API 36)** with full Google Play Upload Key signing continuity.

---

## 1. Architecture Overview

- **Desktop & Web Frontend**: React 19 + TypeScript + Tailwind CSS v4 (Material 3 Dark/Light adaptive design with 21 Material color schemes and English/Indonesian localization).
- **Desktop Native Shell (`/src-tauri`)**: Tauri v2 + Rust backend (`src-tauri/src/main.rs`, `Cargo.toml`, `tauri.conf.json`) for native Windows `.msi` and `.exe` NSIS installer generation and direct local `gradlew.bat` / `adb` process invocation.
- **Local Workspace & Packaging Engine (`server.ts` & `src/core/*`)**:
  - `src/core/androidGenerator.ts`: Generates complete, standards-compliant Android Studio Kotlin projects (`compileSdk = 36`, `targetSdk = 36`, `AGP 8.8.0`, `Gradle 8.11.1`, `Kotlin 2.1.0`) using `androidx.webkit.WebViewAssetLoader` (`https://appassets.androidplatform.net/assets/www/index.html`), `enableEdgeToEdge()`, and predictive back callbacks.
  - `src/core/zipAndSignEngine.ts`: Pure-TypeScript ZIP/APK/AAB archive builder & reader with 4-byte `zipalign` padding for uncompressed entries (`resources.arsc`), RSA-2048 X.509 self-signed certificate & keystore generator (`SHA-1` & `SHA-256` fingerprints, AES-256-GCM encrypted private key vault), `META-INF/MANIFEST.MF` + `ANDROIDF.SF` + `ANDROIDF.RSA` cryptographic signing, and binary/manifest inspection.
  - `src/core/apiUpgradeEngine.ts`: 15-step Android API 36 migration analyzer and 10-point Google Play Console Readiness Checker (`PASS` / `WARNING` / `BLOCKED`).

---

## 2. Prerequisites

- **Node.js**: v20+ LTS
- **For Native Windows Desktop Installer (`src-tauri`)**:
  - Rust toolchain (`rustup`, Cargo 1.80+)
  - Microsoft Edge WebView2 Runtime (pre-installed on Windows 10/11)
- **For Full Local Gradle Bytecode Compilation on Workstation**:
  - JDK 21 LTS (Eclipse Temurin 21 recommended for AGP 8.8.0 / Gradle 8.11.1)
  - Android SDK Command-Line Tools with `platforms;android-36` and `build-tools;36.0.0`

---

## 3. Build, Test & Run Commands

```bash
# Install dependencies
npm install

# Run deterministic unit & acceptance test suite (node:test via tsx)
npm test

# Start full-stack studio server on http://localhost:3000
npm run dev

# Build production frontend bundle
npm run build

# Build native Windows Tauri v2 installer (.msi / .exe) on Windows
npx @tauri-apps/cli build
```

---

## 4. Known Platform & Architectural Limitations

1. **Compiled APK/AAB vs. Source Project**: A compiled `.apk` or `.aab` archive is a packaged binary artifact, not a complete Android Studio source tree, and **never** contains the private signing key (`.jks` / `.p12`) — only the public verification certificate inside `META-INF/`. Rebuilding an existing app for Google Play updates requires either the original source/HTML files or recovered web assets signed with the original Upload Key.
2. **Google Play Console Policy Scope**: Passing the automated Google Play Readiness Checker verifies technical SDK (`targetSdk 36`), 64-bit ABI (`arm64-v8a`), manifest security (`WebViewAssetLoader`, cleartext traffic), and signing continuity, but Google Play reviewers also evaluate app utility, Privacy Policy disclosures, and Data Safety declarations.
