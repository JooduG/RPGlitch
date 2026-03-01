/**
 * src/media/audio.js
 * 🎵 AUDIO SERVICE
 * Handles sound effects and text-to-speech.
 */

import { db } from "@data/db.js"
import { textToSpeech } from "./speech_engine.svelte.js"

const STORAGE_KEY = "rpglitch_audio_settings"

class SoundEffectsService {
    constructor() {
        this.audioContext = null
        this.buffers = new Map()
        this.unlocked = false
        this.lastPlayed = 0
        this.threshold = 500 // debounce in ms
        this.notificationsEnabled = true
    }

    async initSettings() {
        try {
            const entry = await db.audio_prefs.get(STORAGE_KEY)
            if (entry && entry.value) {
                this.notificationsEnabled = !!entry.value.notificationsEnabled
            }
        } catch (e) {
            console.warn("[Polish] Failed to load settings:", e)
        }
    }

    async setNotifications(enabled) {
        this.notificationsEnabled = !!enabled
        try {
            await db.audio_prefs.put({
                key: STORAGE_KEY,
                value: { notificationsEnabled: this.notificationsEnabled },
            })
        } catch (e) {
            console.error("[Polish] Failed to save audio settings:", e)
        }
    }

    init() {
        const unlockHandler = () => {
            this.unlock()
            document.body.removeEventListener("click", unlockHandler)
            document.body.removeEventListener("touchstart", unlockHandler)
            document.body.removeEventListener("keydown", unlockHandler)
        }

        document.body.addEventListener("click", unlockHandler)
        document.body.addEventListener("touchstart", unlockHandler)
        document.body.addEventListener("keydown", unlockHandler)
    }

    async unlock() {
        if (this.unlocked) return

        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
            }

            if (this.audioContext.state === "suspended") {
                await this.audioContext.resume()
            }

            this.unlocked = true
        } catch (e) {
            console.warn("[Polish] Failed to unlock AudioContext:", e)
        }
    }

    async play(key) {
        if (key === "notification" && !this.notificationsEnabled) {
            return
        }

        if (!this.unlocked || !this.audioContext) return

        const now = Date.now()
        if (now - this.lastPlayed < this.threshold) {
            return
        }
        this.lastPlayed = now

        let url = null

        if (window.rpgLists?.sounds) {
            try {
                let soundList = window.rpgLists.sounds
                if (Array.isArray(soundList) && soundList.length > 0) {
                    try {
                        if (typeof soundList[0] === "string" && soundList[0].trim().startsWith("[")) {
                            soundList = JSON.parse(soundList[0])
                        }
                        if (!Array.isArray(soundList)) soundList = []
                    } catch (e) {
                        console.warn("[Polish] JSON parse warning:", e)
                        soundList = []
                    }
                } else {
                    soundList = []
                }

                if (Array.isArray(soundList)) {
                    const soundEntry = soundList.find((s) => typeof s === "string" && s.startsWith(key))
                    if (soundEntry) {
                        const parts = soundEntry.split("=")
                        if (parts.length > 1) {
                            url = parts.slice(1).join("=").trim()
                        }
                    }
                }
            } catch (e) {
                console.error("[Polish] Config lookup failed:", e)
            }
        }

        if (!url && key === "notification") {
            url = "https://user.uploads.dev/file/50dc061d6ed6439719d283d042e9c172.wav"
        }

        if (!url) return

        try {
            let buffer = this.buffers.get(key)
            if (!buffer) {
                const response = await fetch(url)
                const arrayBuffer = await response.arrayBuffer()
                buffer = await this.audioContext.decodeAudioData(arrayBuffer)
                this.buffers.set(key, buffer)
            }

            const source = this.audioContext.createBufferSource()
            source.buffer = buffer
            source.connect(this.audioContext.destination)
            source.start(0)
        } catch (e) {
            console.warn("[Polish] Playback error:", e)
        }
    }
}

const soundEffects = new SoundEffectsService()

export const Audio = {
    /**
     * The Native Voice Store (Svelte 5 Reactive)
     * Usage: Audio.voice.speak("Hello")
     * usage: $derived(Audio.voice.isSpeaking)
     */
    voice: textToSpeech,

    /**
     * Play a sound effect or notification.
     * @param {string} soundId - "notification", "click", "error", etc.
     */
    play: (soundId) => {
        return soundEffects.play(soundId)
    },

    // Expose for initialization
    _effects: soundEffects,
}
