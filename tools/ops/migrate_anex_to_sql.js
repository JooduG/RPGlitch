import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(
  __dirname,
  "../../.agent/knowledge/lorebook/knowledge/ANEX_Lorebook.json",
);
const OUTPUT_DIR = path.join(__dirname, "../../migrations");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

function escapeSql(str) {
  if (typeof str !== "string") return "NULL";
  return "'" + str.replace(/'/g, "''") + "'";
}

function escapeArray(arr) {
  if (!Array.isArray(arr)) return "NULL";
  const items = arr.map((item) => '"' + item.replace(/"/g, '\\"') + '"');
  return "'{" + items.join(",") + "}'";
}

try {
  console.log(`Reading from ${INPUT_FILE}...`);
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

  let fileCounter = 1;
  let currentChunkSize = 0;
  let currentSql = "";
  const MAX_CHUNK_SIZE = 8000; // 8KB to be safe for LLM/MCP limits

  function flush() {
    if (currentSql.length === 0) return;
    const fileName = path.join(
      OUTPUT_DIR,
      `chunk_${String(fileCounter).padStart(3, "0")}.sql`,
    );
    fs.writeFileSync(fileName, currentSql);
    console.log(`Written ${fileName} (${currentSql.length} bytes)`);
    fileCounter++;
    currentSql = "";
    currentChunkSize = 0;
  }

  function buffer(statement) {
    if (currentChunkSize + statement.length > MAX_CHUNK_SIZE) {
      flush();
    }
    currentSql += statement + "\n";
    currentChunkSize += statement.length;
  }

  // 1. Process Prompts
  if (data.prompts && Array.isArray(data.prompts)) {
    console.log(`Processing ${data.prompts.length} prompts...`);
    buffer("-- Prompts");
    data.prompts.forEach((p) => {
      const id = p.identifier || "unknown";
      const name = p.name || "Unnamed";
      const content = p.content || "";
      const role = p.role || "system";
      const pos = p.injection_position || 0;
      const depth = p.injection_depth || 0;
      const enabled = p.enabled !== undefined ? p.enabled : true;
      const marker = p.marker || false;
      const sys = p.system_prompt !== undefined ? p.system_prompt : true;

      const stmt = `INSERT INTO prompts (identifier, name, content, role, injection_position, injection_depth, enabled, marker, system_prompt) VALUES (${escapeSql(id)}, ${escapeSql(name)}, ${escapeSql(content)}, ${escapeSql(role)}, ${pos}, ${depth}, ${enabled}, ${marker}, ${sys}) ON CONFLICT (identifier) DO NOTHING;`;
      buffer(stmt);
    });
  }

  // 2. Process Lorebook Entries
  if (data.entries) {
    const entries = Object.values(data.entries);
    console.log(`Processing ${entries.length} lorebook entries...`);
    buffer("\n-- Lorebook Entries");
    entries.forEach((e) => {
      const uid = e.uid;
      const unique_key = `entry_${uid}`;
      const keys = e.key || [];
      const content = e.content || "";
      const comment = e.comment || "";
      const priority = e.order || 100;
      const enabled = !e.disable;
      const tags = [];

      const stmt = `INSERT INTO lorebook_entries (uid, unique_key, keys, content, comment, priority, enabled, tags) VALUES (${uid}, ${escapeSql(unique_key)}, ${escapeArray(keys)}, ${escapeSql(content)}, ${escapeSql(comment)}, ${priority}, ${enabled}, ${escapeArray(tags)});`;
      buffer(stmt);
    });
  }

  flush();
} catch (err) {
  console.error("Error generating migration:", err);
  process.exit(1);
}
