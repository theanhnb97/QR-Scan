# Handoff Log

Append newest entries at the top.

---

## 2026-09-20 — Compact Authenticator List and Search

Implemented:
- Reworked each Authenticator row into a compact two-line layout: `Issuer - account`, then code left and TOTP time right.
- Removed the large countdown ring from the list row while keeping the near-expiry danger color on code/time.
- Added search matching issuer, account name, and label, including a no-results state and clear-search action.

Verification:
- TypeScript: passed.
- Jest: 32 tests passed across 7 suites.
- ESLint quiet mode: passed.
- Android arm64-v8a Release build passed, signed with the local debug keystore for device testing, installed, and launched on `Active_3`.

---

## 2026-09-20 — Migration Scan Result UX Fix

Implemented:
- Bounded long result sheets with a scrollable content area and fixed action area so `Import accounts` and `Close` remain reachable.
- Accepted CameraKit's native `qr` format in scan detection handling.
- Replaced migration parsing's URL object dependency with encoded query extraction for long Google Authenticator payloads.

Verification:
- TypeScript: passed.
- Jest: 32 tests passed across 7 suites.
- ESLint quiet mode: passed.
- Android arm64-v8a Release build passed, signed with the local debug keystore for device testing, installed, and launched on `Active_3`.

---

## 2026-09-20 — Android Release Device Install

Verification:
- Regenerated `react-native-camera-kit` Android codegen after a stale generated C++/header mismatch blocked the first release build.
- Android arm64-v8a Release build passed.
- Because production keystore values are not configured, signed the APK with the repository debug keystore for local device testing only.
- Installed and launched `com.anhnt.qrscan` version `1.0` on `Active_3` (`0123456789ABCDEF`).

Remaining:
- Production release signing and broader physical-device QA remain pending.

---

## 2026-09-20 — Google Authenticator Migration Import

Implemented:
- Added a dependency-free protobuf decoder for Google Authenticator `otpauth-migration://offline` QR payloads.
- Added a transient migration model that converts supported SHA-1/SHA-256/SHA-512 TOTP/HOTP records into standard account inputs.
- Added a Scan result preview showing issuer/account metadata without displaying secrets.
- Added explicit confirmation, metadata duplicate detection, per-account secure save, and import summary reporting.
- Added import shortcuts from the empty Authenticator state and Settings; shortcuts open Scan and explain the Google export flow.
- Migration history stores only account count metadata; raw migration payloads and secrets are excluded.

Verification:
- TypeScript: passed.
- Jest: 31 tests passed across 7 suites.
- ESLint quiet mode: passed with no errors or warnings.
- `git diff --check`: passed.

Remaining:
- Physical device QA with a real Google Authenticator export QR remains pending.
- Microsoft Authenticator backup/cloud transfer is not imported directly; standard `otpauth://` QR/manual secret entry remains supported.

---

## 2026-09-20 — Zoom Slider Stability and Compact TOTP Cards

Implemented:
- Changed the Scan zoom slider to calculate movement from the gesture start value and `dx`, preventing value jumps caused by re-rendering while dragging after repeated tab switches.
- Added responder capture/termination handling and disabled touch handling on the moving slider fill/thumb.
- Removed the Authenticator row's secondary `time · tap to copy` line to reduce card height while keeping the code tap-to-copy action and countdown number in the ring.
- Added a gradual transition from the primary accent to danger red during the final 40% of each TOTP period.

Verification:
- TypeScript: passed.
- Jest: 29 tests passed across 7 suites.
- ESLint: 0 errors; existing crypto/UI warnings remain.
- `git diff --check`: passed.
- iOS Simulator Debug build: passed; artifact `/tmp/qrscanapp-zoom-totp-ios/Build/Products/Debug-iphonesimulator/QRScanApp.app`.
- Android Debug `:app:assembleDebug`: passed.

Remaining:
- Physical device QA should confirm the zoom gesture and TOTP color transition on iOS and Android hardware.

---

## 2026-09-20 — Splash Branding, Keyboard Avoidance, TOTP Actions, and Sheet Layout

Implemented:
- Added `QR Scan` plus `FAST | SAFE | IN YOUR HANDS` to the native iOS launch storyboard while preserving the native background/mark treatment.
- Added real `KeyboardAvoidingView` + scroll behavior and iOS Done accessories to Authenticator add/edit forms; disabled autocorrect/spell suggestions on generator fields and enabled automatic keyboard insets.
- Added a visible three-dot options action on every Authenticator row so Edit, Reveal secret, Export QR, and Delete are discoverable without long-press.
- Removed the intermediate child wrapper from `DismissibleBackdrop`, fixing the extra bottom gap in Create generated-history sheets while keeping outside-tap dismissal.

Verification:
- TypeScript: passed.
- Jest: 27 tests passed across 6 suites.
- Android Debug `:app:assembleDebug`: passed.
- iOS Simulator Debug build: running/verification pending final completion output.
- `git diff --check`: passed after whitespace cleanup.

Remaining:
- Physical iPhone keyboard, native splash, and TOTP export/share QA remain pending.

---

## 2026-09-20 — Native Splash, Launcher, Icon Audit, and Auth Swipe Direction

Agent/Developer:
AI Assistant

Implemented:
- Replaced the screenshot/mockup splash with native iOS LaunchScreen resources and AndroidX SplashScreen resources using the supplied centered mark plus light/dark backgrounds.
- Replaced iOS launcher artwork with the supplied full-bleed 1024px master and Android launcher resources with supplied adaptive foreground/background assets.
- Added `docs/ICON_AUDIT.md` as the manifest-driven semantic mapping audit and kept functional controls on the shared SVG `AppIcon` system.
- Corrected Authenticator rows to use right-to-left swipe (`direction="left"`) with right-side Edit/Delete actions; retained one-open-row behavior, vertical-scroll filtering, confirmation, and secure-secret deletion.
- Corrected the Authenticator accessibility hint to describe the actual gesture and actions.

Verification:
- TypeScript: passed.
- Jest: 27 tests passed across 6 suites.
- ESLint: 0 errors; existing crypto/UI warnings only.
- `git diff --check`: passed.
- iOS Simulator Debug build: passed; artifact `/tmp/qrscanapp-splash-icons-ios/Build/Products/Debug-iphonesimulator/QRScanApp.app`.
- Android Debug `:app:assembleDebug`: passed; artifact `android/app/build/outputs/apk/debug/app-debug.apk`.

Remaining:
- Physical cold-launch splash inspection and Authenticator swipe test cases on iOS/Android devices remain pending.
- Android production signing and store metadata remain pending.

---

## 2026-09-20 — iOS AppIcon Border Fix

Implemented:
- Confirmed the white border came from the smaller iOS AppIcon PNGs containing pre-rounded white-background artwork.
- Regenerated all iPhone/iPad AppIcon PNG slots directly from `assets/source-v2/app-icon/ios/qr_scan_app_icon_master_1024.png`.
- Kept the asset catalog full-bleed so iOS applies its own rounded mask exactly once.

Verification:
- All AppIcon PNGs have the expected pixel dimensions and no alpha channel.
- iOS Simulator Debug build passed; artifact `/tmp/qrscanapp-icon-fix-ios/Build/Products/Debug-iphonesimulator/QRScanApp.app`.
- `git diff --check`: passed.

Known limitations:
- Physical iPhone home-screen appearance should be rechecked after reinstalling the updated build because SpringBoard caches icons.

---

## 2026-09-20 — Functional Icon Consistency Pass

Agent/Developer:
AI Assistant

Implemented:
- Extended the shared `AppIcon` SVG set with favorite, delete, and add icons; aligned flash rendering to the common stroke style.
- Added icon-backed History and Authenticator swipe actions and replaced the remaining History favorite Unicode glyph.
- Added consistent icon-plus-label layout to authenticator add/save/share actions with balanced touch spacing.
- Kept raster logo assets only for branded empty/loading states.

Verification:
- TypeScript: passed.
- Jest: 27 tests passed across 6 suites.
- ESLint: 0 errors; existing crypto/UI warnings only.
- `git diff --check`: passed.

Remaining:
- Physical VoiceOver/TalkBack and device visual QA remain part of the release checklist.

---

## 2026-09-19 — Vietnamese UI and Scanner/History/Auth UX Pass

Agent/Developer:
AI Assistant

Implemented:
- Added Vietnamese-first localization with an English switch in Settings.
- Added back buttons in History, Authenticator, and Create headers.
- Added right-to-left History swipe actions for favorite/delete without an inline delete X.
- Added right-swipe Authenticator actions for QR sharing and delete, circular countdown progress, and copy feedback.
- Added Scan flash icon states, 1x/1.5x/2x/3x CameraKit zoom controls, and copy-content result action.
- Added Create explicit Generate action, stable preview rendering, icon actions, and native image clipboard support.
- Added image-scan history failure fallback so a readable result remains visible.

Verification:
- TypeScript: passed.
- Jest: 27 tests passed across 6 suites.
- ESLint: 0 errors; existing warnings only.
- Android Debug build: passed.
- iOS Simulator Debug build: passed.
- Signed iOS Release device build: passed; installed and launched on iPhone `00008020-001825812638002E` as `com.anhnt.qrscan`.
- Final signed iOS Release artifact: `/tmp/qrscanapp-device-release-ui-final/Build/Products/Release-iphoneos/QRScanApp.app`; Android Release assembly also passed and remains unsigned without production credentials.

Remaining:
- Physical tap/gesture QA for swipe rows, camera zoom/flash, clipboard image, Photos, biometrics, and generated-code rescan.
- Android production keystore/store assets remain pending.

---

## 2026-09-19 — Final iOS Release Build and Generate UX Verification

Agent/Developer:
AI Assistant

Implemented:
- Rebuilt the signed iOS Release configuration after the latest Create/Generate screen changes.
- Confirmed the generated JavaScript bundle contains the keyboard dismissal and “Back to Scan” controls.
- Installed and launched `/tmp/qrscanapp-device-release-final/Build/Products/Release-iphoneos/QRScanApp.app` on iPhone `00008020-001825812638002E` using bundle ID `com.anhnt.qrscan`.

Verification:
- TypeScript: passed.
- Jest: 27 tests passed across 6 suites.
- iOS Release device build: passed.
- iOS Release artifact install and launch: passed; React Native JS evaluation reached without an application crash.

Remaining:
- Manual hands-on QA of keyboard dismissal, scanner, camera permissions, biometrics, Photos save, native actions, and Android device behavior.
- Production Android keystore and store metadata remain pending.

---

## 2026-09-19 — Security Polish, Native Actions, and Release Assets

Agent/Developer:
AI Assistant

Implemented:
- Added SQLite-backed app settings, app-lock lifecycle gate, settings sheet, and configurable in-app/external URL behavior.
- Added safe CSV/JSON history export from an explicit sanitized-field allowlist.
- Added authenticator metadata editing without touching secure credentials.
- Added `NativeActionService` plus Android Kotlin intents and iOS Swift Contacts/EventKit/Settings handoffs, with share fallbacks.
- Fixed scanner flash hit testing and multiple-image-code selection history recording.
- Generated iOS and Android launcher icons from supplied assets.

Verification:
- TypeScript passes.
- Jest: 26 tests pass across 6 suites.
- Android Debug and Release builds pass; release APK is at `android/app/build/outputs/apk/release/app-release.apk`.
- iOS Simulator Debug build passes after Swift native action integration.
- Metro iOS bundle passes.

Remaining:
- Physical iPhone/Android QA, Apple Team selection, production Android keystore, and store metadata/signing remain.

---

## 2026-09-19 — Core Product Flows and Secure Persistence Implemented

Agent/Developer:
AI Assistant

Scope:
Continue from the scanner build and replace the remaining mock data/security layers while completing the P0 UI flows.

Implemented:
- Added `react-native-keychain` 10.0.0 adapter for iOS Keychain and Android Keystore-backed AES-GCM storage.
- Added `@op-engineering/op-sqlite` 18.2.4 schema/repositories for sanitized history and authenticator metadata; no secret column exists.
- Added native biometric USER_PRESENCE gate for reveal and QR export.
- Added Authenticator account list, countdown, copy, manual Base32 TOTP setup, delete, reveal and export QR.
- Added History search/favorites/delete/clear controls.
- Added typed result actions, URL WebView/external open, TOTP confirmation import and scanner flash control.
- Added QR/Code 128 generator with share/save image actions.
- Corrected SHA256/SHA512 TOTP implementation and added RFC vector tests.

Tests/builds:
- TypeScript: passed.
- Jest: 24/24 passed.
- ESLint: 0 errors, existing crypto/UI warnings only.
- Metro iOS bundle: passed.
- iOS Simulator Debug: `xcodebuild` passed with 13 autolinked native modules.
- Android Debug: `./gradlew :app:assembleDebug` passed, including op-sqlite CMake builds.

Known limitations:
- Physical iPhone/Android camera, biometrics, Photos and native action QA is still required.
- Wi-Fi connection, contact insertion, calendar insertion, app lock/settings and history export remain pending.
- Release signing, final icons/splash and store validation remain pending.

Exact next task:
Run the app on a connected iPhone using Xcode with Team selected, then finish native Wi-Fi/contact/calendar actions and app-lock/settings UX.

---

## 2026-09-19 — Camera Scanner Build Stabilized

Agent/Developer:
AI Assistant

Scope:
Make Phase 01 scanner native builds work with the installed Xcode 16.4 and Android SDK.

Implemented:
- Replaced VisionCamera 5.2.3 with CameraKit 16.2.1 for live scanning.
- Added ML Kit barcode scanning 2.0.0 for selected-image scanning.
- Added `react-native-permissions` camera setup and haptic feedback on detections.
- Preserved the scanner service boundary in `src/services/scanner/CameraKitAdapter.tsx`.
- Removed VisionCamera/Nitro native dependencies and regenerated CocoaPods/codegen.

Tests run:
- TypeScript: passed.
- Jest: 20/20 tests passed.
- ESLint: passed with existing warnings only.
- iOS Simulator Debug: `xcodebuild ... CODE_SIGNING_ALLOWED=NO build` passed.
- Android Debug: `ANDROID_HOME=/Users/mac/Library/Android/sdk ./gradlew :app:assembleDebug` passed.

Security/privacy notes:
- Barcode decoding remains on-device; no camera frames or payloads are uploaded.
- Haptic feedback contains no payload data.

Known limitations:
- Camera behavior on the physical iPhone still needs a device run and permission prompt check.
- Secure Keychain/Keystore storage, SQLite history, biometrics, and generator remain pending phases.

Exact next task:
Implement the native secure credential store and authenticator repository before adding TOTP account UI.

---

## 2026-09-19 — Platform Application Identifier Updated

Agent/Developer:
AI Assistant

Scope:
Keep iOS and Android application identifiers aligned with the requested product identifier.

Implemented:
- Confirmed iOS Debug and Release `PRODUCT_BUNDLE_IDENTIFIER` values are `com.anhnt.qrscan`.
- Changed Android `namespace`, `applicationId`, and native Kotlin package declarations to `com.anhnt.qrscan`.
- Preserved the existing iOS development team setting for device signing.

Tests run:
- Searched platform configuration and source package declarations for stale default identifiers.
- TypeScript and Jest checks remain unchanged from the prior handoff.

Security/privacy notes:
- Identifiers contain no secret or user data.

Known limitations:
- The Apple Team and connected iPhone must still be selected in Xcode for an on-device run.

Exact next task:
Open `ios/QRScanApp.xcworkspace`, select the signing Team and connected iPhone, then run.

---

## 2026-09-19 — iOS Bundle Identifier Updated

Agent/Developer:
AI Assistant

Scope:
Fix Apple registration failure caused by the React Native template bundle identifier.

Implemented:
- Changed Debug and Release `PRODUCT_BUNDLE_IDENTIFIER` values in `ios/QRScanApp.xcodeproj/project.pbxproj` to `com.anhnt.qrscan`.
- Preserved the existing `DEVELOPMENT_TEAM` value for device signing.

Tests run:
- Searched iOS project settings to confirm no `org.reactjs.native.example` identifier remains.

Security/privacy notes:
- Bundle identifier contains no secret or user data.

Known limitations:
- Apple Developer registration now uses the project-specific identifier `com.anhnt.qrscan`.

Exact next task:
Open the iOS target in Xcode, confirm Team and automatic signing, then run on the connected iPhone.

---

## 2026-09-19 — Brand Assets Integrated

Agent/Developer:
AI Assistant

Scope:
Integrate the newly supplied `assets/` package into the Phase 00 React Native shell.

Implemented:
- Centralized raster asset references in `src/ui/assets.ts`.
- Applied approved theme tokens from `assets/theme/qr_scan_theme.json`.
- Added primary logo and mark usage to Scan, History, Auth, and Create states.
- Added the required `Scan from Image` secondary action to the Scan permission state.
- Added branded Scan tab icon and accessible image labels.
- Added a TypeScript declaration for Node/Jest `TextEncoder` and `TextDecoder` globals.
- Updated Jest config/test smoke coverage for the ESM React Navigation dependency.

Changed modules/files:
- `src/ui/assets.ts`
- `src/ui/theme/colors.ts`
- `src/ui/screens/ScanScreen.tsx`
- `src/ui/screens/HistoryScreen.tsx`
- `src/ui/screens/AuthScreen.tsx`
- `src/ui/screens/CreateScreen.tsx`
- `src/ui/navigation/RootNavigator.tsx`
- `jest.config.js`
- `__tests__/App.test.tsx`
- `types/test-globals.d.ts`
- `memory/CURRENT_STATE.md`
- `memory/DECISIONS.md`
- `memory/TODO.md`
- `memory/CHANGELOG.md`

Tests run:
- `./node_modules/.bin/jest --runInBand --no-cache --env=node __tests__/TotpGenerator.test.ts __tests__/ContentParser.test.ts __tests__/App.test.tsx`: 18 passed, 0 failed.
- `./node_modules/.bin/tsc --noEmit`: passed.
- `npm run lint`: passed with existing non-blocking warnings in crypto bitwise code and tab icon callbacks.

Security/privacy notes:
- Assets contain no secrets or scan payloads.
- The app icon concept is not used as a security or credential asset.

Known limitations:
- Native launch splash and final iOS/Android store icon exports remain pending.
- Scanner camera implementation remains Phase 01 work.

Release blockers:
- None added by this asset integration.

Docs/memory updated:
- `memory/CURRENT_STATE.md`
- `memory/DECISIONS.md`
- `memory/TODO.md`
- `memory/HANDOFF_LOG.md`
- `memory/CHANGELOG.md`

Exact next task:
Start Phase 01 scanner capability selection and native camera permission implementation.

---

## 2025-09-19 — Phase 00 (Foundation) Complete

Agent/Developer:
AI Assistant

Scope:
Complete Phase 00 (Foundation) for the bare React Native QR Scan & 2FA Authenticator application according to `docs/implementation/PHASE_00_FOUNDATION.md`, `docs/03_UI_UX_SPEC.md`, and `MASTER_AGENT_PROMPT.md`.

Implemented:
- Bare React Native 0.87.1 project with New Architecture and Hermes enabled. Native directories under `/ios` and `/android`.
- Core domain models: `ScannedContent.ts`, `ScanHistoryItem.ts`, and `AuthenticatorAccount.ts`.
- Domain interfaces: `src/domain/interfaces.ts` for parser, repositories, credential store, and OTP generator.
- RFC 4648 Base32 implementation (`src/domain/otp/Base32.ts`).
- RFC 4226 / RFC 6238 compliant TOTP generator (`src/domain/otp/RfcTotpGenerator.ts`).
- Typed content parser (`src/domain/parsers/ContentParser.ts`) supporting `otpauth://`, `WIFI:`, `mailto:`, `tel:`, `sms:`, `BEGIN:VCARD`, `MECARD:`, `geo:`, `BEGIN:VEVENT`, and URLs.
- Mock repositories for UI shell: `MockSecureCredentialStore`, `MockHistoryRepository`, `MockAuthenticatorRepository`.
- UI theme colors matching design specs (`src/ui/theme/colors.ts`).
- Navigation tabs and screens: `ScanScreen`, `HistoryScreen`, `AuthScreen`, `CreateScreen`, `RootNavigator`, and `App.tsx`.
- Unit test suites: `__tests__/TotpGenerator.test.ts` and `__tests__/ContentParser.test.ts`.

Changed modules/files:
- `App.tsx`
- `__tests__/App.test.tsx`
- `__tests__/TotpGenerator.test.ts`
- `__tests__/ContentParser.test.ts`
- `src/domain/models/*`
- `src/domain/interfaces.ts`
- `src/domain/otp/*`
- `src/domain/parsers/*`
- `src/data/mock/*`
- `src/ui/screens/*`
- `src/ui/navigation/*`
- `src/ui/theme/*`
- `memory/*`

Tests run:
- `./node_modules/.bin/jest --runInBand --no-cache --env=node __tests__/TotpGenerator.test.ts __tests__/ContentParser.test.ts`: 17 passed, 0 failed.
- TypeScript transpile verification across all 17 source/test files: 0 errors.

Security/privacy notes:
- `safeValue` in `ScanHistoryItem` strictly excludes TOTP secrets and Wi-Fi passwords.
- Transient OTP provisioning models keep secret keys in memory only; never stored in history or normal databases.
- `AuthenticatorAccount` decouples secrets, pointing to native secure storage via `credentialId`.

Known limitations:
- Sandboxed execution container blocks local loopback socket creation (`EPERM 0.0.0.0`), preventing local Gradle daemon lock sockets. Native builds are directly buildable via Xcode and Android Studio outside the sandbox.

Release blockers:
- None for Phase 00.

Docs/memory updated:
- `memory/CURRENT_STATE.md`
- `memory/DECISIONS.md`
- `memory/TODO.md`
- `memory/HANDOFF_LOG.md`
- `memory/CHANGELOG.md`

Exact next task:
Start Phase 01: Scanner implementation per `docs/implementation/PHASE_01_SCANNER.md`.

---

## 2026-09-19 — Final Consolidated Build Verification

Implemented:
- Completed the single consolidated verification run requested for the current workspace.
- iOS Simulator Debug and Release builds both passed with `CODE_SIGNING_ALLOWED=NO`.
- Android Debug and Release APK builds, TypeScript, Jest, lint, and Metro bundle had already passed in the same run.

Artifacts:
- iOS Debug: `/tmp/qrscanapp-final-ios-debug/Build/Products/Debug-iphonesimulator/QRScanApp.app`
- iOS Release: `/tmp/qrscanapp-final-ios-release/Build/Products/Release-iphonesimulator/QRScanApp.app`
- Android Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Android Release: `android/app/build/outputs/apk/release/app-release.apk` (debug-signed)

Known limitations:
- This verifies simulator/build artifacts only; physical iPhone and Android QA, Apple Team/device signing, and production Android signing remain pending.

Docs/memory updated:
- `memory/CURRENT_STATE.md`
- `memory/HANDOFF_LOG.md`

Exact next task:
Run the app on the connected iPhone with Team `com.anhnt.qrscan` and complete physical-device camera, biometric, gallery, and native-action QA.

---

## 2026-09-19 — Device Signing, Permission and Release Hardening

Implemented:
- Added `@react-native/assets-registry@0.87.1` so `react-native-svg` bundles reliably with React Native 0.87.1 device builds.
- Added Face ID usage text, iOS add-only Photos authorization, narrower Android save permissions, history-save error recovery, and accessibility labels/state for core controls.
- Added environment/file-based Android release signing with an explicit unsigned fallback and a non-secret example file.

Device verification:
- Signed iOS Debug build passed with Team `3QUZ24Y9QT` and provisioning profile `com.anhnt.qrscan`.
- Artifact installed and launched on the connected iPhone using `xcrun devicectl`; console startup reached React Native/Metro without an application crash.
- Android `:app:assembleRelease` passed after signing changes and produced `android/app/build/outputs/apk/release/app-release-unsigned.apk`.
- TypeScript passed; Jest passed 27 tests; lint passed with existing warnings; `npm audit --omit=dev` found 0 vulnerabilities.

Known limitations:
- Hands-on scanner, biometric, Photos, native action, generated-code rescan, and Android physical-device QA remain pending.
- Android production keystore, signed APK/AAB, store screenshots, privacy metadata, and license notices remain pending.

Docs/memory updated:
- `memory/CURRENT_STATE.md`
- `memory/TODO.md`
- `memory/KNOWN_ISSUES.md`
- `memory/CHANGELOG.md`
- `memory/DECISIONS.md`
- `docs/09_RELEASE_CHECKLIST.md`
- `README.md`

Exact next task:
Run the installed app through the physical iPhone QA matrix, then supply production Android signing values and archive the iOS Release configuration.

---

## 2026-09-19 — Scan and Generator UX Refinement

Implemented:
- Replaced the Scan flash control glyph with a lightning bolt.
- Replaced discrete zoom presets with a core React Native draggable slider from 1x to 5x.
- Renamed image scanning to `Choose from library` in the localized UI.
- Replaced the Authenticator tab dot with a key icon.
- Added a Create-screen generated-code history modal backed by SQLite and capped at 50 records.
- Kept Wi-Fi passwords out of generated history; only the network name is retained.
- Hid share, save, and copy-image actions until a QR/barcode has been successfully generated.

Verification:
- TypeScript: passed.
- Jest: 27 tests passed across 6 suites.
- ESLint: 0 errors; existing crypto/UI warnings remain.
- Android Debug assemble: passed.
- iOS Simulator Debug build: passed; artifact `/tmp/qrscanapp-ui-final-ios/Build/Products/Debug-iphonesimulator/QRScanApp.app`.

Known limitations:
- Physical-device interaction QA for the slider and generated-history modal remains pending.
- This session verifies the simulator build; device Release should be rerun if a signed artifact is required for this exact change set.

Docs/memory updated:
- `docs/03_UI_UX_SPEC.md`
- `docs/09_RELEASE_CHECKLIST.md`
- `memory/CURRENT_STATE.md`
- `memory/TODO.md`
- `memory/CHANGELOG.md`
- `memory/DECISIONS.md`
- `memory/HANDOFF_LOG.md`

---

## 2026-09-19 — TOTP Navigation and Sheet Dismissal Polish

Implemented:
- Replaced the Authenticator tab icon with a custom circular clock/timer glyph matching the TOTP countdown concept.
- Moved Create generated-history access into the navigation header immediately beside Settings; removed the in-content history control so generator boxes no longer shift.
- Added a shared dismissible backdrop wrapper to Scan result/multiple-code sheets, Authenticator sheets, Settings, and Create generated history.
- Create header history action opens the existing modal through typed navigation params.

Verification:
- TypeScript: passed.
- Jest: 27 tests passed across 6 suites.
- ESLint: 0 errors; existing warnings remain.
- Android Debug assemble: passed.
- iOS Simulator Debug build: passed with `xcodebuild -quiet`.
- `git diff --check`: passed.

Known limitations:
- Physical-device interaction QA for header history and tap-outside dismissal remains pending.

---

## 2026-09-20 — Continued Final Validation

Implemented:
- Removed the remaining trailing whitespace in `AuthScreen.tsx`.
- Revalidated the native iOS launch storyboard, keyboard-safe forms, visible Authenticator secure-action entry point, and Create history sheet changes without further code changes.

Verification:
- TypeScript: passed.
- Jest: 6 suites / 27 tests passed.
- ESLint: 0 errors; existing crypto/native/UI warnings remain.
- `git diff --check`: passed.
- iOS Simulator Debug build: passed; artifact `/tmp/qrscanapp-final-continued-ios/Build/Products/Debug-iphonesimulator/QRScanApp.app`.
- Android Debug assemble: passed; artifact `android/app/build/outputs/apk/debug/app-debug.apk`.

Known limitations:
- Physical-device interaction QA for cold-launch splash timing, keyboard dismissal, biometric export/share, and Create history spacing remains pending.
- Android production signing and store metadata remain pending.

---

## 2026-09-20 — Authenticator Bulk Export and Countdown Ring

Implemented:
- Added Google Authenticator-compatible bulk migration QR export from the Authenticator list and Settings.
- Added biometric/device authentication and explicit secret warning before export.
- Added QR batch navigation and share support for large account sets.
- Kept the compact circular countdown icon beside each TOTP code and preserved the near-expiry red transition.
- Skipped custom-period TOTP accounts with a visible compatibility warning.
- Moved Add account to the top-right Authenticator header and split it into setup-key and QR-code actions.

Verification:
- TypeScript: passed.
- Jest: 8 suites / 34 tests passed.
- ESLint: passed.
- git diff check: passed.
- Android arm64-v8a Release build: passed.
- Locally debug-signed APK installed and launched on Active_3 (0123456789ABCDEF).

Known limitations:
- Google Authenticator/other authenticator physical scan interoperability and biometric/share interaction still need hands-on device QA.
- Android production signing and store metadata remain pending.

Docs/memory updated:
- docs/03_UI_UX_SPEC.md
- docs/09_RELEASE_CHECKLIST.md
- memory/CURRENT_STATE.md
- memory/TODO.md
- memory/DECISIONS.md
- memory/CHANGELOG.md
- memory/HANDOFF_LOG.md

---

## 2026-09-20 — Android Device Install

Verification:
- Built the current arm64-v8a Android Release APK.
- Signed it with the local debug keystore for device-only testing.
- Installed over the existing app on Active_3 (0123456789ABCDEF).
- Relaunched com.anhnt.qrscan successfully.

Known limitations:
- This is a local debug-signed install, not a production release signature.

---

## 2026-09-22 - Android scanner crash fix

Implemented:
- Added Android `VIBRATE` permission and a defensive haptic fallback around scan feedback.
- Present scan results immediately instead of waiting for history persistence.
- Normalized CameraKit format callbacks, enabled autofocus explicitly, and limited Android barcode types to native-supported formats.

Verification:
- `npx tsc --noEmit` passed.
- Jest: 34/34 passed.
- ESLint and `git diff --check` passed.
- Android arm64-v8a Release APK assembled, signed with the local debug keystore, installed on `Active_3` (`192.168.6.48:5555`), and launched without a new crash.
- Crash buffer confirmed the original failure: `SecurityException: Requires VIBRATE permission` after a scan callback.

Known limitations:
- A physical QR/barcode scan still needs to be performed on the updated APK to confirm the end-to-end result sheet.

---

## 2026-09-22 - Scan header logo and debug install

Implemented:
- Added the theme-aware transparent QR Scan mark to the left side of the Scan camera header.
- Repaired the dark logo PNG alpha channel so it no longer renders an opaque white rectangle.

Verification:
- Android arm64-v8a Debug APK assembled and installed on `Active_3` (`192.168.6.48:5555`).
- Metro dev server running on port 8081 for fast reloads.
- TypeScript, Jest (34/34), ESLint, and `git diff --check` passed.

Operational note:
- `Active_3` is connected wirelessly. Before Android Debug launch/reload, run `adb reverse tcp:8081 tcp:8081`; verified active with `adb reverse --list`.

URL behavior:
- New installations default to the external browser.
- Existing saved `in_app`/`external` preferences are preserved.
- URL result sheets show one action only and follow the saved preference.

Android QR follow-up:
- CameraKit native code supports `qr`, but Android filtering could discard a valid detection before JS when the reported format differs.
- Disabled the Android `allowedBarcodeTypes` filter while retaining the explicit iOS list.
- Reloaded the Debug app on `Active_3` through wireless ADB with `adb reverse tcp:8081 tcp:8081` active.
- TypeScript, Jest (36/36), ESLint, and `git diff --check` passed.
- Physical QR retest remains pending.

Android TOTP timer follow-up:
- Compared Mac and Android epoch time: identical at verification; Android automatic time and timezone are enabled.
- Reworked `AuthScreen` so Android Keystore secrets are loaded once per account-list change and the countdown uses a non-overlapping synchronous interval.
- Reloaded Debug app on `Active_3` with wireless ADB Metro reverse mapping active; no new crash logged.
- Physical countdown/code rollover retest remains pending.

---

## 2026-09-20 — Pre-publish Git History Sanitization

Implemented:
- Reduced `main` to exactly one root commit named `Init`.
- Removed `android/app/debug.keystore` from the published tree and stopped allowing debug keystores in `.gitignore`.
- Preserved the local debug keystore file outside Git so device-only builds continue to work.

Verification:
- `git rev-list --count main`: 1.
- `android/app/debug.keystore` is not tracked.
- No PEM/private-key or high-signal cloud-token matches found in the new `main` tree.

Known limitations:
- The existing uncommitted Xcode scheme change remains outside the `Init` commit and should not be added accidentally when preparing the push.

## 2026-09-22 - Android Release Publish Candidate

Implemented:
- Assembled `android/app/build/outputs/apk/release/app-release-unsigned.apk` for `arm64-v8a`.
- Created and verified `/tmp/qrscan-app-release-debug-signed-publish.apk` with the ignored local debug keystore.

Verification:
- Reconnected wireless `Active_3` at `192.168.6.49:5555` after its address changed.
- Mapped Metro with `adb reverse tcp:8081 tcp:8081`.
- Installed and launched `com.anhnt.qrscan` successfully; Android reports `android.permission.VIBRATE` granted.

Known limitations:
- This is a debug-signed device artifact, not a production/store-signed APK. Production keystore and store metadata remain pending.
