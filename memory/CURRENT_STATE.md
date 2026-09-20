# Current State

Status: **Core flows, native splash/launcher, icon audit, and security polish implemented; physical-device/store QA pending**

## Completed
- Bootstrapped bare React Native 0.87.1 project with New Architecture and Hermes enabled.
- Native iOS project shell configured in `/ios`.
- Native Android project shell configured in `/android` with JDK 17.
- Installed React Navigation stack (`@react-navigation/native`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`).
- Defined strongly-typed core domain models:
  - `ScannedContent.ts`: typed union covering plain text, URLs, Wi-Fi, email, phone, SMS, contact, location, calendar event, product barcodes, ISBN, and transient TOTP/HOTP models where secrets stay in memory only.
  - `ScanHistoryItem.ts`: sanitized persistence model ensuring secrets and Wi-Fi passwords are never written to unencrypted history.
  - `AuthenticatorAccount.ts`: authenticator account model decoupled from secrets, referencing native Keychain/Keystore via `credentialId`.
- Defined domain contracts in `src/domain/interfaces.ts`:
  - `ContentParser`
  - `HistoryRepository`
  - `SecureCredentialStore`
  - `AuthenticatorRepository`
  - `OtpGenerator`
- Implemented zero-dependency RFC 4648 Base32 engine (`src/domain/otp/Base32.ts`).
- Implemented RFC 4226 / RFC 6238 compliant TOTP generator with pure TypeScript SHA-1, SHA-256, SHA-512 and HMAC (`src/domain/otp/RfcTotpGenerator.ts`).
- Implemented robust URI and payload parser (`src/domain/parsers/ContentParser.ts`) for `otpauth://`, `WIFI:`, `mailto:`, `tel:`, `sms:`, `BEGIN:VCARD`, `MECARD:`, `geo:`, `BEGIN:VEVENT`, and URLs.
- Implemented mock repositories for UI foundation:
  - `MockSecureCredentialStore`
  - `MockHistoryRepository`
  - `MockAuthenticatorRepository`
- Implemented four-tab navigation shell and screens conforming to `docs/03_UI_UX_SPEC.md`:
  - `ScanScreen`: live camera/image scan, flash, reticle, typed result actions, URL WebView/external open, TOTP confirmation.
  - `HistoryScreen`: SQLite-backed search, favorites, delete, clear and error/empty states.
  - `AuthScreen`: SQLite-backed TOTP/HOTP list, countdown, copy, manual add, delete, biometric reveal and QR export.
  - `CreateScreen`: QR generation for text/URL/Wi-Fi/email/phone, Code 128 generation, share and Photos save.
  - `RootNavigator`: bottom tab navigation with dark mode and accessibility labels.
  - `App.tsx`: wired with `SafeAreaProvider` and `RootNavigator`.
- Integrated the supplied brand assets under `assets/`:
  - Logo mark and primary lockup are used in the Scan, History, Auth, and Create shell states.
  - Theme tokens now match `assets/theme/qr_scan_theme.json` (blue primary, navy, mint, light/dark surfaces).
  - Scan tab includes the required `Choose from library` secondary action.
  - Asset imports are centralized in `src/ui/assets.ts` for future native splash/app-icon wiring.
- Replaced the React Native template platform identifiers with `com.anhnt.qrscan` for Apple device signing and Android application packaging.
- Added SQLite-backed app settings, app-lock lifecycle gate, configurable URL behavior, and safe CSV/JSON history export.
- Added focused native smart-action adapters for Android Wi-Fi/contact/calendar intents and iOS Wi-Fi settings/Contacts/EventKit handoffs, with share fallbacks.
- Added authenticator metadata editing and generated iOS/Android launcher icon assets from the supplied brand icon.
- Corrected escaped Wi-Fi field parsing so generated network QR payloads round-trip reliably.
- Added the official React Native asset registry package required by `react-native-svg` 15.15.5 for deterministic Metro device bundling.
- Added Face ID usage text, platform-correct Photos save permission handling, and broader accessibility labels/state across core screens.
- Added Android release signing configuration via ignored `android/keystore.properties` or `QRSCAN_*` environment variables; release builds are unsigned until a production keystore is supplied.
- Added Vietnamese-first UI localization with an English switch in Settings.
- Added shared swipe actions for History and Authenticator, header back actions, Scan flash icon states, CameraKit zoom controls, result copy action, Google Authenticator-style countdown ring, copy feedback, and native image clipboard support on iOS/Android.
- Updated Scan flash to a lightning icon, replaced zoom presets with a draggable 1x-5x slider, renamed image import to Choose from library, and replaced the Auth tab dot with a circular TOTP timer icon.
- Moved Create generated-history access into the native header action group beside Settings and made all bottom sheets dismissible by tapping the dimmed backdrop.
- Added SQLite-backed generated-code history capped at 50 records. Wi-Fi history stores only the SSID; share/save/copy actions remain hidden until a code is generated.
- Standardized functional icons through `src/ui/components/AppIcon.tsx`: SVG stroke geometry, theme-driven colors, fixed size tiers, and icon-backed swipe actions. Brand raster logos remain limited to branded empty/loading states.
- Replaced the legacy screenshot splash with native iOS/Android splash resources using the supplied centered mark and light/dark backgrounds; replaced launcher catalogs with supplied full-bleed iOS and adaptive Android assets.
- Completed `docs/ICON_AUDIT.md` against `assets/source-v2/icons/icon-manifest.json`; Authenticator rows now reveal right-side Edit/Delete actions on a right-to-left swipe.
- Added a branded iOS launch title/tagline, keyboard-safe Authenticator add/edit sheets, a visible Authenticator options button for secure reveal/export/delete, and a wrapper-free dismissible sheet backdrop for Create history spacing.
- Stabilized the Scan zoom slider across repeated tab switches by using gesture deltas from a fixed start value and preventing the moving thumb/fill from intercepting touch events.
- Reduced Authenticator row height by removing the secondary time/copy hint; TOTP code and countdown ring now shift toward the danger color near period expiry.
- Added Google Authenticator migration QR parsing, non-secret account preview, duplicate detection, and explicit secure bulk import into Keychain/Keystore-backed credentials.
- Added Google Authenticator import entry points in the empty Authenticator state and Settings; both open Scan with export instructions because another app's private storage cannot be read directly.
- Fixed long QR result sheets so action buttons remain visible, accepted CameraKit's `qr` format, and made migration URI extraction robust for encoded query payloads.
- Redesigned Authenticator rows into compact two-line issuer/account and code/time items, and added search across issuer, account name, and label.
- Added Google Authenticator-compatible bulk export from the Authenticator list and Settings, with biometric confirmation, sequential QR batches, and a visible warning for custom-period accounts that cannot be represented by the migration format.
- Kept the compact circular TOTP countdown icon beside each code while preserving the near-expiry danger-color transition.
- Moved Add account to the Authenticator header as a compact plus action with setup-key and QR-code choices; removed the fixed bottom add button.
- Comprehensive unit test coverage verified:
  - Base32 encoding/decoding & edge cases.
  - RFC 6238 official test vectors at specified timestamps.
  - Scanned content parser across all supported schemas.
  - 34/34 tests passing cleanly, including migration export round-trip and batch-splitting coverage.

## Persistence and security
- `@op-engineering/op-sqlite` 18.2.4 stores only history/authenticator metadata.
- `react-native-keychain` 10.0.0 stores TOTP/HOTP secrets using iOS Keychain and Android Keystore-backed AES-GCM storage.
- Native biometric gate is used for reveal/export actions; no JS boolean is treated as the security boundary.
- Generated OTPs and raw provisioning URIs remain transient and are not persisted/logged.

## Current recommended next task
Run on a physical iPhone and Android device with the selected signing team, then complete release signing and store QA.

## Build & Test status
- React Native: 0.87.1 (New Architecture + Hermes)
- Unit Tests: 34/34 passing (`TotpGenerator`, `ContentParser`, `HistorySanitizer`, `Persistence`, app smoke test, history export, UI helpers, Google migration, migration export).
- TypeScript: `tsc --noEmit` passes.
- TypeScript: `tsc --noEmit` passes.
- Lint: passes with existing warnings for intentional bitwise crypto operations and React Navigation callback icon definitions.
- Platform Builds:
  - iOS Simulator Debug build: passed in the final consolidated build at `/tmp/qrscanapp-final-ios-debug/Build/Products/Debug-iphonesimulator/QRScanApp.app`.
- iOS Simulator Release build: passed in the final consolidated build at `/tmp/qrscanapp-final-ios-release/Build/Products/Release-iphonesimulator/QRScanApp.app`.
- iOS device Debug build: passed with Team `3QUZ24Y9QT`, installed and launched on the connected iPhone as `com.anhnt.qrscan`.
  - Android Debug APK build: passed with `ANDROID_HOME=/Users/mac/Library/Android/sdk ./gradlew :app:assembleDebug` (includes op-sqlite CMake and native smart actions).
- Android Release APK build: passed; output at `android/app/build/outputs/apk/release/app-release.apk`.
- Android Release build after signing-boundary update: passed; output is `android/app/build/outputs/apk/release/app-release-unsigned.apk` until production keystore values are supplied.
  - Metro iOS release bundle: passed with `npx react-native bundle`.
- Final consolidated verification run completed on 2026-09-19; post-fix verification also passed TypeScript, 27 Jest tests, lint, signed iOS device build/install/launch, and Android release assembly.
- Final signed iOS Release rebuild after the Generate-tab keyboard/back-navigation patches passed on 2026-09-19. Artifact: `/tmp/qrscanapp-device-release-final/Build/Products/Release-iphoneos/QRScanApp.app`; installed and launched on the connected iPhone as `com.anhnt.qrscan`.
- Final signed iOS Release rebuild after the Vietnamese/UI enhancement pass passed on 2026-09-19. Artifact: `/tmp/qrscanapp-device-release-ui/Build/Products/Release-iphoneos/QRScanApp.app`; installed and launched on the connected iPhone as `com.anhnt.qrscan`.
- iOS Simulator Debug and Android Debug builds passed after the native clipboard, CameraKit zoom, swipe, and localization changes.
- iOS Simulator Debug build passed after the native splash, launcher, icon audit, and Authenticator swipe-direction changes on 2026-09-20; artifact: `/tmp/qrscanapp-splash-icons-ios/Build/Products/Debug-iphonesimulator/QRScanApp.app`.
- Android Debug `:app:assembleDebug` passed after the same changes on 2026-09-20; artifact: `android/app/build/outputs/apk/debug/app-debug.apk`.
- Android Debug `:app:assembleDebug` passed after the keyboard/splash/sheet fixes on 2026-09-20.
- Final signed iOS Release rebuild after the final Authenticator localization pass passed on 2026-09-19. Artifact: `/tmp/qrscanapp-device-release-ui-final/Build/Products/Release-iphoneos/QRScanApp.app`; installed and launched on the connected iPhone as `com.anhnt.qrscan`.
- Android Release assembly passed after the final UI pass; output remains unsigned until production keystore values are supplied.
- TypeScript, Jest (27/27), lint (0 errors), and `git diff --check` passed after the icon consistency pass.
- Continued verification on 2026-09-20: TypeScript, Jest (27/27), lint (0 errors), `git diff --check`, iOS Simulator Debug build, and Android Debug assemble all passed after the final keyboard/splash/sheet polish. Latest iOS artifact: `/tmp/qrscanapp-final-continued-ios/Build/Products/Debug-iphonesimulator/QRScanApp.app`.
- Regenerated every iOS AppIcon PNG slot from the supplied full-bleed 1024px master so iOS does not double-mask a pre-rounded white-background icon; iOS Simulator Debug build passed with artifact `/tmp/qrscanapp-icon-fix-ios/Build/Products/Debug-iphonesimulator/QRScanApp.app`.
- Continued verification on 2026-09-20: TypeScript, 29 Jest tests, lint (0 errors), and `git diff --check` passed after the zoom slider and Authenticator card polish.
- Native verification on 2026-09-20: iOS Simulator Debug build passed at `/tmp/qrscanapp-zoom-totp-ios/Build/Products/Debug-iphonesimulator/QRScanApp.app`; Android Debug `:app:assembleDebug` passed.
- Android release verification on 2026-09-20: regenerated CameraKit codegen, assembled the arm64-v8a release APK, signed it with the local debug keystore for device-only testing, installed it on `Active_3` (`0123456789ABCDEF`), and launched `com.anhnt.qrscan`.
- Android release verification on 2026-09-20: rebuilt after bulk authenticator export changes, signed with the local debug keystore for device-only testing, installed on `Active_3` (`0123456789ABCDEF`), and launched `com.anhnt.qrscan`.
- Android device verification on 2026-09-20: rebuilt the current Authenticator add-menu change, signed with the local debug keystore, installed over the existing app on `Active_3` (`0123456789ABCDEF`), and relaunched `com.anhnt.qrscan`.
- Pre-publish Git hygiene on 2026-09-20: `main` was reduced to one root `Init` commit; the tracked debug keystore was removed from the published tree and `.gitignore` now excludes all keystores.
- Android scanner fix on 2026-09-22: scan callbacks were reaching JS, then `Vibration.vibrate(45)` crashed the React Native process because `VIBRATE` was absent from the manifest. Added the permission and a defensive haptic fallback. Results now present before history persistence completes, and Android receives only supported CameraKit barcode formats.
- Android verification on 2026-09-22: release APK rebuilt, locally debug-signed, installed on `Active_3` over ADB, and launched without a new crash. Physical QR/barcode retest is still required.
- Scan header polish on 2026-09-22: added the theme-aware app mark to the left side of the camera header, removed the opaque white canvas from the dark logo asset, and installed an arm64-v8a Debug APK on `Active_3` with Metro running for fast iteration.
- Wireless Android debug note on 2026-09-22: `Active_3` uses wireless ADB, so run `adb reverse tcp:8081 tcp:8081` and verify `adb reverse --list` before launching/reloading the Debug app.
- URL action behavior on 2026-09-22: new settings default to the external browser; URL result sheets expose one primary action that follows the saved in-app/external preference, with no duplicate browser buttons.
- Android QR scan follow-up on 2026-09-22: CameraKit's Android allow-list was disabled (`[]`) so ML Kit can emit valid QR detections even when a device reports a format variant outside the JS allow-list. Debug app reloaded over wireless ADB/Metro; physical QR retest is pending.
- Android TOTP timer fix on 2026-09-22: measured Mac and `Active_3` epoch time equal with automatic time/timezone enabled. Changed Authenticator refresh to read each secret once per account-list load and run a synchronous one-second timer from the in-memory cache, avoiding overlapping Android Keystore reads that made the 30-second countdown jump.
- Android publish candidate on 2026-09-22: assembled the arm64-v8a Release APK at `android/app/build/outputs/apk/release/app-release-unsigned.apk`, signed a device-only artifact at `/tmp/qrscan-app-release-debug-signed-publish.apk`, and installed/launched it on `Active_3` (`192.168.6.49:5555`).

## Release blockers
`com.anhnt.qrscan` is signed successfully with Team `3QUZ24Y9QT` on the connected iPhone. This session verified simulator/Gradle builds but did not perform physical-device keyboard/splash/share QA; physical camera, biometric, Photos, native-action and generated-code rescan QA still need hands-on verification. Android production release signing and store metadata remain pending until a production keystore and store assets are supplied; the installed Android artifact is debug-signed for device testing.
