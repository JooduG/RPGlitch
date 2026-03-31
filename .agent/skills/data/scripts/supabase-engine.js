import "dotenv/config";

/**
 * ❄️ Librarian Cold Storage: Archival Engine (Sovereign Fetch Edition)
 * -------------------------------------------------------------------------
 * Bypasses SDK fetch failures by using raw fetch for all Supabase operations.
 * -------------------------------------------------------------------------
 */

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

/**
 * 📂 Archive a log entry
 */
export async function archiveLog({ session_id, task_slug, content, metadata = {} }) {
  if (!URL || !KEY) {
    throw new Error("❌ Cold Storage Error: Missing SUPABASE_URL or SUPABASE_KEY in .env");
  }

  const endpoint = `${URL}/rest/v1/development_logs`;

  console.error(`📡 Archiving log to Supabase at ${endpoint}...`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      session_id,
      task_slug,
      content,
      metadata,
      created_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase Archive Failed (${response.status}): ${errorText}`);
  }

  return { success: true };
}

/**
 * 🔍 Query cold storage
 */
export async function queryLogs({ task_slug, limit = 10 }) {
  if (!URL || !KEY) {
    throw new Error("❌ Cold Storage Error: Missing SUPABASE_URL or SUPABASE_KEY in .env");
  }

  let endpoint = `${URL}/rest/v1/development_logs?select=*&order=created_at.desc&limit=${limit}`;
  if (task_slug) {
    endpoint += `&task_slug=eq.${task_slug}`;
  }

  console.error(`📡 Querying Supabase logs at ${endpoint}...`);

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase Query Failed (${response.status}): ${errorText}`);
  }

  return await response.json();
}

export const SupabaseEngine = {
  archiveLog,
  queryLogs,
};
