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

- **[js-development.md](../../../rules/js-development.md)** - Modern vanilla JavaScript development index and quick reference
- **[js-cash-dom-usage.md](../../../rules/js-cash-dom-usage.md)** - Cash DOM for concise, readable JavaScript in Perchance projects
- **[js-dexie-usage.md](../../../rules/js-dexie-usage.md)** - Dexie.js for IndexedDB management in Perchance projects
- **[js-dom-manipulation.md](../../../rules/js-dom-manipulation.md)** - Modern DOM APIs and manipulation patterns for vanilla JavaScript
- **[js-ecosystem-overview.md](../../../rules/js-ecosystem-overview.md)** - Unified JavaScript ecosystem decision framework
- **[js-indexeddb-principles.md](../../../rules/js-indexeddb-principles.md)** - IndexedDB principles and best practices for Perchance applications
- **[js-modern-apis.md](../../../rules/js-modern-apis.md)** - Modern browser APIs including Fetch API, Intersection Observer, and contemporary web APIs
- **[js-modern-features.md](../../../rules/js-modern-features.md)** - Modern JavaScript features (ES2023+) including template literals and destructuring
- **[js-patterns-practices.md](../../../rules/js-patterns-practices.md)** - JavaScript patterns, performance optimization, and debugging best practices
- **[js-storage-strategy.md](../../../rules/js-storage-strategy.md)** - Unified client-side storage strategy covering localStorage, IndexedDB, and Dexie.js

## Current Tasks (RPGlitch JavaScript-Specific)

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
