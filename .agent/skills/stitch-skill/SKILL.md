---
name: stitch
description: Triggered by any task involving DESIGN.md specification updates, reverse-engineering Stitch metadata, or Stitch MCP operations.
---

# The Weaver (Stitch)

> "I am the Weaver. I bridge the gap between the Designer's aesthetic intent and the technical requirements of the Stitch MCP. I synchronize the Design Specification into External Assets."

## Overview

The `stitch` skill manages the synchronization between the RPGlitch Engine's local design specifications (`DESIGN.md`) and the external Stitch environment. It ensures that the **Chalk Regime** aesthetics are precisely documented and woven into the project metadata. This skill governs the spec formatting and MCP interfacing required to maintain a single source of truth for the project's visual identity.

### Strategic Context

- **High-Fidelity Implementation**: Precise translation of the Chalk Regime and Nordic Collection to Stitch screen metadata.
- **Architectural Integrity**: Maintenance of the root `DESIGN.md` as the authoritative sovereign source for all visual tokens.
- **Synchronized Reality**: Ensuring parity between local Svelte components and external Stitch screen assets.

## When to Use

- **Positive Triggers**: Updating the `DESIGN.md` specification, reverse-engineering Stitch metadata via MCP tools, or creating/modifying Stitch screens and projects.
- **Synchronicity Triggers**: When a local aesthetic change needs to be "woven" into the external project via `mcp_StitchMCP`.
- **EXCLUSIONS**: Do not use for pure CSS layout tweaks that do not impact the root design specification or external assets.

## How It Works

1. **Spec Alignment**: Compare the proposed aesthetic intent with the existing `DESIGN.md` and Chalk Regime tokens.
2. **Technical Translation**: Draft technically precise component descriptions and metadata for the Stitch environment.
3. **MCP Interfacing**: Utilize the `StitchMCP` tools to fetch or update project/screen metadata.
4. **Parity Verification**: Confirm that the external Stitch state matches the local Svelte implementation and DESIGN.md.

## Usage

```bash
# Fetch the latest screen metadata from the Stitch environment
mcp_StitchMCP_get_screen projectId="..." screenId="..."

# List all screens in the project to verify synchronization
mcp_StitchMCP_list_screens projectId="..."
```

## Present Results

Present the updated design specification and synchronization status.

- **Evidence**: Links to the updated `DESIGN.md` and the successful `StitchMCP` output logs.
- **Validation**: Demonstrate that local tokens and external screen metadata are in perfect parity.

## Common Rationalizations

| Agent Excuse                         | The Reality                                                                                |
| :----------------------------------- | :----------------------------------------------------------------------------------------- |
| "I'll just update the CSS directly." | Bypassing `DESIGN.md` creates "spec drift" and violates Rule 04 sovereignty.               |
| "The Stitch metadata is secondary."  | Synchronization is safety. Parity between environments is a mandatory quality gate.        |
| "The spec doesn't need precision."   | A vague spec leads to failure in the MCP Weaver. Precision is the baseline of sovereignty. |

## Red Flags

- **Spec Fragmentation**: Allowing the root `DESIGN.md` to fall out of sync with actual component implementations.
- **Ad-hoc Tokenization**: Introducing raw hex values or non-standard spacing that isn't documented in the specification.
- **Stitch Drift**: External project screens that no longer mirror local engine physics or aesthetics.

## Troubleshooting

- **Sync Failure**: If MCP tools return errors, verify the `projectId` and `screenId` against the Stitch dashboard.
- **Metadata Conflict**: If external metadata differs from local state, prioritize the `DESIGN.md` specification as the arbiter.

## Verification

- [ ] `DESIGN.md` updated with technically precise component descriptions and tokens.
- [ ] Stitch screen metadata fetched and synchronized via official MCP tools.
- [ ] Component look-and-feel verified against the Designer's sovereign intent (Rule 04).
- [ ] **Hard Evidence Recorded**: A successful `mcp_StitchMCP` sync log and updated `DESIGN.md`.
