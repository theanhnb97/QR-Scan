# 08 — QA & Test Plan

## Unit tests

### Parser
- plain text
- HTTP URL
- HTTPS URL
- malformed URL
- Wi-Fi QR variants
- phone
- email
- SMS
- contact
- location
- TOTP URI
- HOTP URI
- invalid secret
- unsupported algorithm

### TOTP
Use RFC-compatible vectors.

Cover:
- SHA1
- SHA256
- SHA512
- 6 digits
- 8 digits
- period boundaries
- clock values around boundary transitions

### Barcode validation
- valid/invalid EAN-8
- valid/invalid EAN-13
- UPC-A length
- Code 128 free text

## Repository tests

Verify:
- deleting authenticator deletes secret
- DB record contains no secret
- history TOTP record contains no raw provisioning URI
- duplicate scan behavior
- favorite update
- clear history

## UI tests

Critical smoke paths:

1. launch → enable camera → scan text → copy
2. scan URL → open in-app → close → return
3. scan image → decode
4. scan Wi-Fi → view actions
5. scan TOTP → preview → add → authenticator code
6. manual TOTP entry → save
7. reveal secret → biometric auth
8. delete authenticator account
9. create URL QR → share/save
10. history search → open item

## Manual device matrix

Test at minimum:

- one current iPhone
- one older supported iPhone size class
- one modern Pixel-class Android
- one Samsung-class Android
- light/dark
- font scaling
- camera denied
- biometric unavailable
- offline mode

## Regression priorities

P0 regressions:

- scanner cannot decode
- TOTP wrong
- secret leakage
- crash on launch
- history corruption
- generated QR cannot be rescanned
