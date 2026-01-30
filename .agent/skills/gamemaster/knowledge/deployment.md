# Deploy: Monolith Pipeline Skill

## When to use this skill

- Generating the final `index.html` artifact for Perchance.
- Syncing configuration before a build.
- Verifying the integrity of build outputs.

## Workflow

1.  **Pre-Flight**: Run `npm run sync` and `npm run validate`.
2.  **Build**: Execute `npm run build` to invoke Vite for asset inlining.
3.  **Audit**: Confirm `dist/index.html` exists and contains no external `<script src="...">` tags.
4.  **Handoff**: Provide the user with copy-paste instructions for the Perchance panels.

## Instructions

- **Single File**: Ensure all CSS and JS are fully inlined. No external dependencies are allowed in production.
- **Validation**: Never proceed with a build if integrity checks fail.
- **Cleanliness**: Ensure the `dist/` directory is purged of old artifacts before building.

## Resources

- **Main Output**: [`dist/index.html`](../../../../dist/index.html)
- **Lists Panel Content**: [RPGlitch-left-panel.txt](../../../../src/RPGlitch-left-panel.txt)
