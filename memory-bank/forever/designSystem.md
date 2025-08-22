---
# Design System & Core Context

## Core Philosophy

-   **Single source of truth:** All design, UI, and CSS rules are documented here and in `.cursor/rules/`. Do not duplicate content elsewhere.
-   **Incremental, reviewable changes:** All code and documentation changes must be small, clear, and reversible.
-   **User feedback is valued before marking issues as resolved.**
-   **Manual testing is expected; all logs and diagnostics should be automatically gathered.**
-   **TODOs are allowed if actionable and regularly reviewed; avoid permanent, forgotten TODOs.**

## Design Philosophy

### Visual Hierarchy & Information Architecture

**Primary Principle: Clear Information Hierarchy**
- **Most important actions first:** Primary actions (Create, Generate, Save) are always the most prominent and accessible
- **Progressive disclosure:** Show essential information first, reveal details on demand
- **Grouping by function:** Related controls and information are visually grouped together
- **Consistent visual weight:** Use size, color, and spacing to indicate importance and relationships

**Layout Philosophy:**
- **Top-down organization:** All navigation and primary actions at the top, content flows downward
- **Left-to-right reading:** Information follows natural reading patterns
- **Grid-based structure:** Consistent alignment and spacing using 8px base unit
- **White space as design element:** Use spacing to create breathing room and visual separation

### User Experience Principles

**Clarity Over Cleverness:**
- **Text labels over icons:** Every interactive element must have a clear text label
- **Descriptive over concise:** Prefer "Generate Character" over "Generate" when space allows
- **Consistent terminology:** Use the same words for the same actions across the app
- **No hidden functionality:** All features should be discoverable through the interface

**Progressive Enhancement:**
- **Core functionality works everywhere:** Basic features work without JavaScript
- **Enhanced experience with interaction:** Hover states, animations, and advanced features enhance but don't replace core functionality
- **Graceful degradation:** Features degrade gracefully on older browsers or slower devices

**Accessibility by Design:**
- **Keyboard navigation:** All interactive elements are keyboard accessible
- **Screen reader friendly:** Semantic HTML and proper ARIA labels
- **High contrast:** Text meets WCAG AA contrast requirements
- **Touch-friendly:** Minimum 44px touch targets on mobile

### Design Decision Framework

**When making design decisions, ask:**

1. **Does this improve clarity?** Will users understand what to do?
2. **Does this maintain consistency?** Does it follow established patterns?
3. **Does this scale appropriately?** Will it work across different screen sizes?
4. **Does this respect user intent?** Does it help users accomplish their goals?
5. **Is this the simplest solution?** Can we achieve this with less complexity?

**Design Trade-offs:**
- **Function over form:** Utility and clarity always take precedence over aesthetics
- **Consistency over customization:** Maintain design system consistency over individual preferences
- **Accessibility over convenience:** Never sacrifice accessibility for developer convenience
- **Performance over polish:** Smooth performance is more important than visual effects

### Visual Design Principles

**Minimalism with Purpose:**
- **Remove unnecessary elements:** Every visual element should serve a purpose
- **Use whitespace intentionally:** Space creates visual breathing room and hierarchy
- **Limit color usage:** Use color to indicate importance, not decoration
- **Consistent visual language:** Similar elements look and behave similarly

**Typography Hierarchy:**
- **Clear size progression:** Use consistent scale (1rem, 1.25rem, 1.5rem, 2rem)
- **Weight for emphasis:** Use bold sparingly for primary actions and headings
- **Line height for readability:** Minimum 1.4 line height for body text
- **Color for hierarchy:** Use color to distinguish between different types of information

**Color Psychology:**
- **Green (Primary):** Success, creation, positive actions
- **Blue (Secondary):** Information, refinement, secondary actions
- **Mauve (AI Actions):** Magic, creativity, AI-powered features
- **Peach (Cancel):** Caution, stopping, aborting actions
- **Red (Danger):** Destruction, warnings, critical actions

### Interaction Design

**Feedback & Responsiveness:**
- **Immediate feedback:** Every action should provide immediate visual feedback
- **Loading states:** Show progress for actions that take time
- **Error prevention:** Design to prevent errors before they happen
- **Error recovery:** When errors occur, provide clear paths to recovery

**Animation Philosophy:**
- **Purposeful motion:** Animations should serve a purpose, not just look pretty
- **Subtle enhancement:** Use animations to enhance understanding, not distract
- **Performance conscious:** Animations should be smooth and not impact performance
- **Accessibility aware:** Respect `prefers-reduced-motion` settings

**State Management:**
- **Clear state indicators:** Users should always know what state the interface is in
- **Consistent state transitions:** Similar actions should have similar state changes
- **Persistent state:** Important user choices should persist across sessions
- **Recovery mechanisms:** Provide ways to undo or recover from mistakes

### Content Strategy

**Information Architecture:**
- **Logical grouping:** Group related information and actions together
- **Progressive disclosure:** Show essential information first, details on demand
- **Consistent labeling:** Use the same terms for the same concepts throughout
- **Contextual help:** Provide help where users need it, not in separate documentation

**Content Guidelines:**
- **Action-oriented language:** Use verbs for buttons and actions
- **Descriptive labels:** Labels should clearly indicate what will happen
- **Consistent terminology:** Use the same words for the same concepts
- **Inclusive language:** Use language that includes all users

### Responsive Design Philosophy

**Mobile-First Thinking:**
- **Start with constraints:** Design for mobile first, then enhance for larger screens
- **Touch-friendly:** All interactive elements must work well with touch
- **Content priority:** Show the most important content first on small screens
- **Progressive enhancement:** Add features and complexity as screen size increases

**Breakpoint Strategy:**
- **Content-driven breakpoints:** Change layout when content needs it, not at arbitrary widths
- **Consistent behavior:** Similar elements should behave similarly across breakpoints
- **Performance consideration:** Ensure layouts work well on slower devices

### Design System Maintenance

**Evolution Principles:**
- **Incremental improvement:** Make small, focused improvements rather than large changes
- **Backward compatibility:** New designs should work with existing content
- **Documentation first:** Document design decisions before implementing them
- **User feedback integration:** Regularly incorporate user feedback into design decisions

**Quality Assurance:**
- **Consistency checks:** Regularly audit for design system compliance
- **Accessibility testing:** Test with screen readers and keyboard navigation
- **Performance monitoring:** Ensure design changes don't impact performance
- **Cross-browser testing:** Verify designs work across target browsers

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

- **CSS Architecture:** All styling uses Pico CSS as the foundation with custom styles layered on top. Component-specific styles are defined in their own files. Avoid inline styles in JavaScript; move all styling into CSS classes.
- **Component Styling:**
  - Components **may define their own encapsulated CSS** (e.g., in `components.css` or component-specific stylesheets).
  - Component-specific styles should primarily target the component's own elements and avoid global impact.
  - All styling within components **must use CSS variables** for design tokens (colors, typography, spacing) as defined in this document.
  - **Avoid inline styles** in JavaScript; move all styling into CSS classes.
  - Component styling should complement, not override, the Pico CSS foundation.
- **Icon-Free Controls:** All interactive UI elements (buttons, links, navigation) must use clear, concise text labels. Icon-only controls are prohibited. Icons may only be used as embellishments directly alongside a text label, never as the sole means of communication.
- **Universal Visual Language:** All Glitch/Perchance apps use the shared color palette, group controls at the top, and follow a minimal, modern, robust interface. All layouts are responsive and touch-friendly, with themed scrollbars and overlays for additional info/actions.

---

## RPGlitch Specific Patterns

- **No sticky top bar:** The top bar scrolls away with the page.
- **Tab-based navigation:** Storyboard, Characters, Worlds, Options.

## ImageGlitch Specific Patterns

- **Main action:** "Generate Images" via `.summon-button`.
- **AI Magic dropdown:** For prompt refinement, chaos, and instructions.
- **Creativity slider:** `#masterCreativitySlider` with live label.
- **Seed input:** For reproducible results.
- **Number of images selector.**
- **Prompt and instructions textareas.**
- **Output area:** Uses `.block`, `.quad-block`, `.solo-block`, `.quad-cell` for image display and grid layouts.
- **Image overlays:** `.image-overlay`, `.image-info-panel`, `.image-control-bar`, `.overlay-button` for info and actions (download, reroll).

---

## Color System

- **Palette:**
  - 🟩 **Primary:** #a6e3a1 (Green)
  - 🟦 **Secondary:** #89b4fa (Blue)
  - 🟪 **Accent (AI Actions):** #cba6f7 (Mauve)
  - 🟧 **Accent (Cancel):** #fab387 (Peach)
  - 🟥 **Accent (Danger):** #f38ba8 (Red)
  - ⬛ **Surface:** #313244 (Main Box)
  - ⬛ **Background:** #1e1e2e (Base)
  - ⚪ **Text:** #cdd6f4
- **Usage:**
  - Color tokens are used for backgrounds, borders, buttons, and text.
  - All color assignments use CSS variables for easy theming.
  - Color system is consistent across all components and screens.
  - Each primary action uses a distinct color for clarity and accessibility.
  - **Button color mapping:**
    - `.summon-button` — Green (primary action)
    - `.transfigure-button` — Mauve ("Instruct AI")
    - `.scribe-button` — Blue ("Refine Prompt")
    - `.chaos-button` — Red ("Embrace the Chaos")
    - `.cancel-button` — Peach (cancel/abort)
    - `.undo-button` — Cyan (undo)

*This palette and token mapping is canonical for all Glitch/Perchance apps. All new components must use these tokens for color assignments.*

## Typography

- **Font:** 'Inter', system-ui
- **Scale:**
  - Base: 1em (16px)
  - Large: 1.25em
  - Headings: 2em
- **Usage:**
  - Headings use bold, large scale.
  - Body text is regular weight, base scale.
  - All text is high-contrast for accessibility.

## Spacing

- **Base Unit:** 8px
- **Scale:** 4px, 8px, 16px, 24px, 32px
- **Usage:**
  - Consistent spacing between all UI elements.
  - Grid and stack layouts use multiples of the base unit.

## Atomic Utility Class Reference

Below is a quick reference table of the most commonly used utility classes in Glitch/Perchance apps. These are based on Pico CSS and custom styles.

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

*This table shows common utility classes. For complete styling, see the actual CSS files in the project.*

## Component Gallery

### Components

- **Buttons:** Large, bold, rounded, colored by action. Disabled state is muted and not-allowed. All buttons use clear text labels (never icon-only); emoji embellishments are allowed. Hover: brightness, shadow, lift. Active: pressed effect.
  - **Button variants:** `.primary-action-button`, `.compact-primary-action-button`, `.delete-button`, `.info-button`, `.cancel-ai-button`, `.undo-ai-button`, `.summon-button`, `.transfigure-button`, `.scribe-button`, `.chaos-button`, `.cancel-button`, `.undo-button` (see Color System for mapping). All variants use Pico CSS and custom classes for layout, color, and state.
- **Inputs/Selects:** Rounded, padded, with blue focus state. Custom dropdown arrows. Touch-friendly sizing.
- **Sliders:** Custom styled, colored thumb, label on interaction.
- **Image Blocks:** Square or grid, with overlays appearing on hover/tap for info and actions. Overlays and action buttons are always text-based (emoji embellishments allowed).
  - **Classes:** `.block`, `.quad-block`, `.solo-block`, `.quad-cell` for image display and grid layouts.
- **Overlays:** Appear on hover/tap, show info and action buttons (download, reroll). Classes: `.image-overlay`, `.image-info-panel`, `.image-control-bar`, `.overlay-button`. All overlays use Pico CSS and custom classes for layout, color, and interaction.
- **System Messages:** Centered in chat feed for distinction. Use Pico CSS and custom classes for centering and style.
- **Profile Avatars:** Rectangular on profile screens for consistency. Use Pico CSS and custom classes for sizing and border radius. Classes: `.avatar`, `.top-bar-avatar-img`, `.profile-pic-large`, `.card-avatar`.
- **Focus Bar & Controls:** `.focus-bar`, `.control-group`, `.left-controls`, `.right-controls`, `.spacer` — Flexbox-based layout for grouping navigation and contextual controls at the top. The focus bar is the canonical pattern for all Glitch/Perchance apps.
- **Container:** `.container` — Responsive, centered, max-width 1200px, used for main layout in all Glitch/Perchance apps.
- **Chin Navigation & Grids:** `.chin-actions-grid`, `.chin-list-grid`, `.chin-card`, `.chin-divider` — Used for navigation and grid layouts, with all controls grouped at the top. All use Pico CSS and custom classes for grid structure and spacing.
- **Card Components:**
  - **Storyboard Cards:** Use semantic HTML structure with `<article>`, `<header>`, `<main>`, `<footer>` elements. Support dropdown selection, profile pictures, and "Premade" tags with color palette integration. Use default Pico border radius with overflow hidden for clean visual boundaries.
  - **Chin Cards (List Cards):** Identical semantic structure to storyboard cards with `<article class="card-info">` containing:
    - **Header:** Contains title with `text-wrap: balance`, up to 3 lines with ellipsis overflow
    - **Main:** Contains description with `text-wrap: balance` and adaptive space allocation
    - **Footer:** Contains "Premade" tag with color palette background, left-aligned
  - **Card Layout:** Uses flexbox with `justify-content: space-between` and `margin-top: auto` for footer positioning
  - **Text Overflow:** Smart ellipsis handling with `text-wrap: balance`
