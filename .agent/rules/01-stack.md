---
trigger: always_on
description: The Immutable Physics of the Environment.
---

# ⚡ 01-stack.md (The Physics)

## 1. Svelte 5 Supremacy (Iron Dome)

| Syntax                  | Status           | Mandate                               |
| :---------------------- | :--------------- | :------------------------------------ |
| `export let`            | 🚫 **FORBIDDEN** | Use `$props()`.                       |
| `$:`                    | 🚫 **FORBIDDEN** | Use `$derived()` or `$effect()`.      |
| `createEventDispatcher` | 🚫 **FORBIDDEN** | Use callback props (e.g., `onclick`). |
| `let x` (Reactive)      | 🚫 **FORBIDDEN** | Use `let x = $state()`.               |
| `<slot />`              | 🚫 **FORBIDDEN** | Use `{@render children()}` snippets.  |
| `any` Type              | 🚫 **FORBIDDEN** | Define specific Interfaces.           |
| `store.subscribe`       | 🚫 **FORBIDDEN** | Auto-subscribe via `$state` values.   |

## 2. The "Church & State" of Styling (Chalk Regime)

- **State (HTML/JS):** Managed by **Artificer**.
- **Church (CSS):** Managed by **Mesmer**.

### 🛑 Constraints

1.  **NO Inline Styles**: `style="..."` is strictly prohibited.
2.  **NO Global CSS**: All styles must be component-scoped or in `src/ui/theme/`.
3.  **NO Tailwind**: Unless explicitly requested by User.
4.  **NO Hardcoded Hex**: Use `var(--app-token)` exclusively.

### ✅ Architecture

- **File:** `src/ui/components/[Component]/[Component].scss`
- **Import:** `@use "src/ui/theme/mixins" as *;`

## 3. The Quality Gate (Testing)

- **Mandate:** All new features **MUST** pass verification before `[x]`.
- **Tool:** `node .agent/skills/warden/scripts/warden.js`

| Gate     | Trigger      | Tool              |
| :------- | :----------- | :---------------- |
| **Lint** | Pre-Commit   | `npm run lint`    |
| **Type** | Pre-Build    | `npm run check`   |
| **Unit** | Logic Change | `vitest run`      |
| **E2E**  | UI Change    | `playwright test` |

## 4. File System Integrity

- **Read-Before-Write:** Always `ls` or `tree` before generating paths.
- **No Ghost Files:** Never import a file that hasn't been verified to exist.
- **Asset Colocation:** Images/Assets live in `src/assets/`, not `public/`.
