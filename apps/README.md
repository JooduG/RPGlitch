---
description: "Shared Perchance application standards and development guidelines"
tags:
  - apps
  - perchance
  - shared-standards
  - build-system
---

# Apps

Shared standards for all Perchance applications.

## For Developers (Human Documentation)

### Build Commands

```bash
npm run fetch:libs      # downloads pico/cash/dexie/purify/_hyperscript → build/local_libs

# Project-specific builds
node build/scripts/build-rpglitch.js
```

### Perchance Constraints

- Strip all external `<script src>` and `<link>`; inline bundle only

### UI Standards

- All buttons must have visible text labels (no icon-only buttons)
- Use semantic HTML5 elements and proper ARIA labels
- All inputs must have associated labels with clear validation
- All interactive elements must be keyboard accessible
- Mobile-first responsive design with progressive enhancement
- Modular, self-contained, reusable components

### Troubleshooting

- If UI looks unstyled, re-run `npm run fetch:libs` (pico in `build/local_libs/pico.min.css`)
- If clipboard copy fails, PowerShell may need `Set-Clipboard`; re-open terminal or copy manually from build output

## Development Rules (AI Instructions)

### Referenced Rules (Apps-Specific)

- **[perchance-architecture.md](perchance-architecture.md)** - Perchance platform architecture and constraints
- **[perchance-build.md](perchance-build.md)** - Perchance build system and output requirements
- **[perchance-lifecycle.md](perchance-lifecycle.md)** - Perchance application lifecycle and deployment
- **[perchance-plugins.md](perchance-plugins.md)** - Perchance plugin system and integration

### Shared Perchance Standards

- Single-file deliverable with inline bundling for Perchance compatibility
- Strip external dependencies and inline all resources

## Current Tasks (Apps-Level)

### High Priority

- [ ] **Build System Enhancement**: Implement incremental builds for faster development
- [ ] **Shared Component Library**: Create reusable UI components across apps

### Medium Priority

- [ ] **Performance Monitoring**: Set up build-time performance tracking
- [ ] **Cross-App Standards**: Establish consistent patterns across RPGlitch/ImageGlitch
- [ ] **ImageGlitch Build Script**: Add `build-imageglitch.js` to `build/scripts/` and document usage here

### Low Priority

- [ ] **Documentation Enhancement**: Improve shared documentation and examples
- [ ] **Testing Framework**: Implement shared testing utilities for Perchance apps

## Recently Completed (Max 10)

- [x] **README Reorganization**: Moved shared standards to apps/ level
- [x] **Folder Structure**: Established technology-specific folder patterns
- [x] **Build Script Updates**: Updated build processes for new structure
