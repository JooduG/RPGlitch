# MISSION PLAN: [026] Nordic Glass Standardization (Frozen ⮕ Frisk)

**Goal**: Unify the UI using a physically accurate glass hierarchy where lower layers are darker (Frozen) and the top-most layer is lighter (Frisk). Standardize global design tokens and purge manual glass overrides.

## User Review Required

> [!IMPORTANT]
> **Stealth Sync Protocol**: I am now strictly using the `tasks/` directory as the "Source of Truth" for historical continuity. Every Antigravity update is mirrored here.
> [!TIP]
> **New Elevation Hierarchy**:
>
> - **Base/Overlay** (Bottom/Mid): Use `Frozen` (#555d66).
> - **Surface** (Top): Uses `Frisk` (#8a9399) to simulate closer light proximity.
> - **Rename**: `glass-deep` is officially renamed to `glass-surface`.

## Proposed Changes

### 🎨 [SECTION: THE NORDIC SYSTEM]

#### [MODIFY] [tokens.css](file:///c:/Users/johng/source/repos/RPGlitch/src/theme/tokens.css)

- Standardize `--glass-s`, `--glass-xl` to Frozen.
- Replace `--glass-deep` with `--glass-surface` (Frisk 30%).

#### [MODIFY] [global.css](file:///c:/Users/johng/source/repos/RPGlitch/src/theme/global.css)

- Update `.glass-base`, `.glass-overlay`, `.glass-surface` utility classes.

### 🏢 [SECTION: CORE ORGANISMS]

#### [MODIFY] [Wings & Headers]

- Refactor `SceneHeader`, `VoiceWing`, `VisualWing`, `DevWing` to use `.glass-overlay`.
- Refactor `LibraryDrawer` to remove manual glass overrides.

### 🧪 [SECTION: ATOMS & MOLECULES]

#### [MODIFY] [Modal](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/molecules/dialogs/Modal.svelte)

- Standardize `.modal-content` to `.glass-surface`.

#### [MODIFY] [StoryboardCard](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/storyboard/StoryboardCard.svelte)

- Standardize `.profile-quick-link` to `var(--glass-surface)`.

---

## Verification Plan

### Automated Tests

- `npm run verify`: General verification of the build and CSS linting.

### Manual Verification

- Visual audit of the **Drawer**, **Wings**, and **Headers** in the browser.
