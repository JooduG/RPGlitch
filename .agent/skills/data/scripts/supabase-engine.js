import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

/**
 * ❄️ Librarian Cold Storage: Archival Engine
 * -------------------------------------------------------------------------
 * Handles long-term persistence of development logs, decisions, and debt.
 * -------------------------------------------------------------------------
 */

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("❌ Cold Storage Error: Missing SUPABASE_URL or SUPABASE_KEY in .env");
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

/**
 * 📂 Archive a log entry
 */
export async function archiveLog({ session_id, task_slug, content, metadata = {} }) {
  const client = getSupabase();
  const { data, error } = await client
    .from("development_logs")
    .insert([
      {
        session_id,
        task_slug,
        content,
        metadata,
        created_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data;
}

/**
 * 🔍 Query cold storage
 */
export async function queryLogs({ task_slug, limit = 10 }) {
  const client = getSupabase();
  let query = client
    .from("development_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (task_slug) {
    query = query.eq("task_slug", task_slug);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export const SupabaseEngine = {
  archiveLog,
  queryLogs,
};
