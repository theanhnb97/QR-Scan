# 11 — Acceptance Criteria

## Scan text

Given a valid text QR,
when the code is visible,
then the app decodes it automatically,
shows a Text result,
and allows Copy and Share.

## Scan URL

Given a valid URL QR,
then the app shows the hostname,
does not auto-open it,
and exposes one explicit open action that follows the saved in-app/external browser preference, defaulting to the external browser.

## Scan from image

Given an image containing one supported code,
then the app decodes it without requiring camera access.

Given multiple codes,
then the app lets the user choose one.

## History

Given a successful ordinary scan,
then a safe history item is created.

Given a sensitive TOTP scan,
then history stores only safe metadata and an authenticator reference.

## TOTP QR

Given a valid `otpauth://totp/...`,
then the app parses it,
shows safe preview metadata,
requires user confirmation,
stores the secret only in secure storage,
creates safe metadata,
and generates a correct current code.

## Manual TOTP

Given issuer/account/valid Base32 secret,
when user taps Save,
then the app stores the secret securely
and creates an authenticator account.

## Authenticator deletion

Given a saved account,
when user confirms delete,
then both secure secret and metadata are removed,
and no secret remains in ordinary persistence.

## Generator

Given valid content,
then generated QR/barcode is readable by the app itself and another standard scanner.
