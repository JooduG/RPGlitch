# Refactoring & Progressive Disclosure

## The Problem: Context Bloat

When `AGENTS.md` or `tasks.md` grows too large, the agent loses focus (and you lose money/tokens).

## The Solution: Progressive Disclosure

1. **Analyze:** Identify distinct topics (e.g., "Testing", "Deployment", "Auth").
2. **Extract:** Move details to `.agent/knowledge/{topic}.md`.
3. **Link:** Replace the wall of text in the root file with a single link.

## Example

**Before (Bloated):**

```markdown
### Testing

To test the app, run npm test. We use Jest. Here is how to mock... [200 lines]
```

**After (Surgical):**

```markdown
### Testing

See [Testing Guide](knowledge/testing.md) for mocking patterns and command references.
```
