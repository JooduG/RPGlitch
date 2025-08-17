---
description: Template and structure guide for the Unified TODO & Handoff document system that serves as the single source of truth for project management across the Unified Orchestrator Mode.
alwaysApply: false
---
# TODO & HANDOFF TEMPLATE

> **TL;DR:** Template and structure guide for the Unified TODO & Handoff document system that serves as the single source of truth for project management across the Unified Orchestrator Mode.

## 🎯 **DOCUMENT PURPOSE**

The TODO & Handoff document serves as the **unified contract** between all modes in the Unified Orchestrator Mode system:

- **🎭 Strategic Mode**: Provides overall context and approach
- **🎨 Tactical Mode**: Contains planning and design decisions
- **⚒️ Operational Mode**: Lists specific tasks and execution details

## 📋 **DOCUMENT STRUCTURE**

### **Required Sections**

```markdown
# UNIFIED TODO & HANDOFF DOCUMENT

> **TL;DR:** Single source of truth for todos, handoff context, and progress tracking across the Unified Orchestrator Mode.

## 🎯 **CURRENT STATUS**

**Phase**: [Current Phase Name] - [Phase Description] ([MODE] EXECUTION IN PROGRESS/COMPLETE)
**Last Updated**: [Timestamp from Time MCP]
**Current Focus**: [Brief description of current focus]

## 🎯 **UNIFIED ORCHESTRATOR MODE STATUS**

### **System Status**
- **Date**: [Date]
- **Status**: [Current system status]
- **Key Improvements**: [List of recent improvements]

## 🎭 **STRATEGIC CONTEXT**

### **Overall Approach**
- [Strategic decisions and approach]

### **System Setup**
- [Tools and workflows configured]

### **Optimizations**
- [Process improvements implemented]

## 🎨 **TACTICAL PLAN**

### **Phase [X]: [Phase Name] ([STATUS])**

- [ ] **Task [X]: [Task Name]** ([PRIORITY])
  - [ ] Subtask 1 - [Description]
  - [ ] Subtask 2 - [Description]
  - [ ] Subtask 3 - [Description]

### **Success Criteria**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## ⚒️ **OPERATIONAL EXECUTION**

### **Current Tasks - [Date]**

#### **Task [X]: [Task Name]** 🔄 IN PROGRESS/✅ COMPLETED

**Priority**: [High/Medium/Low]
**Complexity**: Level [1-3] ([Mode Route])
**Status**: [Current status]

**Description**: [Detailed task description]

**Subtasks**:
- [✅/🔄/ ] **Subtask Name**: [Description]
  - [✅/🔄/ ] Specific action 1
  - [✅/🔄/ ] Specific action 2

**Success Criteria**:
- [✅/🔄/ ] Criterion 1
- [✅/🔄/ ] Criterion 2

**Metrics & Measurement**:
- **Metric 1**: [Target] → [Current status]
- **Metric 2**: [Target] → [Current status]

**Estimated Time**: [Time estimate] → [Current progress]

### **Completed Tasks - [Date]**

#### **Task [X]: [Task Name]** ✅ COMPLETED

**Priority**: [High/Medium/Low]
**Complexity**: Level [1-3] ([Mode Route])
**Status**: ✅ COMPLETED

**Description**: [Task description]

**Subtasks Completed**:
- [x] **Subtask Name**: [Description]
  - [x] Specific action 1
  - [x] Specific action 2

**Success Criteria Achieved**:
- [x] Criterion 1
- [x] Criterion 2

## 🔄 **HANDOFF STATUS**

### **[Mode] to [Mode] Handoff** ✅ COMPLETE/🔄 IN PROGRESS

**Date**: [Date]
**Status**: [Complete/In Progress]
**Ready for Next Mode**: [Yes/No]

**Strategic Context**:
- **Overall Approach**: [Strategic decisions and approach]
- **System Setup**: [Tools and workflows configured]
- **Optimizations**: [Process improvements implemented]

**Tactical Context**:
- **Requirements**: [Key requirements identified]
- **Design Decisions**: [Major design decisions made]
- **Architecture**: [System architecture planned]

**Implementation Plan**:
- **Phase 1**: [Phase description]
- **Phase 2**: [Phase description]
- **Timeline**: [Expected timeline]

**Ready for Operational Execution**:
- **First Task**: [First task to implement]
- **Success Criteria**: [How success will be measured]
- **Blockers**: [Any potential blockers identified]

## 📊 **PROGRESS TRACKING**

### **Overall Progress**
- **Phase 1**: [X]% Complete ✅/🔄
- **Phase 2**: [X]% Complete ✅/🔄
- **Phase 3**: [X]% Complete ✅/🔄

### **Key Metrics**
- **Tasks Completed**: [X]/[Y] ([Z]%)
- **Conflicts Resolved**: [X]/[Y] ([Z]%)
- **Systems Integrated**: [X]/[Y] ([Z]%)

### **Next Milestones**
1. [Milestone 1]
2. [Milestone 2]
3. [Milestone 3]

## 🎯 **SUCCESS CRITERIA**

### **Phase [X] Success Criteria**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### **Overall Success Criteria**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

---

**📋 UNIFIED TODO & HANDOFF: The intelligent single mode that does it all!**
```

## 📋 **SECTION GUIDELINES**

### **🎯 CURRENT STATUS Section**

**Purpose**: Quick overview of current project state

**Required Elements**:

- **Phase**: Current phase name and description
- **Last Updated**: Timestamp from Time MCP
- **Current Focus**: Brief description of what's being worked on

**Format**:

```markdown
**Phase**: Phase [X] - [Description] ([MODE] EXECUTION IN PROGRESS/COMPLETE)
**Last Updated**: [YYYY-MM-DDTHH:MM:SS+02:00] (from Time MCP)
**Current Focus**: [Brief description]
```

### **🎭 STRATEGIC CONTEXT Section**

**Purpose**: High-level strategic decisions and approach

**Required Subsections**:

- **Overall Approach**: Strategic decisions and methodology
- **System Setup**: Tools, workflows, and configurations
- **Optimizations**: Process improvements and enhancements

**Format**:

```markdown
### **Overall Approach**
- [Strategic decision 1]
- [Strategic decision 2]

### **System Setup**
- [Tool/workflow 1]
- [Tool/workflow 2]

### **Optimizations**
- [Optimization 1]
- [Optimization 2]
```

### **🎨 TACTICAL PLAN Section**

**Purpose**: Detailed planning and design decisions

**Required Elements**:

- **Phase Structure**: Organized by phases with status indicators
- **Task Breakdown**: Hierarchical task organization
- **Success Criteria**: Measurable outcomes for each phase

**Format**:

```markdown
### **Phase [X]: [Phase Name] ([STATUS])**

- [ ] **Task [X]: [Task Name]** ([PRIORITY])
  - [ ] Subtask 1 - [Description]
  - [ ] Subtask 2 - [Description]

### **Success Criteria**
- [ ] Criterion 1
- [ ] Criterion 2
```

### **⚒️ OPERATIONAL EXECUTION Section**

**Purpose**: Specific tasks and execution details

**Required Elements**:

- **Current Tasks**: Tasks currently in progress
- **Completed Tasks**: Tasks that have been finished
- **Detailed Task Information**: Priority, complexity, status, description

**Task Format**:

```markdown
#### **Task [X]: [Task Name]** 🔄 IN PROGRESS/✅ COMPLETED

**Priority**: [High/Medium/Low]
**Complexity**: Level [1-3] ([Mode Route])
**Status**: [Current status]

**Description**: [Detailed task description]

**Subtasks**:
- [✅/🔄/ ] **Subtask Name**: [Description]
  - [✅/🔄/ ] Specific action 1

**Success Criteria**:
- [✅/🔄/ ] Criterion 1

**Metrics & Measurement**:
- **Metric 1**: [Target] → [Current status]

**Estimated Time**: [Time estimate] → [Current progress]
```

### **🔄 HANDOFF STATUS Section**

**Purpose**: Track transitions between modes

**Required Elements**:

- **Handoff Information**: Date, status, readiness
- **Context Transfer**: Strategic and tactical context
- **Implementation Plan**: Next steps and timeline

**Format**:

```markdown
### **[Mode] to [Mode] Handoff** ✅ COMPLETE/🔄 IN PROGRESS

**Date**: [Date]
**Status**: [Complete/In Progress]
**Ready for Next Mode**: [Yes/No]

**Strategic Context**:
- **Overall Approach**: [Strategic decisions and approach]
- **System Setup**: [Tools and workflows configured]

**Tactical Context**:
- **Requirements**: [Key requirements identified]
- **Design Decisions**: [Major design decisions made]

**Implementation Plan**:
- **Phase 1**: [Phase description]
- **Timeline**: [Expected timeline]

**Ready for Operational Execution**:
- **First Task**: [First task to implement]
- **Success Criteria**: [How success will be measured]
- **Blockers**: [Any potential blockers identified]
```

### **📊 PROGRESS TRACKING Section**

**Purpose**: Overall project progress and metrics

**Required Elements**:

- **Phase Progress**: Percentage completion for each phase
- **Key Metrics**: Task completion, conflict resolution, system integration
- **Next Milestones**: Upcoming important events

**Format**:

```markdown
### **Overall Progress**
- **Phase 1**: [X]% Complete ✅/🔄
- **Phase 2**: [X]% Complete ✅/🔄

### **Key Metrics**
- **Tasks Completed**: [X]/[Y] ([Z]%)
- **Conflicts Resolved**: [X]/[Y] ([Z]%)

### **Next Milestones**
1. [Milestone 1]
2. [Milestone 2]
```

### **🎯 SUCCESS CRITERIA Section**

**Purpose**: Define measurable success outcomes

**Required Elements**:

- **Phase Success Criteria**: Specific to each phase
- **Overall Success Criteria**: Project-wide outcomes

**Format**:

```markdown
### **Phase [X] Success Criteria**
- [ ] Criterion 1
- [ ] Criterion 2

### **Overall Success Criteria**
- [ ] Criterion 1
- [ ] Criterion 2
```

## 📋 **FORMATTING GUIDELINES**

### **Status Indicators**

Use consistent status indicators throughout the document:

- **✅ COMPLETED**: Task or phase is finished
- **🔄 IN PROGRESS**: Task or phase is currently being worked on
- **⏳ READY TO START**: Task is ready to begin
- **❌ BLOCKED**: Task is blocked and cannot proceed

### **Priority Levels**

Use consistent priority indicators:

- **High**: Critical tasks that must be completed first
- **Medium**: Important tasks that should be completed soon
- **Low**: Nice-to-have tasks that can be deferred

### **Complexity Levels**

Use consistent complexity indicators:

- **Level 1**: Simple tasks (Operational only)
- **Level 2**: Medium complexity (Tactical → Operational)
- **Level 3**: Complex tasks (Strategic → Tactical → Operational)

### **Mode Routes**

Use consistent mode route indicators:

- **Operational Only**: Direct to Operational Mode
- **Tactical → Operational**: Tactical planning, Operational execution
- **Strategic → Tactical → Operational**: Full planning cycle

## 📋 **USAGE INSTRUCTIONS**

### **When to Update**

Update the document:

1. **At the start of each mode transition**
2. **When task status changes**
3. **When new tasks are added**
4. **When milestones are reached**
5. **When blockers are identified or resolved**

### **How to Update**

1. **Use Time MCP** for all timestamps
2. **Update status indicators** consistently
3. **Maintain hierarchical structure**
4. **Add detailed descriptions** for new tasks
5. **Update progress percentages** accurately

### **Integration with Unified Orchestrator Mode**

The document integrates with the Unified Orchestrator Mode:

- **🎭 Strategic Mode**: Updates Strategic Context and overall approach
- **🎨 Tactical Mode**: Updates Tactical Plan and design decisions
- **⚒️ Operational Mode**: Updates Operational Execution and task status

### **File Location**

- **Template**: `.cursor/rules/todo-handoff-template.mdc` (this file)
- **Project Data**: `memory-bank/project/todo-handoff.md` (actual project data)

## 📋 **EXAMPLE ENTRIES**

### **Example Task Entry**

```markdown
#### **Task 1: Code Cleanup & Refactoring Session** 🔄 IN PROGRESS

**Priority**: High
**Complexity**: Level 2 (Tactical → Operational)
**Status**: Significant progress - 4 core modules created

**Description**: Comprehensive code cleanup and refactoring session focusing on JavaScript modularization, CSS specificity optimization, and code organization improvements.

**Subtasks**:
- [✅] **JavaScript Modularization**: Break down 4886-line monolithic file
  - [✅] Extract utility functions and helpers → **utils.js** created
  - [✅] Extract constants and configuration → **constants.js** created
  - [🔄] Create remaining business logic modules

**Success Criteria**:
- [🔄] JavaScript modularization complete (target: 4-6 files) → **4 core modules created**
- [ ] CSS specificity optimization achieves 50% reduction
- [ ] Code organization and readability significantly improved

**Metrics & Measurement**:
- **File Size Reduction**: Target 15-20% reduction → **4 modules created, ~800 lines extracted**
- **Complexity Reduction**: Target 30% reduction → **Modular structure reduces complexity**

**Estimated Time**: 1-2 days → **Phase 1 (JavaScript Modularization) ~60% complete**
```

### **Example Handoff Entry**

```markdown
### **Strategic to Tactical Handoff** ✅ COMPLETE

**Date**: 2025-07-23
**Status**: Complete
**Ready for Next Mode**: Yes

**Strategic Context**:
- **Overall Approach**: Unified Orchestrator Mode with automatic role selection
- **System Setup**: Single intelligent mode with 3 roles (Strategic/Tactical/Operational)
- **Optimizations**: Token efficiency and intelligent integration

**Tactical Context**:
- **Requirements**: Code cleanup, refactoring, and optimization for immediate improvement
- **Design Decisions**: Modular JavaScript architecture, CSS specificity reduction
- **Architecture**: Maintainable, readable, and performant codebase

**Implementation Plan**:
- **Phase 1**: JavaScript Modularization (4886-line file breakdown)
- **Phase 2**: CSS Specificity Optimization (50% reduction target)
- **Timeline**: 1-2 days for complete implementation

**Ready for Operational Execution**:
- **First Task**: Continue JavaScript modularization and complete remaining business logic modules
- **Success Criteria**: Improved code maintainability, reduced complexity, better performance
- **Blockers**: None identified
```

## 📋 **BEST PRACTICES**

### **Documentation Quality**

1. **Be Specific**: Provide detailed descriptions and context
2. **Use Consistent Formatting**: Follow the template structure exactly
3. **Update Regularly**: Keep the document current with project status
4. **Include Metrics**: Add measurable outcomes and progress indicators
5. **Maintain Hierarchy**: Use proper heading levels and organization

### **Task Management**

1. **Break Down Large Tasks**: Divide complex tasks into manageable subtasks
2. **Set Clear Success Criteria**: Define measurable outcomes for each task
3. **Track Progress**: Update status indicators and progress percentages
4. **Identify Blockers**: Document any issues preventing progress
5. **Estimate Time**: Provide realistic time estimates and track actual progress

### **Handoff Management**

1. **Transfer Context**: Ensure all relevant information is passed between modes
2. **Define Next Steps**: Clearly specify what needs to be done next
3. **Set Expectations**: Define success criteria and timeline for next phase
4. **Document Blockers**: Identify any issues that might prevent progress
5. **Maintain Continuity**: Ensure smooth transitions between modes

---

**📋 TODO & HANDOFF TEMPLATE: The intelligent structure for unified project management!**
