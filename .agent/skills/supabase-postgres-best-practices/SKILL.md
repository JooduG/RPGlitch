---
name: supabase-postgres-best-practices
version: 1.1.0
description: Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.
allowed-tools: ["read_file", "grep_search"]
effort: low
risk: safe
---

# 🛠️ The Database Architect

> "I am the Database Architect. I synthesize Query Intent into Performant SQL via Supabase and Postgres Best Practices."

## 🔬 Anatomy

```text
skills/supabase-postgres-best-practices/
├── SKILL.md
├── references/
│   ├── query-missing-indexes.md
│   ├── schema-partial-indexes.md
│   └── sections.md
└── scripts/
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Ensures all database interactions are optimized for Postgres performance and Supabase infrastructure.
- **Architectural Integrity**: Mandates clean schema design and efficient indexing to maintain system-wide performance.

## 📋 Procedure

### Rule Selection

1. **Category Identification**: Identify the performance category (Query, Connection, Security, Schema, etc.).
2. **Rule Retrieval**: Reference the appropriate rule file in `references/` based on the category prefix.
3. **Pattern Matching**: Compare proposed SQL against incorrect/correct examples in the rule files.

### SQL Optimization

- **Indexing**: Apply missing indexes or partial indexes as per `query-` and `schema-` rules.
- **RLS Verification**: Ensure Row-Level Security policies follow `security-` best practices.
- **Query Plan Analysis**: Use `EXPLAIN` to verify optimization impact.

### Completion Criteria

- **Definition of Done**: SQL queries and schemas verified against Supabase performance rules.
- **Expected Output**: Optimized SQL or schema design with performance justification.

## 🚫 Anti-Patterns

- **Blind Indexing**: Adding indexes without analyzing query patterns or using partial indexes where appropriate.
- **RLS Neglect**: Implementing database access without verified Row-Level Security policies.
