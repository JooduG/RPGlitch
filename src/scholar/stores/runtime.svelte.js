// 📜 SCHOLAR: The Runtime State
function createRuntimeStore() {
  let state = $state({
    character: {
      name: "Unknown",
      description: "",

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
  });

  return {
    get character() {
      return state.character;
    },
    get isReady() {
      return state.ready;
    },

    // Actions
    updateCharacter(data) {
      Object.assign(state.character, data);
    },
    sync() {},
  };
}

export const runtime = createRuntimeStore();
