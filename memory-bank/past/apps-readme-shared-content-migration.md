# Apps README Shared Content Migration Plan

## Objective

Move shared Perchance app standards from `apps/rpglitch/README.md` to `apps/README.md` to eliminate duplication and provide common standards for all Perchance apps (RPGlitch, ImageGlitch, future apps).

## Content to Move from RPGlitch README to Apps README

### 1. Build Commands Section
```markdown
### Build Commands

```bash
# Development build
node build/scripts/build-rpglitch.js

# Watch mode (if available)
npm run watch:rpglitch
```
```

**Action**: Move to apps/README.md and generalize for all apps

### 2. Development Rules References
Currently in rpglitch README, should be in apps README:
- References to Perchance-specific rules
- General Perchance constraints and standards
- Common development patterns

### 3. Shared Perchance Standards
- Single-file deliverable constraints
- Inlined scripts requirement
- Perchance platform limitations
- Common troubleshooting

## Content to Keep in RPGlitch README

### RPGlitch-Specific Only
- Storyboard functionality requirements
- Character and profile management specifics
- Deterministic placeholder system
- Item management features
- RPGlitch-specific tasks and completed items

## Implementation Steps

### Phase 1: Enhance Apps README
1. Add shared build command patterns
2. Add common Perchance constraints
3. Add shared development standards
4. Add troubleshooting section

### Phase 2: Clean RPGlitch README
1. Remove duplicated shared content
2. Keep only RPGlitch-specific requirements
3. Reference apps/README.md for shared standards
4. Maintain RPGlitch-specific tasks

### Phase 3: Validation
1. Ensure no duplication between files
2. Verify all shared content is in apps/README.md
3. Confirm RPGlitch README only has project-specific content

## Expected Benefits

- **Reduced Duplication**: Shared standards in one place
- **Easier Maintenance**: Update shared standards once
- **Cleaner Context**: RPGlitch README focuses only on RPGlitch specifics
- **Scalability**: Easy to add new Perchance apps (ImageGlitch, etc.)
- **Token Efficiency**: Smaller context windows for specific tasks

## Files to Update

1. `apps/README.md` - Add shared Perchance standards
2. `apps/rpglitch/README.md` - Remove shared content, keep RPGlitch-specific only
3. Future: `apps/imageglitch/README.md` - Reference shared standards

---

**Status**: Plan created, ready for implementation
**Next Step**: Implement Phase 1 - enhance apps/README.md with shared content