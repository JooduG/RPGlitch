# 🧙‍♂️ Svecosystem & Superpowers

> **Context**: This project uses "ejected" but high-powered Svelte 5 libraries.

## 1. Runed (`runed`)

**Role**: The "Standard Library" for Svelte 5 Runes.
**Status**: ✅ Installed & Approved.

### Key Utilities

- `useDebounce`: `const debounced = useDebounce(val, 500)`
- `useLocalStorage`: `const storage = useLocalStorage('key', default)`
- `useEventListener`: Clean event handling that auto-destroys.

## 2. Paneforge (`paneforge`)

**Role**: Resizable Layout Engine (VS Code style).
**Status**: ✅ Installed & Approved.

### Usage Pattern

```svelte
<script>
    import { PaneGroup, Pane, PaneResizer } from "paneforge"
</script>

<PaneGroup direction="horizontal">
    <Pane defaultSize={20}>Sidebar</Pane>
    <PaneResizer />
    <Pane>Main Content</Pane>
</PaneGroup>
```

## 3. Disallowed / Alternatives

- **Superforms / Formsnap**: ❌ **SKIP**. Use standard `$state` for inputs in this SPA.
- **SvelteKit**: ❌ **BANNED**. Single HTML Monolith only.
