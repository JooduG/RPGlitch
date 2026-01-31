# 💀 Premortem: Imaging Failure

> **Objective:** Identify failure modes 6 months from now and build countermeasures today.

## 1. Failure Scenario: "The Broken Archive"

**Date:** July 2026
**Symptoms:** The `.agent/` directory is 100MB+ of fragmented markdown. Search tools time out. Cross-references are 40% broken.
**Cause:** Unchecked growth and lack of "Entropy Cleanup" protocols.
**Countermeasure:**

- Implement `npm run clean` to aggressive prune stale tasks.
- Enforce strict "Track Finalization" where task files are merged and deleted, not just moved.

## 2. Failure Scenario: "The Local-First Wall"

**Date:** April 2026
**Symptoms:** Users with 10,000+ lore entries experience UI lag. Dexie.js queries take seconds.
**Cause:** State reactivity overload.
**Countermeasure:**

- Architect "Virtual Scholar" views to only load active context.
- Implement background "Resonance Workers" for heavy data processing.

## 3. Failure Scenario: "Vibe Rot"

**Date:** March 2026
**Symptoms:** The agent starts sounding like a corporate Jira bot. The "Antigravity" spirit is replaced by generic AI politeness.
**Cause:** Over-correction on hygiene or lack of "Aesthetic Refresh" turns.
**Countermeasure:**

- Periodic "Vibe Checks" against `aesthetic.md`.
- Protect the "Signature Tone" in [05-hygiene](../../rules/05-hygiene.md).

## 4. Failure Scenario: "The Security Breach"

**Date:** February 2026
**Symptoms:** A user accidentally commits an API key that was stored in a "Track Plan".
**Cause:** Warden check only ran on `src/`, not `.agent/`.
**Countermeasure:**

- Expand `warden` to audit `.agent/tasks/` for secrets before every commit.
