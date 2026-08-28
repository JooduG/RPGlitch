---
description: 4-Step File Harmonization Protocol — (1) Boundaries/Relocation, (2) Ground-Up Refactor, (3) Nomenclature & Descriptive Renaming, (4) Debt Settlement & P4 Zero Backwards Compatibility.
---

# 🔄 File Harmonization Protocol (`/harmonize`)

> **Objective**: Systematically optimize an individual file or module through a structured 4-phase progression: clean layer boundaries and code relocation, a ground-up structural refactor, crisp descriptive nomenclature alignment, and ruthless debt settlement / zero backwards-compatibility purging.

---

## 📋 The Harmonization Pipeline

```text
[Step 1: Move & Boundary Audit] ➔ [Step 2: Ground-Up /refactor] ➔ [Step 3: Rename & Nomenclature Alignment] ➔ [Step 4: Debt & P4 Compatibility Purge]
```

---

### Step 1: Boundaries & Code Relocation (Move In / Move Out)

**Goal**: Ensure the file strictly owns its single domain responsibility, without hoarding alien logic or missing closely coupled primitives.

1. **Move Out (Purge Boundary Bleed)**:
   - Identify any logic, helpers, state mutations, or queries that belong to a different architectural layer (e.g., UI code in `@state`, state mutations in `@ui`, raw SQL/IndexedDB calls in components).
   - Relocate misplaced logic to its canonical owner (`src/ui/`, `src/state/`, `src/intelligence/`, `src/data/`, `src/media/`, `src/platform/`, `src/utils/`).
2. **Move In (Consolidate Domain Logic)**:
   - Check if companion utilities, single-caller helper functions, or tightly coupled data definitions scattered across other files should be consolidated into this target module.
3. **Verify Imports & Upstream Callers**:
   - Update all import/export paths across downstream consumers immediately. Enforce unidirectional downward layer hierarchy (`ui` $\rightarrow$ `state` $\rightarrow$ `intelligence` $\rightarrow$ `data` $\rightarrow$ `platform`).

---

### Step 2: Ground-Up Refactor (`/refactor`)

**Goal**: Execute a complete structural deconstruction and linear rebuild of the file for maximum readability, performance, and purity.

1. **Universal File Architecture**:
   - **Instructional Header Block**: Big comment block at the absolute top explaining purpose, schema/props, dependencies, and modification rules.
   - **Organized Body with Dividers**: Clear section dividers (`// ============================================================================`).
   - **Changelog Footer**: Document historical refactors and rationale at the bottom.
2. **Svelte 5 Runes Sovereignty** (for `.svelte` and `.svelte.js`):
   - Replace any legacy syntax with modern runes: `$state()`, `$derived()`, `$effect()`, `{@render snippet}`.
   - Purge deprecated stores (`writable`, `readable`), `$:` reactive blocks, `<slot />`, and `createEventDispatcher`.
3. **Code Optimization & Flattening**:
   - Flatten nested conditionals, callback pyramids, and deep state hierarchies.
   - Ensure clean error encapsulation (`try / catch`) and declarative data transformations (`.map()`, `.filter()`, `.reduce()`).
   - For UI components: enforce zero design drift, Tailwind v4 token alignment, and headless `bits-ui` primitives.

---

### Step 3: Rename for Clarity, Descriptiveness & Nomenclature

**Goal**: Eliminate ambiguity, strictly enforce constitutional lexical standards, and ensure names self-document their true domain behavior.

1. **Constitutional Lexical Standards ([GEMINI.md](file:///c:/Users/johng/.gemini/GEMINI.md))**:
   - **`kebab-case`**: Folders & files (e.g., `card-conversion.js`, `story-pipeline.js`, `simulation-engine/`).
   - **`PascalCase`**: Svelte components (e.g., `StoryPanel.svelte`, `TelemetryCard.svelte`).
   - **`snake_case`**: Variables, parameters, functions, and process state (e.g., `init_db()`, `current_char`, `resolve_speaking_style()`).
   - **`question_snake`**: Booleans (e.g., `is_active`, `has_token`, `is_wanderer`, `can_stream`).
   - **`SCREAMING_SNAKE`**: Constants & globals (e.g., `MAX_ENTROPY`, `SPEAKING_STYLES`, `SIGNATURE_COLORS`).
   - **Localization**: Metric/SI units, Swedish Date Standard (YYYY-MM-DD HH:MM), Europe/Stockholm timezone (GMT+2 CEST).
2. **Descriptive Verbs & Intent Alignment**:
   - Replace generic shorthand verbs (`init`, `handle`, `process`, `data`, `item`) with descriptive, unambiguous domain terms (`init_db`, `parse_character_card`, `set_versionchange_quiesce`).
   - Choose terms reflecting two-way operations, domain specificity, and ecosystem conventions rather than vague generic labels.
3. **Synchronize Downstream Consumers**:
   - Update re-exports in index barrels (`src/data/index.js`, `src/ui/index.js`, etc.) and all test file imports.

---

### Step 4: Debt Settlement & P4 Zero Backwards Compatibility Purge

**Goal**: Ruthlessly dissolve historical technical debt, purge dead code, and enforce the Pre-Beta Purity Law (**P4: Zero Backwards Compatibility**).

1. **P4 Compatibility Purge**:
   - **No Legacy Shims & Aliases**: Delete deprecated function wrappers, backward-compatible property fallbacks (e.g. `voice_register`, `turn` vs `round`, `role_tier`), or schema shims.
   - **Refactor Callers Directly**: When an abstraction or key changes, update all downstream consumers immediately instead of supporting legacy shapes.
2. **Dead Code & Zombie Fixture Pruning**:
   - Sweep the file and its corresponding test file for unused imports, dead mock helpers, obsolete test fixtures, and unreachable branches.
3. **Verification & Audit Gate**:
   - Run tests: `npm run test`
   - Run design audit (if UI/CSS): `npm run audit:design`
   - Run nomenclature audit: `npm run tool:audit-nomenclature`
   - Run markdown lint: `npm run lint:md`
   - Ensure 100% green pass with 0 errors and 0 warnings.
