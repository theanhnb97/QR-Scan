# Decisions Log

Use compact ADR-style entries.

---

## D-001 — Bare React Native Stack

Status: Accepted

Decision:
Build the application using **Bare React Native 0.87.1** with TypeScript, React Native Community CLI, New Architecture (TurboModules/Fabric), and Hermes engine.
Native iOS project lives under `/ios` and native Android project lives under `/android`.
Strictly forbid any Expo packages (`expo`, `expo-*`, EAS, Expo Router).

Reason:
Direct buildability with Xcode and Android Studio/Gradle, native performance with New Architecture, precise control over camera integration, and zero dependency overhead.

---

## D-002 — Local-First Architecture

Status: Accepted

Decision:
Core scanner, generator, history, and authenticator require no backend/account.

Reason:
Reduce complexity, eliminate server privacy attack surfaces, and preserve complete offline functionality.

---

## D-003 — TOTP Storage Separation

Status: Accepted

Decision:
TOTP/HOTP secrets live exclusively in platform secure storage:
- iOS: Keychain
- Android: Keystore-backed encrypted storage
Normal database stores only metadata and a foreign pointer `credentialId`.
Secrets must never be stored in AsyncStorage, SQLite, MMKV, Zustand/Redux state, or plain files.

Reason:
Prevents plaintext credential leakage from normal database dumps, backups, or memory dumps.

---

## D-004 — No Raw TOTP URI in History

Status: Accepted

Decision:
Scan history records store sanitized metadata and account references only. `safeValue` strictly strips secret keys and Wi-Fi passwords.

Reason:
Provisioning URIs (`otpauth://`) contain the shared secret key in plaintext in the query string.

---

## D-005 — Result-First Scanned URL Behavior

Status: Accepted

Decision:
A scanned URL is displayed for inspection with domain extraction before navigating. User action is strictly required to open in browser.

Reason:
Prevents drive-by URL visits, phishing attacks, and malicious intent redirection.

---

## D-006 — Manual TOTP Entry is P0

Status: Accepted

Decision:
Authenticator supports both scanned provisioning QR and manual Base32 setup key entry with validation.

Reason:
Many web services provide a setup secret key as an accessible alternative to QR camera scanning.

---

## D-007 — SQLite Package Selection for Non-Secret Persistence

Status: Accepted

Decision:
Evaluate and select a high-performance, New Architecture compatible SQLite library (e.g. `op-sqlite` or `react-native-quick-sqlite`) for non-secret metadata. `react-native-sqlite-storage` is rejected due to lack of New Architecture maintenance.

Reason:
High-speed synchronous operations via JSI/C++ bindings on New Architecture, active maintenance, and offline query speed.

---

## D-008 — Pure TypeScript RFC 6238 TOTP Engine

Status: Accepted

Decision:
Implement RFC 4226 (HOTP) and RFC 6238 (TOTP) algorithms in pure TypeScript with zero runtime dependencies. Verify against official IETF test vectors for SHA-1, SHA-256, and SHA-512.

Reason:
Portability across JS runtimes, complete auditability, and no external cryptographic dependencies that could introduce vulnerabilities.

---

## D-009 — Brand Asset Integration

Status: Accepted

Decision:
Use the supplied raster brand assets as bundled React Native image resources during the foundation phase. Centralize references in `src/ui/assets.ts`; use the primary logo/mark in empty states and the theme JSON as the source for UI color tokens.

Reason:
Preserves the approved visual identity while keeping native splash-screen and store-icon export work separate from the React Native shell. The supplied app icon remains a concept asset until final full-bleed platform exports are approved.

---

## D-010 — Platform Application Identifier

Status: Accepted

Decision:
Use `com.anhnt.qrscan` as the iOS bundle identifier for Debug and Release configurations and as the Android namespace/application ID. Keep the selected Apple development team in Xcode for device signing.

Reason:
The React Native template identifier (`org.reactjs.native.example.*`) is not a product-grade identifier and failed Apple registration. The new value follows reverse-DNS convention, matches the QR Scan product identity, and keeps platform package naming consistent.

---

## D-011 — Camera and Image Barcode Scanning

Status: Accepted

Decision:
Use `react-native-camera-kit` 16.2.1 for the live QR/barcode camera and `@react-native-ml-kit/barcode-scanning` 2.0.0 for scanning selected images. Keep both behind `src/services/scanner/CameraKitAdapter.tsx` so UI code does not depend on native APIs.

Reason:
VisionCamera 5.2.3 does not compile with the installed Xcode 16.4 SDK because it references removed AVFoundation/CoreVideo symbols.

Compatibility note:
CameraKit has New Architecture codegen support. The ML Kit image decoder is a focused legacy NativeModule used only through the service boundary; it does not change the application architecture.

---

## D-012 — Secure Storage and SQLite Implementations

Status: Accepted

Decision:
Use `react-native-keychain` 10.0.0 for platform secure credentials and `@op-engineering/op-sqlite` 18.2.4 for non-secret metadata. Both are autolinked and compile with React Native 0.87.1 New Architecture in this repository.

Reason:
Keychain exposes iOS Keychain and Android Keystore-backed AES-GCM storage; op-sqlite is actively maintained, supports codegen/JSI, and avoids the unmaintained `react-native-sqlite-storage` default.

Alternatives considered:
`react-native-sqlite-storage` was rejected for maintenance/New Architecture concerns. A custom secure TurboModule was not needed because Keychain's current API meets the storage boundary.

---

## D-013 — QR and Barcode Rendering

Status: Accepted

Decision:
Use `react-native-qrcode-svg` 6.3.24 with `react-native-svg` 15.15.5 for QR rendering, `jsbarcode` 3.11.6's pure JS Code 128 encoder for barcodes, and `react-native-view-shot` 5.1.1 plus CameraRoll 7.10.2 for image share/save.

Reason:
The generator remains local and readable without introducing a large UI framework or an obsolete native barcode renderer.

---

## D-014 — Biometric Gate

Status: Accepted

Decision:
Sensitive authenticator reveal/export actions call a native Keychain/Keystore `USER_PRESENCE` gate through `NativeBiometricService`. A JavaScript `isAuthenticated` flag is never used as authorization.

---

## D-015 — TOTP Hash Algorithms

Status: Accepted

Decision:
Keep the OTP engine dependency-free and implement SHA-1, SHA-256, SHA-512 and HMAC in TypeScript. Official RFC 6238 vectors for all three algorithms are covered by unit tests.

---

## D-016 — Settings and History Export Storage

Status: Accepted

Decision:
Store app-lock and URL behavior preferences in the non-secret SQLite settings table. Export CSV/JSON only from a field allowlist of already-sanitized history records.

Reason:
Settings are non-secret application metadata, while an allowlist makes history export safe by construction.

---

## D-017 — Native Smart Action Handoffs

Status: Accepted

Decision:
Keep smart actions behind `NativeActionService`. Android uses platform intents for Wi-Fi settings, contacts, and calendar; iOS uses Settings, Contacts, and EventKit. Share fallbacks remain available when a platform handoff is unavailable.

Reason:
Platform capabilities and permission prompts must stay outside arbitrary React components, while the app remains usable on devices with restricted capabilities.

---

## D-018 — Background Privacy Protection

Status: Accepted

Decision:
Use an iOS blur overlay during inactive/background transitions and Android `FLAG_SECURE` to prevent sensitive app snapshots and screenshots.

Reason:
Authenticator codes and scan results should not appear in the task switcher or screenshot surfaces while app-lock state is changing.

---

## D-019 — React Native Asset Registry Compatibility

Status: Accepted

Decision:
Pin the official `@react-native/assets-registry` package to `0.87.1` alongside React Native `0.87.1`.

Reason:
`react-native-svg` 15.15.5 resolves its asset helper through this package, while React Native 0.87.1 does not declare it as a transitive dependency. Pinning the matching package keeps Metro bundling deterministic for device builds without introducing an Expo dependency.

---

## D-020 — Android Release Signing Boundary

Status: Accepted

Decision:
Read Android release signing values from ignored `android/keystore.properties` or `QRSCAN_*` environment variables. When no production keystore is configured, `assembleRelease` produces an explicitly unsigned APK rather than silently using the debug keystore.

Reason:
Production credentials must never be committed, and a debug-signed release artifact must not be mistaken for a store-ready build.

---

## D-021 — Lightweight Native UI Enhancements

Status: Accepted

Decision:
Use a small TypeScript locale provider, React Native core `PanResponder` swipe rows, CameraKit controlled zoom, and platform-native image clipboard adapters. Do not add a gesture/UI framework for these focused interactions.

Reason:
The requested Vietnamese UI, swipe actions, camera zoom, and image clipboard behavior can remain lightweight and directly buildable under the existing New Architecture stack.

---

## D-022 — Generated Code History Privacy Boundary

Status: Accepted

Decision:
Persist up to 50 generated-code records in SQLite as non-secret metadata. QR/barcode payloads are retained for restoration except Wi-Fi records, which retain only the SSID and display metadata; Wi-Fi passwords are never written to this history table.

Reason:
Generated-code history is useful for quick reuse, but ordinary SQLite must not become a storage path for network credentials.

## D-023 — Unified Functional Icon System

Status: Accepted

Decision:
Use the local `AppIcon` SVG component as the single source for functional UI icons. Keep fixed size tiers (20px actions, 21px headers, 23px tabs, 18px compact), use theme/status colors at call sites, and reserve raster assets for brand presentation rather than controls.

Reason:
One geometry/stroke system keeps icons aligned across navigation, scanner controls, generator actions, and swipe actions without adding a large icon dependency.

---

## D-024 — Native Splash and Launcher Asset Sources

Status: Accepted

Decision:
Use the supplied `assets/source-v2/splash/native` mark/background sources for native iOS and Android launch screens, and the supplied full-bleed iOS/adaptive Android launcher sources for platform icon catalogs. Do not use screenshot/mockup assets in native launch resources.

Reason:
Native launch surfaces must contain only the branded background and centered mark; platform masks and launch APIs must own device chrome and transitions.

---

## D-025 — Authenticator Swipe Direction and Actions

Status: Accepted

Decision:
Authenticator rows use core `PanResponder` with horizontal capture and `direction="left"`: a right-to-left swipe reveals right-side Edit and Delete actions. One module-level active-row closer keeps only one row open while preserving vertical FlatList scrolling and row taps.

Reason:
This meets the supplied swipe specification without adding a gesture dependency and keeps destructive deletion behind the existing confirmation and secure-secret cleanup path.

---

## D-026 — Manifest-Driven Icon Audit

Status: Accepted

Decision:
Treat `assets/source-v2/icons/icon-manifest.json` as the semantic source of truth. `docs/ICON_AUDIT.md` records every rendered functional mapping; no emoji/unicode glyphs or improvised semantic replacements are allowed for production controls.

Reason:
Semantic consistency is more important than visual guesswork, especially for Settings, Theme, Authenticator, Delete, and navigation controls.

---

## D-027 — Keyboard and Discoverability Boundaries

Status: Accepted

Decision:
Keep sensitive Authenticator actions behind the existing biometric confirmation flow, but expose their entry point through a visible per-row options button. Wrap credential metadata forms in keyboard-aware scrolling and use native iOS input accessories for dismissal; disable spell/autocorrect suggestions on code-generation fields.

Reason:
Users must be able to discover secure export/reveal actions without weakening the biometric boundary, and keyboard avoidance must work in both full screens and modal sheets.

---

## D-028 — Google Authenticator Bulk Export

Status: Accepted

Decision:
Export all compatible authenticator accounts through Google's `otpauth-migration://` protobuf format. Require explicit confirmation followed by native biometric/device authentication, show each QR batch in sequence, and warn when custom-period TOTP accounts are skipped because the migration format represents a 30-second period.

Reason:
This provides an interoperable transfer path without direct access to another authenticator's private storage while preventing silent loss of period semantics. Secrets remain transient during QR construction and are never written to history, normal metadata storage, or logs.
