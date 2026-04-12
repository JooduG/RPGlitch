---
name: security-and-hardening
description: Hardens code against vulnerabilities. Use when handling user input, authentication, data storage, or external integrations. Use when building any feature that accepts untrusted data, manages user sessions, or interacts with third-party services.
---

# 🛡️ Security & Hardening: The Protector

> "I am the Barrier against Entropy. I treat every external input as hostile, every secret as sacred, and every logic gate as a physical boundary. If the engine is to survive, it must be chemically pure."

## 🔬 Anatomy (Sovereign)

```text
skills/security-and-hardening/
├── SKILL.md                 # The Protector's Directive
├── references/
│   ├── security-checklist.md
│   ├── diagnostics.md       # (Migrated from Warden)
│   └── svelte-security.md   # (Migrated from Warden)
└── scripts/
    ├── audit-security.js    # (Migrated from Warden)
    ├── janitor.js           # Physical debt purge
    └── audit-engine.js      # Behavioral X-Ray logic
```

## 🎯 Overview

Security-first development practices for web applications. Treat every external input as hostile, every secret as sacred, and every authorization check as mandatory. Security isn't a phase — it's a constraint on every line of code that touches user data, state, or external systems. For the RPGlitch engine, this specifically focuses on **Zero-Trust Input Sanitization**, **Rune Access Integrity**, and the **Adversarial Audit** of AI-generated content.

## 🎯 When to Use

- Building anything that accepts user input (/OOC, character dialogue).
- Implementing authentication or authorization logic.
- Storing or transmitting sensitive data via Dexie.js.
- Integrating with external APIs or media assets.
- Adding file uploads or callbacks.
- Conducting a final Rule 06 (Compliance) audit (Behavioral X-Ray).

---

## ⚙️ Core Process: The Sovereign Audit

### 1. Behavioral X-Ray (Diagnostic)

Systematically probe the engine for "slop" or "drift".

- Check model refusal boundaries against Rule 02 (Sim Integrity).
- Ensure out-of-character (/OOC) leakage is zero.
- Run `bash .agent/skills/security-and-hardening/scripts/audit-engine.js` to verify narrative grounding.

### 2. Zero-Trust Data Boundary Enforcement

Treat every byte entering a Svelte component as a potential vector.

- **Sanitization**: All HTML output MUST pass through `DOMPurify.sanitize()` from `src/core/security.js`.
- **Load Validation**: Intercept and validate all `load` function payloads using strict JS typing.
- **Rune Purity**: Ensure `$state` and `$derived` runes are never exposed directly to external inputs without an intermediate sanitization layer.

### 3. Physical Logic & Sanitization Sweep

Before finishing a task, execute the **Janitor Protocol**.

- Run `bash .agent/skills/security-and-hardening/scripts/janitor.js` to purge temporary technical debt and verify nomenclature.
- Run `bash .agent/skills/security-and-hardening/scripts/audit-security.js` for OS-level boundary scanning (Windows/macOS/Linux).

---

## 🏛️ Extended Operational Framework

### The Three-Tier Boundary System

#### 🟢 Always Do (No Exceptions)

- **Validate all external input** at the system boundary (API routes, form handlers).
- **Sanitize every dynamic HTML render** — never render unsanitized content to the DOM.
- **Use HTTPS** for all external communication.
- **Hash sensitive tokens** if stored persistently (never store plaintext secrets).
- **Set security headers** where applicable in the manifest (CSP equivalents).
- **Run `npm audit`** before every release checkpoint.

#### 🟡 Ask First (Requires Human Approval)

- Adding new authentication flows or changing identity logic.
- Storing new categories of sensitive data (PII).
- Adding new external service integrations.
- Modifying security-relevant build configuration.
- Granting elevated permissions or roles within the simulation state.

#### 🔴 Never Do

- **Never commit secrets** to version control (API keys, passwords, tokens).
- **Never log sensitive data** (passwords, internal state tokens).
- **Never trust client-side validation** as a security boundary.
- **Never use `eval()` or unsanitized `innerHTML`** with user-provided data.
- **Never expose stack traces** or internal engine errors directly to the user persona.

---

## 🛡️ OWASP Top 10 Prevention (RPGlitch Context)

### 1. Injection (Engine & Data)

While we avoid SQL, injection remains a threat to our logic and state.

- **BAD**: Directly injecting unsanitized strings into state-mutating functions.
- **GOOD**: Use strict typing and schema validation (Zod) before data reaches the engine.
- **GOOD**: Parameterize all Dexie.js queries to prevent logical injection.

### 2. Broken Authentication

Authentication in a local-first environment focuses on access control to the IndexedDB store.

- **Session Management**: Use secure, local-only tokens.
- **Cookie Safety**: If bridging to a server, use `httpOnly`, `secure`, and `sameSite: lax` flags.

### 3. Cross-Site Scripting (XSS)

- **BAD**: Rendering `userInput` directly via `{@html ...}`.
- **GOOD**: Use Svelte 5's automatic escaping for standard text.
- **IF YOU MUST RENDER HTML**: Always use `DOMPurify.sanitize(userInput)`.

### 4. Broken Access Control

Always check authorization, not just identity.

- Every protected operation MUST check if the active entity has the requisite permission in the current simulation round.
- Prevent non-protagonist entities from modifying global state runes.

### 5. Sensitive Data Exposure

- Never return internal metadata or debug keys in user-facing responses.
- Use environment variables for all secrets; maintain `.env.example` as a template.

---

## 🔍 Input Validation Patterns

### Schema Validation at Boundaries

```javascript
// Use strict typing or Zod-style validation at the component entrance
const CharacterInputSchema = {
  name: (v) => typeof v === "string" && v.length <= 50,
  bio: (v) => typeof v === "string" && v.length <= 2000,
};

// Validate during input handling
function handleInput(payload) {
  if (!CharacterInputSchema.name(payload.name)) {
    throw new Error("Invalid Character Name");
  }
  // Proceed with sanitized data
}
```

### File Upload Safety

- Restrict file types: `['image/jpeg', 'image/png', 'image/webp']`.
- Restrict sizes: Max 5MB per asset.
- Verify Magic Numbers (File Signatures) in `src/core/security.js` to ensure content matches its declared type.

---

## 🕵️ Triaging npm audit Results

Not all findings require immediate action. Use this decision tree:

- **Severity: critical or high**
  - Is the code reachable? Fix immediately.
  - Is a fix available? Update or patch.
- **Severity: moderate**
  - Fix in the next release cycle.
- **Severity: low**
  - Track and fix during regular dependency maintenance.

---

## 📋 Security Review Checklist

### Authentication & Authorization

- [ ] Passwords/Tokens hashed (if applicable).
- [ ] Every protected operation checks entity permissions.
- [ ] Non-protagonists cannot mutate global state.

### Input & Data

- [ ] All user input validated at the system boundary.
- [ ] HTML output is encoded OR passed through `DOMPurify`.
- [ ] No secrets in code or version control.
- [ ] Sensitive fields excluded from persona-facing responses.

### Infrastructure

- [ ] Manifest security (CSP) configured.
- [ ] Dependencies audited for vulnerabilities.
- [ ] Error messages don't expose engine internals.
- [ ] Behavioral X-Ray confirms zero narrative drift.

## 📋 Common Rationalizations

- _"It's just an internal tool, security doesn't matter."_ → Internal tools are high-value targets.
- _"We'll add security later."_ → Retrofitting is 10x more difficult.
- _"No one would try to exploit this."_ → Automated scanners will find it.
- _"The framework handles it."_ → Frameworks provide tools, not guarantees.

## 🚩 Red Flags

- User input passed directly to state mutations or unsanitized HTML rendering.
- Secrets in source code or commit history.
- Missing rate limiting/cooldowns on expensive intelligence kernels.
- AI characters speaking as the narrator or the user.

## ✅ Final Safety Verification

- [ ] `npm audit` shows zero critical/high vulnerabilities.
- [ ] Zero secrets found in source code or git history.
- [ ] Janitor protocol reports 100% nomenclature cleanliness.
- [ ] Behavioral X-Ray confirms Rule 02/03 adherence.
