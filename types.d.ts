/// <reference types="vite/client" />
/**
 * 🛸 RPGlitch: Global Type Definitions
 */

import type { Table } from "dexie";
import Dexie from "dexie";

declare global {
  // =========================================================================
  // [1] UTILITIES & COMMON TYPES
  // =========================================================================

  /** Common JSON-compatible map */
  type JsonMap = Record<string, unknown>;

  /** Ambient Profile controller interface for Profile wings */
  interface ProfileController {
    is_editing: boolean;
    is_saving: boolean;
    show_delete_confirm: boolean;
    is_packing_up: boolean;
    hovered_section: string | null;
    active_field: { key: string; label: string };
    busy_fields: Set<string>;
    char: any;
    draft_id: string | null;
    draft_name: string | null;
    identity_error: string;
    can_edit: boolean;
    id_valid: boolean;
    name_valid: boolean;
    identity_valid: boolean;
    sync: () => void;
    start_editing: () => void;
    cancel: () => void;
    save: (entity_type: string) => Promise<void>;
    delete: (entity_type: string) => Promise<void>;
    setImage: (data_url: string) => Promise<void>;
    set_field_value: (key: string, value: any) => void;
    set_active_field: (key: string, label: string) => void;
    get_safe_value: (key: string) => string;
    mark_mutated: () => void;
    commit_draft_id: () => boolean;
    enhance: (key: string, value: string) => Promise<void>;
    enhance_profile: (entity_type: string) => Promise<void>;
  }

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
    guidanceScale?: number;
    resolution?: string;
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

  /** Perchance AI text generation bridge (`src/index.html`) */
  function generate_text(prompt: string | JsonMap, options?: JsonMap): Promise<unknown>;
  function generateText(prompt: string | JsonMap, options?: JsonMap): Promise<unknown>;
  function pluginGenerateText(prompt: string | JsonMap, options?: JsonMap): Promise<unknown>;

  /** Perchance text-to-image generation bridge (`src/index.html`) */
  function generate_image(options: T2IOptions): Promise<T2IResult>;
  function pluginGenerateImage(options: T2IOptions): Promise<T2IResult>;

  /** Perchance super-fetch web bridge (`src/index.html`) */
  function fetch_web(url: string, options?: JsonMap): Promise<unknown>;
  function pluginFetchWeb(url: string, options?: JsonMap): Promise<unknown>;

  // =========================================================================
  // [3] SECURITY & SANITIZATION KERNEL
  // =========================================================================

  interface PurifyKernel {
    sanitize: (input: string, config?: JsonMap) => string;
  }

  const DOMPurify: PurifyKernel;

  // =========================================================================
  // [4] HOST INTEGRATION (WINDOW)
  // =========================================================================

  interface Window {
    webkitAudioContext: typeof AudioContext;
    Dexie: typeof Dexie;
    DOMPurify: PurifyKernel;
    generate_text?: typeof generate_text;
    generateText?: typeof generateText;
    pluginGenerateText?: typeof pluginGenerateText;
    generate_image?: typeof generate_image;
    pluginGenerateImage?: typeof pluginGenerateImage;
    fetch_web?: typeof fetch_web;
    pluginFetchWeb?: typeof pluginFetchWeb;
    ontouchstart?: unknown;
  }
}

// =========================================================================
// [5] DATABASE SCHEMA (DEXIE V2)
// =========================================================================

declare module "dexie" {
  interface Dexie {
    stories: Table<JsonMap, number>;
    simulation_log: Table<JsonMap, number>;
    entities: Table<JsonMap, string>;
    sessions: Table<JsonMap, number>;
    kv_settings: Table<JsonMap, string>;
    audio_prefs: Table<JsonMap, string>;
    mutation_ledger: Table<JsonMap, number>;
  }
}

export {};
