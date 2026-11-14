# Design Skill Pitfalls

> Empirical scar tissue for RPGlitch design tokens, UI primitives, and layout rules. Read this file before editing `DESIGN.md` tokens or `src/ui/` components.

---

## Pitfall 1: Hand-Editing Generated Token Mirrors

- **Trigger**: Adding or modifying a CSS token, utility class, or signature color.
- **Wrong Behavior**: Editing `src/media/design.css` or `src/media/tokens.js` directly, or referencing nonexistent `src/data/definitions/signature-colors.js`.
- **Correct Behavior**: Edit YAML frontmatter or fenced `css` blocks in [DESIGN.md](../../../DESIGN.md), then run `npm run sync:css` (or `npm run test:sync`) to regenerate both mirrors.

## Pitfall 2: Unregistered `.no-scrollbar` or Custom Semantic Classes

- **Trigger**: Hiding scrollbars or adding custom semantic class names inside `.svelte` templates.
- **Wrong Behavior**: Using `.no-scrollbar` or inventing ad-hoc CSS classes not registered in [DESIGN.md](../../../DESIGN.md) `@utility` or [eslint.config.js](../../../eslint.config.js) (`better-tailwindcss/no-unknown-classes`).
- **Correct Behavior**: Use [ScrollArea.svelte](../../../src/ui/primitives/ScrollArea.svelte) or `scrollbar-none [&::-webkit-scrollbar]:hidden`. Register any new custom utility as an `@utility` block in `DESIGN.md` (and whitelist non-Tailwind component classes in `eslint.config.js`).

## Pitfall 3: Unguarded View Transitions or Mixing Directives

- **Trigger**: Triggering view/layout morphs or styling an element that carries `view-transition-name`.
- **Wrong Behavior**: Calling `document.startViewTransition()` directly without concurrency guards, inventing unregistered `view-transition-name` values (e.g. `telemetry-card`), or combining Svelte `transition:` / `in:` / `out:` directives with `view-transition-name` on the same DOM node.
- **Correct Behavior**: Wrap DOM updates in `guarded_transition()` from [ui-helpers.js](../../../src/utils/ui-helpers.js), restrict view-transition names to those registered in `DESIGN.md` (`card-slot-ai`, `card-slot-user`, `card-slot-fractal`, `entity-morph-fractal`, `unified-console`, or dynamic card IDs), and delegate kinetic choreography to [motion/SKILL.md](../motion/SKILL.md).

## Pitfall 4: High-Luminance `--signature-color` Solid Fills With White Text

- **Trigger**: Rendering foreground text on a container tinted with an entity's dynamic `--signature-color`.
- **Wrong Behavior**: Setting a solid `var(--signature-color)` background with `text-white` (`--color-pure-white` / `--color-frisk`), which drops contrast to `1.22:1`–`1.78:1` on bright signatures (`#fde047`, `#fbbf24`, `#84cc16`).
- **Correct Behavior**: Use translucent `color-mix(in srgb, var(--signature-color) 10%, var(--color-glass-sunken))` wells over dark surfaces (as in `ChatBubble.svelte` and `Profile.svelte`) or gradient scrims (`from-black/95`), or switch foreground text to dark `--color-chalk` ink when painting a solid high-luminance fill.

## Pitfall 5: Bypassing `src/ui/primitives/` for Direct `bits-ui` Imports

- **Trigger**: Building buttons, dialogs, modals, dropdowns, sliders, toggles, meters, progress bars, scroll areas, or tooltips in view components.
- **Wrong Behavior**: Importing raw primitives directly from `bits-ui` in feature views or referencing nonexistent wrappers (`Popover`, `DropdownMenu`).
- **Correct Behavior**: Import project wrappers from [src/ui/primitives/](../../../src/ui/primitives/README.md). Keep direct `bits-ui` (`^2.20.6`) imports (`AlertDialog`, `Avatar`, `Button`, `Collapsible`, `Dialog`, `Label`, `Meter`, `Progress`, `ScrollArea`, `Select`, `Slider`, `Switch`, `Tooltip`) inside primitive wrappers (plus `Avatar` in [ProfilePicture.svelte](../../../src/ui/ProfilePicture.svelte)).
