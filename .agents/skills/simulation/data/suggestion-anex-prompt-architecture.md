# Suggestion: ANEX Prompt Architecture & Epistemic Boundaries

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Prompt Engineering, Information Theory & Epistemic Barrier Filtering  
> **Scope:** Top-to-Bottom Assembly, Bracket Parameters `[KEY: VALUE]`, Atomic Clearing, and Telepathy-Proof Filters  

---

## 1. Executive Summary

Language models exhibit semantic drift and attention degradation across long multi-turn sessions. The **ANEX (Adaptive Narrative Execution) Prompt Architecture** standardizes the compiler pipeline:
1. **Top-to-Bottom Assembly Stack:** Orders prompt elements by attention hierarchy to minimize "Lost-in-the-Middle" context penalties.
2. **Pseudo-JSON Bracket Parameters (`[KEY: VALUE]`):** Delivers a 40–60% token compression advantage over raw JSON while maintaining deterministic state mutability.
3. **Universal Atomic Clearing:** Guarantees deterministic state purges without prompt bloat.
4. **The Epistemic Wall:** Enforces strict multi-agent information boundaries to prevent AI telepathy regarding hidden user plans and secrets.

---

## 2. Information Theory: Semantic Degeneracy & Multi-Turn Decay

```text
[TURN 1] ──► Optimal State (Entropy = 0.0) ──► 100% Adherence to Core Identity
    │
    ▼ (Attention sweep encounters natural language drift)
[TURN 10] ──► Token Duplication (Entropy = 0.42) ──► Stylistic Homogenization
    │
    ▼ (Context window saturates with uncompressed prose)
[TURN 25+] ──► Context Sink Collapse ──► 39% Drop in Constraint Reliability
```

Natural human prose has a high Kolmogorov complexity and low information density. When uncompressed natural language accumulates across turns:
- **Premature Anchoring:** The LLM's autoregressive attention mechanism increasingly attends to its own previous outputs rather than the initial system prompt.
- **Context Sinks ("Lost-in-the-Middle"):** Important instructions placed in the middle of long prompts suffer severe recall degradation. ANEX forces critical instructions to the absolute top and immediate bottom (recency buffer).

---

## 3. Top-to-Bottom Assembly Stack

```text
┌──────────────────────────────────────────────────────────┐
│ 1. SYSTEM DIRECTIVE (Sovereign Authority & L1-L4 Rules)  │ ──► Top Anchor (Highest Priority)
├──────────────────────────────────────────────────────────┤
│ 2. ACTIVE ENTITY STATE (Archetype, Present Bracket State)│
├──────────────────────────────────────────────────────────┤
│ 3. WORLD SPACE & FRACTAL (Setting, Lighting, Clocks)     │
├──────────────────────────────────────────────────────────┤
│ 4. DYNAMIC STASIS BUFFER (Spotlighted NPC Vectors)       │
├──────────────────────────────────────────────────────────┤
│ 5. RELEVANT MEMORIES (Vector RAG Injections)             │
├──────────────────────────────────────────────────────────┤
│ 6. CHAT HISTORY (Rolling Window of Raw Dialogue/Prose)   │
├──────────────────────────────────────────────────────────┤
│ 7. RECENCY INSTRUCTION / TURN REMINDER                   │ ──► Bottom Anchor (Immediate Attention)
└──────────────────────────────────────────────────────────┘
```

---

## 4. Pseudo-JSON Bracket Parameter Syntax

### 4.1 Bracket Mutation Rules
Instead of verbose JSON objects, entities express dynamic physical conditions using bracket notation:

```text
[KEY: VALUE]
```

- **Direct Overwrites:** Emitting `[SHIRT: woolen sweater]` immediately replaces the previous `SHIRT` value without string concatenation or duplicate keys.
- **Universal Atomic Clearing:**
  Emitting any of the following clearing tokens deletes the specific key from the entity's active state:
  `[KEY: none]`, `[KEY: bare]`, `[KEY: naked]`, `[KEY: off]`, `[KEY: removed]`, `[KEY: disrobed]`, `[KEY: healed]`, `[KEY: cleared]`, `[KEY: normal]`.
- **Wildcard Purging:** `[CLOTHING: none]` purges all clothing keys simultaneously.
- **Multi-Item Aggregation:** Repeated occurrences of list keys merge into arrays:

  ```text
  [INVENTORY: rusty crowbar]
  [INVENTORY: oxidized scalpel]
  ```

### 4.2 Undress & Redress Lifecycle
To prevent the model from hallucinating garments into existence or losing track of removed gear:
1. **Undressing:** Stashes removed garments into `[INVENTORY: <item>]`.
2. **Redressing:** Reads items back from `INVENTORY` before restoring them to active clothing slots.

---

## 5. Epistemic Prompt Filter (The Telepathy Wall)

```text
       [USER STATE]
┌─────────────────────────┐
│ • Visible Attire        │ ────────► [PASSES THROUGH] ────────► [AI CONTEXT]
│ • Observable Actions    │
├─────────────────────────┤
│ • [SECRET: ...]         │ ───► ✕ [BLOCKED BY EPISTEMIC WALL]
│ • [PLAN: ...]           │
└─────────────────────────┘
```

### 5.1 The Rule of Epistemic Isolation
- When compiling prompt payloads for AI Characters in `render_character()`, the filter **strictly strips** `[SECRET: ...]` and `[PLAN: ...]` belonging to the User.
- The AI Character must only react to observable cues, verbal statements, or explicit physical tells.
- **Director Visibility:** The Epistemic Wall is relaxed only when compiling prompts for the Director (`render_director()`) to enable situational irony and dramatic pacing.

---

## 6. Implementation Reference

```javascript
/**
 * Strips unobservable user state across the Epistemic Wall.
 * @param {string} raw_user_state - Raw bracket state string of the user
 * @returns {string} Sanitized state visible to AI characters
 */
export function filter_epistemic_wall(raw_user_state) {
  if (!raw_user_state) return "";
  // Strip private cognitive keys: SECRET, PLAN, INTERNAL_THOUGHT
  return raw_user_state
    .replace(/\[SECRET:\s*[^\]]+\]/gi, "")
    .replace(/\[PLAN:\s*[^\]]+\]/gi, "")
    .replace(/\[INTERNAL_THOUGHT:\s*[^\]]+\]/gi, "")
    .trim();
}
```
