---
name: style
description: Triggers on all .scss, .css, and .svelte files or where otherwise relevant. Governs brand identity, visual design standards, and SCSS architecture.
---

# Style: Brand & SCSS Skill

## Brand Identity & Guidelines

**Brand Name:** Mesmer / RPGlitch

This skill enforces core constraints for visual design and technical implementation to ensure consistent brand representation across the platform.

## When to use this skill

- Implementing UI layouts or visual components.
- Applying color, typography, or spacing constants.
- Managing brand voice and tone in interface copy.
- Optimizing for mobile (`< 768px`) or desktop (`> 1024px`).

## Workflow

1.  **Token Discovery**: Check `knowledge/design-tokens.json` for approved constants.
2.  **Architecture Application**: Follow the 7-1 SCSS pattern (Abstracts, Base, Components).
3.  **Voice Calibration**: Review `knowledge/voice-tone.md` for copy guidelines.
4.  **UI/UX Search**: Use `knowledge/reference/design-lists/scripts/search.py` to find specific design patterns or guidelines.
5.  **Verification**: Test touch targets and accessibility.

## Instructions

### 1. SCSS Standards
- **Prefix**: Use `--app-*` for variables.
- **Nesting**: Maximum depth of 3.
- **Class Naming**: Use `kebab-case`. Avoid IDs for styling.
- **Icons**: Use **Inline SVG** only. No external icon fonts.

### 2. Brand Constraints
- **Voice**: Professional, direct, and efficient.
- **Terminology**: Use "Use" instead of "Utilize".

## Resources

### Core Mixins
- **Glassmorphism**: `%material-glass` (Blur 16px, 60% Opacity).
- **Character Portraits**: Use the `Triptych` pattern (3-state sliding viewports).

### Knowledge Base
- [Design Tokens](../../knowledge/design-tokens.json)
- [Voice & Tone](../../knowledge/voice-tone.md)
- [Global Glossary](../../knowledge/glossary.md)
- [Design Lists Scripts](../../knowledge/reference/design-lists/scripts/)
