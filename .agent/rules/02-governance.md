---
trigger: always_on
description: The Immutable Laws of Governance.
---

# ⚖️ 02-governance.md (The Law)

## 1. Nomenclature (Regex Enforced)

| Entity               | Pattern                          | Example                 |
| :------------------- | :------------------------------- | :---------------------- |
| **Directory**        | `^[a-z0-9-]+$`                   | `src/core/game-engine/` |
| **Svelte Component** | `^[A-Z][a-zA-Z0-9]+\.svelte$`    | `StoryPanel.svelte`     |
| **Script/Utility**   | `^[a-z0-9_]+\.(js\|ts)$`         | `verify_state.js`       |
| **Asset**            | `^[a-z0-9_-]+\.(png\|jpg\|svg)$` | `hero-banner.png`       |
| **Knowledge**        | `^[a-z0-9-]+\.md$`               | `01-stack.md`           |

## 2. Localization & Units (SI Standard)

- **Time:** ISO 8601 (`YYYY-MM-DD`, `HH:MM:SS`). **NO** `MM/DD/YYYY`.
- **Distance:** Meters (`m`), Kilometers (`km`). **NO** Feet/Miles.
- **Weight:** Grams (`g`), Kilograms (`kg`). **NO** Lbs/Oz.
- **Temperature:** Celsius (`°C`). **NO** Fahrenheit.

## 3. Zero-Trust Security (The Shield)

### 🛑 Constraints

1.  **Input Sanitization:** ALL user input must pass through `DOMPurify` before DOM rendering.
2.  **No Secrets:** NEVER commit `.env`, `_KEY`, `_TOKEN`, or `_SECRET` files.
3.  **No `innerHTML`:** Use `textContent` or sanitized `{@html ...}` only if unavoidable.
4.  **No External Fonts:** Serve all fonts locally (GDPR/Privacy).

## 4. Operational Hygiene

- **Console.log:** 🚫 **FORBIDDEN** in Production. Use `Logger` class.
- **Comments:** Explain _WHY_, not _WHAT_.
- **TODOs:** 🚫 **FORBIDDEN**. Do it now or track it in `plan.md`.
