# 🚀 Future (The Roadmap)

> **Role**: Mission Board & Tracks Registry
> **Last Synchronized**: 2026-05-25

This document tracks all major tracks for the project. Each track has its own detailed plan in its respective single-file artifact.

## 🚀 Active Mission

- **Track**: `architectural-refactor-modal-dialog`
- **Objective**: Migrate the custom Modal to bits-ui/Dialog.

## 🗺️ Roadmap (Tracks)

| Track ID                                                  | Name                                           | Priority | Status  | Objective                                                                                               |
| :-------------------------------------------------------- | :--------------------------------------------- | :------- | :------ | :------------------------------------------------------------------------------------------------------ |
| `view-transition-collision-overflow-clipping-2026-05-31`  | View Transition Collision & Overflow Clipping  | P0       | ✅ Done | Fix identity token collisions, prevent layout boundary clipping, and stabilize typography bounds.       |
| `sensory-layer-layout-continuity-polish-sweep-2026-05-31` | Sensory Layer Layout & Continuity Polish Sweep | P0       | ✅ Done | Refactor layouts/transitions inside EntityCard and Drawer, unhide empty cards and secure launch timing. |
| `inertial-rack-pull-selection-motion-phase-a-2026-05-31`  | Inertial Rack-Pull Selection Motion (Phase A)  | P0       | ✅ Done | Implement press compression tension, rack eject animation, and view transitions in EntityCard.          |
| `drawer-relocation-motion-engine-upgrade-2026-05-31`      | Drawer Relocation & Motion Engine Upgrade      | P0       | ✅ Done | Relocate Drawer component to atoms, transition from fly statement to Svelte 5 physics spring.           |
| `architectural-refactor-tooltip-system`                   | Architectural Refactor - Tooltip System        | P0       | ✅ Done | Migrate the custom tooltip system to bits-ui/Tooltip and clean up redundant calculations.               |
| `inline-log-editing-2026-05-25`                           | Inline Log Entry Editing                       | P0       | ✅ Done | Implement inline log editing directly inside story feed via atomic TextField and in-place buttons.      |
| `agent-system-alignment-2026-05-24`                       | Agent System Alignment                         | P0       | ✅ Done | Synchronize .agents config, motion & svelte guidelines, and harden token checkers.                      |
| `glasspill-inputbar-refactor-2026-05-24`                  | GlassPill & InputBar Refactor                  | P0       | ✅ Done | Harmonize width clamps to 4 columns standard, and extract flank button animations to Button.svelte.     |
| `architectural-flatness-utility-consolidation-2026-05-24` | Architectural Flatness & Utility Consolidation | P0       | ✅ Done | Centralize helpers, flatten Storymode panels, and centralize reactive busy locks.                       |
| `ui-cleanup-animation-decommissioning-2026-05-24`         | UI Cleanup & Animation Purge                   | P0       | ✅ Done | Purge tremor animations, TypingIndicator components, tilt actions, and dead references.                 |
| `memory-protocol-consecutive-sender-fix-2026-05-24`       | Memory Protocol & Consecutive Messages         | P0       | ✅ Done | Merge consecutive messages from same actor, filter system telemetry, clear loader bubble.               |
| `reactivity-crash-fix-2026-05-24`                         | Reactivity & Turn Counter Fixes                | P0       | ✅ Done | Fix Svelte 5 proxy collisions, round coercion, and secure try-finally execution loops.                  |
| `image-upload-pipeline-2026-05-24`                        | Image Upload Pipeline                          | P0       | ✅ Done | Implement image upload pipeline using Perchance upload-plugin with state and IndexedDB persistence.     |
| `re-routing-optimization-2026-05-24`                      | Re-Routing Optimization Sweep                  | P0       | ✅ Done | Clean barrel patterns, replace deep imports in main.js and boot.js with folder gates.                   |
| `tab-context-coupling-2026-05-24`                         | Tab-Context Coupling                           | P0       | ✅ Done | Bind UI activeId (Chin) to ContextBroker; loadViewContext flushes+hibernates vectors.                   |
| `ui-reactivity-stabilization-2026-05-24`                  | UI Reactivity & Intent Locking                 | P0       | ✅ Done | Consolidate UI flags in status.svelte.js, implement sub-ms intent lock & exception.                     |
| `protocol-library-compression-2026-05-24`                 | Protocol Library Compression                   | P0       | ✅ Done | Strip internal uppercase headers and trailing colons from PROTOCOL_LIBRARY strings.                     |
| `chrono-round-increment-2026-05-23`                       | Chrono Round Increment Pacing                  | P0       | ✅ Done | Step mutable round state counter forward before committing snapshot save.                               |
| `performance-anchor-preservation-2026-05-23`              | Performance Anchor Preservation                | P0       | ✅ Done | Let 'eternal' layer data points bypass keyword filter to prevent token starvation.                      |
| `intelligence-polish-2026-05-23`                          | Intelligence Polish                            | P0       | ✅ Done | Add Fractal RAG memories, dual-phase post-generation scanning, and rich epilogues.                      |
| `devmode-storycard-refactor-2026-05-22`                   | DevMode StoryCard Refactor                     | P0       | ✅ Done | Fix clickability layering, correct border radius, active story, and refactor CSS.                       |
| `prologue-fractal-identity-fix-2026-05-21`                | Prologue Fractal Identity Fix                  | P0       | ✅ Done | Fix hydration race + sentinel masking causing fractal to display as ENVIRONMENT.                        |
| `storymode-ui-refactor-2026-05-21`                        | Storymode UI Refactor & Visual Align           | P0       | ✅ Done | Refactor entire storymode UI tree, delete MessageToolbar, style active bubbles.                         |
| `profile-class-simplification-2026-05-20`                 | Profile Class Simplification                   | P0       | ✅ Done | Refactor CSS classes, fix React-style `className` to Svelte `class`, harmonize.                         |
| `profile-avatar-layout-rebalance-2026-05-20`              | Profile Avatar Layout Rebalance                | P0       | ✅ Done | Rebalance profile avatar layout to fill the entire left column and remove hover.                        |
| `profile-wings-design-cleanup-2026-05-19`                 | Profile Wings Design Cleanup                   | P0       | ✅ Done | Visual and Audio wings premium aesthetics refactor and design token integration.                        |
| `profile-design-cleanup-2026-05-19`                       | Profile Design Cleanup                         | P0       | ✅ Done | Execute design cleanup of Profile.svelte in readonly and edit modes.                                    |
| `drawer-and-avatar-contrast-remediation-2026-05-18`       | Drawer and Avatar Contrast Remediation         | P0       | ✅ Done | Fix contrast, desaturation, and legibility issues in drawer/initials.                                   |
| `storyboard-card-bleed-remediation-2026-05-18`            | Storyboard Card Bleed Remediation              | P0       | ✅ Done | Fix signature color bleed and typography contrast.                                                      |
| `refactor-design-schema-2026-05-18`                       | Refactor DESIGN.md Schema                      | P0       | ✅ Done | Refactor DESIGN.md to follow schema, flatten & migrate tokens.                                          |
| `profile-grid-layout`                                     | Profile Grid Layout                            | P0       | ✅ Done | Implement state-aware 12-column grid layout and verticality.                                            |
| `spacing-migration`                                       | Spacing Migration                              | P0       | ✅ Done | Project-wide migration from raw spacing to semantic tokens.                                             |
| `signature-color-consolidation`                           | Signature Color Consolidation                  | P0       | ✅ Done | Consolidate signature color automation and logic hardening.                                             |

---

> 🎨 Tactics | `planning` | /01-plan
