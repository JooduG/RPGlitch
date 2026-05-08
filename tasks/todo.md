# Mission Command (TODO)

- [x] Update legacy references [x]
  - [x] Modify `DESIGN.md`
  - [x] Modify `vitest.config.js`
  - [x] Modify `.agents/skills/swarm/templates/manifest.json`
  - [x] Fix global `mcp_config.json` path error
- [x] Verification [x]
  - [x] Run `npm run deploy:prepare`
  - [x] Final audit (junction removed, singular .agents committed)
  - [x] Verified full system green (271 tests, clean build)
- [x] Merge `storyboard-actions.svelte.js` into `StoryboardPill.svelte`
- [x] Verification
  - [x] Svelte 5 logic check via autofixer
  - [x] Clean delete of legacy actions file
- [x] Mariana Trench Refactor: `StoryboardCard.svelte`
- [ ] Verification
  - [ ] Build & Lint check
  - [ ] Manual UI audit

## 🧠 Skill Log

| Timestamp (ISO 8601)   | Task                | Skill Invoked        | Outcome     |
| ---------------------- | ------------------- | -------------------- | ----------- |
| 2026-05-08T01:44+02:00 | Update legacy paths | `using-agent-skills` | ✅ Resolved |
| 2026-05-08T06:24+02:00 | Storyboard Merge    | `svelte`             | ✅ Resolved |
| 2026-05-08T06:44+02:00 | StoryboardCard SOTA | `designer`           | ✅ Resolved |
