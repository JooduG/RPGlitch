import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

describe("PerchanceBridge", () => {
    let bridge

    beforeEach(async () => {
        // Clear modules to re-evaluate bridge.js and re-instantiate the singleton
        vi.resetModules()

        // Mock console.warn and console.error
        vi.spyOn(console, "warn").mockImplementation(() => {})
        vi.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
        // Clean up global mutations
        if (typeof window !== "undefined") {
            delete window.oc
        }
    })

    describe("Mock Mode", () => {
        beforeEach(async () => {
            // Ensure window.oc is undefined
            if (typeof window !== "undefined") {
                delete window.oc
            }

            // Dynamically import to get a fresh instance
            const module = await import("./bridge.js")
            bridge = module.bridge
        })

        it("should log a warning on instantiation", () => {
            expect(console.warn).toHaveBeenCalledWith("[Security:Bridge] Native 'oc' object not found. Running in Mock Mode.")
        })

        it("should not be ready", () => {
            expect(bridge.isReady).toBe(false)
        })

        it("should return mock character data", () => {
            expect(bridge.character).toEqual({
                name: "Mock User",
                description: "A phantom entity manifested for testing purposes.",
            })
        })

        it("should log an error and do nothing for invalid .on() arguments", () => {
            bridge.on(123, null)
            expect(console.error).toHaveBeenCalledWith("[Security:Bridge] Invalid arguments for .on()")
        })

        it("should do nothing for valid .on() arguments", () => {
            bridge.on("event", () => {})
            // Just verifying it doesn't throw
            expect(console.error).not.toHaveBeenCalled()
        })

        it("should return empty object for customData", () => {
            expect(bridge.customData).toEqual({})
        })
    })

    describe("Live Mode", () => {
        let mockOc

        beforeEach(async () => {
            // Setup mock window.oc
            mockOc = {
                character: {
                    name: "Live User",
                    description: "A real character",
                    extra: "data",
                },
                thread: {
                    on: vi.fn(),
                    customData: {
                        foo: "bar",
                    },
                },
            }
            window.oc = mockOc

            // Dynamically import to get a fresh instance
            const module = await import("./bridge.js")
            bridge = module.bridge
        })

        it("should not log a warning on instantiation", () => {
            expect(console.warn).not.toHaveBeenCalled()
        })

        it("should be ready", () => {
            expect(bridge.isReady).toBe(true)
        })

        it("should return merged character data", () => {
            expect(bridge.character).toEqual({
                name: "Live User",
                description: "A real character",
                extra: "data",
            })
        })

        it("should handle missing character data gracefully", () => {
            window.oc.character = null
            expect(bridge.character).toEqual({
                name: "Unknown",
                description: "",
            })
        })

        it("should handle non-object character data gracefully", () => {
            window.oc.character = "invalid-data"
            expect(bridge.character).toEqual({
                name: "Unknown",
                description: "",
            })
        })

        it("should delegate .on() to window.oc.thread.on", () => {
            const callback = vi.fn()
            bridge.on("testEvent", callback)
            expect(mockOc.thread.on).toHaveBeenCalledWith("testEvent", callback)
        })

        it("should catch and log errors from window.oc.thread.on", () => {
            const error = new Error("Test error")
            mockOc.thread.on.mockImplementation(() => {
                throw error
            })

            bridge.on("testEvent", () => {})
            expect(console.error).toHaveBeenCalledWith("[Security:Bridge] Failed to attach listener for 'testEvent':", error)
        })

        it("should return customData from window.oc.thread", () => {
            expect(bridge.customData).toEqual({ foo: "bar" })
        })

        it("should handle missing customData gracefully", () => {
            window.oc.thread.customData = null
            expect(bridge.customData).toEqual({})
        })

        it("should handle a missing 'thread' object gracefully for customData", () => {
            window.oc.thread = undefined
            // This currently throws, but should ideally return {}
            expect(bridge.customData).toEqual({})
        })

        it("should handle a missing 'thread' object gracefully for .on()", () => {
            window.oc.thread = undefined
            bridge.on("testEvent", () => {})
            expect(console.error).toHaveBeenCalledWith(`[Security:Bridge] Failed to attach listener for 'testEvent':`, expect.any(TypeError))
        })
    })
})
