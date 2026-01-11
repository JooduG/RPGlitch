// 📜 SCHOLAR: The Reactive Bridge
// This file connects the Old World (db.js) to the New World (Svelte)

import { db } from "../../js/scholar/db.js";

function createRuntimeStore() {
  // 1. Define the Reactive State (The Truth)
  let state = $state({
    character: {
      name: "Unknown Traveler",
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      level: 1,
    },
    ready: false,
  });

  return {
    // Getters for the UI to consume
    get character() {
      return state.character;
    },
    get isReady() {
      return state.ready;
    },

    // 2. The Synchronization Protocol
    // Call this whenever the legacy engine changes data
    sync() {
      if (!db.data || !db.data.character) return;

      // Direct mapping from Legacy DB to Reactive State
      state.character = {
        name: db.data.character.about?.name || "Traveler",
        health: db.data.character.vitals?.health || 100,
        maxHealth: db.data.character.vitals?.maxHealth || 100,
        energy: db.data.character.vitals?.energy || 100,
        maxEnergy: db.data.character.vitals?.maxEnergy || 100,
        level: db.data.character.progression?.level || 1,
      };
      state.ready = true;

      // Debug Log (Optional)
      // console.log("📜 [Scholar] Runtime Synced:", state.character);
    },

    // Manual override for testing
    debug_damage(amount) {
      state.character.health = Math.max(0, state.character.health - amount);
    },
  };
}

export const runtime = createRuntimeStore();
