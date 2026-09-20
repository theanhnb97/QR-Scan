# 09 — Release Checklist

## Build
- [x] iOS Debug device build succeeds and installs with the selected Team; iOS Release still needs final store archive validation
- [x] Android release build succeeds (unsigned until production keystore values are supplied)
- [ ] no debug flags accidentally enabled
- [ ] no development secrets in bundle

## Scanner
- [ ] camera permission flow works
- [ ] QR live scan works
- [ ] barcode live scan works
- [ ] image scan works
- [ ] duplicate debounce works
- [ ] flash works on supported devices
- [ ] draggable camera zoom slider works on supported devices

## Results
- [ ] text
- [ ] URL
- [ ] Wi-Fi
- [ ] phone/email/SMS
- [ ] contact
- [ ] location
- [ ] barcode
- [ ] unsupported state
- [ ] copy content action

## History
- [ ] save
- [ ] reopen
- [ ] search
- [ ] filter
- [ ] favorite
- [ ] delete
- [ ] clear
- [ ] swipe actions work without accidental activation
- [ ] sensitive payloads are redacted/not stored

## Generator
- [ ] QR generation
- [ ] save image
- [ ] share
- [ ] explicit Generate action keeps preview stable while typing
- [ ] copy image to clipboard
- [ ] generated QR rescans successfully
- [ ] barcode validation works
- [ ] generated-code history stores at most 50 non-secret records
- [ ] share/save/copy actions stay hidden until generation succeeds

## Authenticator
- [ ] TOTP scan preview
- [ ] manual secret add
- [ ] secure storage
- [ ] RFC-compatible OTP result
- [ ] countdown boundary correct
- [ ] circular countdown progress updates correctly
- [ ] copy code
- [ ] copy notification appears
- [ ] swipe share QR/delete actions work
- [ ] bulk migration export from Authenticator list and Settings
- [ ] sequential export QR batches can be scanned by Google Authenticator
- [x] edit metadata
- [ ] reveal secret requires auth
- [ ] export QR requires auth
- [ ] delete removes secure secret
- [x] app lock works in code path; physical re-auth QA pending

## Security
- [ ] no raw `otpauth://` in DB/history
- [ ] no TOTP secret in DB
- [ ] no secret/OTP in logs
- [ ] no Wi-Fi password in ordinary history
- [ ] sensitive background snapshot protected
- [ ] export warning present
- [ ] dependency audit reviewed

## UX
- [ ] light/dark mode
- [ ] font scaling
- [ ] VoiceOver/TalkBack basic pass
- [ ] empty states
- [ ] error states
- [ ] denied permissions
- [ ] destructive confirmations
- [ ] bottom sheets dismiss when tapping the dimmed backdrop

## Store readiness
- [ ] privacy copy matches implementation
- [x] permission usage descriptions are accurate
- [ ] screenshots do not expose sensitive data
- [ ] version/build numbers correct
- [ ] open-source license notices present
