# Project Memory

## Product
QR Scan is a native iOS + Android QR/barcode utility with local history, smart actions, code generation, and a lightweight secure TOTP authenticator.

## Product principle
**Scan → Understand → Act**

## Primary tabs
- Scan
- History
- Auth
- Create

## Permanent constraints
- Native SwiftUI on iOS
- Native Jetpack Compose on Android
- Local-first MVP
- No account/backend required for core features
- TOTP secrets only in secure storage
- No raw `otpauth://` in normal history
- No secret/OTP logging
- URL never auto-opens immediately after scan
- TOTP scan never auto-saves
- Passkey manager is out of MVP scope

## Documentation rule
Read `AGENTS.md` and all project memory before coding.
Update project state and handoff files after each coding session.
