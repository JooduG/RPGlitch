/* build/scripts/combine-views.js
 * Combine key repo areas into Markdown overviews for fast human/AI review.
 * Outputs → build/output/*.md
 *
 * This version:
 *  - **does not** create INDEX.md (delete yours once; it won’t come back)
 *  - keeps a merged hub at build/output/repo-overview.md:
 *      quick links + Mermaid repo tree + curated overview body
 *  - treats docs/rules as OPTIONAL (no warning if missing)
 *  - prepends a generated-file banner to each output
 *
 * Env knobs:
 *   COMBINE_MAX_BYTES          (default: 250000)
 *   COMBINE_RECENT_SINCE_DAYS  (default: 7)
 *   COMBINE_RECENT_LIMIT       (default: 100)
 *   COMBINE_IGNORE_FILE        (default: config/ignore.master)
 *   COMBINE_TREE_DEPTH         (default: 2)
 *   COMBINE_TREE_MAX_NODES     (default: 200)
 *   COMBINE_DEBUG=1            (log files ignored by master ignore)
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const picomatch = require('picomatch');

// -------- config --------
const REPO_ROOT  = path.join(__dirname, '..', '..');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

const MAX_BYTES          = Number(process.env.COMBINE_MAX_BYTES || 250_000);
const RECENT_SINCE_DAYS  = Number(process.env.COMBINE_RECENT_SINCE_DAYS || 7);
const RECENT_LIMIT       = Number(process.env.COMBINE_RECENT_LIMIT || 100);
const TREE_DEPTH         = Number(process.env.COMBINE_TREE_DEPTH || 2);
const TREE_MAX_NODES     = Number(process.env.COMBINE_TREE_MAX_NODES || 200);

const TEXT_EXTS = new Set([
  '.md', '.mdx', '.mdc',
  '.js', '.mjs', '.cjs', '.ts',
  '.json', '.yml', '.yaml',
  '.html', '.css', '.scss',
  '.sh'
]);

// -------- master ignore (single source of truth for this combiner) --------
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
const _toPosix = p => p.split(path.sep).join('/');
const MATCHERS = MASTER_IGNORE
  .filter(p => !p.startsWith('!'))
  .map(p => picomatch(p));
function isIgnored(relPath) {
  const posix = _toPosix(relPath);
  return MATCHERS.some(fn => fn(posix));
}
const DEBUG_IGNORE = process.env.COMBINE_DEBUG === '1';

// -------- targets to build --------
const TARGETS = [
  {
    name: 'rules',
    title: 'Combined Rules',
    // .cursor/rules is primary; docs/rules is OPTIONAL
    sources: ['.cursor/rules', 'docs/rules'],
    excludeDirs: new Set(['node_modules']),
    output: 'combined-rules.md',
    warnOnMissing: false // <— silence missing-source warnings for this target
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
    title: 'Combined Tests (tests/)',
    sources: ['tests'],
    excludeDirs: new Set(['node_modules']),
    output: 'combined-tests.md'
  },
  {
    name: 'tools',
    title: 'Combined Tools (tools/ + build/scripts/)',
    sources: ['tools', 'build/scripts'],
    excludeDirs: new Set(['node_modules', 'build/output']),
    output: 'combined-tools.md'
  },
  {
    name: 'docs',
    title: 'Combined Docs (docs/)',
    sources: ['docs'],
    output: 'combined-docs.md',
    excludeDirs: new Set(['node_modules', '.git', 'build/output'])
  },
  {
    name: 'readmes',
    title: 'All READMEs across repo',
    sources: ['.'],
    output: 'combined-readmes.md',
    excludeDirs: new Set(['node_modules', '.git', 'build/output']),
    filter: (relPath) => /(^|[\\/])README(\.(md|mdx|mdc))?$/i.test(relPath)
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
      'tests'
    ],
    excludeDirs: new Set(['node_modules', 'build/output', '.git', '.cursor']),
    output: 'repo-overview.md'
  },
  {
    name: 'everything',
    title: 'Repo Everything (entire repo except archive/ & generated dirs)',
    sources: ['.'],
    excludeDirs: new Set([
      'archive',
      'node_modules',
      'build/output',
      '.git',
      '.cursor/.trash',
      'dist',
      'coverage',
      '.nyc_output',
      '.cache',
      '.tmp',
      '.temp'
    ]),
    output: 'repo-everything.md'
  },
  {
    name: 'recent',
    title: `Recent Changes (last ${RECENT_SINCE_DAYS} days, up to ${RECENT_LIMIT} files)`,
    sources: [
      'apps',
      'build/scripts',
      'docs',
      'memory-bank',
      'tests',
      '.cursor/rules'
    ],
    excludeDirs: new Set(['node_modules', 'build/output', '.git']),
    output: 'recent-changes.md',
    recent: true
  }
];

// -------- helpers --------
function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function isTextFile(file){ return TEXT_EXTS.has(path.extname(file).toLowerCase()); }

function walk(dir, excludeDirs, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rel = path.relative(REPO_ROOT, abs);

    const ignored = isIgnored(rel);
    if (DEBUG_IGNORE && ignored) console.warn(`↪ ignored by master: ${rel}`);
    if (ignored) continue;

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
function demoteHeadings(s){ return s.replace(/^(#+)/gm, '#$1'); }
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

// recent helpers
function gitAvailable(){
  try { cp.execSync('git --version', { stdio: 'ignore' }); return true; }
  catch { return false; }
}
function gitRecentFiles({ sinceDays, limit, includeDirs }){
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
function mtimeRecentFiles({ limit, includeDirs, excludeDirs }) {
  const all = [];
  for (const src of includeDirs){
    const abs = path.join(REPO_ROOT, src);
    if (!fs.existsSync(abs)) continue;
    const stack = [abs];
    while (stack.length){
      const dir = stack.pop();
      for (const e of fs.readdirSync(dir, { withFileTypes: true })){
        const a = path.join(REPO_ROOT, path.relative(REPO_ROOT, path.join(dir, e.name)));
        const r = path.relative(REPO_ROOT, a);
        if (e.isDirectory()){
          if (excludeDirs.has(e.name)) continue;
          if (isIgnored(r)) continue;
          stack.push(a);
        } else if (e.isFile() && isTextFile(a)){
          if (isIgnored(r)) continue;
          all.push({ rel: r, mtime: fs.statSync(a).mtimeMs });
        }
      }
    }
  }
  all.sort((a,b) => b.mtime - a.mtime);
  return all.slice(0, limit).map(x => x.rel);
}

// sources hygiene
function splitExistingSources(sources) {
  const existing = [];
  const missing  = [];
  for (const src of sources) {
    const abs = path.join(REPO_ROOT, src);
    if (fs.existsSync(abs)) existing.push(src);
    else missing.push(src);
  }
  return { existing, missing };
}

// markdown builder
function buildFromList({ title, files }) {
  let out =
    `<!-- markdownlint-disable MD032 MD022 MD036 MD024 -->\n` +
    '> **Generated file** — built by `build/scripts/combine-views.js` at build time.  \n' +
    '> Edit the source docs under `docs/` and `memory-bank/docs/`, not this file.\n\n' +
    `# ${title}\n\n`;

  const folderCounts = {};
  for (const rel of files) {
    const top = (rel.split(path.sep)[0] || '.');
    folderCounts[top] = (folderCounts[top] || 0) + 1;
  }
  if (Object.keys(folderCounts).length > 1) {
    out += '### Folder summary\n\n';
    for (const top of Object.keys(folderCounts).sort()) {
      out += `- \`${top}/\` — ${folderCounts[top]} files\n`;
    }
    out += `\n`;
  }

  out += `## Table of Contents\n\n`;
  const groups = {};
  for (const rel of files) {
    const top = (rel.split(path.sep)[0] || '.');
    (groups[top] ??= []).push(rel);
  }
  for (const top of Object.keys(groups).sort()) {
    out += `- **${top}/**\n`;
    for (const rel of groups[top]) {
      const label = rel.replace(/\\/g, '/');
      const id = safeAnchor(rel);
      out += `  - [${label}](#${id})\n`;
    }
  }
  out += `\n---\n`;

  for (const rel of files) {
    const abs = path.join(REPO_ROOT, rel);
    const { text, size, truncated } = readPreview(abs);
    const ext = path.extname(rel).toLowerCase();
    const lang = languageFromExt(rel);

    const id = safeAnchor(rel);
    out += `\n\n<a id="${id}"></a>\n## ${rel}\n\n`;

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
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim() + '\n';
}

function safeAnchor(text) {
  let slug = String(text).toLowerCase().trim();
  slug = slug.replace(/[\\/]+/g, '');
  slug = slug.replace(/\./g, '');
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug;
}
function readPreview(abs, max = MAX_BYTES){
  const stat = fs.statSync(abs);
  const truncated = stat.size > max;
  const buf = fs.readFileSync(abs, 'utf8').slice(0, max);
  return { text: buf, size: stat.size, truncated };
}

// build one target
function buildOne(target) {
  const { existing, missing } = splitExistingSources(target.sources);
  const SOURCES = existing.length ? existing : [];

  // Only warn about missing sources if explicitly enabled (default true)
  const shouldWarn = (target.warnOnMissing !== false);
  if (shouldWarn && missing.length) {
    console.warn(`⚠ ${target.name}: missing source dirs -> ${missing.join(', ')}`);
  }

  const start = Date.now();
  let files = [];

  if (target.recent) {
    files = gitAvailable()
      ? gitRecentFiles({
          sinceDays: RECENT_SINCE_DAYS,
          limit: RECENT_LIMIT,
          includeDirs: SOURCES
        })
      : [];
    if (!files.length) {
      files = mtimeRecentFiles({
        limit: RECENT_LIMIT,
        includeDirs: SOURCES,
        excludeDirs: target.excludeDirs || new Set()
      });
    }
  } else {
    for (const src of SOURCES) {
      const abs = path.join(REPO_ROOT, src);
      files.push(...walk(abs, target.excludeDirs || new Set()));
    }
    files = Array.from(new Set(files)).sort();
    if (typeof target.filter === 'function') {
      files = files.filter(target.filter);
    }
  }

  ensureDir(OUTPUT_DIR);
  const outfile = path.join(OUTPUT_DIR, target.output);
  const markdown = buildFromList({ title: target.title, files });
  fs.writeFileSync(outfile, markdown, 'utf8');

  const meta = {
    name: target.name,
    title: target.title,
    output: path.basename(outfile),
    path: outfile,
    filesCount: files.length,
    sources: SOURCES,
    excludeDirs: Array.from(target.excludeDirs || new Set()),
    recent: !!target.recent
  };

  console.log(`✔ ${target.name}: ${files.length} files → ${path.relative(REPO_ROOT, outfile)} (${Date.now()-start}ms)`);
  return meta;
}

// mermaid repo tree
function buildRepoTree({ sources, excludeDirs }) {
  const seenNodes = new Set();
  const edges = [];
  let nodes = 0;

  function addNode(id) {
    if (!seenNodes.has(id)) { seenNodes.add(id); nodes++; }
  }
  function addEdge(a, b) { edges.push([a, b]); }

  const ex = new Set(excludeDirs || []);
  const maxNodes = TREE_MAX_NODES;

  function scan(rootRel) {
    const rootAbs = path.join(REPO_ROOT, rootRel);
    if (!fs.existsSync(rootAbs)) return;

    function walkDir(baseRel, level) {
      if (nodes >= maxNodes) return;
      if (level > TREE_DEPTH) return;

      const abs = path.join(REPO_ROOT, baseRel);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) return;
      const baseName = path.basename(baseRel);

      if (ex.has(baseName) || isIgnored(baseRel)) return;

      addNode(baseRel || '.');

      const entries = fs.readdirSync(abs, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name)
        .sort();

      for (const name of entries) {
        const childRel = path.join(baseRel, name);
        if (ex.has(name) || isIgnored(childRel)) continue;

        addNode(childRel);
        addEdge(baseRel || '.', childRel);

        if (nodes >= maxNodes) break;
        walkDir(childRel, level + 1);
      }
    }

    walkDir(rootRel, 0);
  }

  if (!sources || !sources.length) {
    scan('.');
  } else {
    for (const src of sources) scan(src);
  }

  const idOf = (rel) => ('n_' + (rel || '.').replace(/[^\w]/g, '_'));
  const labelOf = (rel) => (rel === '.' || rel === '' ? 'repo-root' : rel.replace(/\\/g, '/'));

  let out = '```mermaid\nflowchart TD\n';
  out += `  classDef folder font-weight:600;\n`;
  for (const rel of seenNodes) out += `  ${idOf(rel)}["${labelOf(rel)}"]:::folder\n`;
  for (const [a, b] of edges) out += `  ${idOf(a)} --> ${idOf(b)}\n`;
  out += '```\n';

  return out;
}

// merged hub writer (ONLY repo-overview.md; no INDEX.md)
function writeCombinedRepoHub(built) {
  const ts = new Date().toISOString();
  const byName = Object.fromEntries(built.map(b => [b.name, b]));
  const repo = byName['repo'];
  if (!repo) return;

  const repoMd = fs.readFileSync(repo.path, 'utf8');

  const quickLines = [];
  quickLines.push('## Quick links', '');
  for (const b of built) {
    quickLines.push(`- **${b.title}** — [${b.output}](./${b.output}) _(files: ${b.filesCount})_`);
  }
  quickLines.push('');

  const mermaid = buildRepoTree({
    sources: repo.sources,
    excludeDirs: repo.excludeDirs
  });

  const header = [
    '<!-- markdownlint-disable MD032 MD022 MD036 MD024 -->',
    '# Repo Hub (Overview + Index)',
    '',
    `> Generated ${ts} by \`build/scripts/combine-views.js\``,
    ''
  ].join('\n');

  const merged = [
    header,
    quickLines.join('\n'),
    '## Repository Tree (Mermaid)',
    '',
    mermaid,
    '---',
    '',
    repoMd.replace(/^#\s+[^\n]+\n/, '## Repo Overview\n')
  ].join('\n');

  fs.writeFileSync(repo.path, merged, 'utf8');
  console.log(`✔ merged hub → ${path.relative(REPO_ROOT, repo.path)}`);
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
  if (built.some(b => b.name === 'repo')) writeCombinedRepoHub(built);
})();
