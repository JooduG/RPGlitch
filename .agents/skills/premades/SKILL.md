---
name: sfw-premades
description: Use when modifying the src/data/premades.js file, specifically when instructed to convert the standard premades to SFW (Safe For Work) or when sanitizing character and fractal content.
---

# Premades Manager

## Overview

This skill governs the `src/data/premades.js` file and its relationship to the NSFW vault.

- **Live file** (`src/data/premades.js`): The SFW version used in production.
- **Vault** (`.agents/skills/premades/assets/premades.nsfw.js`): The original NSFW version, preserved permanently.

Violating the letter of these instructions is a violation of the spirit of these instructions.

---

## Directory Structure

```text
.agents/skills/premades/
├── SKILL.md                  # This file — instructions and constraints
└── assets/
    └── premades-nsfw.js      # 🔒 THE VAULT — original NSFW content, never modified
```

---

## The Bright-Line Constraint

Overwrite or delete the vault (`assets/premades.nsfw.js`) for any reason? Revert immediately. Start over.

**No exceptions:**

- Do not edit `assets/premades.nsfw.js`. It is read-only archival storage.
- Do not start sanitizing `src/data/premades.js` without first verifying the vault exists and is intact.
- Do not mix SFW and NSFW content in the same file via comments or conditionals.
- The vault is the source of truth for the full NSFW roster. Always restore from it.

---

## Execution Steps — Converting Live File to SFW

When triggered to sanitize the premades:

1. **Verify the vault**: Confirm `assets/premades-nsfw.js` exists and contains valid JS. If it is missing or corrupt, copy from `src/data/premades.js` before doing anything else.
2. **Sanitize the live file**: Edit `src/data/premades.js` to remove explicit language, extreme physical descriptions, and sexual dynamics/vectors. Replace with SFW equivalents that preserve each character's core personality and each fractal's thematic identity.
3. **Verify syntax**: Confirm `src/data/premades.js` parses without errors after sanitization.
4. **Do not touch the vault**: `assets/premades.nsfw.js` must remain unchanged throughout the entire process.

## Execution Steps — Restoring NSFW Content

When triggered to restore the original premades:

1. Copy `assets/premades-nsfw.js` → `src/data/premades.js`, overwriting the SFW version.
2. Confirm the restored file parses without errors.

---

## SFW Sanitization Guidelines

When rewriting entities for SFW, follow these rules per field:

| Field                  | NSFW → SFW Rule                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `description`          | Keep the character archetype; remove explicit sexual references.                                                       |
| `eternal.physical`     | Remove explicit body part references (bulge, etc.). Keep build, face, hair, height.                                    |
| `eternal.non_physical` | Keep personality core (charisma, intelligence, loyalty). Remove sexual drive and explicit kinks.                       |
| `present.physical`     | Describe attire cleanly; remove revealing or explicit garment details.                                                 |
| `present.non_physical` | Keep emotional/operational state; remove sexual anticipation or explicit intent.                                       |
| `past[].directive`     | Keep formative backstory beats; remove explicit acts.                                                                  |
| `future[].directive`   | Keep ambition and motivation; remove explicit sexual goals.                                                            |
| `vector_tags`          | Replace explicit tags (e.g. `breeding`, `bimbofication`) with neutral equivalents (e.g. `ambition`, `transformation`). |

---

## Counter-Rationalization Table

| Agent Excuse                                                            | Operational Reality Check                                                                                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| "I can save the NSFW content later if the user asks."                   | The vault already exists. Never assume; always verify it is there before sanitizing.                                                             |
| "This character's personality is entirely NSFW — I should delete them." | Do not delete entities. Adapt their core archetype into a SFW equivalent. Every character has a thematic identity beyond their explicit content. |
| "I'll just comment out the explicit parts in the live file."            | Comments in the production file are forbidden. The vault is the correct mechanism for preserving NSFW content.                                   |
| "The vault file looks fine, I don't need to check it."                  | Always verify it parses correctly before beginning sanitization. Silent corruption is real.                                                      |
