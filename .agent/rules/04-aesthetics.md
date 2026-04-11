---
name: aesthetics
trigger: always_on
description: The Aesthetic Monarch. Defines visual physics, depth, and the Nordic Collection.
---

# Rule 04: Aesthetics & Design

> "I am the Aesthetic Monarch. I define the soul of RPGlitch. My light is the 'Chalk Regime', and my shadow is the 'Nordic Collection'. If a component does not feel premium, it is a breach of my law."

---

## ⚖️ The Law

### ❄️ The Nordic Collection

The interface abandons the gritty neon-SWARMtch cliché in favor of **The Nordic Collection** — a cool, deep, and elegant visual language. It feels like a high-end research terminal located in a frozen, subterranean facility.

#### Core Aesthetic Pillars

- **Abyssal Depth**: Backgrounds use deep, immersive radial gradients (`var(--bg-grad-1)` through `var(--bg-grad-4)`) starting from dark slate-blues bleeding into pure black.
- **Atmospheric Noise**: A persistent `3%` global noise overlay adds physical texture to the viewport, breaking up digital perfection.
- **Glass & Shadow**: Elements detach from the background via structural shadows and glassmorphic blurs, utilizing fluid, elastic physics for interactions.

---

### 💎 Colors & Tokens

We rely on strict, named tokens rather than raw hex values in our components. You MUST use exactly these CSS variables.

#### Brand Primitives

- **Chalk** (`var(--color-chalk)`): `#222326`. The primary high-contrast text and structural accent. Crisp, almost icy white.
- **Gunmetal** (`var(--color-gunmetal)`): `#363840`. The core component background. Dense and non-intrusive.
- **Frozen** (`var(--color-frozen)`): `#555d66`. The primary application accent.
- **Frisk** (`var(--color-frisk)` / `var(--font-color-s)`): `#8a9399`. Secondary application accent.

#### Surface Elevation

Elevation is achieved by progressively mixing `Gunmetal` with `Chalk` to lighten the surface as it lifts toward the user:

- `var(--glass-l)` (`#11191f`): The absolute structural floor.
- `var(--glass-xs)`: `var(--color-chalk)` + 30% alpha. Submerged base.
- `var(--glass-s)`: `var(--color-chalk)` + 15% alpha. Sunken surface.
- `var(--glass-l)`: `var(--color-frisk)` + 5% alpha. Elevated glass.
- `var(--glass-xl)`: `var(--color-frisk)` + 15% alpha. Floating monolith.

---

### 📐 Typography & Spacing

We use a strictly defined triad of fonts, scaled via an absolute T-shirt sizing scale (`var(--font-size-xxs)` through `var(--font-size-xxxxxl)`).

- **Headline Font** (`var(--font-family-heading)`): `Ubuntu`, sans-serif.
- **Body Font** (`var(--font-family-body)`): `Inter`, system-ui.
- **Label Font** (`var(--font-family-mono)`): `JetBrains Mono`, monospace.

Padding, margins, and gaps must strictly adhere to the modular scale:
`var(--spacing-xxs)` (0.25rem) to `var(--spacing-xxxl)` (6rem).

---

### 🕹️ Component Interactions (Grounded Engine)

The Nordic Collection relies on static spatial depth and kinetic scaling rather than floating bounciness.

- **Interaction Engine**: Atoms (Buttons, Cards, Pills) use the centralized engine in `global.css`.
  - **Hover**: Driven by `--hover-brightness` and `--hover-blur`.
  - **Grounded Policy**: Explicitly avoid `translateY` on hover to maintain subterranean weight.
- **Active States**: High-precision scale reduction via `--motion-click` (Scale: 0.95).
- **Kinetic Physics**: Svelte Action-driven Web Animations API primitives (`use:shimmy`, `use:pulse`, `use:spin`, `use:stab`).
- **3D Tilt**: Interactive perspective cards utilize `use:tilt` to provide hardware-accelerated perspective tracking.

---

### 📜 Do's and Don'ts

- **Do** use strict named tokens (`var(--color-chalk)`, `var(--spacing-xl)`) rather than raw hex/pixels.
- **Do** maintain the semantic typography split.
- **Don't** use standard hard SWARMtch sharp edges; this regime favors soft glass and `var(--border-radius-m)`.
- **Don't** use raw hex colors. To prevent eye strain, avoid `#FFFFFF` and `#000000` directly.

---

> "Depth is the ultimate luxury."
