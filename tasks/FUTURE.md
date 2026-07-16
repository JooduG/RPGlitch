# Implementation Plan: Address Parser and Director Issues

## Goal

Address the 3 issues described in `scribbles.md`:

1. JSON quote-escaping robustness: Automatically replace raw unescaped interior double-quotes with clean backslashed equivalents (`\"`) in JSON strings before parsing them.
2. Sanitize leaking XML formatting tokens: Strip leaking tokens like `&quot;` and `&apos;` in `parse_message` right before calling `wrap_dialogue`.
3. Fallback block for Director JSON failure: Intercept raw text prose if model generation drops brackets or outputs invalid JSON, mapping it to `internal_monologue` so it is not lost.

## Research & Audit

- **Files affected**:
  - `src/intelligence/parser.js`
  - `src/intelligence/kernel.js`
  - `src/intelligence/parser.test.js`
  - `src/intelligence/kernel.test.js`

## Steps

- [x] Implement JSON quote-escaping function in `parser.js`
- [x] Add XML entity sanitization in `parse_message` in `parser.js`
- [x] Update `parse_director_json` in `kernel.js` with fallback logic
- [x] Add parser unit tests in `parser.test.js`
- [x] Add kernel unit tests in `kernel.test.js`
- [x] Run `npm run verify` to verify local CI success
- [x] Update `scribbles.md` to check items as complete
