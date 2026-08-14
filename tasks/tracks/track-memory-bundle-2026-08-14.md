# 🚀 Implementation Blueprint — `track-memory-bundle-2026-08-14`

> **Track Goal**: Implement the Canon Chronicle for exact fact persistence in `entity.past` (with forge-skip protection) paired with the `FACT[]` / `FACT-CLEAR[]` input protocol and deterministic zero-LLM / zero-ONNX retrieval.

```text
  DIRECTOR / ENGINE EMISSION
  ┌───────────────────────────────────────────────────────────────────────┐
  │ FACT[Ren]: Hid the stolen ledger beneath floorboards in the old mill  │
  │ FACT-CLEAR[Ren]: Looking for the ledger                               │
  └───────────────────────────────────┬───────────────────────────────────┘
                                      │
                               ┌──────▼──────┐
                               │ Parser / DM │
                               └──────┬──────┘
                                      │
  WRITE & STORAGE PATH                ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │ 1. Deduplication (Exact / Substring / ≥85% Word Overlap)              │
  │ 2. Storage: entity.past[] (type: "chronicle", meta.chronicle = true)  │
  │ 3. Bounds Enforcement: Max 200 entries, ≤220 chars each               │
  └───────────────────┬───────────────────────────────┬───────────────────┘
                      │                               │
                      ▼                               ▼
  ┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
  │     Memory Forge Consolidation       │  │     Deterministic Context Engine     │
  │   (meta.chronicle = true SKIPPED)    │  │  Score = In-Scene(+3) + Mention(+1.5)│
  │    Verbatim facts are preserved      │  │          + Type Weight + Recency     │
  └──────────────────────────────────────┘  └──────────────────┬───────────────────┘
                                                               │
                                                               ▼
                                            ┌──────────────────────────────────────┐
                                            │ Prompt: <RETRIEVED_CANON_EVENTS>     │
                                            │ Budget: ~1,300 characters            │
                                            └──────────────────────────────────────┘
```

---

## 1. Storage Schema & Forge-Skip Protection

### A. Record Schema (`entity.past`)

Rather than creating an isolated database or ballooning the schema, Chronicle records reside within the existing `entity.past` vector array using metadata flags:

- **Identifier Flag**: `meta.chronicle = true`.
- **Record Type**: `type: "chronicle"`.
- **Typed Taxonomies**: `event`, `relationship`, `promise`, `plan`, `injury`, `secret`, `possession`, `location`, `off_screen`.
- **Bound Limits**: Hard maximum of **200 records per entity**; **≤220 characters per entry**. Oldest records evict first upon capacity overflow.

### B. Ingestion Deduplication Matrix

Before writing to `entity.past`, candidate facts are evaluated by `temporal.js` to eliminate redundant memory records:

| Deduplication Layer      | Criteria                                                | Action                                              |
| :----------------------- | :------------------------------------------------------ | :-------------------------------------------------- |
| **Exact Match**          | Identical string content                                | Drop candidate duplicate.                           |
| **Substring Match**      | Candidate exists within an existing entry or vice-versa | Drop candidate or keep the most descriptive record. |
| **Fuzzy Semantic Match** | $\ge 85\%$ word-overlap similarity                      | Reject candidate as duplicate.                      |

### C. Forge-Skip Preservation

During periodic long-session memory consolidation, the Memory Forge processes narrative prose while ignoring Chronicle facts:

- Every record marked with `meta.chronicle = true` is explicitly **bypassed and preserved intact**.
- Canon facts survive infinite consolidation cycles without semantic degradation.

---

## 2. Deterministic Retrieval Engine (Zero-LLM / Zero-ONNX)

Facts are retrieved via heuristic evaluation without incurring ONNX embedding latency or LLM token overhead.

### Scoring Calculation (`retrieve_chronicle_facts`)

When a prompt is assembled, every chronicle record in `entity.past` is scored via the following heuristic weights:

$$\text{Score} = S_{\text{scene}} + S_{\text{mention}} + W_{\text{type}} + R_{\text{recency}}$$

- **In-Scene Character Bonus ($S_{\text{scene}}$)**: $+3.0$ if the associated character is present in the current scene.
- **Transcript Mention Bonus ($S_{\text{mention}}$)**: $+1.5$ if the fact's keywords or subject appear in the recent turn window.
- **Category Weight ($W_{\text{type}}$)**: Priority modifier assigned by fact taxonomy (e.g., active `secret`, `promise`, or `injury` prioritize higher than passive background `event`).
- **Recency Factor ($R_{\text{recency}}$)**: Normalized value favoring recent canon entries.

### Prompt Injection Block

Top-ranking records are injected into character and director contexts within a strict **~1,300 character budget**:

```xml
<RETRIEVED_CANON_EVENTS>
  - Mia buried the copper key beneath the root of the mill's oak tree. [secret]
  - Ren owes 400 credits to the Silver Talon syndicate. [debt]
  - Julian's left arm was fractured during the breach. [injury]
</RETRIEVED_CANON_EVENTS>
```

---

## 3. Protocol & State Mutation (`FACT[]` / `FACT-CLEAR[]`)

The Director system emits discrete fact signals to atomically append or overwrite state without modifying user-authored locked fields.

```text
FACT[CharacterName]: <verbatim fact statement>
FACT-CLEAR[CharacterName]: <target fact or keyword to overwrite>
```

### Operational Directives

1. **`FACT[Target]`**: Adds a permanent canon fact to `Target`'s `entity.past` array after passing dedup and length validation.
2. **`FACT-CLEAR[Target]`**: Locates and purges outdated or resolved facts (e.g., a resolved debt or recovered item) to prevent stale narrative conflicts.
3. **Readonly Protection**: User-authored core profile fields remain immutable; `FACT[]` mutations are restricted to the dynamic past/chronicle stream.

---

## 4. Implementation Playbook (Bite-Sized Checklist)

### Phase 1: Test-Driven Red Suite

- [ ] **Protocol Parser Unit Tests**: Add test assertions in `src/intelligence/parser.test.js` validating `FACT[]` and `FACT-CLEAR[]` token extraction and character routing.
- [ ] **Chronicle Normalization & Bounds**: Create tests in `src/intelligence/temporal.test.js` ensuring 220-char caps, 200-item eviction, and dedup (substring and $\ge 85\%$ overlap).
- [ ] **Deterministic Retrieval Scoring**: Build tests in `src/intelligence/context.test.js` verifying scoring weights (scene presence $+3$, mention $+1.5$, category bonus, recency).
- [ ] **Forge-Skip Protection**: Create tests in `src/intelligence/temporal.test.js` proving `meta.chronicle = true` records survive consolidation routines unaltered.

### Phase 2: Storage & Storage Logic

- [ ] **Schema Normalization**: Update `src/data/normalizer.js` with chronicle bounds and typing sanitization.
- [ ] **Temporal Chronicle Engine**: Implement chronicle insertion, string/overlap deduplication, and forge-skip safeguards in `src/intelligence/temporal.js`.

### Phase 3: Protocol Parsing & Kernel Mutations

- [ ] **Parser Implementation**: Implement `FACT[]` and `FACT-CLEAR[]` parsing rules in `src/intelligence/parser.js`.
- [ ] **Kernel State Mutations**: Connect parsed fact actions to atomic state operations in `src/intelligence/kernel.js` while maintaining user profile readonly protections.

### Phase 4: Context Assembly & Prompt Integration

- [ ] **Prompt Directive Injection**: Add emission formatting instructions for `FACT[]` / `FACT-CLEAR[]` into Director and Character system prompts within `src/intelligence/prompts.js`.
- [ ] **Chronicle Block Assembly**: Implement `retrieve_chronicle_facts` context assembly and inject the `<RETRIEVED_CANON_EVENTS>` block in `src/intelligence/context.svelte.js`.

### Phase 5: Verification & Deployment

- [ ] **Run Test Verification Suite**:

  ```bash
  npm run verify
  ```

  _(Validates `test:unit`, `test:design`, `lint`, and `svelte-check`)_.

- [ ] **Long-Session Simulation**: Simulate a 50+ turn narrative session to verify that canon facts survive consecutive Memory Forge consolidation cycles.
- [ ] **Production Bundle**:

  ```bash
  npm run build
  ```

- [ ] **Archival**: Update `tasks/PRESENT.md` and archive track documentation.
