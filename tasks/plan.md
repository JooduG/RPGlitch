# Mission Plan: Security Hardening & UI Polish [045]

> **Status**: `[DONE]`
> **Mission**: Resolve security and architectural vulnerabilities identified in code review, including prompt injection, NSFW content, and UI layering/animation debt.

## User Review Required

> [!IMPORTANT]
> The `escape` function is being updated to include double and single quotes. This is a breaking change for any logic that depends on quotes being preserved in the escaped output, but it is necessary for prompt injection protection.

## Proposed Changes

### [Security]

#### [MODIFY] [security.js](file:///c:/Users/johng/source/repos/RPGlitch/src/core/security.js)
- Update the `escape` function to also escape double quotes (`"`) and single quotes (`'`).
- This prevents users from "escaping" string-wrapped prompt templates.

#### [MODIFY] [optics.js](file:///c:/Users/johng/source/repos/RPGlitch/src/media/optics.js)
- Replace explicit NSFW examples in the `SEMANTIC RESONANCE` instruction with neutral, genre-accurate examples.
- This ensures compliance with AI safety filters.

---

### [UI & Aesthetics]

#### [MODIFY] [floating-dropdown.js](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/utils/actions/floating-dropdown.js)
- Replace `display: none/flex` with `visibility`, `opacity`, and `pointer-events`.
- Update `zIndex` calculation to use `var(--z-index-max)`.

#### [MODIFY] [AudioWing.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/profile/wings/AudioWing.svelte)
- Remove redundant `z-index: 9999;`.

## Verification Plan

### Automated Tests
- `npm test src/core/security.js`
- `npm test src/media/optics.js`

### Manual Verification
- **Prompt Injection**: Verify quotes are escaped in input.
- **UI Transitions**: Verify smooth fade in/out for dropdowns.
- **Z-Index**: Verify dropdowns render above all other elements.
