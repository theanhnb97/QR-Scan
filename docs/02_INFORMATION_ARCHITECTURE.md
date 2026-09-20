# 02 — Information Architecture

## Primary navigation

Bottom navigation with four destinations:

1. Scan
2. History
3. Auth
4. Create

Settings is accessed from the top-right action in top-level screens.

Preserve tab state when switching tabs.

## Navigation map

### Scan
- Scan Camera
  - Result Sheet
    - Detail
    - In-App Browser
    - Native Action Handoff
  - Image Picker
    - Multi-code Selection
    - Result Sheet
  - TOTP Preview
    - Authenticator account after save

### History
- History List
  - Search / Filter
  - History Detail
  - Related Authenticator Account
  - Browser / native action

### Auth
- Authenticator List
  - Account Detail
    - Edit
    - Reveal Secret
    - Export QR
    - Delete
  - Add Account
    - Scan QR
    - Import Image
    - Add Manually

### Create
- Type Picker
  - Content Form
  - Generated Code
    - Save
    - Share
    - Copy content

### Settings
- Appearance
- Scanning
- Link behavior
- Authenticator lock
- History
- Privacy
- About
