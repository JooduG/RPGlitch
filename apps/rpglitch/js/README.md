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

- **[js-modern-guide.md](../../../rules/js-modern-guide.md)** - Modern vanilla JavaScript development index and quick reference
- **[js-dom.guide.md](../../../rules/js-dom.guide.md)** - Cash DOM for concise, readable JavaScript in Perchance projects
- **[js-storage-guide.md](../../../rules/js-storage-guide.md)** - Dexie.js for IndexedDB management in Perchance projects
- **[js-dom.guide.md](../../../rules/js-dom.guide.md)** - Modern DOM APIs and manipulation patterns for vanilla JavaScript
- **[js-ecosystem-overview.md](../../../rules/js-ecosystem-overview.md)** - Unified JavaScript ecosystem decision framework
- **[js-storage-guide.md](../../../rules/js-storage-guide.md)** - IndexedDB principles and best practices for Perchance applications
- **[js-modern-guide.md](../../../rules/js-modern-guide.md)** - Modern browser APIs including Fetch API, Intersection Observer, and contemporary web APIs
- **[js-modern-guide.md](../../../rules/js-modern-guide.md)** - Modern JavaScript features (ES2023+) including template literals and destructuring
- **[js-patterns-practices.md](../../../rules/js-patterns-practices.md)** - JavaScript patterns, performance optimization, and debugging best practices
- **[js-storage-guide.md](../../../rules/js-storage-guide.md)** - Unified client-side storage strategy covering localStorage, IndexedDB, and Dexie.js

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
- [x] **Local Storage Setup**: Added localStorage for basic data persistence
