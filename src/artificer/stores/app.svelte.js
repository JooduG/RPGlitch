// ⚒️ ARTIFICER: UI State Manager
export const app = $state({
  // Navigation
  view: "lobby", // 'lobby' | 'game'
  controlPanelOpen: false,

  // 🎛️ SETTINGS (User Preferences)
  settings: {
    sound: true, // Notification Sounds
    callMode: false, // UI Layout Mode
    streamText: true, // True = Real-time chunks, False = Instant
    autoScroll: true, // Follow chat
    devMode: false,
  },

  // 🌊 STREAMING STATE (Real-time data from LLM)
  streaming: {
    active: false,
    content: "",
    nodeId: null, // ID of the message being generated
  },

  // Actions
  toggleControlPanel() {
    this.controlPanelOpen = !this.controlPanelOpen;
  },
  setView(v) {
    this.view = v;
  },

  // Settings Mutators
  toggleSound() {
    this.settings.sound = !this.settings.sound;
  },
  toggleCallMode() {
    this.settings.callMode = !this.settings.callMode;
  },
  toggleStreamText() {
    this.settings.streamText = !this.settings.streamText;
  },
  toggleAutoScroll() {
    this.settings.autoScroll = !this.settings.autoScroll;
  },
  toggleDevMode() {
    this.settings.devMode = !this.settings.devMode;
  },

  // Streaming Mutators (Called by GameMaster/LLM)
  startStream(id) {
    this.streaming.active = true;
    this.streaming.content = "";
    this.streaming.nodeId = id;
  },

  updateStream(chunk) {
    this.streaming.content += chunk;
  },

  endStream() {
    this.streaming.active = false;
    this.streaming.nodeId = null;
  },
});
