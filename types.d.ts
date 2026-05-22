/// <reference types="vite/client" />
/**
 * 🛸 RPGlitch: Global Type Definitions
 * Mariana Trench SOTA Refactor: Clarity, Robustness, Optimal Flow.
 */

import type { Table } from "dexie";
import Dexie from "dexie";

declare global {
  // =========================================================================
  // [1] UTILITIES & COMMON TYPES
  // =========================================================================

  /** Common JSON-compatible map */
  type JsonMap = Record<string, unknown>;

  // =========================================================================
  // [2] RUNTIME CONTEXT (PERCHANCE GLOBALS)
  // =========================================================================

  /** Interface for text-to-image options */
  interface T2IOptions {
    prompt: string;
    negativePrompt?: string;
    seed?: number;
    width?: number;
    height?: number;
  }

  /** Result object for image generation plugins */
  interface T2IObject {
    dataUrl: string;
  }

  /** Result type for image generation plugins */
  type T2IResult = string | T2IObject;

  /** Perchance AI streaming interface */
  function ai(prompt: string, options?: JsonMap): Promise<string>;

  /** Primary text-to-image generator */
  function t2i(options: T2IOptions): Promise<T2IResult>;

  /** Legacy/Plugin text-to-image interface */
  function pluginTextToImage(options: T2IOptions): Promise<T2IResult>;

  /** Unified text-to-image interface with prompt overloading */
  function textToImage(prompt: string | T2IOptions, options?: JsonMap): Promise<T2IResult>;

  /** Asset upload utility */
  function upload(data: unknown, options?: JsonMap): Promise<unknown>;

  /** Plugin asset upload alias */
  const pluginUpload: typeof upload;

  /** Forces a UI tick/update */
  function update(): void;

  // =========================================================================
  // [3] EXTERNAL MODULES & DATA STRUCTURES
  // =========================================================================

  /** Perchance Output Context (OC) structure */
  interface PerchanceOC {
    characters?: unknown[];
    worlds?: unknown[];
    settings?: JsonMap;
    sounds?: JsonMap;
    thread: {
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      customData?: unknown;
    };
    [key: string]: unknown;
  }

  const oc: PerchanceOC;

  /** Global RPG shared lists */
  interface RPGLists {
    sounds?: unknown;
    [key: string]: unknown;
  }

  const rpgLists: RPGLists;

  /** Security & Sanitization kernel */
  interface PurifyKernel {
    sanitize: (input: string, config?: JsonMap) => string;
  }

  const DOMPurify: PurifyKernel;

  // =========================================================================
  // [4] ENGINE STATE ARCHITECTURE
  // =========================================================================

  /** Atomic snapshot of a simulation turn */
  interface TurnState {
    id: string;
    phase: "idle" | "scanning" | "forecasting" | "echoing";
    turnNumber: number;
    timestamp: number;
  }

  /** Global application runtime state */
  interface AppState {
    storyMode: "chat" | "grid";
    theme: string;
    isBusy: boolean;
    activeTrackId?: string;
  }

  /** Fundamental unit of world knowledge */
  interface LoreAtom {
    uid: string;
    content: string;
    type: "character" | "location" | "event" | "rule";
    metadata: JsonMap;
  }

  // =========================================================================
  // [5] HOST INTEGRATION (WINDOW)
  // =========================================================================

  interface Window {
    chrono: unknown;
    webkitAudioContext: typeof AudioContext;
    RPGLITCH_CONFIG: JsonMap;
    app: unknown;
    runtime: unknown;
    rpgApp: unknown;
    state: unknown;
    GameMaster: unknown;
    Engine: unknown;
    Dexie: typeof Dexie;
    DOMPurify: PurifyKernel;
    ai: typeof ai;
    t2i: typeof t2i;
    rpgLists: RPGLists;
    pluginTextToImage: typeof pluginTextToImage;
    pluginUpload: typeof pluginUpload;
    oc: PerchanceOC;
    update: typeof update;
    ontouchstart?: unknown;
  }
}

// =========================================================================
// [6] DATABASE SCHEMA
// =========================================================================

declare module "dexie" {
  interface Dexie {
    stories: Table<JsonMap, string>;
    messages: Table<JsonMap, string>;
    entities: Table<JsonMap, string>;
    settings: Table<JsonMap, string>;
  }
}

export {};
