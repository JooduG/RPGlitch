# Zero-Trust UI Architecture: The Hostile Frontier

> "The client is a battlefield. Trust nothing entering from the network, verify everything before rendering, and assume every interaction is a potential breach of the engine's physics."

## 🔬 Table of Contents

- [The Philosophy of Hostile Frontiers](#the-philosophy-of-hostile-frontiers)
- [Contract Enforcement (Schema Validation)](#contract-enforcement-schema-validation)
- [State Isolation & Encapsulation](#state-isolation--encapsulation)
- [Fallout UI (Fail-Safe Rendering)](#fallout-ui-fail-safe-rendering)
- [Adversarial UI Verification](#adversarial-ui-verification)

---

## The Philosophy of Hostile Frontiers

In the RPGlitch architecture, the UI is not just a display layer — it is a **Boundary Controller**. We operate under the 'Zero-Trust' model:

1. **Explicit Identification**: No data enters the component tree without being identified and typed.
2. **Access Control**: State transitions are gated by permission-aware runes.
3. **Assumed Breach**: We design with the assumption that data has already been intercepted or malformed.

---

## Contract Enforcement (Schema Validation)

Every data payload crossing the boundary (from Dexie.js or the Intelligence Kernel) MUST be validated against a strict schema.

### Runtime Schema Pattern

TypeScript types provide compile-time safety but vanish at runtime. We use **Zod** or **Light-Validation** in `src/core/security.js` to enforce contracts at every tick.

```javascript
import { EntitySchema } from "$core/security";

// 🟢 GOOD: Validation before state assignment
function loadProfile(raw_data) {
  const { success, data, error } = EntitySchema.safeParse(raw_data);

  if (!success) {
    logger.critical("Contract Breach Detected", error);
    triggerFallout("malformed-entity");
    return;
  }

  // High-fidelity state assignment
  active_entity = data;
}
```

---

## State Isolation & Encapsulation

The Nordic Regime utilizes encapsulated state to prevent lateral data leakage between entities.

### Scope Purity

- **Component Local State**: Use `$state` for UI-only concerns (toggles, hover).
- **Global Intelligence state**: Managed via the `DynamicsEngine` and surfaced through read-only `$derived` views.
- **Immutability**: Treat state snapshots as immutable. Never mutate an object received from a prop; instead, clone, validate, and emit a gated signal to the engine.

---

## Fallout UI (Fail-Safe Rendering)

When a contract breach or engine failure occurs, we never crash. We transition to a **Fallout UI**.

### Error Boundary Strategy

1. **Detection**: Catch exceptions in Svelte's `onerror` lifecycle or via `$effect` error guards.
2. **Containment**: Isolate the broken component (e.g., the specific Profile Slot).
3. **Degradation**: Render a "Chalk Regime" error token with diagnostic info for the user, while keeping the rest of the simulation round active.

```svelte
<script>
  let error_state = $state(null);

  // Custom boundary logic in Nordic Regime
  $effect(() => {
    if (critical_failure) {
      error_state = "simulation-desync";
    }
  });
</script>

{#if error_state}
  <FalloutOverlay type={error_state} />
{:else}
  {@render children()}
{/if}
```

---

## Adversarial UI Verification

Before any UI change is marked [DONE], it must survive the **Adversarial Audit**:

- **Null-Probing**: Does the UI survive `null/undefined` payloads for every prop?
- **OOM-Stress**: Does the UI degrade gracefully during high-entropy narrative loops?
- **Injection-Probe**: Can simulated "hostile" strings (e.g., `<script>`) bypass the sanitization gate?

---

## ✅ Zero-Trust Quality Gate

- [ ] All API/Data payloads validated via schema at the entry point.
- [ ] No raw "any" types or unverified casting.
- [ ] Components implement explicit Error Boundaries (Fallout UI).
- [ ] State is encapsulated with zero lateral leakage between entity profiles.
- [ ] Sensory bridges (Audio/Visual) are gated by direct user interaction state.

```

```
