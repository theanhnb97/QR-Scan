# 10 — Handoff Checklist

Every agent/developer handoff must complete this checklist.

## Scope
- [ ] Task scope is stated
- [ ] P0/P1/P2 level is known
- [ ] Acceptance criteria are referenced

## Code
- [ ] Code compiles for touched platform
- [ ] No unrelated refactor mixed in
- [ ] No TODO silently left in critical path
- [ ] New dependency justified

## Tests
- [ ] Relevant unit tests added/updated
- [ ] Relevant tests run
- [ ] Failures documented exactly
- [ ] Manual testing notes added if needed

## Security/privacy
- [ ] No sensitive values logged
- [ ] No secret added to normal DB
- [ ] No sensitive raw value added to history
- [ ] No credential added to docs/examples
- [ ] Export/reveal flows keep authentication requirement

## Documentation
- [ ] `memory/CURRENT_STATE.md` updated
- [ ] `memory/TODO.md` updated
- [ ] `memory/HANDOFF_LOG.md` appended
- [ ] `memory/CHANGELOG.md` appended
- [ ] `memory/DECISIONS.md` updated if a decision changed
- [ ] relevant docs updated if behavior changed

## Handoff note must include
- [ ] what is now working
- [ ] changed modules/files
- [ ] tests and results
- [ ] known issues
- [ ] release blockers
- [ ] exact next recommended task
