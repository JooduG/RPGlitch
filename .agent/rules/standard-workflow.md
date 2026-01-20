---
trigger: always_on
---

# Workflow Principles & Quality Gates

## Enforcement Levels

The rigidity of the workflow is determined by the `enforcement_level` set in `.agent/config.yaml`.

| Level | Description | TDD Requirement | Quality Gates |
| :--- | :--- | :--- | :--- |
| **Strict** | Production-ready hardening. | Mandatory Red-Green-Refactor. | All gates required. |
| **Flexible** | Balanced development. | Recommended for complex logic. | Core gates required. |
| **Experimental** | Rapid prototyping. | Optional. | Minimal gates (Lint/Build). |

## Guiding Principles

1. **The Plan is the Source of Truth:** All work must be tracked in `plan.md`
2. **The Tech Stack is Deliberate:** Changes to the tech stack must be documented in `tech-stack.md` _before_ implementation
3. **Test-Driven Development:** Write unit tests before implementing functionality
4. **High Code Coverage:** Aim for >80% code coverage for all modules
5. **User Experience First:** Every decision should prioritize user experience
6. **Non-Interactive & CI-Aware:** Prefer non-interactive commands. Use `CI=true` for watch-mode tools (tests, linters) to ensure single execution.

## Quality Gates

Before marking any task complete, verify:

- [ ] All tests pass
- [ ] Code coverage meets requirements (>80%)
- [ ] Code follows project's code style guidelines (as defined in `rules/`)
- [ ] All public functions/methods are documented (e.g., docstrings, JSDoc)
- [ ] Type safety is enforced (e.g., TypeScript types)
- [ ] No linting or static analysis errors
- [ ] Works correctly on mobile (if applicable)
- [ ] Documentation updated if needed
- [ ] No security vulnerabilities introduced
