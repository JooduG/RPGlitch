---
name: developer-database
description: Triggers on all .sql and .ts files in supabase/ or migrations/, or where otherwise relevant. Governs database architecture, SQL migrations, and Supabase realtime logic.
---

# Developer Database: Architecture & Realtime Skill

## When to use this skill

- Writing or applying SQL migrations in `migrations/` or `supabase/`.
- Implementing multiplayer features or realtime event broadcasts.
- Configuring Row Level Security (RLS) policies.
- Developing Supabase Edge Functions.

## Workflow

1.  **Schema Design**: Define snake_case tables and granular RLS policies.
2.  **Migration Generation**: Use `supabase db diff` to capture changes in YYYYMMDDHHmmss_action_entity.sql format.
3.  **Realtime Integration**: Implement broadcasts using the `scope:entity:id` pattern.
4.  **Edge Logic**: Deploy fire-and-forget tasks or complex auth logic via Edge Functions.

## Instructions

### 1. Database Standards
- **RLS**: Every table must have RLS enabled. Avoid `FOR ALL`; be granular (SELECT, INSERT, etc.).
- **Indexing**: Columns used in RLS `USING` clauses MUST be indexed.
- **IDs**: Use `identity generated always as identity` unless UUIDs are required.

### 2. Realtime Protocols
- **Mechanism**: Use `broadcast` for high-frequency events (moves, dice); `presence` for online status.
- **Cleanup**: Always call `removeChannel` in `onDestroy` or component teardown.
- **Svelte Integration**: Use `$effect` and `onMount` for subscription lifecycle management.

### 3. Edge Functions (Deno)
- **Runtime**: Use Deno (not Node). Use `npm:` or `jsr:` prefixes for imports.
- **Secrets**: Access via `Deno.env.get()`.

## Resources

### Realtime Decision Matrix

| Event | Function | Rationale |
| :--- | :--- | :--- |
| **Token Move** | `broadcast` | High frequency, ephemeral. |
| **Dice Roll** | `broadcast` | Immediate feedback; async persist. |
| **Chat** | `broadcast` | Socket speed; background DB save. |
| **Join/Leave** | `presence` | Efficient state diffing. |
