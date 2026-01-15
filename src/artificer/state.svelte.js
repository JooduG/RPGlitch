// ⚒️ ARTIFICER: UI State Manager
import { themeStore } from "../mesmer/logic/theme.svelte.js";

export class AppStore {
  // Navigation
  view = $state("lobby"); // 'lobby' | 'game'
  controlPanelOpen = $state(false);
  profileOpen = $state(false);

  // 🎭 LOBBY SELECTION STATE
  selectedAi = $state(null);
  selectedUser = $state(null);
  selectedFractal = $state(null);
  aiList = $state([]);
  userList = $state([]);
  fractalList = $state([]);
  lobbyReady = $state(false);

  // 🧬 SIMULATION STATE (The Heartbeat)
  simulation = $state({
    loading: false, // STASIS: True when Chrono is processing
    turn: 0, // CHRONO: Current time step
    feed: [], // NARRATIVE: The story so far
    status: "idle", // idle | generating | saving
  });

  // 🎛️ SETTINGS (User Preferences)
  settings = $state({
    sound: true, // Notification Sounds
    callMode: false, // UI Layout Mode
    streamText: true, // True = Real-time chunks, False = Instant
    autoScroll: true, // Follow chat
    devMode: false,
  });

  // --- LIFECYCLE ---

  init() {
    if (typeof window === "undefined") return;

    // 1. Load Settings
    const saved = localStorage.getItem("rpg_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge to ensure new keys are preserved
        this.settings = { ...this.settings, ...parsed };
      } catch (e) {
        console.error("[Warden] Settings Corrupt:", e);
      }
    }
  }

  saveSettings() {
    if (typeof window === "undefined") return;
    localStorage.setItem("rpg_settings", JSON.stringify(this.settings));

    // 2. Broadcast to Legacy Global (Immediate Sync)
    // This is important for parts of the app that still rely on the global config
    if (typeof window !== "undefined") {
      window.RPGLITCH_CONFIG = {
        sound: this.settings.sound,
        autoScroll: this.settings.autoScroll,
        textSpeed: this.settings.streamText ? 30 : 0,
        devMode: this.settings.devMode,
      };
    }
  }

  // 🎭 MESMER: Visual Experience (Lightbox)
  lightbox = $state({
    active: false,
    src: null,
    caption: "",
  });

  // 🌊 STREAMING STATE (Real-time data from LLM)
  streaming = $state({
    active: false,
    content: "",
    nodeId: null, // ID of the message being generated
  });

  // Actions
  toggleControlPanel = () => {
    this.controlPanelOpen = !this.controlPanelOpen;
  };

  editingEntity = $state(null);

  toggleProfile = (forceState = null, entity = null) => {
    if (forceState !== null) {
      this.profileOpen = forceState;
    } else {
      this.profileOpen = !this.profileOpen;
    }

    // If opening with a specific entity, set it
    // If just toggling, we might keep previous or default
    if (entity) {
      this.editingEntity = this.normalizeEntity(entity);
    }
  };

  /**
   * Ensure entity has all required UI properties to prevent rendering crashes
   */
  normalizeEntity(entity) {
    return themeStore.normalizeEntity(entity);
  }

  setView = (v) => {
    this.view = v;
  };

  // Lightbox Actions
  openLightbox = (src, caption = "") => {
    this.lightbox.active = true;
    this.lightbox.src = src;
    this.lightbox.caption = caption;
  };

  closeLightbox = () => {
    this.lightbox.active = false;
    this.lightbox.src = null;
  };

  // Settings Mutators (Auto-Save)
  toggleSound = () => {
    this.settings.sound = !this.settings.sound;
    this.saveSettings();
  };

  toggleCallMode = () => {
    this.settings.callMode = !this.settings.callMode;
    this.saveSettings();
  };

  toggleStreamText = () => {
    this.settings.streamText = !this.settings.streamText;
    this.saveSettings();
  };

  toggleAutoScroll = () => {
    this.settings.autoScroll = !this.settings.autoScroll;
    this.saveSettings();
  };

  toggleDevMode = () => {
    this.settings.devMode = !this.settings.devMode;
    this.saveSettings();
  };

  // Streaming Mutators (Called by GameMaster/LLM)
  startStream = (id) => {
    this.streaming.active = true;
    this.streaming.content = "";
    this.streaming.nodeId = id;
  };

  updateStream = (chunk) => {
    this.streaming.content += chunk;
  };

  endStream = () => {
    this.streaming.active = false;
    this.streaming.nodeId = null;
  };
}

export const app = new AppStore();

if (typeof window !== "undefined") {
  window.app = app;
  window.rpgApp = app;
}
