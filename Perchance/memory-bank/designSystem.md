# RPGlitch Design System: CSS Architecture

## CSS Methodology: Hybrid Atomic/Component Approach

### Overview
Our CSS architecture now uses a hybrid Atomic/Component model. All CSS—including atomic utilities—is consolidated into `RPGlitch.css` (no @import, no external files). Over 5000 lines of duplicate/redundant CSS have been removed, resulting in a smaller, faster, and more maintainable codebase.

### Key Principles
- **Atomic Utilities**: Single-purpose classes for layout, spacing, typography, and interaction (e.g., `.flex`, `.gap-2`, `.text-truncate`).
- **Component Classes**: For complex UI elements (e.g., `.character-card`, `#topBar`).
- **Performance**: Reduced specificity, minimized file size, and optimized rendering.
- **Maintainability**: All styles are in one place, with clear separation between utilities and components.

### Major Updates
- **Top Bar**: Now a modern, interactive flex container with proper height and menu/action areas.
- **Storyboard Cards**: Use responsive flex/grid layout for three columns (AI Character, User Character, World) with correct horizontal spacing.
- **Utility Classes**: New and improved utilities for flex/grid, spacing, truncation, and responsive design.
- **Duplicate Code Removal**: All redundant/legacy CSS blocks (e.g., old profile, layout, and avatar styles) have been merged or eliminated.
- **Design Tokens**: All color, spacing, and typography variables are preserved in `:root` for easy theming and future expansion.

### Utility Class Reference
- **Layout**: `.flex`, `.flex-row`, `.flex-col`, `.flex-center`, `.block`, `.hidden`, etc.
- **Spacing**: `.gap-1` to `.gap-4`, `.px-2`, `.py-2`, `.my-1`, `.mt-auto`, etc.
- **Typography**: `.text-xs` to `.text-4xl`, `.font-bold`, `.text-truncate`, `.multiline-truncate`, etc.
- **Borders & Radius**: `.rounded`, `.rounded-full`, `.shadow-sm`, etc.
- **Interaction**: `.cursor-pointer`, `.opacity-70`, `.transition`, etc.
- **Responsive**: `sm\:hidden`, `md\:flex`, etc. (see CSS for details)

### Component Styling
- **Buttons**: Base and variant styles for all button types.
- **Forms**: Unified input, textarea, and select styling.
- **Avatars**: Consistent avatar styles for all contexts.
- **Menus/Lists**: Contextual menu and list item styles.
- **Cards/Storyboards**: Modern, flexible card layouts.
- **Chat**: Message feed and bubble styles.
- **Profile/Studio**: Field rows, actions, and layout regions.

### Performance & Build
- All CSS is in `RPGlitch.css`—no external dependencies.
- Build process outputs a single, optimized HTML file for Perchance.
- Atomic CSS methodology continues to guide new utility creation.

---

**Last Updated:** 2025-07-03
**Version:** 2.1.1 (Single-Agent, CSS Consolidation & Layout Fixes)
