---
name: sfw-premades
description: Use when modifying the src/data/premades.js file, specifically when instructed to convert the standard premades to SFW (Safe For Work) or when sanitizing character and fractal content.
---

# Premade Sanitization (SFW)

## Overview

This skill ensures that when converting the standard `src/data/premades.js` file to a Safe For Work (SFW) version, the original NSFW (Not Safe For Work) content is securely saved and never permanently lost.

Violating the letter of these instructions is a violation of the spirit of these instructions.

---

## The Bright-Line Constraint

Overwrite the NSFW version of the premades without backing it up? Revert the changes. Start over.

**No exceptions:**

- Do not delete or overwrite the original NSFW content permanently.
- Do not start editing `premades.js` without first creating a safe backup of the explicit version.
- Do not mix SFW and NSFW versions in the same file via comments.

---

## Required Execution Steps

When triggered to make the premades SFW, you must follow these steps exactly:

1. **Create the Backup**: Before making ANY changes, copy `src/data/premades.js` to `src/data/premades.nsfw.js`. This preserves the original adult content for later use.
2. **Sanitize the Core File**: Edit `src/data/premades.js` to remove explicit language, extreme physical descriptions, and sexual dynamics/vectors. Replace them with SFW equivalents that maintain the character's core personality and the fractal's thematic essence.
3. **Verification**: Ensure both `src/data/premades.js` (SFW) and `src/data/premades.nsfw.js` (NSFW) exist and contain valid syntax.

---

## Counter-Rationalization Table

| Agent Excuse                                                             | Operational Reality Check                                                                                              |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| "I can just comment out the NSFW parts in the same file."                | Comments clutter the production file and risk exposing explicit content. Always create a separate `.nsfw.js` file.     |
| "I will save the NSFW content later if the user asks for it."            | Data loss is irreversible. The backup MUST be created before any sanitization begins.                                  |
| "This character's whole personality is NSFW, I should just delete them." | Do not delete entities. Adapt their core themes (e.g., intense loyalty, medical precision, etc.) into SFW equivalents. |
