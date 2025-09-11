---
description: "JavaScript files for RPGlitch application with modern ES2023+ features and best practices"
tags:
  - javascript
  - es2023
  - cash-dom
  - dexie
  - rpglitch
globs:
  - "**/*.js"
---

# JavaScript Files

## Development Rules (AI Instructions)

### Referenced Rules from `rules/`

- **[js-modern-guide.md](../../../rules/js-modern-guide.md)** - Guidelines for modern JavaScript (ES2023+), including features and browser APIs.
- **[js-dom.guide.md](../../../rules/js-dom.guide.md)** - Patterns for DOM manipulation, including the use of Cash DOM.
- **[js-storage-guide.md](../../../rules/js-storage-guide.md)** - The unified strategy for client-side storage (localStorage, IndexedDB, Dexie.js).
- **[js-ecosystem-overview.md](../../../rules/js-ecosystem-overview.md)** - A decision framework for the JavaScript ecosystem.
- **[js-patterns-practices.md](../../../rules/js-patterns-practices.md)** - Best practices for JavaScript patterns, performance, and debugging.

## Current Tasks (RPGlitch JavaScript-Specific)

### Module Boundaries

- Keep UI rendering and event binding in HTML/Component layers; keep domain logic and data ops in JS modules
- Use small, focused modules (single responsibility); export clear, documented functions

### High Priority

- [ ] **Code Modularization**: Break down monolithic JavaScript into focused modules
- [ ] **Character Storage System**: Implement Dexie.js for character data persistence
- [ ] **Story Management**: Create story/campaign management functionality with IndexedDB
- [ ] **Data Validation**: Add comprehensive input validation for character creation

### Medium Priority

- [ ] **API Integration**: Implement fetch API for external data sources
- [ ] **Performance Optimization**: Optimize JavaScript performance using modern patterns
- [ ] **Error Handling Enhancement**: Improve error handling throughout the application
- [ ] **Cash DOM Migration**: Migrate DOM manipulation to use Cash DOM library

### Low Priority

- [ ] **Modern Features Adoption**: Implement more ES2023+ features where beneficial
- [ ] **Code Documentation**: Add comprehensive JSDoc comments
- [ ] **Unit Testing Setup**: Implement JavaScript unit testing framework
- [ ] **Bundle Optimization**: Optimize JavaScript bundle size for Perchance

## Recently Completed (Max 10)

- [x] **Initial JavaScript Structure**: Created basic JavaScript structure for RPGlitch
- [x] **Character Creation Logic**: Implemented basic character creation functionality
- [x] **IndexedDB Setup**: Migrated from localStorage to IndexedDB with Dexie.js for data persistence
