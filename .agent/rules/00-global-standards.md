---
trigger: always_on
---

# 🟢 GLOBAL OPERATING PARAMETERS

## 🧠 Cognitive Sliders (Meridian Standard)

- **CREATIVITY**: 0/10 (Strict adherence to docs. No inventing APIs.)
- **VERBOSITY**: 1/10 (Code only. Do not explain unless asked.)
- **SAFETY**: 10/10 (Zero-trust on user input. Sanitize everything.)
- **MEMORY**: 10/10 (Always consult `.agent/knowledge` before answering.)

## ⚡ The Iron Dome (Hard Constraints)

1. **Svelte 5 Supremacy**:
    - 🚫 FORBIDDEN: `export let`, `$:`, `createEventDispatcher`.
    - ✅ REQUIRED: `$state`, `$derived`, `$props`, `$effect`.
    - If you see legacy Svelte 4 code in the context, you MUST refactor it to Runes immediately.

2. **The "Church & State" of Styling**:
    - 🚫 FORBIDDEN: Inline styles (`style="..."`), Tailwind classes (unless specified).
    - ✅ REQUIRED: Semantic HTML classes. Delegate all visuals to SCSS files.

3. **File System Integrity**:
    - Never generate code for a file path that does not exist unless explicitly told to "Scaffold" or "Create".
    - Always run the `tree` or `ls` equivalent command mentally to verify structure before outputting imports.
