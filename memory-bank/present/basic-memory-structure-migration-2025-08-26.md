# Basic Memory Structure Migration (2025-08-26)

What changed

- Adopted four-bucket structure: past/, present/, future/, forever/.
- Deprecated memory-bank/projects/; removed newly-added files and marked folder as deprecated.
- Updated forever/basic-memory-integration-guide.md to reflect new structure.
- Added memory-bank/README.md explaining the buckets.

Why

- Aligns with Unified Orchestrator Mode pointers in AGENTS.md and live present context files.
- Simplifies navigation and keeps a single source of truth for organization.

Next

- Prefer adding notes to the appropriate bucket. Remove the empty projects/ folder in a cleanup pass.
