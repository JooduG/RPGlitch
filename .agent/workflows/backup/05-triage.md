---
name: 05-triage
description: Issue Triage Protocol. Categorizing and prioritizing work.
---

# 05-triage (Issue Triage)

> **Goal:** Efficiently categorize, prioritize, and assign incoming issues/tasks.

## 1. Triggers

- **User Request**: "Triage this issue."
- **New Issue/Task**: A new item appears in the backlog.
- **Slash Command**: `/05-triage`

## 2. Brain (Context Injection)

- **Rules**: `.agent/rules/01-foundation.md` (Operational Philosophy)
- **Issue Tracker**: GitHub/Core Repo.

## 3. Procedures

### Phase 1: Ingestion

1. Parse `AVAILABLE_LABELS`.
2. Parse `ISSUES_TO_TRIAGE` (Bulk) or `ISSUE_BODY` (Single).

### Phase 2: Analysis

1. Map label semantics according to `.agent/rules/01-foundation.md`.
2. Establish internal heuristics for priority based on keywords.

### Phase 3: Extraction

1. **Single Mode**: Output CSV to `SELECTED_LABELS`.
2. **Bulk Mode**: Generate JSON array.
3. **Write**: Use `echo` to write results to `$GITHUB_ENV`.
