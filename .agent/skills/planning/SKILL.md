---
name: planning
description: Breaks work into ordered tasks and delivers them incrementally. Use when you have a spec and need to break work into verifiable implementation slices.
---

# Planning & Incremental Delivery

> "Decompose work into small, verifiable tasks and build in thin vertical slices. Each increment leaves the system in a working, testable state."

## Overview

The `planning` skill is the engine of implementation. it combines task breakdown with the discipline of incremental delivery. It ensures that complex features are sliced into manageable units (S/M sizing) and delivered one verifiable piece at a time to maintain engine integrity.

### Strategic Context

- **Dependency Mapping**: Build foundation layers (Schema, Store) before dependent layers (Logic, UI).
- **Vertical Slicing**: Build a complete path (DB → API → UI) for a single sub-feature before moving to the next.
- **Risk-First**: Tackle the most uncertain or complex parts in the first increment.

## How It Works

### 1. Task Breakdown

Decompose specifications into discrete units of work in `tasks/plan.md`.

- **Small (S)**: 1-2 files.
- **Medium (M)**: 3-5 files.
- **Large (L)**: Too large. Subdivide.

### 2. Incremental Execution

- **Slice Definition**: Identify the smallest "unit of value."
- **Slam & Verify**: Implement → Run tests → Verify build.
- **Save-Point**: Commit successful increments using Conventional Commits.

## Usage

```bash
# Verify the current increment before moving to the next
npm run verify
```

## Verification Checklist

- [ ] Every task has specific, testable acceptance criteria.
- [ ] Tasks are ordered bottom-up by technical dependency.
- [ ] No single increment touches more than ~5 files.
- [ ] Each increment was independently verified (tests pass, build clean).
