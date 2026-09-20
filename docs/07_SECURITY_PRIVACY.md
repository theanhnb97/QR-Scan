# 07 — Security & Privacy

## Threat model priorities

Protect against:

- accidental secret leakage through logs/history
- local DB extraction
- casual device access to authenticator secrets
- unsafe secret export
- sensitive app-switcher snapshots
- accidental cloud/backend transmission

## TOTP storage

### iOS
Use Keychain.

### Android
Use Android Keystore-backed key material and encrypted secret storage.

Database stores only `credentialId`.

## Logging

Use centralized redacted logging.

Never log:

- raw `otpauth://`
- Base32 TOTP/HOTP secret
- OTP output
- Wi-Fi password
- private keys/tokens
- unredacted credential payloads

## Analytics

MVP should work with no analytics.

If analytics is added later, allowed events should be coarse product events only, such as:

- scanner_opened
- scan_success_by_type
- generator_opened

Never include decoded sensitive content as parameters.

## Screenshots / app switcher

Android:
use secure-window protections for sensitive authenticator reveal/export screens where appropriate.

iOS:
obscure sensitive content when backgrounding/app switcher snapshot is created.
Do not claim complete screenshot prevention.

## Export

Reveal Secret and Export QR require fresh device authentication.

Exported QR contains the secret and must show a clear warning.

## Backups

Do not assume platform backup behavior is safe.

Sensitive secret storage must use platform options that avoid unintended insecure backup.

Document chosen backup accessibility/security class in implementation notes.

## Memory/docs safety

Project documentation must never contain real secrets.

Use placeholder values such as:

`JBSWY3DPEHPK3PXP`

only if needed for test examples, and clearly mark them as synthetic.
