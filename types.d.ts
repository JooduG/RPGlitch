/**
 * 🛸 RPGlitch: Global Type Definitions
 * This file silences TypeScript noise for runtime-injected APIs.
 */

import Dexie from "dexie";

declare global {
  // =========================================================================
  // 🗝️ Perchance Runtime APIs (Injected by host environment)
  // =========================================================================
  interface Window {
    /** Perchance AI text generation */
    ai: (prompt: string, options?: Record<string, unknown>) => Promise<string>;
    /** Perchance image generation */
    textToImage: (prompt: string, options?: Record<string, unknown>) => Promise<any>;
    /** Alias for textToImage matching the plugin export */
    pluginTextToImage: (options: {
      prompt: string;
      negativePrompt?: string;
      seed?: number;
      width?: number;
      height?: number;
    }) => Promise<any>;
    t2i: (options: {
      prompt: string;
      negativePrompt?: string;
      seed?: number;
      width?: number;
      height?: number;
    }) => Promise<string>;
    /** Perchance file upload */
    upload: (data: unknown, options?: Record<string, unknown>) => Promise<any>;
    /** Alias for upload matching the plugin export */
    pluginUpload: (data: unknown, options?: Record<string, unknown>) => Promise<any>;
    /** Perchance lists/data access */
    oc: {
      characters?: unknown[];
      worlds?: unknown[];
      settings?: Record<string, unknown>;
      sounds?: Record<string, unknown>;
      thread: {
        on: (event: string, callback: (...args: any[]) => void) => void;
        customData?: any;
      };
      [key: string]: unknown;
    };
    /** Perchance update trigger */
    update: () => void;
    /** Perchance lists */
    rpgLists: {
      sounds?: any;
      [key: string]: any;
    };
    /** Chrono debug handle */
    chrono: unknown;
    /** Dexie global (for legacy access) */
    Dexie: typeof Dexie;
    /** DOMPurify global */
    DOMPurify: {
      sanitize: (input: string, config?: Record<string, unknown>) => string;
    };
    /** WebKit Audio Context (Safari) */
    webkitAudioContext: typeof AudioContext;
    /** Legacy RPGlitch Config */
    RPGLITCH_CONFIG: Record<string, unknown>;
    /** App Store Global */
    app: any;
    /** App Store Alias */
    rpgApp: any;
    /** Legacy State Alias */
    state: any;
    /** GameMaster Core */
    GameMaster: any;
    /** Engine Core */
    Engine: any;
  }
}

declare module "dexie" {
  interface Dexie {
    stories: Table<any, string>;
    messages: Table<any, string>;
    entities: Table<any, string>;
    settings: Table<any, string>;
  }
}

declare global {
  // 🎭 App State Types
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
  // 🔧 Custom Event Types
  // =========================================================================
  interface CustomEvent<T = any> {
    detail: T;
  }

  interface Event {
    detail?: any;
  }
}

export {};
