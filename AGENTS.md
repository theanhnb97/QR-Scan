# AGENTS.md — Mandatory Instructions for Coding Agents

## 1. Mission

Build QR Scan as a production-quality native app for iOS and Android.

Do not treat this repository as a prototype unless a task explicitly says so.

The app is:

- a QR/barcode scanner,
- a typed-content interpreter,
- a smart-action utility,
- a local scan history,
- a QR/barcode generator,
- a lightweight TOTP authenticator.

## 2. Platform direction

### iOS
Use Swift, SwiftUI, AVFoundation, PhotosPicker, WKWebView, Keychain, LocalAuthentication, and SwiftData/Core Data where appropriate.

### Android
Use Kotlin, Jetpack Compose, CameraX, Room, Android Keystore-backed encryption, BiometricPrompt, and WebView.

Do not introduce Flutter, React Native, Ionic, or another cross-platform UI runtime.

## 3. Source-of-truth hierarchy

When requirements conflict, use this priority:

1. Explicit latest user requirement
2. `memory/DECISIONS.md`
3. `docs/01_PRD.md`
4. `docs/03_UI_UX_SPEC.md`
5. `docs/05_TECH_ARCHITECTURE.md`
6. Other project docs
7. Existing code behavior

If code conflicts with an approved documented requirement, fix the code rather than silently changing the requirement.

## 4. Required session workflow

### Before coding

Read:

- `memory/PROJECT_MEMORY.md`
- `memory/CURRENT_STATE.md`
- `memory/DECISIONS.md`
- `memory/TODO.md`
- latest `memory/HANDOFF_LOG.md`
- relevant docs for the task

Then identify:

- exact scope,
- affected modules,
- acceptance criteria,
- tests needed,
- security/privacy implications.

### During coding

- Keep changes scoped.
- Prefer compiling increments.
- Add tests alongside domain/business logic.
- Do not put business logic in Views/Composables.
- Do not bypass repositories/security interfaces.
- Do not log raw QR payloads by default.
- Never log TOTP secrets or OTP codes.
- Do not store sensitive secrets in normal DB.
- Do not invent backend APIs.
- Do not implement out-of-scope P1/P2 features unless required to unblock P0.

### Before handoff

Run the relevant build/test/lint checks available in the repository.

Then update:

- `memory/CURRENT_STATE.md`
- `memory/TODO.md`
- `memory/HANDOFF_LOG.md`
- `memory/CHANGELOG.md`

If architecture/product behavior changed, also update:

- `memory/DECISIONS.md`
- relevant docs under `docs/`

## 5. Memory policy

Project memory is a factual engineering/project state, not a scratchpad.

Write only:

- decisions,
- current implementation state,
- known issues,
- next tasks,
- test status,
- migration notes,
- release blockers.

Do not write hidden reasoning, speculative chain-of-thought, personal data, credentials, secrets, or raw sensitive payloads.

Keep entries concise and directly actionable.

## 6. Security release blockers

Never ship with any of these:

- TOTP secret in Room/SQLite/SwiftData/Core Data plaintext
- raw `otpauth://` URI in history
- secret or OTP in logs/analytics/crash metadata
- automatic TOTP save immediately after scan without confirmation
- authenticator secret export without user re-authentication
- broken RFC-compatible TOTP behavior
- camera frames uploaded for ordinary scanning
- production secrets committed to repo

## 7. Implementation quality bar

Every completed feature must include:

- loading/empty/error/permission states where applicable,
- accessibility labels,
- dark mode compatibility,
- basic unit tests for business logic,
- no known P0 regression,
- updated docs/memory.

## 8. Output format after each task

At the end of the coding-agent response, report:

### Implemented
What was completed.

### Changed files
Key files/modules modified.

### Tests
What was added/run and result.

### Security/privacy impact
Any sensitive-data implications.

### Known limitations
Only real remaining limitations.

### Docs/memory updated
Which project-state files were updated.

### Next recommended task
One concrete next task.
