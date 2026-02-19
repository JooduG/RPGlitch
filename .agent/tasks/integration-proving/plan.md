# Plan: Integration Proving (ProsePanel)

## [Goal Description]

Extract the narrative feed logic from `Storymode.svelte` into a dedicated `ProsePanel.svelte` component. This reinforces the "Single Responsibility Principle" and ensures the feed handles its own scrolling, rendering, and interaction logic using pure Svelte 5 Runes.

## User Review Required

> [!NOTE]
> Moving `src/ui/organisms/feed/ProsePanel.svelte` creates a new directory structure `feed/`.

## Proposed Changes

### UI / Feed

#### [NEW] [ProsePanel.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/feed/ProsePanel.svelte)

- **Logic**:
    - Consumes `messages.feed` from `@state/messages.svelte.js`.
    - Handles auto-scrolling with `$effect`.
    - Manages message actions (Delete, Edit, Regenerate, Continue) via `session` state.
- **Props**:
    - None (connects to global stores `messages`, `app`, `engineState`) OR `feed` prop for purity.
    - _Decision_: Connect to global stores for now to match current `Storymode` pattern, unless "Pure IO" mandate requires props. The spec says "Logic follows Pure IO where possible".
    - _Plan_: Try to use props `messages={messages.feed}` if possible, but global state is acceptable for container components.

#### [MODIFY] [Storymode.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/storymode/Storymode.svelte)

- Remove `feed` derived state.
- Remove `scrollRef` and scroll effects.
- Remove `handleDelete`, `handleRegenerate`, `handleContinue`, `handleEdit`.
- Replace feed loop with `<ProsePanel />`.

#### [NEW] [index.scss](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/organisms/feed/index.scss)

- Scoped styles for the feed container and scrollbars.

## Verification Plan

### Automated Tests

- `npm run lint`: Ensure no Svelte 4 syntax leaks.
- `npm run check`: Validate types.

### Manual Verification

1. **Load Storymode**: Verify historical messages appear.
2. **Streaming**: Generate a new message and verify smooth scrolling.
3. **Actions**: Click "Regenerate" and "Delete" to verify state updates.
4. **Responsiveness**: Resize window to ensure scrollbar behaves correctly.
