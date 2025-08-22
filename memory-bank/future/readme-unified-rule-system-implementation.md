---
description: "Tactical implementation plan for README.md unified rule system migration with specific steps and folder-by-folder decisions"
tags:
  - implementation
  - migration
  - tactical
  - step-by-step
---

# README.md Unified Rule System - Tactical Implementation Plan

## TACTICAL OVERVIEW

**MISSION:** Execute strategic plan for README.md unified rule system with minimal risk and maximum efficiency.

**APPROACH:** Template-first + incremental rollout + folder-by-folder evaluation

**SUCCESS METRICS:**

- Each phase completed without breaking existing functionality
- AI recognition verified at each step
- Build scripts cleanly separated (sync:readme vs sync:rules)

## TACTICAL PHASES

### PHASE 1: TEMPLATE CREATION & PILOT

#### Step 1.1: Create README.md Template

**Target**: Create reusable template with proper frontmatter structure

**Example template structure:**

```markdown
---
description: "[Folder purpose and rules summary]"
tags: ["[folder-type]", "[technology]"]
globs: ["**/*.[ext]"] # Only if folder-specific file types
alwaysApply: false # Default, true only for critical folders
---

# [Folder Name]

## For Developers (Human Documentation)
- Quick start instructions
- Setup requirements  
- Architecture overview
- Common workflows
- Context from memory-bank for quick onboarding

## Development Rules (AI Instructions)
- Follow [technology] standards from `rules/[technology]-development.md`
- [Folder-specific rule 1]
- [Folder-specific rule 2]

## Current Tasks (Max 10 items)
- [ ] [Current task]
- [ ] [Active task 2]
- When list reaches 10 items, move completed to memory-bank/completed.md

## Context & Status
Current state, recent changes, key decisions from context.md

## Related Documentation
- [Link to related files]
```

#### Step 1.2: Pilot Implementation (apps/rpglitch)

**Target**: Test template on most complex folder

**Current State Analysis**:

- ✅ **COMPLETED**: Restructured into html/, js/, scss/ technology-specific folders
- ✅ **COMPLETED**: Each technology folder has README.md with proper rule references
- ✅ **COMPLETED**: Removed redundant "Core Standards" sections that duplicated rule content
- ✅ **COMPLETED**: Updated apps/README.md with proper Perchance-specific rule references
- ✅ **COMPLETED**: Template updated with lessons learned

**Key Lessons Learned:**

1. **Rule categorization critical**: Separate global rules from folder-specific rules
2. **No duplication**: Reference rules, don't repeat content
3. **Proper scoping**: Technology-specific rules only apply to relevant file types
4. **Task organization**: High/Medium/Low priority with descriptive names
5. **Frontmatter format**: Array format for tags/globs to avoid markdown interpretation

**Expected Result**: ✅ **ACHIEVED** - Template and pilot implementation complete

#### Step 1.3: AI Recognition Testing

**Target**: Verify all three IDEs recognize new structure

**Test Plan:**

1. Test Amazon Q recognition of frontmatter rules
2. Test Cursor recognition of frontmatter rules  
3. Test Windsurf recognition of frontmatter rules
4. Verify rule application in each IDE
5. Test rule inheritance and references

### PHASE 2: ROOT-LEVEL FOLDER EVALUATION

#### Folder-by-Folder Decision Matrix

| Folder | README.md? | Rationale | Complexity | Rules Source | Status |
|--------|------------|-----------|------------|--------------|--------|
| `/apps/` | YES | Multiple apps, needs coordination | Medium | Perchance-specific rules | ✅ COMPLETE |
| `/apps/rpglitch/` | YES | Complex app, specific rules | High | Project-specific | ✅ COMPLETE |
| `/apps/rpglitch/html/` | YES | Technology-specific rules | Medium | HTML rules | ✅ COMPLETE |
| `/apps/rpglitch/js/` | YES | Technology-specific rules | Medium | JS rules | ✅ COMPLETE |
| `/apps/rpglitch/scss/` | YES | Technology-specific rules | Medium | SCSS rules | ✅ COMPLETE |
| `/apps/imageglitch/` | EVALUATE | Simple app, may not need | Low | TBD | PENDING |
| `/build/` | YES | Build system complexity | Medium | New + references | PENDING |
| `/memory-bank/` | YES | Knowledge management | Medium | New + references | PENDING |
| `/docs/` | YES | Documentation standards | Medium | New + references | PENDING |
| Root `/` | YES | Workspace standards | High | New + references | PENDING |

#### Step 2.1: /apps/ Folder

**Decision**: YES - Needs coordination between multiple apps

**Implementation:**

- Human docs: App overview, build instructions, shared constraints
- AI rules: Reference `rules/perchance-*.md`, app coordination standards
- Current tasks: Active development items (max 10)
- Context: Current state from memory-bank

#### Step 2.2: /apps/imageglitch/ Folder  

**Decision**: EVALUATE during implementation

**Evaluation Criteria:**

- Does it have app-specific rules?
- Is it complex enough to warrant separate README?
- Would it benefit from TODO tracking?

**Likely Decision**: NO - Simple app, inherits from `/apps/`

#### Step 2.3: /build/ Folder

**Decision**: YES - Build system complexity warrants documentation

**Implementation:**

- Human docs: Build system overview, script purposes, configuration
- AI rules: Build script development standards, configuration management
- Current tasks: Build system improvements, optimization tasks (max 10)
- Context: Current build system state

#### Step 2.4: /memory-bank/ Folder

**Decision**: YES - Knowledge management system needs documentation

**Implementation:**

- Human docs: Memory bank purpose, organization, usage
- AI rules: Knowledge management standards, file organization
- Current tasks: Reorganization progress, system improvements (max 10)
- Context: Current reorganization state

#### Step 2.5: /docs/ Folder

**Decision**: YES - Documentation standards and organization

**Implementation:**

- Human docs: Documentation structure, target audiences
- AI rules: Documentation writing standards, organization principles
- Current tasks: Documentation improvements, missing docs (max 10)
- Context: Current documentation state

#### Step 2.6: Root / Folder

**Decision**: YES - Workspace-level standards and coordination

**Implementation:**

- Human docs: Enhanced project overview, quick start
- AI rules: Workspace standards, cross-folder coordination
- Current tasks: Project roadmap, major milestones (max 10)
- Context: Current project state

### PHASE 3: BUILD SCRIPT UPDATES

#### Step 3.1: Create sync:readme Function

**Target**: Handle README.md files with frontmatter separately from rules

**Example implementation:**

```javascript
function syncReadmes(sourceDir, targetDir) {
  // Find README.md files with frontmatter
  // Copy to IDE directories
  // Maintain separation from rules/ folder sync
}
```

#### Step 3.2: Update sync-configs.js

**Target**: Add README.md processing without affecting rules sync

**Changes:**

- Add `syncReadmes()` function
- Call separately from `copyRules()`
- Maintain clear separation

#### Step 3.3: Test Build System

**Target**: Verify build system works with new structure

**Test Plan:**

1. Run `npm run sync` - verify both README and rules sync
2. Test IDE recognition after sync
3. Verify no conflicts between sync:readme and sync:rules

### PHASE 4: SYSTEM INTEGRATION

#### Step 4.1: Update System Documentation

**Target**: Reflect new README-based approach in system docs

**Files to Update:**

- `system-effective-rule-writing.md` - Add README.md approach
- `system-rule-interactions.md` - Update for new structure
- `system-folder-specific-rules.md` - Update implementation

#### Step 4.2: Clean Up Old Files

**Target**: Archive old scattered rule files after successful migration

**Process:**

1. Verify all content migrated successfully
2. Archive old rule files (don't delete)
3. Update any remaining references

## TACTICAL EXECUTION ORDER

### Week 1: Template & Pilot

1. Create README.md template
2. Implement pilot on apps/rpglitch
3. Test AI recognition across IDEs
4. Refine template based on results

### Week 2: Root-Level Rollout

1. Apply template to /apps/, /build/, /docs/, /memory-bank/, root
2. Evaluate /apps/imageglitch/ during implementation
3. Update build scripts for sync:readme
4. Test complete system

### Week 3: Integration & Cleanup

1. Update system documentation
2. Clean up old files
3. Final testing and verification
4. Document lessons learned

## TACTICAL CHECKPOINTS

### After Each Folder Migration

- [ ] AI recognition verified in all IDEs
- [ ] Existing functionality preserved
- [ ] Human documentation improved
- [ ] Rules properly referenced or included
- [ ] Context information integrated
- [ ] Task list under 10 items

### After Build Script Updates

- [ ] sync:readme works independently
- [ ] sync:rules unaffected
- [ ] No conflicts between systems
- [ ] All IDEs receive updates correctly

### After System Integration

- [ ] Documentation reflects new approach
- [ ] Old files properly archived
- [ ] No broken references
- [ ] System fully operational
- [ ] memory-bank/completed.md system working

## TACTICAL RISKS & MITIGATIONS

### Risk: Template Doesn't Work for All Folders

**Mitigation**: Flexible template with optional sections

### Risk: Build Script Conflicts

**Mitigation**: Clear separation, independent testing

### Risk: AI Recognition Issues

**Mitigation**: Test each IDE at each step

### Risk: Information Loss

**Mitigation**: Archive old files, verify migration

### Risk: Task List Overflow

**Mitigation**: 10-item limit with move to memory-bank/completed.md

## EXECUTION STATUS

**Phase 1: COMPLETE ✅**

- ✅ Template created and refined
- ✅ Pilot implementation on apps/rpglitch complete
- ✅ Technology-specific folder structure implemented
- ✅ Rule categorization strategy established
- ✅ Task management system implemented

**Phase 2: IN PROGRESS 🔄**

- ✅ /apps/ folder complete
- ⏳ Remaining root-level folders pending

**Key Insights from Phase 1:**

1. **Last-child-folders principle works**: Only deepest folders get README.md with rules
2. **Rule categorization essential**: Global vs folder-specific vs project-specific
3. **No duplication rule**: Reference, don't repeat rule content
4. **Proper scoping critical**: Rules must match file types they apply to
5. **Task organization effective**: High/Medium/Low priority structure works well

**Next Step**: Continue Phase 2 - Complete remaining root-level folders

---

**Status**: Phase 1 complete, Phase 2 in progress
**Next**: Apply template to /build/, /memory-bank/, /docs/, root folders
