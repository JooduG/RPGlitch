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
    removeBackground?: boolean;
  }

  /** Result object for image generation plugins */
  interface T2IObject {
    dataUrl?: string;
    url?: string;
    image?: string;
  }

  /** Result type for image generation plugins */
  type T2IResult = string | T2IObject;

  /** Perchance AI streaming interface (generate_text) */
  function generate_text(prompt: string, options?: JsonMap): Promise<string>;

  /** Primary text-to-image generator (generate_image) */
  function generate_image(options: T2IOptions): Promise<T2IResult>;

  /** Legacy/Plugin text-to-image interface */
  function pluginGenerateImage(options: T2IOptions): Promise<T2IResult>;

  /** Asset upload utility */
  function upload(data: unknown, options?: JsonMap): Promise<unknown>;
  function upload(callback: (dataUrl: string | null | undefined) => void): void;

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

  const LISTS: RPGLists;

  /** Security & Sanitization kernel */
  interface PurifyKernel {
    sanitize: (input: string, config?: JsonMap) => string;
  }

  const DOMPurify: PurifyKernel;

  // =========================================================================
  // [4] HOST INTEGRATION (WINDOW)
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
    generate_text: typeof generate_text;
    generate_image: typeof generate_image;
    LISTS: RPGLists;
    pluginGenerateImage: typeof pluginGenerateImage;
    oc: PerchanceOC;
    update: typeof update;
    ontouchstart?: unknown;
  }
}

// =========================================================================
// [5] DATABASE SCHEMA
// =========================================================================

declare module "dexie" {
  interface Dexie {
    stories: Table<JsonMap, number>;
    simulation_log: Table<JsonMap, number>;
    entities: Table<JsonMap, string>;
    sessions: Table<JsonMap, number>;
    kv_settings: Table<JsonMap, string>;
    audio_prefs: Table<JsonMap, string>;
  }
}

export {};
