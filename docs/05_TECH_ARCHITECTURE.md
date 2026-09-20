# 05 — Technical Architecture

## Core pipeline

`Scanner → Decoder → ContentParser → Typed Content → ActionResolver → UI → History`

Camera/image decoding and content interpretation must remain separate.

## Shared conceptual interfaces

- `CodeScanner`
- `ImageCodeDecoder`
- `ContentParser`
- `ActionResolver`
- `HistoryRepository`
- `AuthenticatorRepository`
- `SecureCredentialStore`
- `OtpGenerator`
- `CodeGenerator`
- `SettingsRepository`

## iOS structure

Suggested:

```text
QRScan-iOS/
  App/
  Core/
    Models/
    Security/
    Persistence/
    Logging/
    Utilities/
  Features/
    Scanner/
    Results/
    History/
    Authenticator/
    Generator/
    Browser/
    Settings/
  Services/
    Parsing/
    Barcode/
    OTP/
```

Use a simple MVVM-style pattern or another lightweight SwiftUI-compatible approach.

Avoid giant global observable objects.

## Android structure

Suggested:

```text
app/
core/
  model/
  database/
  security/
  logging/
  util/
domain/
  parser/
  actions/
  otp/
feature/
  scanner/
  results/
  history/
  authenticator/
  generator/
  browser/
  settings/
```

Use ViewModel + StateFlow and clear repository boundaries.

Avoid business logic inside Composables.

## Persistence split

### Normal DB

May contain:

- scan history
- favorites
- generated-code metadata
- settings references
- authenticator metadata

### Secure store

Contains:

- TOTP/HOTP secrets only
- future approved secret material

Normal DB references secret via `credentialId`.

## Timing architecture for TOTP

Use one shared clock/ticker per visible authenticator scope.

Do not create one timer per row.

Calculate remaining time from epoch time, not from decrementing local counters that may drift.

## Dependency policy

Prefer:

1. platform API
2. official/first-party library
3. mature focused dependency

Every new dependency must have an explicit reason.

Avoid adding a dependency for trivial utilities.
