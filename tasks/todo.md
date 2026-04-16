# Mission Board: Operation Aperture 🧊

- [x] `[x]` **Phase 1: Component Core (Logic)**
    - [x] `[x]` Update `VectorArray.svelte` to remove old dashed button
    - [x] `[x]` Implement internal `Aperture` UI and height-splitting logic
    - [x] `[x]` Expose Aperture trigger prop
- [x] `[x]` **Phase 2: Interaction Bridge (Triggers)**
    - [x] `[x]` Implement Label-hover detection in `EntityFragments.svelte`
    - [x] `[x]` Wire up global signatures (orange/gray glowing states)
    - [x] `[x]` Connect Header-hover to `VectorArray` Aperture
- [ ] `[ ]` **Phase 3: Extension (Wings)**
    - [ ] Update `VisualWing.svelte` with the same Header-Aperture pattern
- [ ] `[ ]` **Phase 4: Verification**
    - [ ] Verify "Add" logic still appends to top correctly
    - [ ] Visual audit of kinetic smoothness
    - [ ] Verify non-array labels (Eternal/Present) follow the "Glow" logic without splitting
