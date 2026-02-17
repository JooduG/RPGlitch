// 🛠️ UI: Interface State Manager
// Manages modals, view states, and visual feedback.
import { db } from "@data/db.js"
import { openLightbox } from "@state/lightbox.svelte.js"
import { themeStore } from "@theme/palette.svelte.js"

export class AppStore {
    initialized = false
    // Navigation
    view = $state("lobby") // 'lobby' | 'game'
    controlPanelOpen = $state(false)
    profileOpen = $state(false)

    // 🎭 LOBBY SELECTION STATE
    selectedAi = $state(null)
    selectedUser = $state(null)
    selectedFractal = $state(null)
    aiList = $state([])
    userList = $state([])
    fractalList = $state([])
    // 📥 ENTITY DRAWER STATE
    drawer = $state({
        open: false,
        type: null, // 'ai' | 'user' | 'fractal'
    })

    // 📖 NARRATIVE CONFIG
    prologue = $state("") // User directions for the start

    // 🧬 SIMULATION STATE (The Heartbeat)
    simulation = $state({
        loading: false, // STASIS: True when Chrono is processing
        turn: 0, // CHRONO: Current time step
        // feed: [], // MOVED TO @state/messages.svelte.js
        status: "idle", // idle | generating | saving
        generatingRole: "ai", // [R5] Tracks who is currently thinking (ai | fractal | user)
    })

    // 🔮 FATE SYSTEM (Fortune)
    fate = $state({
        active: false, // UI Trigger (The Eye Opens)
        hand: [], // Cards available to pick
        selected: null, // The chosen card
    })

    // 🌩️ UI TENSION (Reactive Intensity)
    tension = $derived(
        ["scanning reality", "synthesizing", "saving"].includes(
            this.simulation.status
        )
            ? 1
            : 0
    )

    // 🎛️ SETTINGS (User Preferences)
    settings = $state({
        sound: true, // Notification Sounds
        callMode: false, // UI Layout Mode
        streamText: true, // True = Real-time chunks, False = Instant
        autoScroll: true, // Follow chat
        devMode: false,
    })

    // 1. LOBBY READINESS (Derived Traceable Logic)
    canStart = $derived(
        this.settings.devMode || (this.selectedAi && this.selectedUser)
    )

    // Legacy compat getter
    get lobbyReady() {
        return this.canStart
    }

    // 🧪 TELEMETRY (DevMode HUD)
    logs = $state([])
    causalityReport = $state({
        entropy: 0,
        velocity: 0,
        reflex: "Stable",
    })

    log(message, type = "system") {
        const entry = {
            id: Math.random().toString(36).substring(7),
            // eslint-disable-next-line svelte/prefer-svelte-reactivity
            timestamp: new Date().toLocaleTimeString(),
            message,
            type, // 'system' | 'ai' | 'db' | 'error'
        }
        this.logs.unshift(entry)
        if (this.logs.length > 100) this.logs.pop()
        console.debug(`[Telemetry:${type.toUpperCase()}] ${message}`)
    }

    // --- LIFECYCLE ---

    async init() {
        if (typeof window === "undefined" || this.initialized) return
        this.initialized = true

        // 1. Load Settings from Dexie
        try {
            const entry = await db.kv_settings.get("rpg_settings")
            if (entry && entry.value) {
                // Merge to ensure new keys are preserved
                this.settings = { ...this.settings, ...entry.value }
            }
        } catch (e) {
            console.error("[Security] Settings Hydration Failed:", e)
        }
    }

    saveSettings = async () => {
        if (typeof window === "undefined") return

        try {
            await db.kv_settings.put({
                key: "rpg_settings",
                value: $state.snapshot(this.settings),
            })
        } catch (e) {
            console.error("[Security] Settings Save Failed:", e)
        }

        // 2. Broadcast to Legacy Global (Immediate Sync)
        if (typeof window !== "undefined") {
            window.RPGLITCH_CONFIG = {
                sound: this.settings.sound,
                autoScroll: this.settings.autoScroll,
                textSpeed: this.settings.streamText ? 30 : 0,
                devMode: this.settings.devMode,
            }
        }
    }

    //  STREAMING STATE (Real-time data from LLM)
    streaming = $state({
        active: false,
        content: "",
        nodeId: null, // ID of the message being generated
    })

    // Actions
    toggleControlPanel = () => {
        this.controlPanelOpen = !this.controlPanelOpen
    }

    setView = (view) => {
        this.view = view
    }

    rerollTitle = async () => {
        /*
        const titles = [
            "The Echo of Silence",
            "Neon Shadows",
            "Fractal Dreams",
            "Velvet Thunder",
            "Code & Chrome",
        ]
        */
        // Random selection for now
    }

    // Drawer Actions
    openDrawer = (type) => {
        this.drawer.open = true
        this.drawer.type = type
    }

    closeDrawer = () => {
        this.drawer.open = false
        this.drawer.type = null
    }

    selectEntity = (type, entity) => {
        if (type === "ai") this.selectedAi = entity
        else if (type === "user") this.selectedUser = entity
        else if (type === "fractal") this.selectedFractal = entity
        this.closeDrawer()
    }
    editingEntity = $state(null)

    toggleProfile = (forceState = null, entity = null) => {
        if (forceState !== null) {
            this.profileOpen = forceState
        } else {
            this.profileOpen = !this.profileOpen
        }

        // If opening with a specific entity, normalize and set it
        if (entity) {
            this.editingEntity = themeStore.normalizeEntity(entity)
        }
    }

    closeProfile = () => {
        this.profileOpen = false
    }

    profileTargetId = $derived(this.editingEntity?.id || null)
    profileTargetType = $derived(this.editingEntity?.type || null)

    /**
     * Alias for toggleProfile to match clearer intent
     * @param {Object} entity - The entity to edit
     */
    openProfile = (entity) => {
        this.toggleProfile(true, entity)
    }

    // Settings Mutators (Auto-Save)
    toggleSound = () => {
        this.settings.sound = !this.settings.sound
        this.saveSettings()
    }

    toggleCallMode = () => {
        this.settings.callMode = !this.settings.callMode
        this.saveSettings()
    }

    toggleStreamText = () => {
        this.settings.streamText = !this.settings.streamText
        this.saveSettings()
    }

    toggleAutoScroll = () => {
        this.settings.autoScroll = !this.settings.autoScroll
        this.saveSettings()
    }

    toggleDevMode = () => {
        this.settings.devMode = !this.settings.devMode
        this.saveSettings()
    }

    // Streaming Mutators (Called by Engine/LLM)
    startStream = (id) => {
        this.streaming.active = true
        this.streaming.content = ""
        this.streaming.nodeId = id
    }

    updateStream = (chunk) => {
        this.streaming.content += chunk
    }

    endStream = () => {
        this.streaming.active = false
        this.streaming.nodeId = null
    }

    /**
     * Lightbox Controls (Proxied to Polish)
     */
    openLightbox = (src, caption = "") => {
        openLightbox(src, caption)
    }

    /**
     * DEBUG: Force Start Game
     * Bypasses lobby checks.
     */
    forceStart = () => {
        console.warn("⚠️ FORCING GAME START")
        this.view = "game"
    }
}

export const app = new AppStore()

if (typeof window !== "undefined") {
    window.app = app
    window.rpgApp = app
    window.state = app // [LEGACY BRIDGE] Map global state to new reactive store
}
