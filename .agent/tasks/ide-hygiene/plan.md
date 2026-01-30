# Plan: IDE Hygiene & Extension Defense

## Goal

Silence semantic noise, resolve IDE extension conflicts, and harden the project's synchronization and ignore protocols.

## Status: Complete ✅

## Tasks

- [x] **Semantic Silence**
    - [x] Trace "interface-declaration" and "basic-types" Info markers to **Total TypeScript** extension failure.
    - [x] Verified that project tools (Warden, Svelte-Check, ESLint) are clean and silent.
    - [x] Resolution: Instructed user to disable the problematic extension.

- [x] **Ignore Hardening**
    - [x] Add `.agent/**` to `ignores.master.json` for all tool chains.
    - [x] Upgrade `sync.js` to explicitly generate and manage `.eslintignore`.
    - [x] Verified propagation to `jsconfig.json` and `files.exclude`.

- [x] **Sync Script Type Hardening**
    - [x] Apply JSDoc `/** @type {Record<string, any>} */` to `sync.js` `args` object.
    - [x] Silence "Property does not exist on type '{}'" IDE warnings.

- [x] **Structural Cleanliness**
    - [x] Refine `any` -> `unknown` in `types.d.ts` and Warden knowledge files.
    - [x] Standardize CSS comments (Convert `//` to `/* */`) to resolve build-time warnings.

## Handover for Next Session

The environment is now "Silent and Clean". Future work should monitor VS Code extension performance if markers reappear. The `.agent/rules/` directory remains the source of truth for all linting and tech-stack constraints.
