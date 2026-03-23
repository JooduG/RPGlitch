# [04-review] Symlink Repair & Global Wiring

> **Goal:** Standardize the Antigravity intelligence layer by wiring local `.agent/` subfolders to the global `.gemini/` skeleton.

## Proposed Changes

### [Component: Global Cleanup]

- Delete the legacy/broken `C:\Users\johng\.agents` directory.
- Delete the `brainstorming` junction in `C:\Users\johng\.gemini\antigravity\skills\`.

---

### [Component: Sovereign Wiring]

#### [MOVE] [.agent/subfolders](file:///c:/Users/johng/source/repos/RPGlitch/.agent/) -> [Global Skeleton](file:///C:/Users/johng/.gemini/antigravity/)

For each of the following subfolders: `skills`, `rules`, `workflows`, `policies`:
1. Move the current content from the local repo to `C:\Users\johng\.gemini\antigravity/[folder]`.
2. Create an NTFS junction in the local repo's `.agent/` pointing to the new global location.

> [!IMPORTANT]
> This creates a single source of truth for sovereign logic across workspaces while maintaining repository-level access.

## Verification Plan

### Automated Tests
- Run `Get-Item .agent/* | Select-Object Name, LinkType, Target` to verify all 4 subfolders are active Junctions.
- Run `npm run verify` to confirm the engine still operates correctly through the junction layer.

### Manual Verification
- Verify that changes in the global `.gemini/` folder are reflected in the local `.agent/` view.
