# 03 — Production UI/UX Specification

This file defines the production behavior and visual composition of each core screen.

## Global UX principles

- Prioritize one dominant action per screen.
- Avoid dashboard-style icon grids on the Scan screen.
- Use sheets for fast post-scan actions.
- Use full-screen navigation for durable/detail workflows.
- Never hide destructive actions next to primary actions.
- Never expose secrets by default.
- Use native controls whenever they already solve the problem well.
- All screens support light/dark mode.
- All important controls have screen-reader labels.

---

# A. App launch

## A1. Launch behavior

No mandatory onboarding carousel.

First launch goes directly to Scan.

If camera permission has not been requested, show the camera UI with a permission education placeholder and a primary “Enable Camera” action.

Do not request camera permission before user intent is clear.

## A2. Top-level chrome

Top app bar:

- screen title where needed
- Settings icon on top-right for top-level tabs

Bottom nav:

- Scan
- History
- Auth
- Create

The Authenticator tab uses a circular timer/clock icon to reinforce the TOTP countdown. Create exposes generated-code history in the header action group beside Settings.

Scan tab may use a visually stronger selected state.

---

# B. Scan

## B1. Scan — permission not granted

Layout:

- dark/neutral camera placeholder
- centered scanner icon
- title: `Scan QR & barcodes`
- body: `Camera access is used only to scan codes on your device.`
- primary button: `Enable Camera`
- secondary button: `Choose from library`

Do not show alarming permission copy.

## B2. Scan — camera active

Full-screen camera surface inside safe area.

Top overlay:

- left: optional compact title/logo
- right:
  - Flash
  - Scan Image
  - Settings if space allows

Center:

- subtle scan guide, approximately 64–72% of screen width
- rounded corners
- do not animate a fake laser continuously

Bottom helper:

`Point your camera at a QR code or barcode`

Optional compact chip:

`Auto scan`

Camera zoom uses a compact draggable slider rather than a row of preset buttons.

No shutter button.

## B3. Detection feedback

When code is detected:

- light haptic
- brief focus/highlight box around detected code if coordinates are reliable
- pause repeated decode for the same payload
- present result sheet

Target perceived latency: immediate.

## B4. Multiple codes in image

If an imported image contains multiple supported codes:

show a full-screen or medium sheet:

Title:
`Multiple codes found`

Rows:

- icon/type
- safe preview/title
- code type

Selecting one opens its result.

Do not expose sensitive raw payload previews.

---

# C. Result sheet system

Use one reusable result shell with type-specific content.

Recommended sheet heights:

- compact for simple text/action
- medium for Wi-Fi/contact
- full/detail only when content is long

Header:

- content-type icon
- title
- optional subtitle/type
- optional favorite action

Body:

- typed content

Primary action:

- type-specific

Secondary actions:

- horizontal action row or overflow menu

Footer:

- `View details` when raw/non-primary metadata exists

## C1. Text result

Title:
`Text`

Body:
Selectable text, up to a comfortable preview length.

Primary:
`Copy`

Secondary:
- Share
- Search Web

Long text:
show first portion and `View full text`.

## C2. URL result

Header:
- globe/lock icon
- hostname in prominent text
- small `HTTPS` or `HTTP` status

Body:
normalized URL, line-wrapped

Primary:
`Open`

Secondary:
- Copy Link
- Share

`Open` uses the saved link preference: in-app browser or system browser. The result sheet exposes one URL action only and still requires an explicit tap.

Never present a spoofed Unicode hostname without also providing normalized details in the detail screen.

## C3. Wi-Fi result

Title:
SSID

Subtitle:
`Wi-Fi Network`

Rows:
- Network
- Security
- Password

Password hidden by default.

Actions:
- Connect
- Copy Password
- Share

Reveal password requires explicit tap; biometric is optional for Wi-Fi, not required.

Do not save Wi-Fi password into ordinary history.

History subtitle can contain SSID/security only.

## C4. Contact result

Avatar placeholder with initials if name exists.

Show:

- name
- organization
- phone
- email

Primary:
`Add Contact`

Secondary:
- Call
- Email
- Copy

## C5. Phone result

Large phone number.

Primary:
`Call`

Secondary:
- Copy
- Add Contact

## C6. Email result

Show email address plus subject if encoded.

Primary:
`Compose`

Secondary:
- Copy
- Share

## C7. SMS result

Show recipient and message preview.

Primary:
`Send Message`

Secondary:
- Copy Number
- Copy Message

## C8. Location result

Show coordinates and optional label.

Primary:
`Open Maps`

Secondary:
- Copy Coordinates
- Share

A static native map preview may be added later; not required for MVP.

## C9. Barcode result

Show:

- barcode format
- decoded value

Primary:
`Copy`

Secondary:
- Search Web
- Share

For ISBN:
label as `ISBN`.

For UPC/EAN:
label as `Product barcode`.

## C10. TOTP detection result

Do not use the ordinary generic result sheet.

Present `Add authentication account` preview.

See Auth section.

---

# D. In-App Browser

Top navigation:

- Close
- hostname/title
- external-browser action

Bottom toolbar:

- Back
- Forward
- Reload
- Share
- More

Security presentation:

- show hostname persistently
- show full URL via details/overflow
- distinguish HTTP from HTTPS

Closing returns to the previous result/history context.

No custom browser tabs inside the in-app browser flow unless platform constraints make them preferable.

---

# E. History

## E1. History list

Top:

Title:
`History`

Actions:
- Search
- Filter
- Settings

Optional segmented/filter chips:

- All
- Links
- Text
- Wi-Fi
- Auth
- Barcode

Group rows:

- Today
- Yesterday
- date

Row anatomy:

- type icon
- title
- subtitle
- relative/absolute time
- favorite indicator if selected

Swipe/context actions:

- Favorite / Unfavorite
- Delete
- Copy when safe

Tap opens typed detail.

## E2. History empty

Icon:
clock/history

Title:
`No scans yet`

Body:
`Codes you scan will appear here.`

CTA:
`Start Scanning`

## E3. Search

Native search field.

Search local metadata only.

Results update immediately.

Sensitive values are not indexed if they are intentionally not stored.

## E4. History detail

Show:

- safe metadata
- scanned time
- source
- content-type-specific actions

For TOTP history:

show issuer/account/type and `Open in Authenticator`.

Never reconstruct/display provisioning URI from history.

---

# F. Authenticator

## F1. Authenticator list

Top:

Title:
`Authenticator`

Actions:
- Search
- Add `+`
- Export all authenticator accounts

The Add action is a compact plus button in the top-right header. Tapping it opens two choices:
- Add from setup key
- Add from QR code

Rows should optimize for fast code reading.

Row:

- first line: issuer and account in one compact `Issuer - account` label
- second line: current code on the left and remaining time on the right
- keep a small circular countdown indicator beside the code
- use smaller text and tight vertical spacing so rows optimize for scanning many accounts
- shift the code/indicator accent toward danger red during the final part of the period

Example:

GitHub
user@example.com

`482 913`                         `18s`

Tap on code:
copy code + success haptic.

Tap row:
open account detail.

Do not use separate countdown timers per row.
Use a shared time source.

The list includes a search field matching issuer, account name, and label. If a query has no matches, show a compact empty result state without changing the stored accounts.

Bulk export uses the Google Authenticator migration QR format. It requires device authentication and explicit confirmation; large exports are shown as sequential QR batches. Accounts with a custom TOTP period are not exported because the migration format assumes 30 seconds.

## F2. Authenticator empty

Title:
`No authentication accounts`

Body:
`Add a QR code or secret key to generate verification codes on this device.`

Primary:
`Add Account`

Secondary:
`Scan QR`

Import shortcut:
`Import from Google Authenticator`

The shortcut opens the scanner with instructions for exporting a migration QR from Google Authenticator. The app cannot read another authenticator's private storage directly.

## F3. Add account menu

Options:

- Scan QR
- Choose from library
- Enter Setup Key

Use native action sheet/menu.

## F4. TOTP preview from QR

Title:
`Add authentication account`

Show:

- Issuer
- Account
- Type: TOTP
- Digits
- Period
- Algorithm

Secret is not shown.

Primary:
`Add`

Secondary:
`Cancel`

Optional:
`Advanced details`

Adding:

- writes secret to secure store
- writes safe metadata to DB
- adds safe history metadata
- navigates/open account

## F5. Manual TOTP entry

Title:
`Enter setup key`

Fields:

1. Service / Issuer
2. Account
3. Secret key
4. Algorithm
5. Digits
6. Period

Secret key field:

- secure/obscured by default
- reveal toggle
- paste enabled
- trim spaces/hyphens only when normalization is safe
- uppercase normalization internally
- inline Base32 validation

Primary:
`Save`

Disabled until required input is valid.

Never echo the secret in validation/error logging.

## F6. Authenticator account detail

Top:

Issuer
Account

Hero:

large OTP code
`482 913`

Countdown/progress immediately below.

Metadata:

- Type
- Algorithm
- Digits
- Period
- Added

Actions:

- Copy Code
- Edit
- Reveal Secret
- Export QR
- Delete

Sensitive actions:

`Reveal Secret`
`Export QR`

must trigger device authentication first.

## F7. Reveal secret

After successful authentication:

show a temporary sensitive sheet.

Title:
`Setup key`

Secret:
monospaced, selectable/copyable

Actions:
- Copy
- Done

Add warning:
`Anyone with this key can generate your verification codes.`

Re-hide when sheet closes or app backgrounds.

## F8. Export provisioning QR

Require re-authentication.

Render locally.

Screen:

- account metadata
- QR code
- warning
- Share
- Save Image

Warning:
`This QR contains your authentication secret. Share it only with a device you trust.`

Never save it automatically.

## F9. Delete account

Confirmation dialog:

Title:
`Delete authentication account?`

Body:
`Verification codes for {issuer/account} will no longer be available on this device.`

Destructive:
`Delete`

Cancel:
`Keep`

Deleting must:

1. remove secret from secure store,
2. remove authenticator metadata,
3. retain or update scan-history item as non-functional historical metadata according to product rule,
4. never leave orphaned secret material.

---

# G. Create

## G1. Create type picker

Title:
`Create`

Use a clean list/grid of templates:

- Website
- Text
- Wi-Fi
- Contact
- Phone
- Email
- SMS
- Location
- Barcode

Limit grid to 2 columns if used; do not create a dense icon wall.

## G2. Create forms

Use native form structure.

Primary action:
`Generate`

Examples:

### Website
- URL

### Text
- multiline text

### Wi-Fi
- Network name
- Password
- Security
- Hidden network

### Contact
- Name
- Phone
- Email
- Organization

### Email
- To
- Subject
- Message

### SMS
- Number
- Message

### Location
- Latitude
- Longitude
- Label

### Barcode
- Format
- Value

Validate before generating.

## G3. Generated result

Large scannable code centered with sufficient quiet zone.

Below:

- type
- safe content summary

Actions:

- Save Image
- Share
- Copy Content

Avoid decorative logo overlays in MVP.

---

# H. Settings

## H0. Current interaction polish

- The app supports Vietnamese as the default UI language and exposes an English switch in Settings.
- History rows reveal Favorite/Delete actions by swiping from right to left; Authenticator rows reveal Share QR/Delete by swiping right.
- Scan exposes flash state icons and discrete 1x/1.5x/2x/3x zoom controls.
- Scan results expose a Copy content action. Create requires an explicit Generate action, keeps the preview stable while typing, and offers Share, Save Image, and Copy Image actions.

## H1. Settings root

Sections:

### Appearance
- System
- Light
- Dark

### Scanning
- Haptic Feedback
- Save Scan History

### Links
- Ask Every Time
- Prefer In-App
- Prefer Browser

### Authenticator
- App Lock
- Lock Timeout
- Import from Google Authenticator

### History
- Clear History

### Privacy
- Privacy Summary

### About
- Version
- Licenses

## H2. App lock

Options:

- Off
- Immediately
- After 1 minute
- After 5 minutes

If biometric/device authentication is unavailable, explain the platform limitation.

Lock should cover Authenticator according to selected timeout.

Sensitive reveal/export always requires fresh authentication even if general app lock is already open, unless a short platform-auth grace period is intentionally documented.

---

# I. Error and edge states

Provide dedicated UI for:

- camera denied
- camera restricted/unavailable
- no code found in image
- unsupported payload
- malformed QR
- invalid URL
- invalid Base32 secret
- unsupported OTP algorithm
- secure-storage failure
- biometric cancellation
- biometric lockout
- authenticator record missing secret
- history reference points to deleted account
- barcode generation validation error

Error copy must explain the next useful action.

---

# J. Motion and haptics

Use subtle motion only.

- scan success: light success haptic
- copy OTP: light haptic
- destructive delete: warning haptic where platform convention supports it
- sheet transitions: system defaults
- no looping neon animations
- countdown progress: smooth enough to read, not distracting

Respect reduced-motion settings.
