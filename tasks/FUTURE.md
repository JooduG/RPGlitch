# 🔍 TRACK: Resolve StoryCard Cutoff in UnifiedConsole Control Panel

## Goal

Fix the issue where StoryCards inside the Library accordion are vertically cut off on first render when opening the UnifiedConsole control panel. We will achieve this by replacing the JS-dependent Bits UI Accordion with a pure CSS grid-based reactive accordion.

## Steps

- [/] Initialize task and analyze `UnifiedConsole.svelte`
- [ ] Implement reactive Svelte state for open sections
- [ ] Replace Bits UI Accordion with pure CSS Grid accordion in `UnifiedConsole.svelte`
- [ ] Verify transition works correctly and height updates dynamically
- [ ] Run automated tests and local verification
