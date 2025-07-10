# Start Here: Perchance/Glitch Development Onboarding

Welcome!  
This project is built with the Perchance/Glitch design system: a modern, minimal, robust approach to web app development focused on maintainability, clarity, and user experience.

## Projects Using This System

This Perchance/Glitch development system currently supports the following projects:

### RPGlitch

-   [Live App](https://perchance.org/rpglitch)
-   [Source: RPGlitch.html](RPGlitch/RPGlitch.html)
-   A minimal, robust RPG character generator and editor.

### ImageGlitch

-   [Live App](https://perchance.org/imageglitch)
-   [Source: ImageGlitch.html](ImageGlitch/ImageGlitch.html)
-   A minimal, component-based image glitching tool.

_This README, the memory bank, and the rules are designed to support multiple Perchance/Glitch projects. As new projects are added, list them here to keep onboarding and reference up to date._

---

## Non-Negotiable Rules (Always Active)

This project is governed by a set of non-negotiable rules and protocols to ensure consistency, maintainability, and user experience.

**For the full, up-to-date list of rules, see:**

-   [atomic-css-principles.mdc](../.cursor/rules/atomic-css-principles.mdc)
-   [icon-free-design-standard.mdc](../.cursor/rules/icon-free-design-standard.mdc)
-   [All rules in .cursor/rules/](../.cursor/rules/)

**Highlights:**

-   Minimal, grouped controls (no icons, only text labels)
-   Atomic/component CSS: all CSS in one file, no @import, no repeated !important
-   Incremental, reviewable changes only
-   Protocol-driven workflows (see rules for details)

---

## Onboarding & Reference Guide

-   [designSystem.md](memory-bank/designSystem.md): Design tokens, UI patterns, and CSS conventions
-   [tasks.md](memory-bank/tasks.md): Active and in-progress tasks for all projects
-   [progress.md](memory-bank/progress.md): Step-by-step progress, milestones, and learnings

> **The memory bank is the canonical source for all project knowledge, design decisions, and active work. Always consult and update the memory bank files during development to ensure consistency and persistent context across sessions.**

---

## Project File Structure

```text
/
├── Perchance/
│   ├── RPGlitch/           # RPGlitch app source (HTML, JS, CSS)
│   ├── ImageGlitch/        # ImageGlitch app source
│   ├── memory-bank/        # Persistent project knowledge and design system
│   ├── README.md           # This onboarding and reference guide
│   └── ...                 # Other Perchance project files
├── .cursor/rules/          # Modular project rules (always reference here)
└── atomic-css/             # Shared atomic CSS utilities and config
```

---

_For any task, always start by reviewing the current state and explicit instructions in this README and the memory bank.  
This onboarding applies to all Perchance/Glitch projects for consistent, high-quality development._
