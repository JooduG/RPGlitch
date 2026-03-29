---
name: css
version: 1.0.0
description: Consolidates Native CSS and polish. Applies the Chalk Regime, glassmorphism, and strict design tokens.
allowed-tools: ["Read", "Write"]
effort: medium
risk: safe
---

# 🛠️ css

> **Persona**: **Skill Executor**: "I am the Stylist. I own the Chalk Regime, the glassmorphism, and the visual soul of the RPGlitch Engine. I synthesize Aesthetic Intent into Visual Reality via Design Tokens and Native CSS."

## 🔬 Anatomy

```text
skills/css/           # Logical Sovereign
├── SKILL.md                     # The Directive
├── scripts/                     # Operational (The How)
└── references/                  # Historical (The Why)
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Visual consistency is absolute. Use of the "Chalk Regime" ensures a premium, Nordic aesthetic.
- **Architectural Integrity**: Native CSS Custom Properties only. Strict separation of layout and theme.
- **Sensory Excellence**: Implementation of atmospheric noise and glassmorphism for depth.

## 📋 Procedure

### Component Polishing

1. **Token Synchronization**:
   - Strip utility classes (Tailwind, etc.).
   - Replace with semantic classes mapped to `var(--token)` values (e.g., `var(--color-chalk)`).

2. **Depth Application**:
   - Apply standard elevation shadows and glassmorphic blurs (`blur-m` to `blur-xl`).
   - Add kinetic transitions for interactions.

### UI Consistency Audit

- **Definition of Done**: All hardcoded hex values removed; components utilize global tokens; responsive scale respects T-shirt sizing.
- **Expected Output**: Premium, coherent visual interface.

## 📋 Technical constraints

- **Svelte 5 Runes**: Styling component state via reactive CSS variables.
- **Zod/DOMPurify**: Sanitization for any dynamic style injections.

## 🚫 Anti-Patterns

- **Inline Styles**: Forbidden. Markup must remain structural.
- **Utility Libraries**: Forbidden. Rely on the internal design system.
- **Hardcoded Hex**: Forbidden (except in `tokens.css`). Use `var(--token)`.
- **Global Pollution**: Avoid styling baseline elements; use semantic classes.

---

> "Precision is the baseline of sovereignty."
