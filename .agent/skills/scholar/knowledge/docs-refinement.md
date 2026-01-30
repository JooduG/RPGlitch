# Documentation Refinement & Progressive Disclosure (The Librarian)

## The Problem: Context Bloat

When `AGENTS.md`, `tasks.md`, or any documentation file grows too large, the agent loses focus (and you lose money/tokens).

## Required Tooling

- **mcp:context7**: `resolve_library_id` (Verify external libs before documenting).
- **mcp:deepwiki**: `read_wiki_structure` (Import external knowledge).
- **mcp:github**: `search_code` (Verify internal usage).

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
