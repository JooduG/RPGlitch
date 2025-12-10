/**
 * Global Type Definitions for RPGlitch
 *
 * These types provide IntelliSense and documentation for the
 * vanilla JavaScript codebase.
 */

// --- PHYSICS ENGINE ---

/**
 * Represents the four-dimensional narrative physics state.
 */
interface Dynamics {
  /** Chaos vs Order (0-100). High entropy creates noise and panic. */
  entropy: number;
  /** Openness vs Defense (0-100). High permeability allows emotional impact but risks damage. */
  permeability: number;
  /** Pacing/Speed (0-100). High velocity drives action but reduces defense. */
  velocity: number;
  /** Impact/Significance (0-100). High resonance creates meaningful change. */
  resonance: number;

  /** Calculated flags from the physics engine */
  _flags?: {
    echoChamber?: boolean;
    glassCannon?: boolean;
    panicSpiral?: boolean;
    fogOfWar?: boolean;
    [key: string]: boolean | undefined;
  };
}

// --- VISUALS ---

/**
 * Visual presentation settings for an entity.
 */
interface Visuals {
  /** Whether the image is horizontally flipped */
  flipped: boolean;
  /** URL for the avatar image */
  avatarUrl?: string;
  /** URL for the full body image */
  fullBodyUrl?: string;
  /** Scaling factor for the image */
  scale?: number;
  /** Vertical offset for the image */
  yOffset?: number;
}

// --- ENTITIES ---

/**
 * Core data structure for Characters and Worlds.
 */
interface Entity {
  /** Unique ID (e.g., "entity-C1", or auto-incremented number) */
  id: number | string;
  /** Entity Type */
  type: "character" | "world";
  /** Display Name */
  name: string;
  /** Short summary */
  description: string;

  /** Narrative Physics State (V4.2) */
  dynamics: Dynamics;
  /** Visual presentation settings */
  visuals: Visuals;

  /** Theme color (e.g., 'azure', 'pink') */
  signatureColour: string;
  /** Searchable tags */
  tags: string[];

  // --- Narrative Sections ---
  /** "Forever" - The immutable truth of the entity */
  forever: string;
  /** "Past" - Backstory and fixed history */
  past: string;
  /** "Present" - Current status and hooks */
  present: string;
  /** "Future" - Goals and destiny */
  future: string;

  // --- Meta ---
  /** Legacy profile picture URL (synced with visuals.avatarUrl) */
  profilePictureUrl?: string;
  /** Timestamp of creation */
  createdAt: number;
  /** Timestamp of last update */
  updatedAt: number;
  /** Whether this is a built-in premade entity */
  isPremade?: number;
  /** Whether this is a custom user entity */
  isCustom?: number;

  // --- Internal ---
  _backupState?: Dynamics | null;
  _lastUpdateMsgId?: number | null;
}

// --- MESSAGES ---

/**
 * A single message in the chat history.
 */
interface Message {
  id?: number;
  storyId: number;
  /** Speaking role */
  role: "user" | "ai" | "narrator" | "system";
  /** Message classification */
  type: "IC" | "OOC" | "DEBUG";

  /** Content text */
  text: string;
  /** Name of the speaker (if applicable) */
  characterName: string;

  /** Random seed used for generation */
  seed?: number;
  /** Metadata for UI rendering */
  meta?: any;
  /** Timestamp */
  createdAt: number;
}

// --- STORIES ---

/**
 * Represents a game session/story.
 */
interface Story {
  id: number;
  title: string;
  isConcluded: 0 | 1;

  // Foreign Keys
  aiCharacterId: number | string;
  userCharacterId: number | string;
  worldId: number | string;

  /** Snapshot of settings at story start */
  settingsSnapshot?: any;
  /** Start/End entity states for rollbacks/diffs */
  snapshots?: {
    start: Record<string, Entity>;
    end?: Record<string, Entity>;
  };

  createdAt: number;
  updatedAt: number;
}

// --- GLOBAL APP STATE ---

/**
 * The global runtime state (mirrors app-state.js).
 */
interface GameState {
  storyTitle: string;
  selectedAI: number | string | null;
  selectedWorld: number | string | null;
  selectedUser: number | string | null;
  mode: string;
  isCustomTitle: boolean;

  story: {
    activeId: number | null;
    byId: Record<number, Story>;
  };

  messages: {
    byStoryId: Record<number, Message[]>;
  };

  settings: {
    temperature: number;
    top_p: number;
    maxTokens: number;
    stop: string[];
    model: string;
    historyLength: number;
    directorMode: boolean;
    storyOpeningInstructions: string;
    [key: string]: any;
  };

  ui: {
    fsm: string;
    [key: string]: any;
  };
}

// --- USAGE EXAMPLE ---
//
// /** @type {Entity} */
// const myChar = await entities.get('character', 1);
//
