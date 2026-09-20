# QR Scan — AI Project Pack

This repository pack is the source of truth for building **QR Scan**, a native iOS + Android utility with four pillars:

1. Scan
2. Smart Actions
3. Authenticator
4. Create

Product principle:

> **Scan → Understand → Act**

Core qualities:

- Native and lightweight
- Local-first
- Privacy-first
- Offline-capable for core flows
- Production-ready UI/UX
- Secure TOTP credential storage
- Modular architecture
- Minimal dependency footprint

## Agent start order

Before editing code, read in this exact order:

1. `AGENTS.md`
2. `memory/PROJECT_MEMORY.md`
3. `memory/CURRENT_STATE.md`
4. `memory/DECISIONS.md`
5. `memory/TODO.md`
6. Relevant files under `docs/`
7. Latest entries in `memory/HANDOFF_LOG.md`

## Agent end-of-session rule

Before ending any implementation session, update:

- `memory/CURRENT_STATE.md`
- `memory/TODO.md`
- `memory/HANDOFF_LOG.md`
- `memory/CHANGELOG.md`

Update `memory/DECISIONS.md` only when a meaningful product/technical decision is made.

Never store user secrets, TOTP secrets, raw `otpauth://` URIs, Wi-Fi passwords, access tokens, private keys, or production credentials in docs or memory.

## Local build

This is a bare React Native `0.87.1` app with New Architecture and Hermes enabled. It does not use Expo.

```sh
npm install
npm start
npx react-native run-ios
npx react-native run-android
```

Native identifiers are `com.anhnt.qrscan` on both platforms. Android Debug/Release builds can also be run directly from `android/gradlew`; iOS device builds require selecting the Apple Development Team in Xcode.

### Android release signing

Release builds never fall back to the debug keystore. Copy `android/keystore.properties.example` to `android/keystore.properties` (the copied file is ignored) or provide `QRSCAN_STORE_FILE`, `QRSCAN_STOREPASSWORD`, `QRSCAN_KEYALIAS`, and `QRSCAN_KEYPASSWORD` environment variables before running `:app:assembleRelease`. Without those values, Gradle produces `app-release-unsigned.apk` for local verification only.
