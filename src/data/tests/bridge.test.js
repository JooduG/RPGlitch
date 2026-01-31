import { afterEach, describe, expect, it, vi } from "vitest"
import { bridge } from "../bridge.js"

describe("PerchanceBridge", () => {
    // Save original window object
    const originalWindow = global.window

    afterEach(() => {
        // Restore window after each test
        global.window = originalWindow
        vi.clearAllMocks()
    })

    it("should be in mock mode when window.oc is undefined", () => {
        // Force mock mode
        // @ts-ignore
        global.window = /** @type {any} */ ({})

        // We need to re-instantiate or check internal state if possible,
        // but since bridge is a singleton export, we might need to test the exposed instance behavior
        // based on the environment it was imported in.
        // Note: Since 'bridge' is instantiated at module level, it captures the state at import time.
        // However, the getters check internal state or window access dynamically?
        // Let's check the implementation:
        // The constructor sets 'this._mockMode'.
        // So if it was imported in a test environment without window.oc, it's already in mock mode.

        expect(bridge.isReady).toBe(false)
        expect(bridge.character.name).toBe("Mock User")
    })

    it("should safely handle .on() calls in mock mode", () => {
        const consoleSpy = vi.spyOn(console, "error")
        bridge.on("MessageCreated", () => {})
        expect(consoleSpy).not.toHaveBeenCalled()

        // Invalid args
        bridge.on(
            /** @type {any} */ (123),
            /** @type {any} */ ("not-a-function")
        )
        expect(consoleSpy).toHaveBeenCalledWith(
            "[Warden:Bridge] Invalid arguments for .on()"
        )
    })

    // Note: Testing the "Live" mode is tricky because the singleton is already instantiated.
    // We would need to modify the bridge.js to allow re-initialization or use `vi.mock` on the module itself.
    // For now, testing the Default (Mock) behavior is sufficient for CI/CD.
})
