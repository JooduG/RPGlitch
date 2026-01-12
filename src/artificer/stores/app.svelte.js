// ⚒️ ARTIFICER: UI State Manager
class AppStore {
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

  // 🎛️ SETTINGS (User Preferences)
  settings = $state({
    sound: true, // Notification Sounds
    callMode: false, // UI Layout Mode
    streamText: true, // True = Real-time chunks, False = Instant
    autoScroll: true, // Follow chat
    devMode: false,
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

  toggleProfile = () => {
    this.profileOpen = !this.profileOpen;
  };

  setView = (v) => {
    this.view = v;
  };

  // Settings Mutators
  toggleSound = () => {
    this.settings.sound = !this.settings.sound;
  };

  toggleCallMode = () => {
    this.settings.callMode = !this.settings.callMode;
  };

  toggleStreamText = () => {
    this.settings.streamText = !this.settings.streamText;
  };

  toggleAutoScroll = () => {
    this.settings.autoScroll = !this.settings.autoScroll;
  };

  toggleDevMode = () => {
    this.settings.devMode = !this.settings.devMode;
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
