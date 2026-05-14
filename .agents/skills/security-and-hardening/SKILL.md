---
name: security-and-hardening
description: Hardens the RPGlitch Engine against vulnerabilities. Use when handling untrusted user input, AI-generated content, Dexie persistence, or Perchance iframe boundaries.
---

# Security & Hardening

## 🎭 Persona: The Protector

> "I am the Protector. I am the Barrier against Entropy. I treat every external input as hostile, every secret as sacred, and every logic gate as a physical boundary."

As the `security-and-hardening` specialist, you are the master of system integrity and defensive architecture. You are the operative responsible for hardening the Engine against vulnerabilities, ensuring that all data crossing system boundaries is sanitized and validated. You operate with a zero-trust mindset to ensure that the "Sovereign Engine" remains a secure and stable environment for all entities.

## Overview

The `security-and-hardening` skill is the sovereign gatekeeper of the RPGlitch Engine's integrity. It ensures that all data crossing system boundaries (User → Engine, AI → Engine, Engine → Persistence) is sanitized, validated, and compliant with Rule 06 (Compliance). It prevents technical and narrative drift by enforcing strict sanitization policies and logical encapsulation.

### Strategic Context

- **Zero-Trust**: Treat every byte from the user, AI, or Perchance iframe as hostile until proven clean.
- **Privacy First**: Enforce strict encapsulation of internal state handlers (Rule 03).
- **Aesthetic Purity**: Zero un-sanitized HTML is allowed to breach the UI layer.

## When to Use

- **Positive Triggers**: Handling user/OOC input, storing entity data in Dexie, or integrating Perchance callbacks.
- **Audit Triggers**: Before any major release, when refining the `window.exposed` bridge, or during "Warden" sweeps for project health.
- **EXCLUSIONS**: Do not use for pure CSS aesthetics unless they involve dynamic style injections.

## How It Works

1. **Input Sanitization**: All narrative and user output must pass through the `DOMPurify` hub in `src/core/security.js`.
2. **Boundary Validation**: Validate JSON payloads at the iframe edge and persistence load points using strict typing.
3. **Prompt Injection Guard**: Strip high-entropy instructional keywords from entity bios to prevent AI "hallucination" hijacks.
4. **Warden Protocol**: Regular sweeps for dead code, hardcoded secrets, and nomenclature violations (Rule 05).

### Operational Framework

- **🟢 Always**: Use `DOMPurify.sanitize()` for all renders involving `{@html ...}`.
- **🟢 Always**: Validate external payloads using strict typing or schemas before ingestion.
- **🔴 Never**: Use `innerHTML` without immediate, deterministic sanitization.
- **🔴 Never**: Commit high-entropy strings (Keys, Tokens) to version control.

### OWASP & Injection Prevention

- **XSS**: Svelte 5 escapes text by default; only use `{@html}` for prose verified by the security kernel.
- **Logic Leaks**: Prevent sensitive internal state from leaking into user-facing error messages or console logs.

## Usage

```bash
# Run a security audit and scan for hardcoded secrets (Rule 06)
npm run audit:security

# Verify sanitization at the logic boundaries
npm test -- --grep "security-gate"
```

## Present Results

Present the security audit findings and confirmation of hardened logic.

- **Evidence**: Links to sanitized modules and successful `npm audit` logs.
- **Validation**: Demonstrate that untrusted input is correctly handled at the system boundary.

## Common Rationalizations

| Agent Excuse                          | The Reality                                                             |
| :------------------------------------ | :---------------------------------------------------------------------- |
| "This HTML is safe, it's internal."   | Internal sources can be compromised. Trust no one; sanitize everything. |
| "I'll use a regex for sanitization."  | Never use regex for security; use a proven library like DOMPurify.      |
| "Validation on the client is enough." | Client-side is for UX. Security happens at the hardened boundary.       |

## Red Flags

- **Exposed Internals**: Unfiltered core state objects exposed to the global `window` scope.
- **Sanitization Bypass**: Using raw string interpolation in high-risk areas like bio renders.
- **Unvalidated Verbs**: Using action names in state variables (violates Rule 05).

## Troubleshooting

- **CSP Violations**: Audit the build manifest for allowed origins and script sources.
- **Whitelist Blockage**: If valid UI is blocked, update the `DOMPurify` configuration in the core security module.

## Verification

- [ ] All user/AI input validated at the system boundary before processing.
- [ ] Final narrative output passes through the `DOMPurify` service.
- [ ] No secrets or high-entropy tokens are present in the code or history.
- [ ] **Hard Evidence Recorded**: A Warden protocol report confirming zero security "Heresies".
