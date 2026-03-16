# 📝 Scribbles

## Step 1: The Memory Migration (Establishing `.agent/state/`)

*Action: Create the new central memory hub and purge root-level clutter.*

* **Create:** `.agent/state/` directory.
* **Frag:** Delete `STATE.md` from the repository root.
* **Migrate:** Move `.agent/tasks/tracks.md` to `.agent/state/tracks.md`.
* **Migrate:** Move `.agent/tasks/backlog.md` to `.agent/state/backlog.md`.
* **Migrate:** Move `.stitch/next-stitch-prompt.md` to `.agent/state/next-prompt.md`.
* **Create:** Initialize `.agent/state/global.md` as the new master tracking baton.

## Step 2: The Design Resolution

*Action: Eliminate the `DESIGN.md` fragmentation.*

* **Audit:** Read `.stitch/DESIGN.md` and `.agent/skills/styling/docs/DESIGN.md`.
* **Extract:** Move all immutable styling constants (The Chalk Regime) into `.agent/rules/03-technetium.md`.
* **Merge:** Combine the remaining active UI tracking info into the new `.agent/state/design.md`.
* **Frag:** Delete the old `.stitch/` folder and `styling/docs/DESIGN.md` file.

## Step 3: Internal Rewiring

*Action: Fix broken references caused by the migrations.*

* **Refactor `project` Skill:** Update `.agent/skills/project/SKILL.md`, `sync.js`, and its templates to point to `.agent/state/` instead of `.agent/tasks/`.
* **Promote `vibe-intake`:** Move `10-vibe-intake.md` from workflows to `.agent/skills/vibe-intake/SKILL.md`.
* **Demote `stitch-loop`:** Move `.agent/skills/stitch-loop/` into `.agent/workflows/08-stitch-loop.md`.
* **Absorb `scribe`:** Merge `.agent/skills/scribe/` documentation protocols into `.agent/workflows/06-continue.md`.

## Step 4: The Lobotomy (Dumb Triggers)

*Action: Strip hardcoded intelligence from external tools.*

* **Conductor CLI:** Rewrite all `.toml` files in `conductor/commands/conductor/` to be simple read-pointers mapping strictly to their respective `.agent/workflows/*.md` files.
* **Stitch CLI:** Rewrite `Stitch/commands/stitch.toml` to mandate adherence to `.agent/rules/03-technetium.md`.
* **GitHub Actions:** Strip prompt text from `.github/workflows/*.yml` and update them to trigger `gemini conductor review`.

## Step 5: The Stitch Subjugation

*Action: Integrate UI/UX generation with Graceful Degradation.*

* **Inject Logic:** Add the "UI/UX Offload Check" (Ask user Y/N before using Stitch) into `.agent/workflows/01-plan.md` and `02-execute.md`.
* **Vendor Skills:** Copy selected UI/UX skills from the `stitch-skills` repo into `.agent/skills/stitch/` and manually format them for Svelte 5.
* **Wire MCP:** Add `stitch.googleapis.com` to `.agent/mcp_config.json`.
