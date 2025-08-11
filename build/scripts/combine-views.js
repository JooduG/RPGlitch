/* build/scripts/combine-views.js
 * Combine key repo areas into Markdown overviews for fast human/AI review.
 * Outputs → build/output/*.md
 *
 * Env knobs:
 *   COMBINE_MAX_BYTES         (default: 250000)
 *   COMBINE_RECENT_SINCE_DAYS (default: 7)
 *   COMBINE_RECENT_LIMIT      (default: 100)
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

// -------- config --------
const REPO_ROOT  = path.join(__dirname, '..', '..');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

const MAX_BYTES  = Number(process.env.COMBINE_MAX_BYTES || 250_000);
const RECENT_SINCE_DAYS = Number(process.env.COMBINE_RECENT_SINCE_DAYS || 7);
const RECENT_LIMIT      = Number(process.env.COMBINE_RECENT_LIMIT || 100);

const TEXT_EXTS = new Set([
  '.md', '.mdx', '.mdc',
  '.js', '.mjs', '.cjs', '.ts',
  '.json', '.yml', '.yaml',
  '.html', '.css', '.scss',
  '.sh'
]);

const picomatch = require('picomatch');
const IGNORE_FILE = process.env.COMBINE_IGNORE_FILE || path.join(REPO_ROOT, 'config', 'ignore.master');

function loadIgnorePatterns(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('#'));
  } catch {
    return [];
  }
}
const MASTER_IGNORE = loadIgnorePatterns(IGNORE_FILE);

// Build matchers (POSIX style paths)
const _toPosix = p => p.split(path.sep).join('/');
const MATCHERS = MASTER_IGNORE
  .filter(p => !p.startsWith('!')) // negations don’t apply to the combiner
  .map(p => picomatch(p));
function isIgnored(relPath) {
  const posix = _toPosix(relPath);
  return MATCHERS.some(fn => fn(posix));
}

// Targets to build
const TARGETS = [
  {
    name: 'rules',
    title: 'Combined Rules',
    sources: ['.cursor/rules', 'docs/rules'],
    excludeDirs: new Set(['node_modules']),
    output: 'combined-rules.md'
  },
  {
    name: 'memory',
    title: 'Combined Memory Bank (excluding archive/)',
    sources: ['memory-bank'],
    excludeDirs: new Set(['archive', 'node_modules']),
    output: 'combined-memory.md'
  },
  {
    name: 'tests',
    title: 'Combined Tests (test-basic-memory/tests)',
    sources: ['test-basic-memory/tests'],
    excludeDirs: new Set(['node_modules']),
    output: 'combined-tests.md'
  },
  {
    name: 'tools',
    title: 'Combined Tools (test-basic-memory/tools + diagnostics + browser-tools)',
    sources: [
      'test-basic-memory/tools',
      'test-basic-memory/diagnostics',
      'test-basic-memory/browser-tools'
    ],
    excludeDirs: new Set(['node_modules']),
    output: 'combined-tools.md'
  },
  {
    name: 'repo',
    title: 'Repo Overview (apps/, build/scripts, docs/, memory (no archive), tests)',
    sources: [
      'apps',
      'build/scripts',
      'docs',
      'memory-bank/active',
      'memory-bank/project',
      'memory-bank/strategic',
      'test-basic-memory/tests'
    ],
    excludeDirs: new Set(['node_modules', 'build/output', '.git', '.cursor']),
    output: 'repo-overview.md'
  },
  {
    name: 'recent',
    title: `Recent Changes (last ${RECENT_SINCE_DAYS} days, up to ${RECENT_LIMIT} files)`,
    sources: [
      // keep it focused on places you care about
      'apps',
      'build/scripts',
      'docs',
      'memory-bank',
      'test-basic-memory/tests',
      '.cursor/rules'
    ],
    excludeDirs: new Set(['node_modules', 'build/output', '.git']),
    output: 'recent-changes.md',
    recent: true
  }
];

// -------- helpers --------
function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function isTextFile(file){
  const ext = path.extname(file).toLowerCase();
  return TEXT_EXTS.has(ext);
}
function walk(dir, excludeDirs, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rel = path.relative(REPO_ROOT, abs);

    if (isIgnored(rel)) continue;

    if (e.isDirectory()) {
      if (excludeDirs.has(e.name)) continue;
      walk(abs, excludeDirs, out);
    } else if (e.isFile()) {
      if (isTextFile(abs)) out.push(rel);
    }
  }
  return out;
}

function stripFrontmatter(s){ return s.replace(/^---[\s\S]*?---\s*/, ''); }
function demoteHeadings(s){ return s.replace(/^(#+)/gm, '#$1'); } // # → ##
function languageFromExt(rel){
  const ext = path.extname(rel).toLowerCase();
  switch (ext){
    case '.js': case '.cjs': case '.mjs': return 'javascript';
    case '.ts':  return 'typescript';
    case '.json':return 'json';
    case '.yml': case '.yaml': return 'yaml';
    case '.html':return 'html';
    case '.css': return 'css';
    case '.scss':return 'scss';
    case '.sh':  return 'bash';
    case '.md': case '.mdx': case '.mdc': return 'markdown';
    default:     return '';
  }
}
function humanKB(n){ return (n/1024).toFixed(1) + ' KB'; }
function safeAnchor(text) {
  let slug = String(text).toLowerCase().trim();
  slug = slug.replace(/[\\/]+/g, ' ');   // slashes -> space
  slug = slug.replace(/\./g, '');        // drop dots
  slug = slug.replace(/[^a-z0-9\s-]/g, ''); // strip punctuation
  slug = slug.replace(/\s+/g, '-');      // spaces -> hyphen
  slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug;
}


function readPreview(abs, max = MAX_BYTES){
  const stat = fs.statSync(abs);
  const truncated = stat.size > max;
  const buf = fs.readFileSync(abs, 'utf8').slice(0, max);
  return { text: buf, size: stat.size, truncated };
}

// --- recent changes helpers ---
function gitAvailable(){
  try { cp.execSync('git --version', { stdio: 'ignore' }); return true; }
  catch { return false; }
}
function gitRecentFiles({ sinceDays, limit, includeDirs }){
  // build an argument list restricting to includeDirs
  const args = [
    '-C', REPO_ROOT,
    'log', `--since=${sinceDays} days ago`,
    '--name-only', '--pretty=format:', '--diff-filter=ACMRT'
  ].concat(includeDirs);
  const cmd = 'git ' + args.map(a => (a.includes(' ') ? `"${a}"` : a)).join(' ');
  let out = '';
  try {
    out = cp.execSync(cmd, { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] });
  } catch {
    return [];
  }
  const lines = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  // unique, filter to existing text files under repo, then limit
  const seen = new Set();
  const files = [];
  for (const rel of lines){
    if (seen.has(rel)) continue;
    const abs = path.join(REPO_ROOT, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile() && isTextFile(abs)){
      seen.add(rel);
      files.push(rel);
      if (files.length >= limit) break;
    }
  }
  return files;
}
function mtimeRecentFiles({ limit, includeDirs, excludeDirs }){
  // fallback: walk and sort by mtime desc
  const all = [];
  for (const src of includeDirs){
    const abs = path.join(REPO_ROOT, src);
    if (!fs.existsSync(abs)) continue;
    const stack = [abs];
    while (stack.length){
      const dir = stack.pop();
      for (const e of fs.readdirSync(dir, { withFileTypes: true })){
        const a = path.join(dir, e.name);
        const r = path.relative(REPO_ROOT, a);
        if (e.isDirectory()){
          if (excludeDirs.has(e.name)) continue;
          stack.push(a);
        } else if (e.isFile() && isTextFile(a)){
          all.push({ rel: r, mtime: fs.statSync(a).mtimeMs });
        }
      }
    }
  }
  all.sort((a,b) => b.mtime - a.mtime);
  return all.slice(0, limit).map(x => x.rel);
}

// --- builders ---
function buildFromList({ title, files }) {
  // Disable noisy rules that come from embedded docs we don't control:
  // - MD032: blanks around lists
  // - MD022: blanks around headings
  // - MD036: emphasis used as heading
  // - MD024: duplicate headings
  let out =
    `<!-- markdownlint-disable MD032 MD022 MD036 MD024 -->\n` +
    `# ${title}\n\n` +
    `> Generated by \`build/scripts/combine-views.js\` — ${files.length} files\n\n` +
    `## Table of Contents\n\n`;

  for (const rel of files) {
    out += `- [${rel}](#${safeAnchor(rel)})\n`;
  }
  out += `\n---\n`;

  for (const rel of files) {
    const abs = path.join(REPO_ROOT, rel);
    const { text, size, truncated } = readPreview(abs);
    const ext = path.extname(rel).toLowerCase();
    const lang = languageFromExt(rel);

    // Section header
    out += `\n\n## ${rel}\n\n`;

    if (ext === '.md' || ext === '.mdx' || ext === '.mdc') {
      const processed = demoteHeadings(stripFrontmatter(text)).trim();
      out += processed + '\n';
    } else {
      out += `\n\`\`\`${lang}\n${text}\n\`\`\`\n`;
    }

    if (truncated) {
      out += `\n> ⚠️ File truncated at ${humanKB(MAX_BYTES)} (full size ${humanKB(size)}). Increase \`COMBINE_MAX_BYTES\` to include more.\n`;
    }
    out += `\n---\n`;
  }

  // Normalize excessive blank lines to keep MD012 happy where possible
  out = out.replace(/\n{3,}/g, '\n\n');

  return out.trim() + '\n';
}

function buildOne(target){
  const start = Date.now();
  let files = [];

  if (target.recent){
    files = gitAvailable()
      ? gitRecentFiles({
          sinceDays: RECENT_SINCE_DAYS,
          limit: RECENT_LIMIT,
          includeDirs: target.sources
        })
      : mtimeRecentFiles({
          limit: RECENT_LIMIT,
          includeDirs: target.sources,
          excludeDirs: target.excludeDirs || new Set()
        });
  } else {
    for (const src of target.sources){
      const abs = path.join(REPO_ROOT, src);
      files.push(...walk(abs, target.excludeDirs || new Set()));
    }
    files = Array.from(new Set(files)).sort();
  }

  const markdown = buildFromList({ title: target.title, files });

  ensureDir(OUTPUT_DIR);
  const outfile = path.join(OUTPUT_DIR, target.output);
  fs.writeFileSync(outfile, markdown, 'utf8');

  const meta = {
    name: target.name,
    title: target.title,
    output: path.basename(outfile),
    path: outfile,
    filesCount: files.length,
    recent: !!target.recent
  };

  console.log(`✔ ${target.name}: ${files.length} files → ${path.relative(REPO_ROOT, outfile)} (${Date.now()-start}ms)`);
  return meta;
}

function writeIndex(built){
  const ts = new Date().toISOString();
  const byName = Object.fromEntries(built.map(b => [b.name, b]));
  const get = (n) => byName[n];

  const lines = [];

  // Title
  lines.push('# Review Hub');
  lines.push(''); // MD022: blank after heading

  // Preamble
  lines.push(`> Generated ${ts} by \`build/scripts/combine-views.js\``);
  lines.push('');

  // Quick links
  lines.push('## Quick links');
  lines.push(''); // MD032: blank before list
  for (const b of built) {
    lines.push(`- **${b.title}** — [${b.output}](./${b.output}) _(files: ${b.filesCount})_`);
  }
  lines.push(''); // MD032: blank after list

  // Divider
  lines.push('---');
  lines.push('');

  // What’s inside
  lines.push('## What’s inside');
  lines.push(''); // MD032: blank before list
  lines.push('- **Combined Rules** → project rules from `.cursor/rules` and `docs/rules`.');
  lines.push('- **Combined Memory Bank** → all of `memory-bank/**` **except** `archive/**`.');
  lines.push('- **Combined Tests** → everything in `test-basic-memory/tests/**`.');
  lines.push('- **Combined Tools** → `test-basic-memory/tools/**`, `diagnostics/**`, `browser-tools/**`.');
  lines.push('- **Repo Overview** → high-level sweep across apps, build scripts, docs, active/project/strategic memory, and tests.');
  if (get('recent')) {
    lines.push(`- **Recent Changes** → files changed in the last **${RECENT_SINCE_DAYS}** days (max **${RECENT_LIMIT}** files).`);
  }
  lines.push(''); // MD032: blank after list

  // Settings
  lines.push('### Current settings');
  lines.push(''); // MD032: blank before list
  lines.push(`- \`COMBINE_MAX_BYTES\` = **${MAX_BYTES}** (inline preview cap per file)`);
  if (get('recent')) {
    lines.push(`- \`COMBINE_RECENT_SINCE_DAYS\` = **${RECENT_SINCE_DAYS}**, \`COMBINE_RECENT_LIMIT\` = **${RECENT_LIMIT}**`);
  }
  lines.push(''); // MD032: blank after list

  // Run commands
  lines.push('### Run these');
  lines.push(''); // MD031: blank before fenced code block
  lines.push('```bash');
  lines.push('npm run combine:all     # build everything in one go');
  lines.push('npm run combine:recent  # only the recent changes hub');
  lines.push('npm run combine:repo    # just the repo overview');
  lines.push('```');
  lines.push(''); // MD031: blank after fence

  fs.writeFileSync(path.join(OUTPUT_DIR, 'INDEX.md'), lines.join('\n'), 'utf8');
}

// -------- main --------
(function main(){
  const only = process.argv.slice(2); // allow: node combine-views.js rules recent ...
  const selected = only.length ? TARGETS.filter(t => only.includes(t.name)) : TARGETS;
  if (!selected.length){
    console.error(`No targets matched. Use one of: ${TARGETS.map(t => t.name).join(', ')}`);
    process.exit(1);
  }
  const built = selected.map(buildOne);
  writeIndex(built);
})();
