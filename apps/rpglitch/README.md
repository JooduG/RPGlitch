---
description: "RPGlitch single-file Perchance deliverable with storyboard + profiles functionality"
tags:
  - rpglitch
  - perchance
  - storyboard
  - profiles
globs:
  - "**/*.html"
  - "**/*.js"
  - "**/*.scss"
---

# RPGlitch

Single-file Perchance deliverable with storyboard + profiles functionality.

## For Developers (Human Documentation)

### Build Commands

```bash
# Development build
node build/scripts/build-rpglitch.js
```

### Entry / Output

- Entry HTML: `apps/rpglitch/html/index.html`
- Output HTML: `build/output/RPGlitch.html`

## Development Rules (AI Instructions)

### RPGlitch-Specific Requirements

- Storyboard functionality with dynamic title management
- Character and profile management with persistent storage
- Deterministic placeholder system for consistent UX
- Item management with full-featured forms and card interactions

## Current Tasks (RPGlitch-Specific)

### High Priority

- [ ] **Deterministic Placeholders**: Implement consistent placeholder system with "Empty" titles
- [ ] **Storyboard Flow Hardening**: Complete toolbar, cancel, showPicker, and dynamic title functionality
- [ ] **JavaScript Modularization**: Continue breaking down remaining business logic modules

### Medium Priority

- [ ] **UI Module Implementation**: Complete remaining RPGlitch-specific UI components
- [ ] **Chin List Enhancement**: Improve persistence and accessibility for chin list functionality
- [ ] **Item Form Development**: Build full-featured item forms with validation
- [ ] **Watch Script**: Add a `watch:rpglitch` npm script if watch mode is desired

### Low Priority

- [ ] **Card Interaction System**: Implement interactive card system for items/characters
- [ ] **Performance Optimization**: Optimize for Perchance single-file constraints
- [ ] **Accessibility Audit**: Comprehensive accessibility review and improvements

## Recently Completed (Max 10)

- [x] **Folder Reorganization**: Restructured into html/, js/, scss/ technology-specific folders
- [x] **Build Script Update**: Updated build process for new folder structure
- [x] **README Migration**: Moved shared standards to parent apps/ folder
