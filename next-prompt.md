# ACTIVE PAYLOAD: Deep System Diagnostics & Wiring Audit

**Directive:** Execute a comprehensive validation of all internal file paths, markdown links, and architectural references across the repository to ensure the Antigravity Engine is structurally sound. Do not write new feature code.

**Execution Steps:**

1. **Workflow Audit:** Read every file in `.agent/workflows/`. Verify that every file path referenced in the text (e.g., `STATE.md`, `.agent/tracks.md`, `.agent/config.yaml`) actually exists in the local file system.
2. **Rules & Knowledge Audit:** Scan `.agent/rules/` and `.agent/knowledge/`. Ensure no legacy Antigravity boilerplate files (e.g., `tasks.md`, `roadmap.md`, `implementation-plan.md`) are still being referenced. Ensure the recent move of `03-physics.md` to the knowledge atlas is correctly mapped.
3. **Perchance / Svelte Import Audit:** Scan the `src/` directory. Check for broken relative import paths in Svelte components. Flag any hallucinated Node.js module imports that violate the Perchance zero-backend constraint.
4. **Autonomous Resolution:** - If you find a broken path to a file that was simply moved, fix the markdown text silently.
    - If you find a reference to a permanently deleted file, erase the reference.
5. **The Handoff:** Trigger the `/06-continue` workflow.
    - Update `STATE.md` Active WIPs with a bulleted list of the exact broken paths or imports you repaired.
    - Overwrite this `next-prompt.md` file with: "Wiring audit complete. System is resonant. Awaiting Director's feature spec."
