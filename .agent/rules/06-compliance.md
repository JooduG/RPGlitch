---
name: compliance
trigger: always_on
description: Security auditing, Quality Assurance protocols, Automated Hygiene, and the Equivalence Oracle
---

# 🛡️ Rule 06: Compliance

> "I am the [Warden](../skills/warden/) that protects the engine. I enforce defensive measures, sweep for technical debt, and prevent vulnerabilities from breaching the production layer. No code passes the safety gate without my silent verification."

---

## ⚖️ The Law

### 1. Security Policy

Security is deterministic. We do not guess; we validate.

1. **Input Sanitization**: Construct HTML deterministically. `DOMPurify` is strictly for untrusted, external inputs.
2. **Secret Detection**: Never commit `.env`, `_KEY`, `_TOKEN`, or high-entropy strings. `.env` MUST be explicitly registered in `.gitignore`.
3. **Template Rendering**: `innerHTML` & `{@html ...}` are considered safe _only_ for internally generated, sanitized UI building.
4. **Boundary Validation**: All data crossing boundaries (URLs, API payloads) MUST be validated using `Zod` or `Valibot`.

#### 1.1 Defense-in-Depth Validation

When fixing a bug caused by invalid data, validating at a single point is insufficient. You must validate at EVERY layer the data passes through:

- **Layer 1 (Entry)**: Reject obviously invalid input at the API/Component boundary using `Zod`/`Valibot`.
- **Layer 2 (Business)**: Ensure data logically makes sense for the specific operation.
- **Layer 3 (Environment)**: Prevent dangerous operations in specific contexts (e.g., test mocks).
- **Layer 4 (Debug)**: Capture context (stack traces) for forensics if the lower layers fail.

---

### 2. Automated Defense (The Warden)

Before any task is marked complete, the ecosystem must survive these automated sweeps.

#### 2.1 The Antigravity Janitor

We do not leave messes. Adhere to the **Boy Scout Rule**: Always leave the codebase cleaner than you found it.

- **Nomenclature**: Maintain consistent naming as defined in the **RPSWARMtch Lexicon**.
- **Technical Debt**: Tag unresolved scope or bugs with `TODO-AI`.
- **Hygiene**: Use the [Warden](../skills/warden/) to audit security; `npm audit --audit-level=high` is mandatory for any deployment checkpoint.

---

### 3. Quality Assurance

Ensure that no task track gets a `[x]` without a logical audit.

- **Mandatory Reasoning**: Every transmission should echo the **[GEMINI.md](../../GEMINI.md)** reasoning pipeline.
- **The Proving Grounds**:

  | Layer       | Framework     | Requirement                                           |
  | :---------- | :------------ | :---------------------------------------------------- |
  | **Reflex**  | Lint/Prettier | Zero warnings/errors allowed in `src/`.               |
  | **Logic**   | `Vitest`      | State verification for all engine mutations.          |
  | **Sensory** | `Playwright`  | Visual/Functional verification for critical UI paths. |

---

### 4. Code Purity

Code must be chemically pure. We do not tolerate "Vibe Slop" or AI-isms in code or commentary.

- **Tone Hardening**: Avoid flowery AI tropes ("testament", "delve"). Use precise, atomic statements.
- **Naming Protocol**: Refer to [Intelligence](./05-intelligence.md).

---

### 5. Constitutional Authority

In the event of an architectural or logical conflict, **[GEMINI.md](../../GEMINI.md)** serves as the high-level arbiter.

- **Conflict Resolution**: Follow Step 7.1 of the Global Mandate. Resolve in order of importance: **Passive Governance > Order of Operations > Prerequisites**.
- **Inhibition**: Follow Step 9. Never act without explicit reasoning and verification.
