// 📜 SCHOLAR: The Runtime State
import { db } from "./database/db.js"; // The Legacy DB Wrapper
import { entities } from "./database/repository.js";

function createRuntimeStore() {
  let state = $state({
    character: {
      id: null, // Critical for DB updates
      name: "Unlinked",
      description: "No data stream connected.",

      // 🧠 Deep State
      eternal: { mental: "", physical: "" }, // Renamed from 'forever'
      present: { mental: "", physical: "" },
      timeline: { past: "", future: "" },

      // 🧪 Dynamics (Dev)
      dynamics: { entropy: 50, velocity: 50, permeability: 50, resonance: 50 },

      // 🎭 Visuals & Voice
      voice: { rate: 1.0, pitch: 1.0 },
      visuals: {
        avatar: null, // URL
        signatureColor: "#84cc16", // Default Lime
        noBackground: false,
      },

      plot: {
        active: [],
        resolved: [],
      },
    },
    userCharacter: null, // Specific reference
    aiCharacter: null,
    storyFractal: null,
    ready: false,
    storyId: null,
  });

  return {
    get character() {
      return state.character;
    },
    get userCharacter() {
      return state.userCharacter;
    },
    get aiCharacter() {
      return state.aiCharacter;
    },
    get storyFractal() {
      return state.storyFractal;
    },
    get isReady() {
      return state.ready;
    },

    // 🟢 SYNC: Read from DB
    async sync(activeStoryId = null) {
      if (activeStoryId) state.storyId = activeStoryId;

      // If we don't know who we are playing, try to recover from persistence
      if (!state.storyId) {
        try {
          const setting = await db.settings.get("active_story");
          if (setting?.value) {
            state.storyId = setting.value;
          } else {
            return; // truly no active story
          }
        } catch (e) {
          return;
        }
      }

      try {
        // 1. Fetch Story to get Character IDs
        const story = await db.stories.get(state.storyId);
        if (!story) return;

        // 2. Fetch Entities
        const [userData, aiData, fractalData] = await Promise.all([
          entities.get("character", story.userId),
          entities.get("character", story.aiId || "unknown_ai"),
          entities.get("fractal", story.fractalId || story.id), // Fallback: Story ID often doubles as Fractal ID in some schemas
        ]);

        if (userData) {
          state.character = {
            ...state.character,
            ...userData,
            id: userData.id,
          };
          // Also set specific User slot
          state.userCharacter = state.character;
        }

        if (aiData) {
          state.aiCharacter = aiData;
        }

        if (fractalData) {
          state.storyFractal = fractalData;
        }

        state.ready = true;
      } catch (err) {
        console.warn("[Scholar] Sync Failed:", err);
      }
    },

    // 🔴 UPDATE: Write to DB
    async updateCharacter(data) {
      // Optimistic UI Update
      Object.assign(state.character, data);

      if (state.character.id) {
        try {
          // Send to IndexedDB
          await db.characters.update(state.character.id, {
            ...data,
            updatedAt: Date.now(),
          });
        } catch (err) {
          console.error("[Scholar] Save Failed:", err);
          // TODO: Rollback state?
        }
      } else {
        console.warn("[Scholar] Cannot save: No Character ID linked.");
      }
    },
  };
}

export const runtime = createRuntimeStore();
