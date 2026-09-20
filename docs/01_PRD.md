# 01 — Product Requirements Document

## 1. Scope

### P0
- Native app shell
- Live QR/barcode scan
- Scan from image
- Typed content parser
- Smart result actions
- URL in-app browser
- History
- Favorites
- Search/filter
- QR generation
- basic barcode generation
- TOTP QR import
- manual TOTP secret entry
- secure TOTP storage
- TOTP code generation
- authenticator list/detail
- app lock / sensitive-action re-authentication
- settings
- dark mode
- accessibility baseline
- tests

### P1
- HOTP full UX
- batch scan
- CSV export
- encrypted authenticator import/export
- widgets/shortcuts
- richer URL safety
- product lookup
- QR customization

### P2
- cloud sync
- account system
- team/enterprise inventory
- passkey manager
- collaborative features

## 2. Main content types

Typed content enum should cover:

- Text
- URL
- WiFi
- Email
- Phone
- SMS
- Contact
- Location
- CalendarEvent
- TOTP
- HOTP
- ProductBarcode
- ISBN
- GenericBarcode
- Unsupported

## 3. History

Normal scan history may store raw payload only when that payload is not classified as sensitive.

Sensitive classes include at minimum:

- TOTP/HOTP provisioning payload
- Wi-Fi password
- future credential/secret payloads

For sensitive items, history stores safe display metadata and a reference to the secure/domain record.

## 4. TOTP

Support RFC 6238 compatible TOTP.

Provisioning inputs:

- scanned `otpauth://totp/...`
- Google Authenticator migration QR (`otpauth-migration://offline?...`) with account preview and explicit confirmation
- selected image containing TOTP QR
- manual Base32 secret entry

Metadata:

- issuer
- account
- label
- algorithm
- digits
- period

Supported algorithms:

- SHA1
- SHA256
- SHA512

Common digits:

- 6
- 8

Default period:

- 30 seconds

Never persist generated codes.

## 5. Manual TOTP add

Provide an “Add manually” flow in Authenticator.

Fields:

- Issuer / service name
- Account / username
- Secret key
- Algorithm
- Digits
- Period

Defaults:

- SHA1
- 6 digits
- 30 seconds

Secret field:

- hidden by default
- paste enabled
- whitespace normalization allowed
- Base32 validation
- never logged
- securely stored only after explicit user save

## 6. URL behavior

URL scans never auto-open.

Default action policy:

- show result
- display hostname prominently
- use the saved in-app or external browser preference for the single primary action

Setting options:

- Prefer in-app
- Prefer external

The default is external browser. The preference changes the primary action target, not the requirement for an explicit user action after scan.

## 7. Offline behavior

Must work offline:

- scan/decode
- parser
- history
- generation
- TOTP
- local search
- settings

Naturally online actions may fail gracefully:

- opening remote URLs
- web search
- map tiles
- product web search
