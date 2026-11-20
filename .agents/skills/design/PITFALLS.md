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

## Pitfall 6: Box-in-a-Box Bracket Shells & Redundant `(i)` Tooltip Icons

- **Trigger**: Rendering parsed `[KEY: VALUE]` fields, tooltips, or field headers inside panels (`Profile.svelte`, `Tooltip.svelte`).
- **Wrong Behavior**: Bypassing `<TextField>` to build a separate pill-bordered header + individual `1px` bordered cards around each bracket entry, or adding standalone `(i)` info icons next to header labels.
- **Correct Behavior**: Render structured read-only content inside `<TextField>` via its `content` snippet (preserving the full `--signature-color` borderless header and `glass-input` hairline), separate rows cleanly with `divide-y divide-white/5`, attach `cursor-help` + `use:tooltip` directly to the header label (with `text-balance` in `Tooltip.svelte`), and reserve decorative borders strictly for purposeful top-level/focus/terminal containers per [DESIGN.md](../../../DESIGN.md).

## Pitfall 7: `ProfilePicture` Placeholder Flicker & `z-10` Stacking Order

- **Trigger**: Rendering `<ProfilePicture>` for an entity that already has `profile_picture`, or overlaying captions atop `<ProfilePicture>`.
- **Wrong Behavior**: Mounting `Avatar.Fallback` unconditionally during `"loading"` (flashes initials before decode) or placing text overlays without a `z-index` (gets hidden behind `ProfilePicture`'s `z-10` loaded image layer).
- **Correct Behavior**: Only render `Avatar.Fallback` in `ProfilePicture.svelte` when `!has_media` or `loading_status === "error"`, and give text overlays `z-20`+ inside the card container.

## Pitfall 8: `InterfaceStore` (`app`) Entity Lists

- **Trigger**: Resolving `@ENTITY` bracket keys or looking up characters/fractals across `src/ui/` (`Profile.svelte`).
- **Wrong Behavior**: Reading nonexistent `app.characters` or `app.fractals` arrays (`undefined`), causing lookups to fail silently.
- **Correct Behavior**: Read `app.ai_list` and `app.fractal_list` (combined with `runtime.active_*` and `ALL_PREMADES` fallback), or query `@data` `list_entities(...)`.

## Pitfall 9: Z-Index Escalation, Modal-Over-Modal Portals & `bits-ui` `wrapperProps` Stacking

- **Trigger**: Adding z-index layers to modals, secondary lightboxes (`ImagePreview.svelte`), backdrops, cards, or portalled floating UI (`Tooltip.Content`, `Select.Content`, `Modal`, `Backdrop`).
- **Wrong Behavior**: Leaving a secondary lightbox modal (`ImagePreview`) on the base `layer="modal"` (`--z-index-modal: 400`) or mounting `<ImagePreview />` before `<Profile />` in `App.svelte` (causing `Dialog.Portal` to paint behind an open Profile modal); passing hardcoded `z_index="1000"`/`"500"` overrides; using banned `z-elevated` / `z-backdrop` / `z-5` / `z-25` / bracketed `z-[...]` classes; putting `z-index` on `Tooltip.Content` / `Select.Content`'s inner `props` div instead of `wrapperProps`; or using `z-popover` (`300`) for dropdowns opened inside modals (`z-modal: 400`).
- **Correct Behavior**: Use local `z-0`–`z-30` inside `isolate` wrappers for component internals, and the 7-tier global scale (`z-sticky`, `z-overlay`, `z-popover`, `z-modal`, `z-tooltip`, `z-toast`, `z-max`) for global chrome/portals. Pass `layer="image"` (`calc(var(--z-index-modal) + 10)` = `410`) to `<Modal>` / `<Backdrop>` for secondary image lightboxes and mount `<ImagePreview />` after `<Profile />` in `App.svelte` so lightboxes stack above `Profile` (`400`) while portalled tooltips and modal-hosted dropdowns (`style:z-index="var(--z-index-tooltip)"` = `500` on `bits-ui` `wrapperProps`, enforced by `audit-design.js` `LEGACY_Z_INDEX`) remain visible above both.

## Pitfall 10: Wing Signature Color Leakage

- **Trigger**: Styling `VisualWing`, `AudioWing`, or `DevWing` inside `Profile.svelte`'s `<aside data-wings-container>`.
- **Wrong Behavior**: Letting wings inherit `--signature-color` from the parent `Profile` modal or passing entity `signature_color` into `VisualWing` prompt fields.
- **Correct Behavior**: Pin `VisualWing` and `AudioWing` `<section>` roots to `style:--signature-color="var(--color-frozen)"` (fallback) and `DevWing` to `style:--signature-color="var(--color-electric-cyan)"`.

## Pitfall 11: VisualWing Prompt Refinement & Dirty-State Sync

- **Trigger**: Wiring image prompt enhancement or programmatic `char.modifiers.*` writes in `VisualWing.svelte`.
- **Wrong Behavior**: Calling removed `app.visual.envision()` or mutating `profile_state.char.modifiers.*` without calling `profile_state.mark_mutated()`.
- **Correct Behavior**: Import `refine_image_prompt` from `@engine` and call `profile_state.mark_mutated()` whenever programmatic actions update `modifiers.prompt` or `modifiers.negative_prompt`.

## Pitfall 12: `bits-ui` `ScrollArea.Scrollbar` Inline `position: absolute` Override

- **Trigger**: Positioning a `ScrollArea.Scrollbar` (`[data-orientation="vertical"]`) relative to the viewport (e.g., `position: fixed; right: 0;`) via `:global(...)` CSS or utility classes.
- **Wrong Behavior**: Writing `position: fixed;` without `!important`, which `bits-ui`'s `ScrollAreaScrollbarSharedState` (`mergeProps(restProps, scrollbarSharedState.props)`) silently overrides with an inline `style="position: absolute; ..."`, pinning the scrollbar to the centered grid column instead of the viewport edge.
- **Correct Behavior**: Use `position: fixed !important;` on the target `[data-orientation="vertical"]` rule (as in `src/ui/Storymode.svelte`).

## Pitfall 13: Container-Level `opacity-muted` / `grayscale` Dimming Foreground Text Overlays

- **Trigger**: Dimming or desaturating a card or media surface for secondary states (e.g., `incoming_only` on `EntityCard.svelte`).
- **Wrong Behavior**: Applying `opacity-muted grayscale` to the outer card root (`[data-card-root]`), which multiplies `0.6` opacity and grayscale across child headlines, signature borders, and glass callout text, making foreground text illegible against the backdrop.
- **Correct Behavior**: Scope `opacity-muted grayscale` strictly to the inner portrait/media wrapper (`<ProfilePicture>` container) so the artwork dims while card borders, titles, and foreground callouts render at 100% contrast (`text-frisk`).

## Pitfall 14: Dynamic `role` Ternaries With Nonnegative `tabindex` (`a11y_no_noninteractive_tabindex`)

- **Trigger**: Toggling interactivity on a non-native interactive container (`<div role="button">`) such as `EntityCard.svelte` in `preview` mode.
- **Wrong Behavior**: Binding `role={preview ? undefined : "button"}` alongside `tabindex={disabled || preview ? -1 : 0}`. Svelte's static compiler does not correlate ternary branches across attributes and flags `a11y_no_noninteractive_tabindex` because a `<div>` whose `role` may be `undefined` cannot have a possible `0` `tabindex`.
- **Correct Behavior**: Keep `role="button"` static on the element and suppress assistive/keyboard focus in non-interactive modes via `tabindex={disabled || preview ? -1 : 0}` paired with `aria-hidden={preview ? "true" : undefined}` and `pointer-events-none`.
