# 📚 Comprehensive Best Practices & Protocols Collection

## 1. Language & Technology Guides

## 2. Continuous Improvement & Knowledge Management

### Reflection & Logging Protocol

- **Task Review & Analysis:**
  - Identify Learnings
  - Identify Difficulties & Mistakes
  - Identify Successes
- **Logging Structure:**
  - Date
  - Task Reference
  - Learnings
  - Difficulties
  - Successes
  - Improvements Identified for Consolidation
- **Consolidation Process:**
  - Review and identify for consolidation
  - Synthesize and transfer to consolidated learnings
  - Prune raw logs
  - Propose rule enhancements (exceptional)

### Guidelines for Knowledge Content

- Prioritize high-value insights
- Be concise & actionable
- Strive for clarity and future usability
- Document persistently, refine & prune continuously
- Organize for retrieval
- Avoid low-utility information
- Support continuous improvement
- Manage information density

## 3. UI/UX & Web Design Protocols

### Web Design Bank

- **Initialization Protocol:**
  - Read all design bank files at the start of every design task
  - Verify all required files exist
  - Check file timestamps
- **Verification Steps:**
  - Have all required files been loaded?
  - Are file timestamps current?
  - Is the brand context and design requirement understood?
  - Any missing or outdated information?
- **Tool Usage Requirements:**
  - Use file reading/writing tools for all operations
  - Only complete after thorough verification
- **Design Bank Structure:**
  - Core Files: designBrief.md, brandContext.md, styleGuide.md, layoutPatterns.md, componentLibrary.md, progress.md
  - Optional Files: userPersona.md, wireframes.md, inspirationExamples.md, accessibilityChecklist.md
- **File Update Checklist:**
  - Before any design task: verify core files, check timestamps, review progress, load optional files, validate requirements
  - During updates: document changes, update progress, cross-reference component library, verify accessibility
- **Critical Reminders:**
  - Memory resets between sessions: documentation is the only persistent context
  - Never delete/overwrite files without explicit confirmation
  - Always reference style guide for visual decisions
  - Maintain accessibility standards

## 4. Memory & Context Management

### Memory Bank Structure

- **Core Files:**
  - coreContext.md (project scope/goals/tech)
  - currentState.md (current focus/status)
  - designSystem.md (architecture/patterns)
- **Additional Context:**
  - Complex feature documentation
  - Integration specifications
  - API documentation
  - Testing strategies
  - Deployment procedures
- **Token-Optimized Structure:**
  - Consolidate feature docs if context is limited, but keep core/active context separate
- **Documentation Updates:**
  - When new patterns are discovered
  - After significant changes
  - Upon user request
  - When context needs clarification

## 5. Task Handoff & Workflow Automation

### Optimized Task Handoff

- **Key Details:**
  - Completed: user schema, registration endpoint, input validation, test suite
  - Current State: server running, database connected
  - Next Steps: login endpoint, JWT generation, auth middleware
  - References: secrets, error patterns
- **File Interaction Optimizations:**
  - Prefer targeted search over full file reads
  - Optimize replacements: specific search blocks, group related changes, verify formatting
  - Cache file contents for multiple edits
  - Group related file operations
  - Close files after use
- **Best Practices for Handoffs:**
  - Maintain continuity
  - Preserve context
  - Set clear next actions
  - Document assumptions
  - Optimize for resumability
- **When to Use Task Handoffs:**
  - When context window usage exceeds 50%
  - For long-running or complex projects
  - When context limitations are approaching
  - When switching focus areas or expertise

## 6. Problem-Solving & Reasoning Protocols

## 9. General Best Practices & Cross-Cutting Themes

- Accessibility & consistency: especially in UI/UX, accessibility and design consistency are non-negotiable

---

*This document is a curated, tool-agnostic collection of best practices, protocols, and guidelines for robust, maintainable, and user-focused software development and documentation.*

---

## Perchance-Specific Best Practices & Protocols

### Perchance Architecture

- **Core Components:**
  - WebviewProvider
  - Controller
  - Task
- **API Provider System:**
  - API Handlers
  - API Transformers
  - API Configuration
  - API Factory
- **Plan/Act Mode System:**
  - Mode State
  - Mode Switching
  - Mode-specific Models
  - Mode-specific Prompting
- **Context Management System:**
  - Model-aware sizing
  - Proactive truncation
  - Intelligent preservation
  - Adaptive strategies
  - Error recovery
- **Task State & Resumption:**
  - Task persistence
  - State recovery
  - Workspace synchronization
  - Error recovery

### Chin Navigation

- **Key Principles:**
  - Minimalist, intuitive, and efficient
  - Clear visual hierarchy
  - Consistent navigation across all pages
  - Responsive design for all screen sizes
- **Implementation:**
  - Use a consistent header/footer across all pages
  - Implement a main navigation menu
  - Add a back button for deeper navigation
  - Ensure smooth transitions between pages

### Atomic/Component CSS

- **Key Principles:**
  - Modularity and reusability
  - Clear separation of concerns
  - Consistent styling across components
  - Easy to maintain and update
- **Structure:**
  - Base styles (reset, typography, colors)
  - Component-specific styles (buttons, forms, tables)
  - Utility classes (spacing, flex, grid)
  - Responsive adjustments

### Perchance-Specific UI/UX Rules

- **Color Scheme:**
  - Primary: #4F46E5 (Indigo 600)
  - Secondary: #6366F1 (Indigo 500)
  - Accent: #8B5CF6 (Purple 500)
  - Background: #1F2937 (Gray 900)
  - Text: #F9FAFB (Gray 100)
- **Typography:**
  - Use a clean, modern font (e.g., Inter, sans-serif)\
  - Headings: 2xl, 1xl, lg, md, sm
  - Body: base, sm, xs
- **Spacing:**
  - Use a consistent spacing scale (e.g., 4, 8, 12, 16, 24, 32, 48, 64)
- **Buttons:**
  - Primary: Indigo 600, hover: Indigo 700
  - Secondary: Indigo 500, hover: Indigo 600
  - Accent: Purple 500, hover: Purple 600
  - Dismiss: Red 500, hover: Red 600
- **Forms:**
  - Consistent field layout
  - Clear labels and placeholders
  - Error messages in red
  - Success messages in green
- **Tables:**
  - Striped rows
  - Hover effects
  - Sortable columns
  - Pagination

### RPGlitch-Specific Instructions

- **File Naming Conventions:**
  - `[entity_name]_[action]_[timestamp].md`
  - `[entity_name]_[timestamp].md`
- **Directory Structure:**
  - `notes/`
  - `tasks/`
  - `designs/`
  - `docs/`
- **Version Control:**
  - Use a clear branching strategy (e.g., `main`, `feature/`, `hotfix/`)
  - Always commit changes with a descriptive message
  - Push to remote regularly

---

## Not Applicable to Perchance Projects

### C# Essentials for Python/TypeScript Developers

- **Core Paradigm Shifts:**
  - Statically typed: type known at compile time
  - Nominal typing: compatibility by explicit declarations/names
  - APIs use strong contracts (interfaces, class hierarchies)
  - Upfront type definition is a core design principle
- **.NET Ecosystem:**
  - CLR: execution engine (memory management, type safety, exceptions, threads)
  - BCL: base class library (data types, collections, networking, file I/O)
  - .NET Standard: API consistency across implementations
  - Modern .NET: cross-platform, open-source, focus of innovation
- **Development Environment:**
  - Install .NET SDK
  - Choose and configure IDE (VS Code + C# Dev Kit, or Visual Studio)
  - Create a "Hello World" app with `dotnet new console -o MyFirstApp`
  - Run with `dotnet run`
- **Type System:**
  - Value types: int, float, bool, char, decimal, struct, enum
  - Reference types: class, interface, delegate, array, string, object
  - Use `var` for type inference (still statically typed)
  - Use `dynamic` for runtime-typed variables (as sparingly as possible)
  - Nullable value types: `int?`, `bool?`, etc.
  - Nullable reference types: `string?`, etc. (C# 8+)
  - Use nullability attributes for API contracts
- **Operators & Control Flow:**
  - Arithmetic: +, -, *, /, %, ++, --
  - Relational: ==, !=, <, >, <=, >=
  - Logical: &&, ||, !
  - Bitwise: &, |, ^, ~, <<, >>
  - Assignment: =, +=, -=, *=, /=, %=, &=, |=, ^=, <<=, >>=\
  - Increment/Decrement: ++, --
  - Member Access: .
  - Indexing: []
  - Type Testing/Conversion: is, as, typeof, ()
  - Null-Coalescing: ??
  - Null-Conditional: ?., ?[]
  - Conditional (Ternary): ?:
  - Lambda Declaration: =>
  - nameof Operator
  - Control Flow: if-else, switch (pattern matching), for, foreach, while, do-while, break, continue, return, goto
- **Access Modifiers Table:**

| Location                        | public | protected internal | protected | internal | private protected | private | file |
|----------------------------------|--------|-------------------|-----------|----------|-------------------|---------|------|
| Within the file                  | ✔️     | ✔️                | ✔️        | ✔️       | ✔️                | ✔️      | ✔️   |
| Within the class                 | ✔️     | ✔️                | ✔️        | ✔️       | ✔️                | ✔️      | ❌   |
| Derived class (same assembly)    | ✔️     | ✔️                | ✔️        | ✔️       | ✔️                | ❌      | ❌   |
| Non-derived class (same assembly)| ✔️     | ✔️                | ❌        | ✔️       | ❌                | ❌      | ❌   |
| Derived class (different assembly)| ✔️    | ✔️                | ✔️        | ❌       | ❌                | ❌      | ❌   |
| Non-derived class (different assembly)| ✔️ | ❌               | ❌        | ❌       | ❌                | ❌      | ❌   |

- **Properties:**
  - Auto-implemented
  - Full (with explicit backing field)
  - Init-only (C# 9+)
- **Delegates & Events:**
  - Declaration, Instantiation (named, anonymous, lambda)
  - Singlecast vs. Multicast
  - The `event` keyword
  - EventHandler, EventArgs, custom EventArgs
- **LINQ Standard Query Operators:**
  - Filtering: Where
  - Projection: Select, SelectMany
  - Ordering: OrderBy, OrderByDescending, ThenBy, ThenByDescending
  - Grouping: GroupBy
  - Joining: Join, GroupJoin
  - Partitioning: Take, Skip, TakeWhile, SkipWhile
  - Aggregation: Count, Sum, Min, Max, Average, Aggregate
  - Element Operations: First, FirstOrDefault, Single, SingleOrDefault, Last, LastOrDefault, ElementAt
  - Quantifiers: Any, All, Contains
  - Conversion: ToList, ToArray, ToDictionary, ToLookup, OfType, Cast
- **Assemblies & Namespaces:**
  - Assemblies: .dll, .exe
  - Namespaces: hierarchical organization
  - File-scoped namespaces (C# 10+)

---

### Extension Architecture (Example)

- **Core Components:**
  - WebviewProvider
  - Controller
  - Task
- **API Provider System:**
  - API Handlers
  - API Transformers
  - API Configuration
  - API Factory
- **Plan/Act Mode System:**
  - Mode State
  - Mode Switching
  - Mode-specific Models
  - Mode-specific Prompting
- **Context Management System:**
  - Model-aware sizing
  - Proactive truncation
  - Intelligent preservation
  - Adaptive strategies
  - Error recovery
- **Task State & Resumption:**
  - Task persistence
  - State recovery
  - Workspace synchronization
  - Error recovery

---

## ✅ Covered by Project Rules

### Covered by `incremental-changes-philosophy.mdc`

- **Incremental Development:** All development work is broken down into small, verifiable steps. The AI proposes a plan of small steps, the user approves the entire plan, and the AI executes it autonomously.

#### Covered by: `protocol-control-system.mdc`

- Explicit workflows: plan/act modes, file management, handoff protocols
- Implicit Approval (Plan to Act Mode switch)
- Memory Reset Protocols (principle of documentation as persistent context)

#### Covered by: `state-awareness-check.mdc`

- Silent mode verification before action
- Avoid redundant protocol switch announcements

#### Covered by: `writing-effective-rules.mdc`

- Separation of concerns: modularity in code and rules (The "Surgically Specific" Principle)
- Continuous Improvement (through rule creation and refinement)

#### Covered by: `user-feedback-protocol.mdc` (Proposed)

- User Preferences & Feedback (capturing and acting on user feedback)

### Covered by `mode-control-system.mdc`

- Explicit workflows: plan/act modes, file management, handoff protocols

### Covered by `plan-mode.mdc`

- Explicit workflows: plan/act modes, file management, handoff protocols

### Covered by `act-mode.mdc`

- Explicit workflows: plan/act modes, file management, handoff protocols

### Covered by `sequential-thinking-guide.mdc`

- **When to Use:**
  - Complex problem decomposition
  - Iterative planning/design
  - In-depth analysis
  - Unclear scope
  - Multi-step solutions
  - Context maintenance
  - Information filtering
  - Hypothesis generation/verification
- **Core Principles:**
  - Iterative thought process
  - Dynamic thought count
  - Honest reflection
  - Hypothesis-driven approach
  - Relevance filtering
  - Clarity in each thought
  - Completion condition

### Covered by: `tool-post-execution-verification.mdc`

- Post-execution verification of tool outcomes (especially file changes)
- Diagnosis of tool failures and reporting discrepancies

### Covered by: `atomic-css-principles.mdc`

- Atomic CSS methodology
- Preference for utility classes over monolithic CSS
- Prohibition of element selectors and deep nesting in CSS

### Covered by: `icon-free-design-standard.mdc`

- Icon-free design preference (clear text labels over standalone icons)
- Minimalist UI aesthetic with tiny text labels

### Covered by: `reflection-protocol.mdc`

- Structured task reflection process
- Identification of learnings, difficulties, and successes post-task
- Proposing improvements to processes or knowledge base

### Covered by: `logging-structure.mdc`

- Standardized format for internal AI logs
- Mandatory log fields (Timestamp, Task Reference, Type, Summary)
- Integration with `mcp_time_get_current_time` for timestamps

### Covered by: `knowledge-consolidation-process.mdc`

- Structured process for synthesizing and integrating learnings
- Regular consolidation into a persistent, actionable knowledge base
- Reviewing, filtering, synthesizing, categorizing, and integrating knowledge
- Proposing rule enhancements based on patterns
