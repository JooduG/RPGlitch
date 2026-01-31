// 👑 GAMEMASTER: The Silent Observer
// Tracks the heartbeat of the engine without revealing it.

export const status = $state({
  isBusy: false,

  // Actions
  setBusy(val) {
    this.isBusy = val;
  },

  // Event Listener Bridge
  init() {
    if (typeof window === "undefined") return;

    // Listen for GameMaster Events
    document.addEventListener("rpg:typing-start", () => this.setBusy(true));
    document.addEventListener("rpg:typing-stop", () => this.setBusy(false));
  },
});
