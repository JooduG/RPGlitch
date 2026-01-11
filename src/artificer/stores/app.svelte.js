export class AppStore {
  view = $state("lobby"); // 'lobby' | 'story'

  // Selection State
  selectedAi = $state(null);
  selectedUser = $state(null);
  selectedFractal = $state(null);

  // Entity Lists (Cached)
  aiList = $state([]);
  userList = $state([]);
  fractalList = $state([]);

  // Session State
  messages = $state([]);

  constructor() {
    // Listen for GameMaster events
    if (typeof window !== "undefined") {
      window.addEventListener("rpglitch:chat-refresh", (e) => {
        // detail.storyId is available if needed
        this.syncMessages();
      });

      window.addEventListener("rpglitch:story-loaded", () => {
        this.syncMessages();
      });
    }
  }

  async syncMessages() {
    // We can pull directly from the legacy store or Session
    // For now, let's use the GameMaster facade if available, or just the legacy store global
    if (window.GameMaster) {
      // We might need a way to get messages synchronously or via async access
      // The legacy store is `state` from `store.js`.
      // Let's use the exposed `store` from `index.js` which is put on window.rpgStore in bootstrap?
      // Actually, let's just use the GameMaster.loadMessages() pattern or better yet, read from the event detail if possible?
      // The event detail doesn't have messages.
      // Let's assume we can access the global `rpgStore` or similar if we exposed it.
      // Bootstrap.js mounts `window.GameMaster`.
      const msgs = await window.GameMaster.loadMessages(
        window.GameMaster.requireActive(),
      );
      this.messages = msgs;
    }
  }

  setView(view) {
    this.view = view;
  }

  select(type, entity) {
    if (type === "ai") this.selectedAi = entity;
    if (type === "user") this.selectedUser = entity;
    if (type === "fractal") this.selectedFractal = entity;
  }
}

export const app = new AppStore();
