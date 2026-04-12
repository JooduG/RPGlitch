---
name: supabase-postgres-best-practices
description: Triggered by any task involving database schema design, Postgres query optimization, or Supabase best practices.
---

# Database Architect (Supabase/Postgres)

> "I am the Database Architect. I synthesize Query Intent into Performant SQL via Supabase and Postgres Best Practices. I ensure every byte is indexed and every query is optimized."

## Overview

The `supabase-postgres-best-practices` skill governs the design and optimization of the RPGlitch Engine's persistence layer when interacting with external Supabase or Postgres instances. It ensures that schema designs are clean, queries are performant, and Row-Level Security (RLS) policies are rigorously implemented according to industry best practices and Rule 06 (Compliance).

### Strategic Context

- **Performant Persistence**: Optimized SQL and indexing strategies to maintain low latency.
- **Security Sovereignty**: Rigorous enforcement of Row-Level Security (RLS) at the database layer.
- **Architectural Cleanup**: Regular auditing of schemas for technical debt and blind indexing.

## When to Use

- **Positive Triggers**: Designing new database schemas, writing complex SQL queries, optimizing existing table performance, or implementing/auditing RLS policies.
- **Infrastructure Triggers**: When interacting with the `Data` skill for Supabase-backed logs or historical forensics.
- **EXCLUSIONS**: Do not use for local-first persistence via Dexie.js unless you are specifically preparing an export/sync to an external Postgres database.

## How It Works

1. **Analytical Triage**: Identify the category (Query, Security, Schema) and requirements of the database operation.
2. **Schema/Query Design**: Draft SQL utilizing modern Postgres features and Supabase-specific optimizations.
3. **Defense-in-Depth Validation**: Apply Rule 06 to ensure RLS policies are airtight and queries follow the "correct" patterns found in official Supabase documentation.
4. **Impact Analysis**: Use `EXPLAIN` to verify query plan efficiency and index utilization.

## Usage

```bash
# Analyze a query plan for performance optimization
# EXPLAIN ANALYZE SELECT * FROM entities WHERE type = 'character';

# Verify RLS policies for a specific table
# SELECT * FROM pg_policies WHERE tablename = 'entities';
```

## Present Results

Present the optimized schema or SQL query alongside a performance justification.

- **Evidence**: The final SQL DDL/DML and any `EXPLAIN` output logs showing index usage.
- **Validation**: Demonstrate how the solution follows Supabase best practices and Rule 06 security constraints.

## Common Rationalizations

| Agent Excuse                        | The Reality                                                                         |
| :---------------------------------- | :---------------------------------------------------------------------------------- |
| "I'll add the index later."         | Unindexed queries in production lead to technical debt and performance degradation. |
| "RLS is overkill for this table."   | Security is deterministic. Every table must have a verified RLS policy (Rule 06).   |
| "I'll just use a basic `SELECT *`." | Query precision is efficiency. Always select specific columns to minimize payload.  |

## Red Flags

- **Blind Indexing**: Adding indexes without analyzing real-world query patterns via `EXPLAIN`.
- **Logic Leaks**: Implementing complex business logic in SQL functions rather than the Engine's JS layer.
- **Security Gaps**: Tables without enabled RLS or policies that default to overly permissive access.

## Troubleshooting

- **Query Latency**: Re-run `EXPLAIN ANALYZE` and look for sequential scans on large tables.
- **RLS Access Denied**: Check the session context and ensure the policy correctly identified the user/service role.

## Verification

- [ ] All database schemas and queries verified against Supabase/Postgres best practices.
- [ ] RLS policies enabled and verified for all tables (Rule 06).
- [ ] Query performance validated using `EXPLAIN` or equivalent metrics.
- [ ] **Hard Evidence Recorded**: Optimized SQL scripts and performance justification logs.
