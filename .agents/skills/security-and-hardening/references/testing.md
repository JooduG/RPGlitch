# Security & Hardening Skill: Testing & QA Procedures

> **Context:** Structural integrity and logic hygiene protocols.

## 1. The Root Cause Tracing Protocol (Debugging)

**Trace backward through the call chain.**

1. **Observe Symptom:** Identify where the failure manifests (UI glitch, error log).
2. **Immediate Cause:** Find the code directly throwing the error (e.g., `undefined` access).
3. **Trace Up:** Ask "What called this?" and "What value was passed?" until the origin point is found.
4. **Fix Source:** Never patch the symptom. Add validation or fix the logic at the origin.

### Diagnostics Toolbox

| Method             | Narrative                                                                 | Trigger                              |
| :----------------- | :------------------------------------------------------------------------ | :----------------------------------- |
| **Binary Search**  | Comment out 50% of the logic to isolate the failure region.               | "I have no idea where the bug is."   |
| **Rubber Ducking** | Explain the code line-by-line to the user or yourself.                    | "The logic seems correct but fails." |
| **Clear Thought**  | Use `mcp_waldzell_clear-thought` to map findings formally before editing. | Complex, multi-file logic errors.    |

## 2. Condition-Based Waiting (Stability)

Flaky tests often fail due to race conditions or arbitrary `setTimeout` calls.

**Core Principle:** Wait for the actual condition, not a guess at timing.

```javascript
// ✅ Correct: Waiting for condition
await waitFor(() => getResult() !== undefined, "Result initialization");
const result = getResult();
expect(result).toBeDefined();
```

### Polling Standard

- **Polrate:** 10ms (Efficient but responsive).
- **Timeout:** Always include a clear timeout description (default 5000ms).
- **Freshness:** Always call the getter inside the loop to avoid stale closure data.

## 3. Svelte 5 Testing Patterns (Vitest)

- **Hydration:** Use `mount` and `unmount` from `svelte` for component tests.
- **Runes in Tests:** Filenames must end in `.svelte.test.js`.
- **Side Effects:** Wrap tests that trigger `$effect` in `$effect.root`.
- **Flush Sync:** Use `flushSync()` to force state updates before making assertions.

## 4. E2E Testing (Playwright)

- **Focus:** User flows and high-level causality checks.
- **Configuration:** `playwright.config.js`.
- **Rule:** Do not test implementation details; test user-visible outcomes.

## 5. The Quality Gate

Before any feature is merged/finalized:

1. **Functional:** Does it meet the User Review requirements?
2. **Structural:** Run `npx @sveltejs/mcp svelte-autofixer` on new components.
3. **Reactive:** Ensure no "banned patterns" (`writable`, `export let`) persist.
4. **Hygiene:** Check for legacy `console.log` or debug artifacts.
