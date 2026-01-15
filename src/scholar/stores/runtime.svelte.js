// 📜 SCHOLAR: The Runtime State
import { db } from "../database/db.js"; // The Legacy DB Wrapper

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

      vitals: { health: 100, maxHealth: 100, energy: 100, maxEnergy: 100 },
      plot: {
        active: [],
        resolved: [],
      },
    },
    ready: false,
    storyId: null,
  });

  return {
    get character() {
      return state.character;
    },
    get isReady() {
      return state.ready;
    },

    // 🟢 SYNC: Read from DB
    async sync(activeStoryId = null) {
      if (activeStoryId) state.storyId = activeStoryId;

      // If we don't know who we are playing, try to guess or wait
      if (!state.storyId) {
        // TODO: Look for 'lastActiveStory' in localStorage or URL
        return;
      }

      try {
        // 1. Fetch Story to get Character ID
        const story = await db.stories.get(state.storyId);
        if (!story) return;

        // 2. Fetch Character Data
        // Assuming 'userId' is the player character
        const charData = await db.characters.get(story.userId);

        if (charData) {
          // 3. Map Legacy DB Data to Runtime Schema
          // (We assume DB schema matches or we map it here)
          state.character = {
            ...state.character, // Keep defaults for missing fields
            ...charData,
            id: charData.id, // Ensure ID is captured
          };
          state.ready = true;
        }
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
          console.log("[Scholar] Database Synced.");
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
