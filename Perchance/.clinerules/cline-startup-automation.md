---
description: Defines a fully automated startup process for Cline to initialize tasks or sessions for any project, replacing the manual startup_prompt.md.
author: Cline
version: 2.0
tags: ["startup", "automation", "memory-bank", "core-behavior", "project-initialization"]
globs: ["memory-bank/*"]
---

# Cline Startup Automation Rule

## Objective
This rule mandates a fully automated startup process for Cline to initialize tasks or sessions within any project. It replaces manual processes by automating the review of memory bank files, generation of summaries, and logging of critical context, ensuring consistency and minimizing user interaction.

## When to Apply This Rule
Cline MUST apply this rule at the start of EVERY task or session within any project context. This rule is triggered automatically upon task initialization.

## Automation Execution Flow

### 1. Initialization and Task Scope Detection
- **Action:** Automatically detect task scope based on context window usage
- **Logic:** If context window usage is below 60% (using global threshold), assume lightweight mode
- **Output:** Log detected scope to report file

### 2. Dynamic Memory Bank File Review
- **Action:** Scan "memory-bank" directory for relevant files
- **Priority Order:** coreContext.md, currentState.md, designSystem.md
- **Adaptation:** Use cached index to track file structure changes
- **Output:** Log reviewed files and changes

### 3. Context Summary Generation
- **Action:** Generate summaries focusing on:
  - Current work focus and recent changes
  - Architectural patterns and key decisions
  - Project goals and technical stack
- **Logic:** Detailed summaries in full mode, critical points only in lightweight mode
- **Output:** Store summaries in report or cache

### 4. Critical Context Logging
- **Action:** Extract and log critical context areas:
  - Platform constraints
  - Security requirements
  - Integration patterns
  - Build process considerations
- **Output:** Highlight priority items in report

### 5. Workflow Setup
- **Action:** Initialize preferred workflow:
  - Start in Plan Mode for approach discussion
  - Transition to Act Mode for implementation
  - Document changes in memory bank files
- **Logic:** Set internal flags to track progression
- **Output:** Log initialized workflow state

### 6. Communication Style Enforcement
- **Action:** Format all outputs to match:
  - Technical but concise
  - Bullet points for clarity
  - Mermaid diagrams for complex flows
  - Early issue flagging
- **Output:** Apply style consistently

### 7. Post-Execution Report Generation
- **Action:** Compile detailed report of all actions
- **Storage:** Save to "memory-bank/startup_log_[timestamp].md"
- **Logic:** Version reports to maintain history

## Error Handling and Fallback Mechanisms
- **File Access Errors:** Log errors and proceed with cached data
- **Structural Changes:** Log discrepancies and adapt
- **Critical Failures:** Revert to minimal mode with cached defaults
- **Output:** Log all errors with explanations

## Integration with Other Rules
- **Context Handoff:** Process preloaded context from new_task
- **Efficiency:** Minimize context usage through caching
- **Threshold Alignment:** Use global 60% threshold from designSystem.md

## Implementation Instructions
- Execute at start of every task
- Use tools (read_file, write_to_file) as needed
- Log all actions transparently

## Conclusion
This rule enables fully automated startup for any project, ensuring consistent initialization while minimizing user interaction.
