---
name: Writeback Rules
description: How to record and feed back information?
---

# Issue Creation & Tracking

When an agent identifies a gap, bug, or technical debt, it **MUST** record it:

- **Command**: **`gli issue create`**.
- **Schema**:
    - `id`: Auto-generated UUID.
    - `type`: `BUG`, `RECO`, `DEBT`.
    - `status`: `OPEN`.
    - `context`: JSON artifact of the failed state.

## Rules
1. **No Duplication**: Search with `gli issue list` before creating.
2. **Context-Heavy**: Attach exact line numbers and file paths.
3. **Traceability**: Link to the PR or Issue ID that triggered the review.
