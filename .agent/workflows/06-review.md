---
description: The "Apex Review" Protocol. A high-level audit for completed tracks or major features.
skill: scholar
constraints:
    - "MUST adopt the Scholar Persona."
context:
    - "Review this track"
    - "Audit this feature"
    - "Check for completion"
---

# ⚖️ Apex Review Protocol (Audit)

> **Goal:** Verify that a Body of Work meets the Prime Directive and Project Standards before anchoring.

## 1. Scope Definition

1.  **Identify**: What is being reviewed? (Track ID, Feature, or Module).
2.  **Reference**: Load `plan.md` and `task.md` to establish the "Promise".

## 2. The Matrices

### A. Core Matrix (The Soul)

- [ ] **Lore Alignment**: Does this fit the narrative/world?
- [ ] **Prime Directive**: Did we respect the User's Agency?
- [ ] **Aesthetic**: Does it comply with the "Chalk Regime" / Mesmer's Law?

### B. Tech Matrix (The Body)

- [ ] **Runes Audit**: Correct usage of `$state`, `$derived`, `$effect`.
- [ ] **Security**: Zero `innerHTML` without sanitization.
- [ ] **Hygiene**: No console logs, proper naming conventions.

### C. Validation Matrix (The Proof)

- [ ] **Tests**: E2E or Unit tests pass.
- [ ] **Functionality**: specifically meets the User's request.

## 3. The Verdict

- **PASS**: The work is accepted. Move to `walkthrough.md` and Close Track.
- **REVISE**: Specific gaps found. Return to **Execution Mode**.
- **REJECT**: Fundamental flaw. Trigger **Revert Protocol**.

## 4. Report

- Output a markdown summary of the Review Findings.
