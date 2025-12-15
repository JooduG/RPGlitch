#!/usr/bin/env node
/**
 * MCP stdio server smoke + handshake tester
 * - Reads build/config/mcp.master.json
 * - Loads env vars from .env (export KEY="value" format)
 * - Starts stdio servers, performs JSON-RPC initialize, tools/list
 * - Logs per-server stdout/stderr and JSON responses under tests/mcp/logs
 * - URL servers are skipped
 */

const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "build", "config", "mcp.master.json");
const ENV_PATH = path.join(ROOT, ".env");
const LOG_ROOT = path.join(ROOT, "memory-bank", "past", "mcp-tests");
const SESSION_DIR = (() => {
  const ts = new Date().toISOString().replace(/[:]/g, "").slice(0, 19);
  return path.join(LOG_ROOT, ts);
})();

function loadEnvExports(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(
      /^\s*export\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.*?)"?\s*$/,
    );
    if (m) env[m[1]] = m[2];
  }
  return env;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function hasInPath(cmd) {
  const bin = process.platform === "win32" ? `${cmd}.cmd` : cmd;
  const res = spawnSync(
    process.platform === "win32" ? "where" : "which",
    [bin],
    { encoding: "utf8" },
  );
  return res.status === 0;
}

class StdioJsonRpc {
  constructor(proc) {
    this.proc = proc;
    this.buf = Buffer.alloc(0);
    this.queue = [];
    this.proc.stdout.on("data", (d) => this._onData(d));
  }
  _onData(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    while (true) {
      const headerEnd = this.buf.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;
      const header = this.buf.slice(0, headerEnd).toString("utf8");
      const m = header.match(/Content-Length:\s*(\d+)/i);
      if (!m) {
        this.buf = this.buf.slice(headerEnd + 4);
        continue;
      }
      const len = parseInt(m[1], 10);
      const total = headerEnd + 4 + len;
      if (this.buf.length < total) break;
      const body = this.buf.slice(headerEnd + 4, total).toString("utf8");
      this.buf = this.buf.slice(total);
      try {
        const msg = JSON.parse(body);
        this.queue.push(msg);
      } catch (e) {
        void e; /* ignore malformed JSON messages */
      }
    }
  }
  send(msg) {
    const data = Buffer.from(JSON.stringify(msg), "utf8");
    const header = Buffer.from(
      `Content-Length: ${data.length}\r\nContent-Type: application/json\r\n\r\n`,
      "utf8",
    );
    this.proc.stdin.write(header);
    this.proc.stdin.write(data);
  }
  async waitFor(predicate, timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const idx = this.queue.findIndex(predicate);
      if (idx !== -1) return this.queue.splice(idx, 1)[0];
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  }
}

function parseArgs(argv) {
  const args = { only: null, skip: new Set(), maxMs: 20000 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--only" && argv[i + 1]) {
      args.only = new Set(
        argv[++i]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
    } else if (a === "--skip" && argv[i + 1]) {
      args.skip = new Set(
        argv[++i]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
    } else if (a === "--maxMs" && argv[i + 1]) {
      args.maxMs = Math.max(5000, parseInt(argv[++i], 10) || 20000);
    }
  }
  return args;
}

async function testServer(name, srv, allEnv, opts) {
  const isUrl = !!srv.url && !srv.command;
  if (isUrl)
    return { name, type: "url", status: "skipped", reason: "URL server" };

  // Skip uvx-based servers when uvx is not available locally
  if (srv.command === "uvx" && !hasInPath("uvx")) {
    return { name, type: "stdio", status: "skipped", reason: "uvx missing" };
  }

  const cmd = srv.command;
  const args = Array.isArray(srv.args) ? srv.args.slice() : [];
  // Windows resolution for common shims
  let command = cmd;
  if (process.platform === "win32") {
    if (cmd === "npx") command = "npx.cmd";
    if (cmd === "uvx") command = "uvx.cmd";
    if (cmd === "npm") command = "npm.cmd";
  }
  const env = { ...process.env };
  if (srv.env && typeof srv.env === "object") {
    for (const [k, v] of Object.entries(srv.env)) {
      const replaced = String(v).replace(
        /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
        (_, key) => allEnv[key] ?? "",
      );
      env[k] = replaced;
    }
  }

  const logBase = path.join(SESSION_DIR, name.replace(/[^A-Za-z0-9_-]/g, "_"));
  const stdoutPath = `${logBase}.stdout.log`;
  const stderrPath = `${logBase}.stderr.log`;
  const metaPath = `${logBase}.json`;
  let stdoutBuf = Buffer.alloc(0);
  let stderrBuf = Buffer.alloc(0);
  let exitInfo = { code: null, signal: null };
  let started = false;
  let toolsCount = null;
  let initializeOk = false;
  let toolsListOk = false;
  let toolCallOk = false;

  let proc;
  let timedOut = false;
  try {
    // On Windows, spawning .cmd shims like npx.cmd often requires a shell
    const useShell = process.platform === "win32";
    proc = spawn(command, args, {
      env,
      stdio: ["pipe", "pipe", "pipe"],
      shell: useShell,
    });
  } catch (e) {
    return { name, type: "stdio", status: "spawn-failed", error: e.message };
  }
  proc.on("error", (e) => {
    stderrBuf = Buffer.concat([
      stderrBuf,
      Buffer.from(String(e?.message || e)),
    ]);
  });
  proc.stdout.on("data", (d) => {
    stdoutBuf = Buffer.concat([stdoutBuf, d]);
  });
  proc.stderr.on("data", (d) => {
    stderrBuf = Buffer.concat([stderrBuf, d]);
  });
  proc.on("exit", (code, signal) => {
    exitInfo = { code, signal };
  });

  // Hard timeout watchdog
  const watchdog = setTimeout(() => {
    timedOut = true;
    try {
      proc.kill("SIGTERM");
    } catch (e) {
      void e;
    }
  }, opts.maxMs || 20000);

  const rpc = new StdioJsonRpc(proc);
  // give the server a brief moment to boot
  await new Promise((resolve) => setTimeout(resolve, 250));
  // initialize (MCP JSON-RPC)
  rpc.send({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      clientInfo: { name: "rpglitch-mcp-tester", version: "1.0.0" },
      capabilities: { experimental: {} },
    },
  });

  const initResp = await rpc.waitFor(
    (m) => m.id === 1 && (m.result || m.error),
    8000,
  );
  // Retry initialize once if no response
  if (!initResp) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    rpc.send({
      jsonrpc: "2.0",
      id: 101,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        clientInfo: { name: "rpglitch-mcp-tester", version: "1.0.0" },
        capabilities: { experimental: {} },
      },
    });
  }
  const init =
    initResp ||
    (await rpc.waitFor((m) => m.id === 101 && (m.result || m.error), 6000));
  initializeOk = !!(init && init.result);
  started = stdoutBuf.length > 0 || stderrBuf.length > 0 || initializeOk;

  // tools/list
  rpc.send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  let toolsResp = await rpc.waitFor(
    (m) => m.id === 2 && (m.result || m.error),
    6000,
  );
  if (!toolsResp) {
    rpc.send({ jsonrpc: "2.0", id: 13, method: "tools.list" });
    toolsResp = await rpc.waitFor(
      (m) => m.id === 13 && (m.result || m.error),
      6000,
    );
  }
  if (toolsResp && toolsResp.result && Array.isArray(toolsResp.result.tools)) {
    toolsListOk = true;
    toolsCount = toolsResp.result.tools.length;
    // Try a safe sample tool call when available
    const names = toolsResp.result.tools.map((t) => t.name);
    if (names.includes("list_dir")) {
      rpc.send({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "list_dir", arguments: { path: "." } },
      });
      const callResp = await rpc.waitFor(
        (m) => m.id === 3 && (m.result || m.error),
        6000,
      );
      toolCallOk = !!(callResp && callResp.result);
    }
  }

  // wrap up
  setTimeout(() => {
    try {
      proc.kill("SIGTERM");
    } catch (e) {
      void e;
    }
  }, 500);
  await new Promise((resolve) => setTimeout(resolve, 700));
  clearTimeout(watchdog);

  fs.mkdirSync(path.dirname(stdoutPath), { recursive: true });
  fs.writeFileSync(stdoutPath, stdoutBuf);
  fs.writeFileSync(stderrPath, stderrBuf);
  const meta = {
    name,
    cmd,
    args,
    initializeOk,
    toolsListOk,
    toolsCount,
    toolCallOk,
    exitInfo,
    stdoutBytes: stdoutBuf.length,
    stderrBytes: stderrBuf.length,
  };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  const status = timedOut
    ? "timeout"
    : initializeOk
      ? "ok"
      : started
        ? "started"
        : "no-output";
  return {
    name,
    type: "stdio",
    status,
    toolsListOk,
    toolsCount,
    toolCallOk,
    stdout: stdoutPath,
    stderr: stderrPath,
    meta: metaPath,
  };
}

async function run() {
  ensureDir(LOG_ROOT);
  ensureDir(SESSION_DIR);
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  // Support both schemas: { mcpServers: {...} } and { servers: {...} }
  const serverMap = config.servers || config.mcpServers || {};
  const allEnv = { ...loadEnvExports(ENV_PATH), ...process.env };
  let entries = Object.entries(serverMap);
  const cli = parseArgs(process.argv);
  if (cli.only) entries = entries.filter(([n]) => cli.only.has(n));
  if (cli.skip && cli.skip.size)
    entries = entries.filter(([n]) => !cli.skip.has(n));
  const results = [];

  for (const [name, srv] of entries) {
    console.log(`→ Testing ${name} ...`);
    const res = await testServer(name, srv, allEnv, { maxMs: cli.maxMs });
    results.push(res);
  }

  const summaryPath = path.join(SESSION_DIR, "summary.json");
  fs.writeFileSync(
    summaryPath,
    JSON.stringify({ when: new Date().toISOString(), results }, null, 2),
  );

  console.log("MCP Test Summary");
  console.log("=".repeat(72));
  for (const r of results) {
    const parts = [
      r.name.padEnd(28),
      String(r.type).padEnd(6),
      r.status.padEnd(10),
    ];
    if (r.toolsListOk) parts.push(`tools:${r.toolsCount}`);
    if (r.toolCallOk) parts.push(`call:ok`);
    console.log(parts.join("  "));
  }
  console.log(`\nLogs: ${SESSION_DIR}`);
}

run().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(1);
});
