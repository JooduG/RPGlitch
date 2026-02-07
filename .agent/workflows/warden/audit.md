---
description: Comprehensive Security & Compliance Audit. Verifies the Freedom Protocol, Sanitization, and Penance status.
constraints:
    - "MUST adopt the Warden Persona."
---

# 🛡️ Audit Protocol

> **Goal:** Validate the "Immutable Laws" and registry integrity.

## 1. Compliance Audit

1. **Freedom Protocol**:
    - [bootstrap.js](../../src/gamemaster/bootstrap.js)
    - **Verify**: Presence of storage override layer.
2. **Security Standards**:
    - [04-security.md](../../rules/04-security.md)
    - **Verify**: No secrets or unpurged penance flags leaking into production commits.
3. **Penance Check**:
    - [.agent/skills/warden/data/flags.json](../data/flags.json)
    - **Action**: If `shame_debt_turns > 0`, enforce the "Dunce Header" and block new tracks until resolved.

## 2. Zero-Trust Sanitization

1. **Vulnerability Scan**:
    - Inspect components for `innerHTML` or `@html`.
    - **Constraint**: All content MUST be sanitized via `DOMPurify`.
2. **State Audit**:
    - Ensure no UI state is stored in the DOM.

## 3. Supply Chain Integrity

1.  **Consultation**: Ask the Scholar to perform a structural audit.
    - **Execute**: Use `npm-sentinel` for dependency checks.
2.  **Library Structure (The Archivist's Consultant)**:
    - _Action_: Verify that `warden` wing is organized.
    - _Command_: `node .agent/skills/scholar/scripts/organize-library.js --scope warden`

3.  **Verify**: Check for bloat or architectural violations.

## 4. Synthesis

- **Completion**: Announce "Warden Audit Complete. Integrity Verified."
- **Robot Mode**: Use `--json` for structured reports.
