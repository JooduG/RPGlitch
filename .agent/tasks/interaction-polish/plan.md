# Plan: Interaction & Physics Polish

## Goal

Standardize the "Clockwork" physics engine, refine the Modal architecture to separate visual backdrops from layout, and enforce the "Chalk" visual regime on all cards.

## Tasks

- [x] **Kinetic Standardization**
    - [x] Centralize `shimmy`, `pulse`, `spin` in `artificer/actions/kinetic.js` (Web Animations API).
    - [x] Refactor `Button.svelte` to use shared kinetic actions.
    - [x] Refactor `StoryboardPill.svelte` to use shared kinetic action.

- [x] **Modal Architecture**
    - [x] Create standardized `Backdrop.svelte` component.
    - [x] Refactor `Modal.svelte` to use `Backdrop` and separate layout wrapper.
    - [x] Fix "Click to Close" on `variant-profile` (ensure clicking empty space closes modal).
    - [x] Integrate `Backdrop` into `LibraryDrawer.svelte`.

- [x] **Visual Polish (Chalk Regime)**
    - [x] `StoryboardCard`: Enforce `#222326` background and remove blue tint.
    - [x] `StoryboardCard`: Updates shimmy/sheen effects to "Nordic Fog".
    - [x] `LibraryDrawer`: Upgrade typography to Strong Sentence Case.
    - [x] `LibraryCard`: Strict anchoring of labels `1.5rem` from bottom.

- [x] **Documentation**
    - [x] Update `AGENTS.md` / `DESIGN.md` with "Clockwork Rule" (Heavy/Mechanical physics).
