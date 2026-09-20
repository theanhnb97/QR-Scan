# TODO

## Phase 00 — Foundation
- [x] Bare React Native iOS and Android projects
- [x] TypeScript, React Navigation, New Architecture and Hermes
- [x] Domain models, parser, Base32 and RFC TOTP/HOTP engine
- [x] Branded shell and `com.anhnt.qrscan` identifiers

## Phase 01 — Scanner
- [x] CameraKit live camera and ML Kit image decoder behind a service boundary
- [x] Camera reticle, permission education state and flash control
- [x] Real-time QR/barcode detection, debounce and haptic feedback
- [x] Result bottom sheet, URL in-app browser/external open and typed actions
- [x] Confirmed TOTP/HOTP import flow

## Phase 02 — Result Handling & Actions
- [x] URL, text, phone, email, SMS and geo actions
- [x] Open Wi-Fi settings through native platform handoff
- [x] Add contacts through native platform handoff
- [x] Add calendar events through native platform handoff

## Phase 03 — History & Non-Secret Persistence
- [x] New-Architecture compatible `@op-engineering/op-sqlite` integration
- [x] SQLite history and authenticator metadata repositories
- [x] Search, filter, favorite, delete and clear actions
- [x] CSV/JSON history export

## Phase 04 — Authenticator (TOTP/HOTP)
- [x] iOS Keychain and Android Keystore-backed encrypted secret storage
- [x] Secure authenticator repository with metadata-only SQLite rows
- [x] TOTP/HOTP listing, countdown, copy and manual Base32 setup
- [x] Biometric gate for reveal secret and QR export
- [x] RFC SHA1/SHA256/SHA512 official test vectors

## Phase 05 — Generator
- [x] QR generator for text, URL, Wi-Fi, email and phone
- [x] Code 128 barcode generator
- [x] Share and save generated image to gallery

## Phase 06 — Polish, QA & Release
- [x] App lock with biometrics/device passcode
- [x] Settings screen and configurable URL action preference
- [x] Native Wi-Fi/contact/calendar action modules
- [x] Android release signing scaffold with ignored keystore configuration
- [ ] Physical iPhone and Android device QA
- [ ] Release signing and store metadata/signing assets
- [ ] Accessibility audit (VoiceOver/TalkBack) and release builds
- [x] Rebuild and install signed iOS Release after Generate-tab keyboard/back-navigation fixes
- [x] Vietnamese-first UI, back navigation, swipe actions, flash icon states, CameraKit zoom controls, scan copy, Auth countdown ring, and image clipboard actions
- [x] Lightning flash icon, draggable camera zoom slider, library wording, generated-code history (50-item cap), and conditional generator actions
- [x] Unified functional icon system, balanced icon/text swipe actions, favorite/delete icons, and consistent modal/action button spacing
- [x] Native splash resources without screenshot/device chrome
- [x] Supplied full-bleed iOS and adaptive Android launcher assets
- [x] Manifest-driven icon audit and corrected Authenticator right-to-left swipe direction
- [x] iOS launch branding, keyboard-safe authenticator forms, visible TOTP options, and Create history sheet spacing
- [x] Stable zoom slider gesture across tab switches and compact TOTP cards with expiry color warning
- [x] Google Authenticator migration QR preview, duplicate detection, and confirmed secure bulk import
- [x] Google Authenticator import shortcuts from empty Authenticator state and Settings
- [x] Long migration scan result layout and CameraKit QR format recognition fix
- [x] Compact Authenticator two-line rows with account search
- [x] Google Authenticator-compatible bulk export with biometric confirmation, QR batching, and retained circular countdown icon
- [x] Compact Authenticator header add menu for setup key and QR code
- [x] Android arm64-v8a release build/install verification on connected device
- [x] Fix Android scan crash caused by missing VIBRATE permission and make result presentation independent of history persistence
- [ ] Retest live QR and barcode scans on Active_3 after the VIBRATE fix
- [ ] Visually verify the theme-aware transparent scan-header logo on light and dark device themes
- [ ] Keep the wireless Android debug helper in the run workflow: ADB reverse mapping for Metro port 8081
- [x] Default URL actions to external browser and use one saved-preference action in scan results
- [ ] Confirm QR camera detection on Active_3 after disabling Android CameraKit format filtering
- [ ] Confirm Android TOTP countdown and code rollover on Active_3 after the Keystore timer fix
- [x] Assemble, locally sign, install and launch the current arm64-v8a Android Release candidate on Active_3
- [ ] Push the updated single `Init` commit after the final publish-candidate checks
