# Spec: Profile Modal Refactor

## 1. Context & Goal

The Profile Modal is undergoing a major redesign ("Three-Zone Layout") to simplify the code structure while enhancing the UX.
The "Readonly Experience" is largely complete. The goal of this track is to implement the "Interactive Experience" ("Everything Else"), seamlessly porting the powerful AI features from the legacy version into the new modular architecture.

## 2. The "Three-Zone" Concept

The new design splits the profile into tree zones:

1. **Center (Presentation):** The character card/dossier. Read-optimized.
2. **Left Wing (Creative):** Tools for changing the entity's appearance (Color, Image Generation). Visible only in Edit Mode.
3. **Right Wing (System):** Meta-controls (UUID, Delete, JSON inspect). Visible only in Edit Mode.

## 3. Requirements

### 3.1 Legacy Feature Restoration

We must restore the following features from `Profile.svelte.backup-v8`:

- **Paint Tool (`TextToImage`):** Allow generating new profile pictures via AI. (Location: Left Wing).
- **Spark UI (`Scholar.consult`):** Allow generating text content (Lore, Personality, etc.) via AI. (Location: Inline with fields or floating toolbar).

### 3.2 System Integrity

- **Persistence:** Ensure `runtime.saveEntity` correctly persists changes to Dexie.
- **Validation:** Ensure inputs are sanitized.
- **State Management:** Use Runes (`$state`, `$derived`) exclusively.

### 3.3 Visual Polish

- **Transitions:** Smooth expansion of Wings when entering Edit Mode.
- **Responsive:** Ensure layouts handle smaller screens gracefully (as per `tech-stack.md` grid rules).

## 4. Acceptance Criteria

- [ ] User can toggle "Edit Mode" which expands the Side Wings.
- [ ] User can generate a new Profile Picture using a text prompt in the Left Wing.
- [ ] User can use "Spark" buttons to auto-generate text for fields (Name, Description, etc.).
- [ ] Changes are persisted to the database upon "Save".
- [ ] "Delete" function works from the Right Wing.
