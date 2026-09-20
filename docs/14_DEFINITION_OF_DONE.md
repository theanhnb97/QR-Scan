# 14 — Definition of Done

A feature is not done because the happy path renders.

A P0 feature is Done only when:

- requirements are implemented,
- code compiles,
- business logic is tested,
- empty/error states exist,
- permissions are handled,
- dark mode works,
- accessibility basics are present,
- sensitive data rules are satisfied,
- no P0 regression is known,
- memory/handoff docs are updated.

For security-sensitive Authenticator work, Done also requires:

- secure store verified,
- no secret in normal DB,
- no secret/OTP in logs,
- re-auth on reveal/export,
- delete removes secret,
- RFC-compatible OTP tests pass.
