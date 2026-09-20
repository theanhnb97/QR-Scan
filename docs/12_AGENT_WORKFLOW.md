# 12 — Agent Workflow

## Start-of-session checklist

1. Read `AGENTS.md`.
2. Read project memory.
3. Read latest handoff.
4. Inspect current code.
5. Choose one scoped task.
6. Identify test commands.
7. Identify security impact.

## During session

Keep a factual task state.

If discovering an architecture decision that must persist across agents, append a concise ADR-style record to `memory/DECISIONS.md`.

Do not write speculative reasoning into memory.

## End-of-session update order

1. Run tests/build.
2. Update `memory/CURRENT_STATE.md`.
3. Update `memory/TODO.md`.
4. Append `memory/CHANGELOG.md`.
5. Append `memory/HANDOFF_LOG.md`.
6. Update `memory/DECISIONS.md` if needed.
7. Update docs if implementation changed behavior.

## Stop conditions

Stop and clearly hand off instead of making broad guesses when:

- required platform API behavior is unknown and security-sensitive,
- a migration could destroy stored authenticator data,
- build signing/provisioning credentials are required,
- a product decision conflicts with current documented requirements.

For ordinary implementation ambiguity, choose the safest/simple native behavior and document it.
