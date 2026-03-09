/**
 * src/state/app.svelte.js
 * 🛠️ UI: Interface State Manager
 * Manages modals, view states, and visual feedback using storyboard/storymode terminology.
 * ZERO NESTING — Flattened Schema only.
 */
import { db } from "@data/db.js"
import { openLightbox } from "@state/lightbox.svelte.js"
import { runtime } from "@state/runtime.svelte.js"
import { engineState } from "@state/status.svelte.js"
import { themeStore } from "@theme/palette.svelte.js"

// Static formatter to avoid 'new Date()' mutable instance warnings in reactive contexts
const logTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
})

export class AppStore {
    initialized = false

    // --- NAVIGATION ---
    view = $state("storyboard") // 'storyboard' | 'storymode'
    controlPanelOpen = $state(false)
    profileOpen = $state(false)

    // --- ENTITY SELECTION STATE (STORYBOARD) ---
    selectedAi = $state(null)
    selectedUser = $state(null)
    selectedFractal = $state(null)

    aiList = $state([])
    userList = $state([])
    fractalList = $state([])

    // --- ENTITY DRAWER STATE ---
    drawer = $state({
        open: false,
        type: null, // 'ai' | 'user' | 'fractal'
    })

    // --- NARRATIVE CONFIG ---
    prologue = $state("") // Starting directions/context

    // --- SIMULATION STATE ---
    simulation = $state({
        loading: false, // STASIS: True when Chrono is processing
    })

    // --- FATE SYSTEM ---
    fate = $state({
        active: false,
        hand: [],
        selected: null,
    })

    // --- UI TENSION (Reactive Intensity) ---
    tension = $derived(engineState.phase === "generating" || engineState.phase === "locked" ? 1 : 0)

    // --- SETTINGS ---
    settings = $state({
        sound: true,
        call_mode: false,
        stream_text: true,
        auto_scroll: true,
        dev_mode: false,
    })

    get turn() {
        return runtime.turn
    }
    set turn(val) {
        runtime.turn = val
    }

    // --- READINESS (Derived Logic) ---
    canStart = $derived(this.settings.dev_mode || (this.selectedAi && this.selectedUser))

    /** Legacy alias for storyboard readiness */
    get storyboardReady() {
        return this.canStart
    }

    // --- TELEMETRY (DevMode HUD) ---
    logs = $state([])
    causalityReport = $state({
        chaos: 0,
        intensity: 0,
        reflex: "Stable",
    })

    /**
     * Records a system event.
     * Uses Intl.format(Date.now()) to satisfy ESLint prefer-svelte-reactivity.
     */
    log(message, type = "system") {
        const entry = {
            id: Math.random().toString(36).substring(7),
            timestamp: logTimeFormatter.format(Date.now()),
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

        try {
            const entry = await db.kv_settings.get("rpg_settings")
            if (entry && entry.value) {
                this.settings = { ...this.settings, ...entry.value }
            }
        } catch (e) {
            console.error("[Security] Settings Hydration Failed:", e)
        }
    }

    saveSettings = async () => {
        if (typeof window === "undefined" || !this.settings) return

        try {
            await db.kv_settings.put({
                key: "rpg_settings",
                value: $state.snapshot(this.settings),
            })
        } catch (e) {
            console.error("[Security] Settings Save Failed:", e)
        }

        // Global Sync for non-Svelte legacy components
        if (typeof window !== "undefined") {
            window.RPGLITCH_CONFIG = {
                sound: this.settings.sound,
                auto_scroll: this.settings.auto_scroll,
                text_speed: this.settings.stream_text ? 30 : 0,
                dev_mode: this.settings.dev_mode,
            }
        }
    }

    // --- LLM STREAMING ---
    streaming = $state({
        active: false,
        content: "",
        nodeId: null,
    })

    // --- ACTIONS ---

    toggleControlPanel = () => {
        this.controlPanelOpen = !this.controlPanelOpen
    }

    setView = (view) => {
        this.view = view
    }

    openDrawer = (type) => {
        this.drawer.open = true
        this.drawer.type = type
    }

    closeDrawer = () => {
        this.drawer.open = false
        this.drawer.type = null
    }

    /**
     * Selects an entity for the current session.
     * Automatically normalizes the object to ensure a flattened schema.
     */
    selectEntity = (type, entity) => {
        const clean = themeStore.normalizeEntity(entity)
        if (type === "ai") this.selectedAi = clean
        else if (type === "user") this.selectedUser = clean
        else if (type === "fractal") this.selectedFractal = clean
        this.closeDrawer()
    }

    editingEntity = $state(null)

    /**
     * Toggles the profile modal and prepares the target entity for editing.
     */
    toggleProfile = (forceState = null, entity = null) => {
        if (forceState !== null) this.profileOpen = forceState
        else this.profileOpen = !this.profileOpen

        if (entity) {
            this.editingEntity = themeStore.normalizeEntity(entity)
        }
    }

    closeProfile = () => {
        this.profileOpen = false
    }

    openProfile = (entity) => {
        this.toggleProfile(true, entity)
    }

    profileTargetId = $derived(this.editingEntity?.id || null)
    profileTargetType = $derived(this.editingEntity?.type || null)

    // SETTINGS MUTATORS
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

    // STREAMING CONTROL
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

    openLightbox = (src, caption = "") => {
        openLightbox(src, caption)
    }

    /**
     * DEBUG: Force Storymode Entry
     * Bypasses storyboard selection checks.
     */
    forceStart = () => {
        console.warn("⚠️ FORCING STORYMODE START")
        this.view = "storymode"
    }
}

export const app = new AppStore()

if (typeof window !== "undefined") {
    window.app = app
    window.rpgApp = app
    window.state = app
}
