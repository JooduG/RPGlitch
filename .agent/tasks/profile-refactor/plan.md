# Plan: Profile Refactor

## Phase 1: Wings & State (Foundation)

Ensure the distinct zones (Wings) function correctly and interact with the global state.

- [x] **Step 1.1:** Verification of Wing Logic.
    - Check CSS transitions for `.wing` expansion.
    - Ensure inputs in Wings are disabled when not in `isEditing`.
- [x] **Step 1.2:** System Wing (Right).
    - Styling/Functionality for "Delete Entity".
    - Add "Raw Data" view (optional, useful for debug) if space permits.

## Phase 2: The Painter (Left Wing)

Restore the `TextToImage` functionality.

- [x] **Step 2.1:** Import `TextToImage` logic from `../mesmer/logic/text-to-image.js`.
- [x] **Step 2.2:** Build the UI in the Left Wing:
    - `input` for Visual Prompt.
    - `Button` for "Generate".
    - Loading state (`visualBusy`).
- [x] **Step 2.3:** Bind result to `char.visuals.profilePictureUrl`.

## Phase 3: The Scholar (Spark UI)

Restore `Scholar.consult` functionality for text fields.

- [x] **Step 3.1:** Import `Scholar` from `../scholar/index.js` (or correct path).
- [x] **Step 3.2:** Update `PROFILE_SECTIONS` loop in the Center Column.
    - Add a "Spark" button next to `textarea` inputs.
    - Only visible in `isEditing`.
- [x] **Step 3.3:** Implement `handleConsult(field)` logic.
    - Handle loading states per-field (`magicBusy`).
- [x] **Step 4.1:** Verify `handleSave` persistence.
- [x] **Step 4.2:** Hygiene Check (Lint/Format).
