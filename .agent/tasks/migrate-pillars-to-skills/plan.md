# Plan: Pillar-to-Skill Migration

## 1. Research & Discovery

- [ ] Identify all occurrences of legacy names (`GameMaster`, `Artificer`, `Mesmer`, `Scholar`, `Warden`) in the `src` directory.
- [ ] Identify occurrences in `.agent` rule and knowledge files.

## 2. Core Implementation

- [ ] **[MODIFY] [engine.js](file:///c:/Users/johng/Documents/GitHub/default/src/core/engine/engine.js)**: Rename `GameMaster` constant to `Engine`. Update exports.
- [ ] **[MODIFY] [app.svelte.js](file:///c:/Users/johng/Documents/GitHub/default/src/state/app.svelte.js)**: Update comments and log prefixes (`[Warden]` -> `[Security]`).
- [ ] Global search and replace in `src` for comments and log strings (Case-sensitive where possible to avoid accidental breakage).

## 3. Documentation Alignment

- [ ] **[MODIFY] [standards.md](file:///c:/Users/johng/Documents/GitHub/default/.agent/rules/standards.md)**: Update "Five Pillars" section to use Skill Matrix terminology.
- [ ] **[MODIFY] [product.md](file:///c:/Users/johng/Documents/GitHub/default/.agent/knowledge/canon/product.md)**: Update "Pillar Architecture" and "Recursive Intelligence" sections.
- [ ] **[MODIFY] [tracks.md](file:///c:/Users/johng/Documents/GitHub/default/.agent/tasks/tracks.md)**: Update history and backlog references if appropriate.

## 4. Verification

- [ ] **Unit Tests**: Run `npm run test:unit` to ensure no functional regressions.
- [ ] **Build Check**: Run `npm run build` to ensure the monolith still aggregates correctly.
- [ ] **Manual Verification**: Verify console logs in a simulated run to ensure `[Security]` and other new prefixes appear correctly.
