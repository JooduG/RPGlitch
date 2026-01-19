---
trigger: glob
globs: supabase/**/*.sql, supabase/**/*.toml, migrations/**/*.sql, src/scholar/database/**/*.js, tools/ops/**/*.js,
---

# Database Architecture & Security

## 1. Migration Standards

- **Naming:** `YYYYMMDDHHmmss_action_entity.sql` (e.g., `20260120100000_create_avatars.sql`).
- **Workflow:**
  1. Modify Schema SQL in `supabase/schemas/`.
  2. Run `supabase db diff -f name_of_change`.
  3. Review the generated migration file.
- **Safety:** Never use `postgres_changes` triggers for new features; use Edge Functions or Broadcasts.

## 2. Row Level Security (RLS)

**Rule:** Every table must have RLS enabled. No exceptions.

### Policy Pattern (Separate by Action)

Do not use `FOR ALL`. Be granular.

```sql
-- ✅ CORRECT
CREATE POLICY "Users can view their own avatars"
ON public.avatars FOR SELECT
TO authenticated
USING ( owner_id = auth.uid() );

CREATE POLICY "Users can update their own avatars"
ON public.avatars FOR UPDATE
TO authenticated
USING ( owner_id = auth.uid() )
WITH CHECK ( owner_id = auth.uid() );
```

### Performance

- **Indexing:** If a column is in an RLS `USING` clause, it MUST be indexed.
- **Join-less Policies:** Avoid joins in RLS. Store denormalized "claims" in `auth.jwt()` or user metadata if possible.
- **Definer Functions:** If a complex check is needed, wrap it in a `SECURITY DEFINER` function to cache the plan.

## 3. SQL Style Guide

- **Case:** Snake_case for everything (`user_id`, `campaign_settings`).
- **IDs:** Always use `identity generated always as identity` for primary keys unless using UUIDs.
- **Foreign Keys:** Explicitly name them. `user_id` references `users(id)`.
