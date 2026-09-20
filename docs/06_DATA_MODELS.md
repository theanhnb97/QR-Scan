# 06 — Data Models

## ScannedContent

Conceptual sealed/enum model:

```text
ScannedContent
- Text
- URL
- WiFi
- Email
- Phone
- SMS
- Contact
- Location
- CalendarEvent
- TOTPProvisioning
- HOTPProvisioning
- ProductBarcode
- ISBN
- GenericBarcode
- Unsupported
```

## ScanHistoryItem

Recommended safe model:

```text
id
contentType
displayTitle
displaySubtitle
safeValue
createdAt
lastOpenedAt
isFavorite
source
metadata
relatedAuthenticatorAccountId
```

`safeValue` must not contain TOTP/HOTP secrets or Wi-Fi passwords.

For ordinary non-sensitive text/url/barcode, safeValue may contain decoded content if product rules allow it.

## AuthenticatorAccount

```text
id
type
issuer
accountName
label
algorithm
digits
period
counter
credentialId
createdAt
updatedAt
isFavorite
sortOrder
```

Never add `secret` to this persisted model.

## TOTP provisioning transient model

A transient in-memory model may contain the secret while parsing/importing.

It must:

- never be logged,
- never be serialized to normal DB,
- be released after secure persistence/cancel where practical.

## GeneratedCodeItem

Optional:

```text
id
type
displayTitle
safePayload
createdAt
```

Do not persist sensitive generated QR payloads unless explicitly approved.
