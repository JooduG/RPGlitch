---
name: css
version: 1.1.0
description: Consolidates Native CSS and polish. Applies the Chalk Regime, Antigravity depth, and Design Spells.
allowed-tools: ["Read", "Write"]
effort: medium
risk: safe
---

# 🛠️ css

> **Persona**: **Skill Executor**: "I am the Stylist. I own the Chalk Regime, the Antigravity weightlessness, and the visual soul of the RPGlitch Engine. I implement 'Design Spells' with silky-smooth precision."

## 🔬 Anatomy

```text
skills/css/           # Logical Sovereign
├── SKILL.md                     # The Directive
├── scripts/                     # Operational (The How)
└── references/                  # Historical (The Why)
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Visual consistency is absolute. Implementation of "Design Spells" for the "wow" factor.
- **Architectural Integrity**: Native CSS Custom Properties only. Strict adherence to **Baseline UI** constraints.
- **Sensory Excellence**: Weightlessness (diffused shadows), Spatial Depth (perspective), and glassmorphism.

## 📋 Procedure

### 1. Component Polishing & Spells
   - **Token Synchronization**: Map semantic classes to `var(--token)` values (e.g., `var(--color-chalk)`).
   - **Antigravity Application**: Apply diffused shadows (`0 20px 40px rgba(0,0,0,0.05)`), Z-axis layering, and 3D transforms.
   - **Design Spells Execution**: Build micro-interactions (magnetic hover, physics-based) with flawless 60fps+ performance.

### 2. Technical Constraints (Baseline UI)
   - **Compositor Only**: Animate ONLY compositor props (`transform`, `opacity`). NEVER animate layout (`width`, `margin`, etc.).
   - **Viewport Standards**: Use `h-dvh` instead of `h-screen`.
   - **Accessibility**: Ensure `safe-area-inset` support and proper focus styling.

### 3. UI Consistency Audit
   - **Definition of Done**: All hardcoded hex removed; 60fps performance verified; Antigravity vibe achieved; Baseline UI respected.

## 🚫 Anti-Patterns

- **Inline Styles**: Forbidden. Markup must remain structural.
- **Layout Animation**: Animating properties that trigger reflow (width, height, top, left).
- **Hardcoded Hex**: Forbidden (except in `tokens.css`).
- **Janky Spells**: Implementing micro-interactions that drop frames or feel "heavy".

---

> "Precision is the baseline of sovereignty."
