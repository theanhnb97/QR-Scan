# 04 — Design System

Use semantic tokens. Platform-native controls may adapt them.

## Brand character

- calm
- precise
- secure
- modern
- utility-first

## Color tokens

Suggested default brand accent:

- `accent`: #4F6BFF

Light:
- `background`: #F8F9FC
- `surface`: #FFFFFF
- `surfaceSecondary`: #F0F2F7
- `textPrimary`: #101318
- `textSecondary`: #606773
- `divider`: #E3E7EE
- `success`: #18864B
- `warning`: #B66900
- `danger`: #C73535

Dark:
- `background`: #0D1015
- `surface`: #151A21
- `surfaceSecondary`: #1D232C
- `textPrimary`: #F6F7FA
- `textSecondary`: #A9B1BD
- `divider`: #2A313C
- `success`: #42C77B
- `warning`: #F4A940
- `danger`: #F06A6A

Use system semantic colors when they better match platform accessibility.

## Typography

iOS:
- SF Pro system typography

Android:
- Roboto / system Material typography

Roles:

- Large Title: 28–34
- Title: 22–24
- Headline: 17–20 semibold
- Body: 16–17
- Secondary: 13–15
- OTP Code: 30–40, monospaced digits if available

Do not hard-code font sizes in a way that breaks Dynamic Type/font scaling.

## Spacing

Base grid: 4pt.

Preferred spacing:
- 4
- 8
- 12
- 16
- 20
- 24
- 32

Screen horizontal padding:
- phone: 16–20

## Radius

- small controls: 10–12
- cards/sheets: 16–20
- pills/chips: fully rounded

## Controls

Primary button:
- height: minimum 48
- strong accent fill
- high contrast label

Secondary button:
- surface or outline treatment
- minimum 44–48 height

Icon-only control:
- touch target minimum 44x44

## Scanner guide

- rounded corner outline
- no full opaque box
- avoid aggressive neon glow
- keep camera feed readable

## Code rendering

QR output:
- high contrast
- pure quiet zone
- no logo overlay in MVP
- never crop quiet zone

Barcode output:
- sufficient horizontal/vertical padding
- human-readable value optional below code where appropriate

## Accessibility

- minimum AA-like contrast target for text
- never use color alone for OTP countdown/error
- support VoiceOver/TalkBack
- logical focus order
- semantic labels for icons
