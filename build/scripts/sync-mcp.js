#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// --- PATHS ---
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const masterMcpPath = path.join(
    REPO_ROOT,
    "build",
    "config",
    "mcp.master.json"
);
const envPath = path.join(REPO_ROOT, ".env");
const TARGET_PATHS = [
    path.join(REPO_ROOT, ".vscode", "mcp.json"),
    path.join(REPO_ROOT, ".cursor", "mcp.json"),
    path.join(REPO_ROOT, ".windsurf", "mcp.json"),
];
const ROOT_MCP_TARGET = path.join(REPO_ROOT, "mcp.json");

// --- UTILITIES ---
function readJson(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(
            `⚠️  Master file not found: ${path.relative(REPO_ROOT, filePath)}.`
        );
        return null;
    }
    try {
        let content = fs.readFileSync(filePath, "utf8");
        if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
        return JSON.parse(content);
    } catch (_err) {
        console.warn(
            `❌  Could not parse JSON from ${path.relative(
                REPO_ROOT,
                filePath
            )}. Check for syntax errors.`
        );
        return null;
    }
}

function writeJson(filePath, data) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`📝 Wrote ${path.relative(REPO_ROOT, filePath)}`);
}

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return {};
    return dotenv.parse(fs.readFileSync(filePath));
}

function substituteEnvVariables(obj, envMap) {
    const replacer = (val) =>
        String(val).replace(
            /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
            (_, key) => envMap[key] ?? `\${key}`
        );
    const walk = (val) => {
        if (Array.isArray(val)) return val.map(walk);
        if (val && typeof val === "object") {
            const out = {};
            for (const [k, v] of Object.entries(val)) out[k] = walk(v);
            return out;
        }
        return typeof val === "string" ? replacer(val) : val;
    };
    return walk(obj);
}

// --- MAIN LOGIC ---
function syncMcp() {
    console.log("\n🔄 Syncing MCP configurations...");
    const masterMcp = readJson(masterMcpPath);
    if (!masterMcp || !masterMcp.mcpServers) {
        console.warn(
            '⚠️  Master MCP config not found or is missing "mcpServers" property. Skipping MCP sync.'
        );
        return;
    }

    // Flatten the object of categories into a single mcpServers object
    const flattenedServers = {};
    for (const categoryName in masterMcp.mcpServers) {
        const category = masterMcp.mcpServers[categoryName];
        for (const serverName in category) {
            flattenedServers[serverName] = category[serverName];
        }
    }

    const clientMcpTemplate = { ...masterMcp, servers: flattenedServers };

    // Inject secrets
    const envMap = { ...process.env, ...loadEnvFile(envPath) };
    const resolvedClientMcp = substituteEnvVariables(clientMcpTemplate, envMap);

    // Write resolved configs to all tool destinations
    for (const target of TARGET_PATHS) {
        writeJson(target, resolvedClientMcp);
    }

    // Write the original, unresolved master config to the root
    writeJson(ROOT_MCP_TARGET, masterMcp);

    // Update Gemini settings.json (restored functionality)
    try {
        const geminiSettingsPath = path.join(REPO_ROOT, ".gemini", "settings.json");
        const geminiSettings = readJson(geminiSettingsPath) || {};
        geminiSettings.mcpServers = flattenedServers || {};
        writeJson(geminiSettingsPath, geminiSettings);
    } catch (_error) {
        console.warn(
            "⚠️  Could not update Gemini settings.json. It might be missing."
        );
    }

    console.log("✅ MCP sync complete.");
}

syncMcp();