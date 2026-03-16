# Workflow: 05-triage

## Phase 1: Ingestion
1. Parse `AVAILABLE_LABELS`.
2. Parse `ISSUES_TO_TRIAGE` (Bulk) or `ISSUE_BODY` (Single).

## Phase 2: Analysis
1. Map label semantics according to `.agent/rules/09-triage-protocol.md`.
2. Establish internal heuristics for priority based on keywords.

## Phase 3: Extraction
1. **Single Mode**: Output CSV to `SELECTED_LABELS`.
2. **Bulk Mode**: Generate JSON array following the schema in `.agent/rules/09-triage-protocol.md`.
3. **Write**: Use `echo` to write results to `$GITHUB_ENV`.
