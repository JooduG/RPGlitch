import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");

// Casing Standards & Rule 06 — Modern Standards (No 'var')

/**
 * Rule 05 — Casing Standards & Rule 06 — Modern Standards (No 'var')
 */

const RE_KEBAB = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const RE_PASCAL = /^[A-Z][a-zA-Z0-9]+$/;
const RE_ALL_CAPS = /^[A-Z][A-Z0-9_]*$/;
const RE_VAR = /\bvar\s+[a-zA-Z_$][a-zA-Z0-9_$]*/;

const STRIP_SUFFIXES = [
  ".template",
  ".svelte",
  ".test",
  ".spec",
  ".manual",
  ".unit",
  ".integration",
  ".d",
];
const TEST_SUFFIXES = [".test", ".spec", ".manual", ".unit", ".integration"];
const SUBJECT_EXTS = [".svelte", ".svelte.js", ".svelte.ts", ".js", ".ts"];

const getBase = (filename) => {
  const withoutExt = filename.slice(0, filename.length - path.extname(filename).length);
  let stem = withoutExt;
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of STRIP_SUFFIXES) {
      if (stem.endsWith(suffix)) {
        stem = stem.slice(0, stem.length - suffix.length);
        changed = true;
        break;
      }
    }
  }
  return stem;
};

const findTestSubject = (filename, dir) => {
  const ext = path.extname(filename);
  const withoutExt = filename.slice(0, filename.length - ext.length);
  let subjectStem = null;
  for (const suffix of TEST_SUFFIXES) {
    if (withoutExt.endsWith(suffix)) {
      subjectStem = withoutExt.slice(0, withoutExt.length - suffix.length);
      break;
    }
  }
  if (!subjectStem) return false;
  return SUBJECT_EXTS.some((se) => fs.existsSync(path.join(dir, subjectStem + se)));
};

export const nomenclatureRules = [
  {
    id: "N-LANG-001",
    severity: "DEBT",
    message: "Svelte component must be PascalCase.",
    auditPath: (name, isDir) => {
      if (isDir || !name.endsWith(".svelte") || name.includes(".template.")) return true;
      const base = getBase(name);
      return RE_PASCAL.test(base);
    },
  },
  {
    id: "N-LANG-002",
    severity: "DEBT",
    message: "File must be kebab-case.",
    auditPath: (name, isDir, relPath) => {
      if (isDir || name.includes("RPGlitch") || name.startsWith("@") || name.startsWith("$"))
        return true;
      if (name.endsWith(".svelte") && !name.includes(".template.")) return true;
      const base = getBase(name);
      if (RE_ALL_CAPS.test(base)) return true;

      const parentDir = path.dirname(path.join(PROJECT_ROOT, relPath));
      if (findTestSubject(name, parentDir)) return true;

      return RE_KEBAB.test(base);
    },
  },
  {
    id: "N-LANG-003",
    severity: "DEBT",
    message: "Folder must be kebab-case or All-Caps abbreviation.",
    auditPath: (name, isDir) => {
      if (!isDir || name.startsWith(".") || name.startsWith("@") || name.startsWith("$"))
        return true;
      return RE_KEBAB.test(name) || RE_ALL_CAPS.test(name);
    },
  },
  {
    id: "N-LANG-VAR",
    severity: "HERESY",
    message: "Forbidden usage of 'var' detected.",
    regex: RE_VAR,
    validate: (line, filePath) => filePath.match(/\.(js|ts|svelte)$/),
  },
];

// Legacy directory walking and standalone execution removed. Logic is now driven by warden.js (The Reflex).
