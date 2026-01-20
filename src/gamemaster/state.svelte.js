// ⚒️ ARTIFICER: UI State Manager
import { themeStore } from "../mesmer/logic/theme.svelte.js";

export class AppStore {
  initialized = false;
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
  // 📥 ENTITY DRAWER STATE
  drawer = $state({
    open: false,
    type: null, // 'ai' | 'user' | 'fractal'
  });

  // 🧬 SIMULATION STATE (The Heartbeat)
  simulation = $state({
    loading: false, // STASIS: True when Chrono is processing
    turn: 0, // CHRONO: Current time step
    feed: [], // NARRATIVE: The story so far
    status: "idle", // idle | generating | saving
  });

  // 🔮 FATE SYSTEM (Fortune)
  fate = $state({
    active: false, // UI Trigger (The Eye Opens)
    hand: [], // Cards available to pick
    selected: null, // The chosen card
  });

  // 🌩️ UI TENSION (Reactive Intensity)
  tension = $derived(
    ["scanning reality", "synthesizing", "saving"].includes(
      this.simulation.status,
    )
      ? 1
      : 0,
  );

  // 🎛️ SETTINGS (User Preferences)
  settings = $state({
    sound: true, // Notification Sounds
    callMode: false, // UI Layout Mode
    streamText: true, // True = Real-time chunks, False = Instant
    autoScroll: true, // Follow chat
    devMode: false,
    debugMode: false, // Diagnostic HUD
  });

  // 1. LOBBY READINESS (Derived Traceable Logic)
  canStart = $derived(
    this.settings.devMode || (this.selectedAi && this.selectedUser),
  );

  // Legacy compat getter
  get lobbyReady() {
    return this.canStart;
  }

  // 🧪 TELEMETRY (Developer HUD)
  logs = $state([]);
  causalityReport = $state({
    entropy: 0,
    velocity: 0,
    reflex: "Stable",
  });

  log(message, type = "system") {
    const entry = {
      id: Math.random().toString(36).substring(7),
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      timestamp: new Date().toLocaleTimeString(),
      message,
      type, // 'system' | 'ai' | 'db' | 'error'
    };
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();
    console.debug(`[Telemetry:${type.toUpperCase()}] ${message}`);
  }

  // --- LIFECYCLE ---

  init() {
    if (typeof window === "undefined" || this.initialized) return;
    this.initialized = true;

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

  //  STREAMING STATE (Real-time data from LLM)
  streaming = $state({
    active: false,
    content: "",
    nodeId: null, // ID of the message being generated
  });

  // Actions
  toggleControlPanel = () => {
    this.controlPanelOpen = !this.controlPanelOpen;
  };

  // Drawer Actions
  openDrawer = (type) => {
    this.drawer.open = true;
    this.drawer.type = type;
  };

  closeDrawer = () => {
    this.drawer.open = false;
    this.drawer.type = null;
  };

  selectEntity = (type, entity) => {
    if (type === "ai") this.selectedAi = entity;
    else if (type === "user") this.selectedUser = entity;
    else if (type === "fractal") this.selectedFractal = entity;
    this.closeDrawer();
  };
  editingEntity = $state(null);

  toggleProfile = (forceState = null, entity = null) => {
    if (forceState !== null) {
      this.profileOpen = forceState;
    } else {
      this.profileOpen = !this.profileOpen;
    }

    // If opening with a specific entity, normalize and set it
    if (entity) {
      this.editingEntity = themeStore.normalizeEntity(entity);
    }
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

  toggleDebugMode = () => {
    this.settings.debugMode = !this.settings.debugMode;
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

  /**
   * DEBUG: Force Start Game
   * Bypasses lobby checks.
   */
  forceStart = () => {
    console.warn("⚠️ FORCING GAME START");
    this.view = "game";
  };
}

export const app = new AppStore();

if (typeof window !== "undefined") {
  window.app = app;
  window.rpgApp = app;
  window.state = app; // [LEGACY BRIDGE] Map global state to new reactive store
}
