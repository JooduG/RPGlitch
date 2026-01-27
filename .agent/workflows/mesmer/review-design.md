---
description: Comprehensive design guide for web and mobile applications. Contains 50+ styles, 97 color palettes, 57 font pairings, 99 UX guidelines, and 25 chart types across 9 technology stacks. Searchable database with priority-based recommendations.
---

# 🎨 Workflow: Review Design (The Stylist)

When user requests UI/UX work (design, build, create, improve), follow this workflow to ensure premium aesthetics.

## 1. Setup

Verify Python installation:

```bash
python3 --version || python --version
```

## 2. Generate Design System (REQUIRED)

Always start with `--design-system` to get comprehensive recommendations:

```bash
python3 .agent/knowledge/reference/design-lists/scripts/search.py "<product_type> <keywords>" --design-system -p "Project Name" --persist
```

## 3. Implementation Patterns

Get stack-specific guidelines (Default: `html-tailwind`):

```bash
python3 .agent/knowledge/reference/design-lists/scripts/search.py "<keyword>" --stack svelte
```

## 4. Quality Gate (The Review)

Before delivery, verify the implementation against the **[Design Quality Gate](./knowledge/design-quality.md)**. Ensure contrast, responsiveness, and interaction smoothness.

## 5. Persistence

System rules are saved in `.agent/design.md`. Page-specific overrides live in `.agent/knowledge/design/pages/`.
