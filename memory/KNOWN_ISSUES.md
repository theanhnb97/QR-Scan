# Known Issues

## ISSUE-001 — Physical-device validation pending
Severity: P0
Status: Open
Platform: Both

Symptoms:
The signed iOS Debug build has now been installed and launched on the connected iPhone, but camera, biometric prompts, gallery behavior and Android device behavior have not yet been exercised through the full manual flow.

Next action:
With the app open on the iPhone, verify permission denial/retry, scan latency, biometrics, Photos save and background behavior; repeat on a physical Android device.

## ISSUE-002 — Native smart actions need device QA
Severity: P1
Status: Implemented, QA pending
Platform: Both

Symptoms:
Phone/email/SMS/geo/URL/text actions work through platform schemes/WebView. Wi-Fi settings, contact insertion and calendar insertion now use focused platform adapters, but permission and manufacturer-specific behavior need device verification.

Next action:
Verify permission denial/retry and successful handoff on a physical iPhone and Android device.

## ISSUE-003 — Production signing and physical QA pending
Severity: P1
Status: Deferred
Platform: Both

Symptoms:
App lock/settings, launcher icon assets, splash asset, and Android signing configuration are implemented. A production Android keystore and store-specific icon/screenshot validation are still pending.

Next action:
Supply production Android keystore values through the ignored signing file or environment, then complete device/store QA.
