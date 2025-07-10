---
# Design System & Core Context

## Core Philosophy

-   **Single source of truth:** All design, UI, and CSS rules are documented here and in `.cursor/rules/`. Do not duplicate content elsewhere.
-   **Incremental, reviewable changes:** All code and documentation changes must be small, clear, and reversible.
-   **User feedback is valued before marking issues as resolved.**
-   **Manual testing is expected; all logs and diagnostics should be automatically gathered.**
-   **TODOs are allowed if actionable and regularly reviewed; avoid permanent, forgotten TODOs.**

## Patterns and Preferences

### Global/Common

-   **Navigation and actions grouped at the top:** All navigation and actions are grouped at the top of the UI, not split or scattered.
-   **Tab-based navigation:** All multi-mode apps use tabbed navigation for major modes (e.g., Storyboard, Characters, Worlds, Options).
-   **Cancellable AI actions:** All long-running AI actions must be cancellable, with a cancel button, timer, and proper UI state management.
-   **Touch-friendly controls and overlays:** All controls and overlays must be touch-friendly and responsive.
-   **Settings and controls:** All settings and controls use atomic, accessible, and responsive UI elements (sliders, dropdowns, text inputs) with live feedback where appropriate.
-   **Contextual actions:** Contextual actions are placed at the top of panels or drawers, not in the main bar.
-   **Item-specific actions:** Item-specific actions appear in profile/workshop footers.
-   **Panel/drawer behavior:** Clicking outside drawers or panels closes them. The same top bar is used on all pages (if present).
-   **Grid layouts:** Drawers/panels use a grid for both actions and cards; cards below follow the same grid. Responsive layouts stack to 1 column on mobile.

---
# Core Principles

-   **Atomic CSS:** All styling must use atomic (utility) CSS classes—one class, one property. No component-based CSS, no element selectors, no deep nesting, and no `!important`. All utilities are defined in `atomic-utilities.css`. If a needed utility does not exist, add it there.
-   **Icon-Free Controls:** All interactive UI elements (buttons, links, navigation) must use clear, concise text labels. Icon-only controls are prohibited. Icons may only be used as embellishments directly alongside a text label, never as the sole means of communication.
-   **Universal Visual Language:** All Glitch/Perchance apps use the shared color palette, group controls at the top, and follow a minimal, modern, robust interface. All layouts are responsive and touch-friendly, with themed scrollbars and overlays for additional info/actions.

---

## RPGlitch Specific Patterns

-   **No sticky top bar:** The top bar scrolls away with the page.
-   **Tab-based navigation:** Storyboard, Characters, Worlds, Options.

## ImageGlitch Specific Patterns

-   **Main action:** “Generate Images” via `.summon-button`.
-   **AI Magic dropdown:** For prompt refinement, chaos, and instructions.
-   **Creativity slider:** `#masterCreativitySlider` with live label.
-   **Seed input:** For reproducible results.
-   **Number of images selector.**
-   **Prompt and instructions textareas.**
-   **Output area:** Uses `.block`, `.quad-block`, `.solo-block`, `.quad-cell` for image display and grid layouts.
-   **Image overlays:** `.image-overlay`, `.image-info-panel`, `.image-control-bar`, `.overlay-button` for info and actions (download, reroll).

---

## Color System

-   **Palette:**
    -   🟩 **Primary:** #a6e3a1 (Green)
    -   🟦 **Secondary:** #89b4fa (Blue)
    -   🟪 **Accent (AI Actions):** #cba6f7 (Mauve)
    -   🟧 **Accent (Cancel):** #fab387 (Peach)
    -   🟥 **Accent (Danger):** #f38ba8 (Red)
    -   ⬛ **Surface:** #313244 (Main Box)
    -   ⬛ **Background:** #1e1e2e (Base)
    -   ⚪ **Text:** #cdd6f4
-   **Usage:**
    -   Color tokens are used for backgrounds, borders, buttons, and text.
    -   All color assignments use CSS variables for easy theming.
    -   Color system is consistent across all components and screens.
    -   Each primary action uses a distinct color for clarity and accessibility.
    -   **Button color mapping:**
        -   `.summon-button` — Green (primary action)
        -   `.transfigure-button` — Mauve ("Instruct AI")
        -   `.scribe-button` — Blue ("Refine Prompt")
        -   `.chaos-button` — Red ("Embrace the Chaos")
        -   `.cancel-button` — Peach (cancel/abort)
        -   `.undo-button` — Cyan (undo)

*This palette and token mapping is canonical for all Glitch/Perchance apps. All new components must use these tokens for color assignments.*

## Typography

-   **Font:** 'Inter', system-ui
-   **Scale:**
    -   Base: 1em (16px)
    -   Large: 1.25em
    -   Headings: 2em
-   **Usage:**
    -   Headings use bold, large scale.
    -   Body text is regular weight, base scale.
    -   All text is high-contrast for accessibility.

## Spacing

-   **Base Unit:** 8px
-   **Scale:** 4px, 8px, 16px, 24px, 32px
-   **Usage:**
    -   Consistent spacing between all UI elements.
    -   Grid and stack layouts use multiples of the base unit.

## Atomic Utility Class Reference

Below is a quick reference table of the most commonly used atomic utility classes in Glitch/Perchance apps. For the full, up-to-date set, see [`atomic-utilities.css`](../../atomic-css/atomic-utilities.css).

| **Type**      | **Class**                | **Effect**                        |
|---------------|-------------------------|-----------------------------------|
| **Layout**    | `.flex`                 | `display: flex`                   |
|               | `.flex-col`             | `flex-direction: column`          |
|               | `.flex-row`             | `flex-direction: row`             |
|               | `.items-center`         | `align-items: center`             |
|               | `.justify-center`       | `justify-content: center`         |
|               | `.justify-between`      | `justify-content: space-between`  |
|               | `.w-full`               | `width: 100%`                     |
|               | `.h-full`               | `height: 100%`                    |
| **Spacing**   | `.p-2`                  | `padding: 0.5rem`                 |
|               | `.p-4`                  | `padding: 1rem`                   |
|               | `.px-2`                 | `padding-left/right: 0.5rem`      |
|               | `.py-2`                 | `padding-top/bottom: 0.5rem`      |
|               | `.m-2`                  | `margin: 0.5rem`                  |
|               | `.gap-2`                | `gap: 0.5rem`                     |
| **Typography**| `.text-xs`              | `font-size: 0.75rem`              |
|               | `.text-base`            | `font-size: 1rem`                 |
|               | `.text-lg`              | `font-size: 1.125rem`             |
|               | `.font-bold`            | `font-weight: bold`               |
|               | `.text-center`          | `text-align: center`              |
| **Color**     | `.bg-white`             | `background-color: #fff`          |
|               | `.bg-surface`           | `background-color: var(--surface0-color)` |
|               | `.text-primary`         | `color: var(--text-color)`        |
| **Borders**   | `.rounded`              | `border-radius: 8px`              |
|               | `.rounded-full`         | `border-radius: 9999px`           |
| **Shadow**    | `.shadow-sm`            | `box-shadow: var(--shadow-sm)`     |
|               | `.shadow-md`            | `box-shadow: var(--shadow-md)`     |
| **Interaction**| `.cursor-pointer`      | `cursor: pointer`                 |
|               | `.opacity-50`           | `opacity: 0.5`                    |
| **Overflow**  | `.overflow-auto`        | `overflow: auto`                  |
|               | `.overflow-hidden`      | `overflow: hidden`                |

*This table is not exhaustive. For all available utilities, see `atomic-utilities.css`.*

## Component Gallery

### Components

-   **Buttons:** Large, bold, rounded, colored by action. Disabled state is muted and not-allowed. All buttons use clear text labels (never icon-only); emoji embellishments are allowed. Hover: brightness, shadow, lift. Active: pressed effect.
    -   **Button variants:** `.primary-action-button`, `.compact-primary-action-button`, `.delete-button`, `.info-button`, `.cancel-ai-button`, `.undo-ai-button`, `.summon-button`, `.transfigure-button`, `.scribe-button`, `.chaos-button`, `.cancel-button`, `.undo-button` (see Color System for mapping). All variants use atomic classes for layout, color, and state.
-   **Inputs/Selects:** Rounded, padded, with blue focus state. Custom dropdown arrows. Touch-friendly sizing.
-   **Sliders:** Custom styled, colored thumb, label on interaction.
-   **Image Blocks:** Square or grid, with overlays appearing on hover/tap for info and actions. Overlays and action buttons are always text-based (emoji embellishments allowed).
    -   **Classes:** `.block`, `.quad-block`, `.solo-block`, `.quad-cell` for image display and grid layouts.
-   **Overlays:** Appear on hover/tap, show info and action buttons (download, reroll). Classes: `.image-overlay`, `.image-info-panel`, `.image-control-bar`, `.overlay-button`. All overlays use atomic classes for layout, color, and interaction.
-   **System Messages:** Centered in chat feed for distinction. Use atomic classes for centering and style.
-   **Profile Avatars:** Rectangular on profile screens for consistency. Use atomic classes for sizing and border radius. Classes: `.avatar`, `.top-bar-avatar-img`, `.profile-pic-large`, `.card-avatar`.
-   **Focus Bar & Controls:** `.focus-bar`, `.control-group`, `.left-controls`, `.right-controls`, `.spacer` — Flexbox-based layout for grouping navigation and contextual controls at the top. The focus bar is the canonical pattern for all Glitch/Perchance apps.
-   **Container:** `.container` — Responsive, centered, max-width 1200px, used for main layout in all Glitch/Perchance apps.
-   **Chin Navigation & Grids:** `.chin-actions-grid`, `.chin-list-grid`, `.chin-card`, `.chin-divider` — Used for navigation and grid layouts, with all controls grouped at the top. All use atomic classes for grid structure and spacing.

## Interaction Patterns

### Cancellable AI Actions

-   **Pattern:** All long-running AI actions are cancellable via a button that transforms into a "Cancel (Xs)" state with a timer.
-   **Visual:** Cancel button uses peach color, disables related inputs, and restores UI on cancel or completion.
-   **Implementation:** Managed by `_manageAiButtonState` helper.
-   **Accessibility:** Cancel and all other interactive controls must use clear text labels (e.g., `Cancel`, `Save`, `Edit`).

## Layout & Navigation

-   **Chin Navigation:**
    -   Uses `.chin-actions-grid`, `.chin-list-grid`, `.chin-card`, `.chin-divider` for navigation and grid layouts. All controls are grouped at the top using atomic classes for grid structure and spacing.
    -   Single panel per tab, 4-column grid on desktop, stacks to 1 column on mobile.
    -   Top row: 4 columns for contextual actions (Create, Import, Search, etc.).
    -   Divider separates actions from content.
    -   Cards below use the same grid.
    -   Contextual actions at the top, item-specific actions in footers.
    -   Clicking outside the chin closes it.
    -   Top bar is consistent across all pages, not sticky.
-   **Focus Bar:**
    -   `.focus-bar`, `.control-group`, `.left-controls`, `.right-controls`, `.spacer` — Used for grouping navigation and contextual controls at the top. All layouts use atomic classes for flexbox layout and spacing.
-   **Container:**
    -   `.container` — Responsive, centered, max-width 1200px, used for main layout in all Glitch/Perchance apps.
-   **Responsive Design:**
    -   All layouts stack to 1 column on mobile.
    -   No floating or legacy buttons; all controls grouped at the top.
    -   Themed scrollbars for visual consistency.
    -   All controls and overlays are sized and spaced for touch usability on mobile.

## States & Feedback

-   **Cursor States:** Disabled elements use `cursor-not-allowed` atomic class.
-   **Image Previews:** Use `object-fit-cover` or `object-fit-contain` atomic classes for avatars and uploads.
-   **Focus & Hover:**
    -   Inputs: blue border and glow on focus (atomic classes).
    -   Cards: subtle lift on hover (atomic classes).
-   **System Messages:** Centered for clarity (atomic classes).
-   **Error States:**
    -   All errors are visually distinct and actionable.
    -   No TODOs or placeholders in production.
-   **Overlays:** Appear on hover/tap for additional info and actions; overlays and action buttons are always text-based (emoji embellishments allowed). All overlays use atomic classes for layout, color, and interaction.

## Testing & Build

-   **Manual Testing:** All logs and diagnostics are automatically gathered.
-   **Build Output:** Single merged CSS, JS, and HTML file, produced by `@build-perchance.js`.
-   **Editing:** Always edit original source, ignore build folder.

---

## UI/UX Review Checklists

Use these checklists to ensure all major UI areas stay true to the design system. Review code, markup, and the live UI against these items for every release or major change.

### Top Bar (Focus Bar) Checklist

-   [ ] Uses `.focus-bar`, `.left-controls`, `.right-controls`, `.spacer` for layout.
-   [ ] All navigation and actions are grouped at the top—no floating or scattered controls.
-   [ ] Tab navigation: Storyboard, Characters, Worlds, Options.
-   [ ] Contextual actions (e.g., “Begin Story”, “Shuffle”) are on the right, grouped.
-   [ ] All buttons have clear text labels (no icon-only).
-   [ ] Responsive: Tabs/actions stack or collapse on mobile.
-   [ ] Not sticky—scrolls away with the page.
-   [ ] Uses atomic utility classes for all layout, color, and spacing.

### Chin Checklist

-   [ ] Uses `.chin-actions-grid` for the top row of actions (Create, Import, Search, etc.).
-   [ ] `.chin-divider` separates actions from content.
-   [ ] `.chin-list-grid` for the grid of cards below.
-   [ ] Cards use `.chin-card` and atomic classes for layout, color, and interaction.
-   [ ] 4-column grid on desktop, 1 column on mobile.
-   [ ] Clicking outside the chin closes it.
-   [ ] All controls and cards are touch-friendly and accessible.
-   [ ] No icon-only controls; emoji embellishments only with text.

### Storyboard Checklist

-   [ ] Uses `.container` for main layout.
-   [ ] Dynamic title (large, bold, high-contrast).
-   [ ] Three-column selection row (AI Character, User Character, World) on desktop; stacks on mobile.
-   [ ] Each selection has a card/preview with avatar, name, summary.
-   [ ] Action row below: “Shuffle”, “Begin Story”, “Advanced Options”.
-   [ ] All controls grouped at the top of their section.
-   [ ] All layout, color, and spacing via atomic utility classes.
-   [ ] Responsive and touch-friendly.
