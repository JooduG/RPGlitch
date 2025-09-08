---
description: Strategic plan for migrating to unified README.md files with frontmatter
  containing human docs + AI rules + progress tracking
tags:
- migration
- rules
- documentation
- system-architecture
permalink: past-readme-unified-rule-system-migration
---

# README.md Unified Rule System Migration - Strategic Plan

## STRATEGIC OVERVIEW

**GOAL:** Transform workspace from scattered rule files to unified README.md files with frontmatter in root-level folders, containing human docs + AI rules + progress tracking.

**CONSTRAINTS:**

- Must maintain cross-IDE compatibility (Amazon Q, Cursor, Windsurf)
- Cannot break existing functionality during transition
- Must preserve all existing rule content
- Need to respect reorganization lock in memory-bank
- Token optimization remains priority (reduce from 33 global rules)
- Keep README.md separate from rules in sync scripts
- Only root-level and strategically important folders get README.md treatment

**SUCCESS CRITERIA:**

- Strategic folders have README.md with proper frontmatter
- All existing rules migrated and consolidated appropriately
- AI assistants recognize new structure across all IDEs
- Human documentation improved and standardized
- Reduced token usage per context (target: 6-8 rules per folder vs 33 global)
- Clear separation: sync:readme vs sync:rules
- Proper rule categorization (global vs folder-specific)
- Task management system with overflow to memory-bank/completed.md

**PREMORTEM - LIKELY FAILURE MODES:**

1. **Rule conflicts** - Multiple README files with overlapping rules create confusion
2. **Migration errors** - Losing existing rule content during consolidation
3. **IDE compatibility breaks** - New structure not recognized by all IDEs
4. **Information overload** - README files become too long and unwieldy
5. **Inconsistent structure** - Different folders use different section formats
6. **Script conflicts** - sync:readme vs sync:rules confusion

## STRATEGIC DECISIONS

### Folder Selection Strategy - Last-Child-Folders Only

**Only deepest/final folders** get README.md files with rules:

- `/apps/` - No (parent folder, shared standards go to `/rules/`)
- `/apps/rpglitch/` - No (parent folder)
- `/apps/rpglitch/html/` - Yes (deepest folder)
- `/apps/rpglitch/js/` - Yes (deepest folder)
- `/apps/rpglitch/scss/` - Yes (deepest folder)
- `/apps/imageglitch/` - Yes (if no subfolders)
- `/build/scripts/` - Yes (deepest folder)
- `/memory-bank/strategic/` - Yes (deepest folder)
- `/memory-bank/tactical/` - Yes (deepest folder)
- `/memory-bank/operational/` - Yes (deepest folder)
- Root `/` - Yes (workspace standards)

### Rule Distribution Strategy - Last-Child-Folders Principle

- **Only deepest/final folders** get README.md files with rules
- **Parent folders** should NOT duplicate technology-specific rules
- **Technology-agnostic standards**: Move to `/rules/` folder (applies to multiple projects)
- **Project-specific content**: Only in project READMEs, reference `/rules/` files
- **Comprehensive references**: ALL relevant rules from `rules/` should be referenced with proper categorization
- **Folder-specific rules**: Rules exclusive to folder hierarchy should be referenced separately from global rules
- **No duplication**: Don't repeat rule content, just reference with brief descriptions

### Build Script Strategy

- **sync:readme** - Handles README.md files with frontmatter
- **sync:rules** - Handles `/rules/` folder content only
- **Clear separation** - No overlap between the two

## STRATEGIC ARCHITECTURE

### README.md Template Structure

**Example template structure:**

```markdown
---
description: "Brief description of folder purpose and rules"
tags: ["folder-specific", "technology-tags"]
globs: ["**/*.js"] # if folder-specific file types
alwaysApply: false
---

# Folder Name

## For Developers (Human Documentation)
Quick start, setup, architecture overview, context from memory-bank

## Development Rules (AI Instructions)
- Follow standards from `rules/technology-rule.md`
- Reference ALL relevant rules from `rules/`
- Only project-specific content here, shared standards in `/rules/`

## Current Tasks (Max 10 items)
- [ ] Active task 1
- [ ] Active task 2
- When list reaches 10 items, move completed to memory-bank/completed.md

## Context & Status
Current state, recent changes, key decisions
```

### Rule Reference Strategy

**Example rule references:**

```markdown
## Development Rules (AI Instructions)

### Referenced Rules from `/rules/`

- **[js-modern-guide.md](../../rules/js-modern-guide.md)** - Modern vanilla JavaScript development
- **[html-best-practises.md](../../rules/html-best-practises.md)** - Semantic HTML and accessibility

### Referenced Rules (Folder-Specific)

- **[perchance-architecture.md](perchance-architecture.md)** - Perchance platform constraints

### RPGlitch-Specific Requirements

- All buttons must have text labels for accessibility
- Use semantic HTML structure for screen readers
```

## STRATEGIC PHASES

### Phase 1: Template & Pilot (apps/rpglitch)

- Create README.md template
- Test on single complex folder
- Verify AI recognition across IDEs

### Phase 2: Root-Level Rollout

- Apply to `/apps/`, `/build/`, `/docs/`, `/memory-bank/`
- Update build scripts for sync:readme

### Phase 3: Selective Subfolder Application

- Evaluate complex subfolders case-by-case
- Apply only where strategic value exists

### Phase 4: System Integration

- Update system documentation
- Clean up old scattered rules

## STRATEGIC BENEFITS

### Token Efficiency

- From 33 global rules to ~6-8 contextual rules per folder
- 80% reduction in rule loading per context
- Faster AI response times

### Documentation Quality

- Single source of truth per strategic folder
- Human and AI documentation co-located
- Progress tracking integrated
- Context information included for quick onboarding

### Maintainability

- Clear ownership per folder
- Easier to update folder-specific rules
- Reduced rule conflicts
- Completed tasks moved to centralized memory-bank

## STRATEGIC RISKS

### Risk: Over-application

**Mitigation**: Selective folder approach, not every subfolder

### Risk: Build Script Confusion

**Mitigation**: Clear separation of sync:readme vs sync:rules

### Risk: Rule Duplication

**Mitigation**: Reference shared rules, don't duplicate

### Risk: Task List Overflow

**Mitigation**: 10-item limit with automatic move to memory-bank/completed.md

## NEXT STRATEGIC DECISION POINTS

1. **Folder Selection**: Which subfolders beyond root-level need README.md?
2. **Rule Distribution**: Which rules stay local vs referenced?
3. **Build Integration**: How to cleanly separate sync:readme vs sync:rules?
4. **Migration Order**: Which folders first for maximum learning?
5. **Task Management**: How to handle completed task migration to memory-bank?
6. **Context Integration**: Which context.md content belongs in README.md?

---

**Status**: Strategic planning complete, awaiting tactical implementation plan
**Next**: Create tactical implementation plan with specific steps