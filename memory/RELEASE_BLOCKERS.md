# Release Blockers

A release must not proceed while any item below is true.

- [x] TOTP secret is excluded from ordinary SQLite schema and history inputs
- [x] Raw `otpauth://` URI is excluded from ordinary history
- [x] Secret/OTP logging is absent in application code
- [x] TOTP output passes RFC 4226/6238 SHA1/SHA256/SHA512 vectors
- [x] Reveal/export routes through native USER_PRESENCE authentication
- [x] iOS blur and Android FLAG_SECURE protect background/screenshot surfaces
- [x] Authenticator deletion removes metadata and secure credential
- [x] Scanner has no upload/network path for camera frames
- [ ] Generated QR/barcode rescans verified on physical devices
- [x] Camera permission denial renders a recovery state
- [x] Camera/Photos permission declarations match current behavior
- [ ] Physical iPhone and Android device QA completed
- [ ] Release signing and store metadata completed
