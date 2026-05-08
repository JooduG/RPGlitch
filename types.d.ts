/// <reference types="vite/client" />
/**
 * 🛸 RPGlitch: Global Type Definitions
 * Refined for Total TypeScript compatibility.
 */

import type { Table } from "dexie";
import Dexie from "dexie";

declare global {
  // =========================================================================
  // [1] PERCHANCE RUNTIME GLOBALS
  // =========================================================================

  const ai: (prompt: string, options?: Record<string, unknown>) => Promise<string>;

  interface T2IOptions {
    prompt: string;
    negativePrompt?: string;
    seed?: number;
    width?: number;
    height?: number;
  }

  const t2i: (options: T2IOptions) => Promise<string | { dataUrl: string }>;
  const pluginTextToImage: (options: T2IOptions) => Promise<string | { dataUrl: string }>;
  const textToImage: (
    prompt: string | T2IOptions,
    options?: Record<string, unknown>,
  ) => Promise<string | { dataUrl: string }>;

  const upload: (data: unknown, options?: Record<string, unknown>) => Promise<unknown>;
  const pluginUpload: typeof upload;

  const update: () => void;

  const oc: {
    characters?: unknown[];
    worlds?: unknown[];
    settings?: Record<string, unknown>;
    sounds?: Record<string, unknown>;
    thread: {
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      customData?: unknown;
    };
    [key: string]: unknown;
  };

  const rpgLists: {
    sounds?: unknown;
    [key: string]: unknown;
  };

  const DOMPurify: {
    sanitize: (input: string, config?: Record<string, unknown>) => string;
  };

  // =========================================================================
  // [2] ENGINE STATE INTERFACES
  // =========================================================================
  interface TurnState {
    id: string;
    phase: "idle" | "scanning" | "forecasting" | "echoing";
    turnNumber: number;
    timestamp: number;
  }

  interface AppState {
    storyMode: "chat" | "grid";
    theme: string;
    isBusy: boolean;
    activeTrackId?: string;
  }

  interface LoreAtom {
    uid: string;
    content: string;
    type: "character" | "location" | "event" | "rule";
    metadata: Record<string, unknown>;
  }

  // =========================================================================
  // [3] WINDOW BINDINGS
  // =========================================================================
  interface Window {
    chrono: unknown;
    webkitAudioContext: typeof AudioContext;
    RPGLITCH_CONFIG: Record<string, unknown>;
    app: unknown;
    rpgApp: unknown;
    state: unknown;
    GameMaster: unknown;
    Engine: unknown;
    Dexie: typeof Dexie;
    DOMPurify: typeof DOMPurify;
    ai: typeof ai;
    t2i: typeof t2i;
    rpgLists: typeof rpgLists;
    pluginTextToImage: typeof pluginTextToImage;
    pluginUpload: typeof pluginUpload;
    oc: typeof oc;
    update: typeof update;
  }
}

// =========================================================================
// [4] DEXIE DATABASE SCHEMA
// =========================================================================
declare module "dexie" {
  interface Dexie {
    stories: Table<Record<string, unknown>, string>;
    messages: Table<Record<string, unknown>, string>;
    entities: Table<Record<string, unknown>, string>;
    settings: Table<Record<string, unknown>, string>;
  }
}

export {};
