// 🛠️ UI: Interface State Manager
// Manages modals, view states, and visual feedback.
import { db } from "@data/db.js"
import { openLightbox } from "@state/lightbox.svelte.js"
import { runtime } from "@state/runtime.svelte.js"
import { engineState } from "@state/status.svelte.js" // [R5] Unified Engine State
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
    })

    // 🔮 FATE SYSTEM (Fortune)
    fate = $state({
        active: false, // UI Trigger (The Eye Opens)
        hand: [], // Cards available to pick
        selected: null, // The chosen card
    })

    // 🌩️ UI TENSION (Reactive Intensity)
    tension = $derived(engineState.phase === "generating" || engineState.phase === "locked" ? 1 : 0)

    // 🎛️ SETTINGS (User Preferences)
    settings = $state({
        sound: true, // Notification Sounds
        call_mode: false, // UI Layout Mode
        stream_text: true, // True = Real-time chunks, False = Instant
        auto_scroll: true, // Follow chat
        dev_mode: false,
    })
    get turn() {
        return runtime.turn
    }
    set turn(val) {
        runtime.turn = val
    }

    // 1. LOBBY READINESS (Derived Traceable Logic)
    canStart = $derived(this.settings.dev_mode || (this.selectedAi && this.selectedUser))

    // Legacy compat getter
    get lobbyReady() {
        return this.canStart
    }

    // 🧪 TELEMETRY (DevMode HUD)
    logs = $state([])
    causalityReport = $state({
        chaos: 0,
        intensity: 0,
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

        // [STABILITY] Defense against lost context or uninitialized state
        if (!this || !this.settings) {
            console.error("[Security] saveSettings: App context or settings lost.")
            return
        }

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
                auto_scroll: this.settings.auto_scroll,
                text_speed: this.settings.stream_text ? 30 : 0,
                dev_mode: this.settings.dev_mode,
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
        this.settings.call_mode = !this.settings.call_mode
        this.saveSettings()
    }

    toggleStreamText = () => {
        this.settings.stream_text = !this.settings.stream_text
        this.saveSettings()
    }

    toggleAutoScroll = () => {
        this.settings.auto_scroll = !this.settings.auto_scroll
        this.saveSettings()
    }

    toggleDevMode = () => {
        this.settings.dev_mode = !this.settings.dev_mode
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
