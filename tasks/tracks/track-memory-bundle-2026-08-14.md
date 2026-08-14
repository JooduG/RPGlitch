# 🚀 Implementation Blueprint — `track-memory-exactness-canon-chronicle-2026-08-14`

> **Track Goal**: Implement the Canon Chronicle for exact fact persistence in `entity.past` (with forge-skip protection) paired with the `FACT[]` / `FACT-CLEAR[]` input protocol and deterministic zero-LLM / zero-ONNX retrieval.

---

## 🎯 Goal & Specifications

Guarantee that **exact historical facts survive long sessions**. After the Memory Forge consolidates prose history, verbatim facts ("Mia buried the key under the oak tree") remain retrievable and never consolidated away.

**Core Principles**:

- **Reuse-before-addition**: Chronicle records live in the existing `entity.past` vector array (`meta.chronicle = true`), avoiding schema bloat.
- **Hard Bounds**: Capped at 200 records of ≤220 characters each (oldest-first eviction on overflow).
- **Dedup on Insert**: Exact-string, substring, and ≥85% word-overlap matching prevent redundant fact duplication.
- **Deterministic Zero-LLM/Zero-ONNX Retrieval**: Scored via scene presence (+3), recent transcript mention (+1.5), fact type weight, and recency.
- **Explicit FACT[]/FACT-CLEAR[] Protocol**: Director emits `FACT[Name]: <fact>` for permanent updates and `FACT-CLEAR[Name]: <fact>` to cleanly overwrite previous facts.

---

## 🏗️ Technical Design

### 1. Storage Schema (`src/data/normalizer.js` & `src/intelligence/temporal.js`)

- Chronicle records stored in `entity.past` with `type: "chronicle"` and `meta.chronicle = true`.
- Typed categories: `event`, `relationship`, `promise`, `plan`, `injury`, `secret`, `possession`, `location`, `off_screen`.
- Hard bounds (max 200 records, max 220 chars per entry) enforced by normalizer.

### 2. Write & Forge Protection (`src/intelligence/temporal.js`)

- Memory Forge consolidation logic updated to **skip and preserve** all records marked with `meta.chronicle = true`.
- Dedup helper: rejects inserts with ≥85% word overlap or identical substring content.

### 3. Deterministic Retrieval (`src/intelligence/context.svelte.js` & `src/intelligence/temporal.js`)

- Retrieval function `retrieve_chronicle_facts(entity, context_state)`:
  - Scored by in-scene character bonus (+3), recent transcript mentions (+1.5), typed fact bonuses, and recency factor.
  - Injected as `<RETRIEVED_CANON_EVENTS>` block into the prompt within a tight character budget (~1,300 chars).

### 4. Input Protocol (`src/intelligence/parser.js` & `src/intelligence/prompts.js`)

- Parser recognizes `FACT[CharacterName]: <statement>` and `FACT-CLEAR[CharacterName]: <target>`.
- Mapped into Director mutations with atomic overwrite semantics.
- User-authored profile fields remain locked under Profile Readonly rules.

---

## 📋 Task Checklist

- [ ] **Phase 1 (RED — Unit Tests)**:
  - [ ] FACT[] and FACT-CLEAR[] parser tests (`src/intelligence/parser.test.js`).
  - [ ] Chronicle deduplication and length bound tests (`src/intelligence/temporal.test.js`).
  - [ ] Deterministic retrieval scoring tests without LLM/embeddings (`src/intelligence/context.test.js`).
  - [ ] Memory Forge skip-chronicle preservation tests (`src/intelligence/temporal.test.js`).

- [ ] **Phase 2 (GREEN — Storage & Write Path)**:
  - [ ] Implement chronicle storage bounds & typing in `src/data/normalizer.js`.
  - [ ] Implement chronicle insertion, deduplication, and forge-skip in `src/intelligence/temporal.js`.

- [ ] **Phase 3 (Input Protocol & Mutation)**:
  - [ ] Implement FACT[] and FACT-CLEAR[] parsing in `src/intelligence/parser.js`.
  - [ ] Wire atomic fact replacement into state mutations in `src/intelligence/kernel.js`.

- [ ] **Phase 4 (Prompt & Context Integration)**:
  - [ ] Add `FACT[]` / `FACT-CLEAR[]` rules to Director and Character system prompts in `src/intelligence/prompts.js`.
  - [ ] Integrate `<RETRIEVED_CANON_EVENTS>` prompt block into `src/intelligence/context.svelte.js`.

- [ ] **Phase 5 (VERIFY & DEPLOY)**:
  - [ ] Run `npm run verify` (`test:unit`, `test:design`, `lint`, `svelte-check`).
  - [ ] Long-session consolidation simulation test (assert facts survive multiple forge cycles).
  - [ ] Run `npm run build` for single-file bundle verification.
  - [ ] Update `tasks/PRESENT.md` pulse log and archive blueprint.
