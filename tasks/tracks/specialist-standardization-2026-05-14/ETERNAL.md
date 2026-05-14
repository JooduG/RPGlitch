# Technical Specification: Specialist Standardization

## Objective

Refactor the agent architecture to centralize persona definitions within Skill manuals (`SKILL.md`) and shift activation responsibility to Conductor workflows.

## Success Criteria

- [ ] `GEMINI.md` is free of individual persona definitions (Unified Persona remains as a summary).
- [ ] `/01-plan.md` and `/02-implement.md` workflows explicitly call for skill activation and persona invocation.
- [ ] Every `SKILL.md` (30 total) begins with a standardized, persona-driven identity declaration: `## 🎭 Persona: [Name]`.
- [ ] No "Persona" or "Identity" sections exist outside of `SKILL.md` files.

## Technical Constraints

- **Svelte 5 Purity**: No impact on core logic.
- **Path Sovereignty**: All links must be relative.
- **Standardized Header**: Use `# Persona: [Name]` or similar as the primary entry point in skills.

## Boundaries

- **Always**: Use the "You are the expert in..." phrasing as requested by the user.
- **Never**: Duplicate persona definitions across multiple files.
- **Ask first**: Before deleting any unique instructions that were tied to a persona in `GEMINI.md`.
