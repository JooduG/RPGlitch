---
name: directives
description: Triggered by any task involving Rule or Skill modifications within the .agent/ directory.
---

# Directives & Systems Architect

> "I am the Architect of the Laws. I do not manage the project; I manage the engine that manages the project. I own the rules, the skills, and the workflows that define our intelligence."

## Overview

The `directives` skill is the core maintenance process for the agent's internal rules and capabilities. It ensures that the `.agent/` directory remains a high-fidelity, self-consistent source of truth for agent behavior and repository-specific logic.

### Strategic Context

- **Sovereign Systems**: Owns the integrity of the [.agent](../../../.agent) directory.
- **Law Composer**: Writer of Rule 01 through Rule 06.
- **Workflow Architect**: Designs the automation workflows in `workflows/`.

## When to Use

- **Positive Triggers**: When a new architectural pattern emerges, when skill documentation is stale, or when automated audits fail.
- **Maintenance**: Regular hygiene of the `.agent/` directory.
- **EXCLUSIONS**: Do not use this for application source code changes; use domain-specific skills instead.

## How It Works

1. **Blueprinting**: Define the change required in the rules or skills via a spec.
2. **Fabrication**: Use `npm run forge:skill` or `npm run forge:svelte` to create assets.
3. **Auditing**: Run `npm run audit:agent` to verify structural purity.
4. **Synchronization**: Ensure all changes are reflected in Rule 05 and Rule 06.

### Physical Architecture

Skills follow a strict, predictable structure:

```text
.agent/skills/
  {skill-name}/         # kebab-case directory
    SKILL.md            # Required: Primary definition
    scripts/            # Required: Executable shell scripts
    {reference}.md      # Optional: Detailed supporting files (>100 lines)
```

## Usage

```bash
# Audit all directives (rules, skills, workflows)
npm run audit:agent

# Create a new skill
node .agent/skills/directives/scripts/forge-skill.js create my-new-skill
```

## Present Results

Present the updated directive and its impact on the agent's operational logic.

- **Evidence**: Links to the modified `.agent/` files and passing audit logs.
- **Validation**: Demonstrate that the new directive honors the Sovereign Template.

## Common Rationalizations

| Agent Excuse                             | The Reality                                                      |
| :--------------------------------------- | :--------------------------------------------------------------- |
| "I can fix this rule without a spec."    | Rules define physics; they must be designed with intentionality. |
| "Audit failure is just a minor warning." | Audit failure represents technical debt in the agent's brain.    |

## Red Flags

- **Strategic Overreach**: Attempting to define project goals instead of agent capabilities.
- **Logic Drift**: Modifying the engine without updating the underlying rules and templates.

## Troubleshooting

- **Audit Failure**: Check `directives/templates/` to ensure the file matches the Sovereign Blueprint.
- **Path Conflicts**: Use `path.join` and relative resolution to prevent OS-specific path issues.

## Verification

- [ ] `.agent` directory is synchronized with Sovereign Template and Rule 05 lexical laws.
- [ ] No "HERESY" or "CRITICAL" warnings in `npm run audit:agent`.
- [ ] **Hard Evidence Recorded**: Audit log output confirms Grade A (Sovereign) status.
