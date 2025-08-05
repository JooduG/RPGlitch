# CONTRIBUTING

## 1. Overview

Central location for workflows & conventions referenced by AGENTS.md.

## 2. Standard Check

Run before every commit / PR:

```bash
npm run lint && npm test && npm run build && npm run validate
```

## 3. Pull-Request Workflow

- Title: `[<package>] <summary>`
- Description links to issue IDs
- All code must pass the Standard Check above
