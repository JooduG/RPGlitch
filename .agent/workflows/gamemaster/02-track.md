---
description: Scaffolds a new work track (feature/bug) with Spec and Plan.
---

# 🛤️ 02: Track Protocol

> **Goal:** Scope and blueprint a new feature or fix with zero ambiguity.

## 1. Discovery

1. **Intelligence Check**:
    - Read [product.md](../../product.md) and [03-tech-stack.md](../../rules/03-tech-stack.md).
    - Scan [tracks.md](../../tasks/tracks.md) for related history.
    - **Resource Extraction**: Consult [roadmap.md](../../roadmap.md) and [.agent/knowledge/incubator/](../knowledge/incubator/) to "steal" existing design specs or conceptual foundations for implementation planning.

## 2. Interactive Scoping (The Baton Loop)

1. **Define**: Identify if `Feature` or `Bug`. Create a `kebab-case-slug`.
2. **Spec**: Draft `spec.md` (The "What").
    - **Verify**: Does this align with the [Philosophy](../../knowledge/vision/philosophy.md)?
3. **Plan**: Draft `plan.md` (The "How").
    - **Constraint**: Must use Atomic items.
    - **Integration**: Must include a "Quality Gate" step per component.

## 3. Materialization

1. **Create**: `.agent/tasks/<slug>/`.
2. **Registry**:
    - Append to [tracks.md](../../tasks/tracks.md):
    - `## [ ] Track: <Short Title>`
    - `- Path: .agent/tasks/<slug>/`
    - `- Status: Scoped`

## 4. Handoff

- **Prompt**: "Track `<slug>` initialized. Ready to `/implement`?"
