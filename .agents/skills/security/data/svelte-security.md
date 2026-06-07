# Svelte 5 Security Protocols: The Nordic Shield

> "Reactivity is a vector. We treat every Rune as a boundary and every Snippet as a sanitization checkpoint. The Nordic Regime demands absolute state purity."

## 🔬 Table of Contents

- [Input Sanitization & {@html}](#input-sanitization--html)
- [Rune Integrity ($state vs External Data)](#rune-integrity-state-vs-external-data)
- [Snippet & Component Boundaries](#snippet--component-boundaries)
- [Lifecycle Safety ($effect & $derived)](#lifecycle-safety-effect--derived)
- [Build-Time Security & Manifests](#build-time-security--manifests)

---

## Input Sanitization & {@html}

In Svelte 5, the `{@html}` tag is the primary XSS vector. Under no circumstances should raw user content enter this tag.

### The Sanitization Boundary

All HTML rendering MUST be deterministically sanitized using `DOMPurify` via the `src/core/security.js` bridge.

```svelte
<script>
  import { sanitize } from "$core/security";
  let { narrative_block } = $props();

  // 🟢 GOOD: Sanitized at the boundary
  let safe_html = $derived(sanitize(narrative_block));
</script>

<div class="nordic-prose">
  {@html safe_html}
</div>
```

**Rule**: If a component uses `{@html}`, it must have a corresponding audit line in the logic comments.

---

## Rune Integrity ($state vs External Data)

Runes are the engine's nervous system. Leaking unsanitized external data directly into a `$state` object can pollute the entire reactive tree.

### The Inversion Pattern

Never bind external input (bind:value) directly to core engine state. Use a "Sanity Transfer" object.

```javascript
// 🔴 BAD: Direct binding to engine state
<input bind:value={character.bio} />;

// 🟢 GOOD: Intermediate proxy with validation
let local_bio = $state(character.bio);

function syncBio() {
  if (validate(local_bio)) {
    character.bio = sanitize(local_bio);
  }
}
```

---

## Snippet & Component Boundaries

Snippets (`{#snippet ...}`) should be treated as functional boundaries. Any snippet that renders dynamic content must assume the content is hostile.

### Secure Snippet Pattern

```svelte
{#snippet entityStatus(entity)}
  <div class="status-token" class:glitch={entity.entropy > 0.9}>
    {entity.name}
    <!-- Svelte auto-escapes standard text -->
    <span class="stress-bar" style="width: {entity.stress * 100}%"></span>
  </div>
{/snippet}

{@render entityStatus(active_char)}
```

**Constraint**: Avoid passing raw HTML strings into snippets. Pass data objects and let the snippet handle the escaping.

---

## Lifecycle Safety ($effect & $derived)

Complex reactivity can create recursive vulnerabilities where state cycles freeze the browser (Low-level DoS).

### The Effect Loop Guard

1. **Never** mutate a state rune inside an `$effect` that depends on that same rune without a clear conditional exit.
2. **Minimize** logic inside `$effect`. Move complex state transitions to pure functions in `src/core/`.
3. **Audit**: Every `$effect` must be documented for its trigger-dependency map.

### Secure Derivation

Use `$derived` to enforce immutable views of sensitive state.

```javascript
// Creates a read-only, sanitized view of character data for the UI
const ui_char = $derived({
  ...character,
  display_name: sanitize(character.name),
});
```

---

## Build-Time Security & Manifests

RPGlitch operates in a Perchance environment. We maintain safety through a strict `manifest.json` and Content Security Policy (CSP).

1. **Scripts**: Only ESM imports from verified CDNs (`esm.sh`) are permitted.
2. **Styles**: Vanilla CSS only. Avoid third-party remote CSS to prevent CSS-injection vectors.
3. **Data**: Persistence is **Dexie.js** only. Direct `localStorage` access is audited for leakage.

## ✅ Svelte Quality Gate

- [ ] All `{@html}` usage is wrapped in `sanitize()`.
- [ ] Zero `$state` mutations inside `$effect` loops.
- [ ] Components use `$props` validation (Layer 1 Defense).
- [ ] No `bind:value` on global engine runes.
- [ ] `flushSync()` used only where transition-state verification is mandatory.

```

```
