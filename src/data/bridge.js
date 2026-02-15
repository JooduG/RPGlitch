/**
 * @file src/warden/bridge.js
 * @description The Perchance Bridge acts as a safe adapter for the native `oc` object.
 * It isolates the application from the chaotic environment of the host window.
 */

class PerchanceBridge {
    constructor() {
        this._mockMode = typeof window === "undefined" || !window.oc
        if (this._mockMode) {
            console.warn(
                "[Security:Bridge] Native 'oc' object not found. Running in Mock Mode."
            )
        }
    }

    /**
     * Checks if the bridge is connected to a live Perchance environment.
     * @returns {boolean}
     */
    get isReady() {
        return !this._mockMode
    }

    /**
     * Safely retrieves the current character metadata from the host.
     * @returns {{ name: string, description: string }}
     */
    get character() {
        if (this._mockMode) {
            return {
                name: "Mock User",
                description:
                    "A phantom entity manifested for testing purposes.",
            }
        }
        return {
            name: "Unknown",
            description: "",
            .../** @type {any} */ (window.oc.character || {}),
        }
    }

    /**
     * Safe wrapper for `oc.thread.on`.
     * @param {string} event - The event name to listen for.
     * @param {(...args: any[]) => void} callback - The callback to execute.
     */
    on(event, callback) {
        if (this._mockMode) {
            // In mock mode, we just verify the arguments are valid but do nothing.
            if (typeof event !== "string" || typeof callback !== "function") {
                console.error("[Security:Bridge] Invalid arguments for .on()")
            }
            return
        }
        try {
            window.oc.thread.on(event, callback)
        } catch (err) {
            console.error(
                `[Security:Bridge] Failed to attach listener for '${event}':`,
                err
            )
        }
    }

    /**
     * Safe wrapper for reading custom thread data.
     * @returns {any}
     */
    get customData() {
        if (this._mockMode) return {}
        return window.oc.thread.customData || {}
    }
}

// Singleton Instance
export const bridge = new PerchanceBridge()
