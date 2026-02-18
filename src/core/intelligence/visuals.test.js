import { describe, expect, it, vi } from "vitest"
import { VisualsService } from "./visuals.js"

// Mock dependencies
vi.mock("@core/engine/bus.js", () => ({
    events: { dispatchEvent: vi.fn() },
    EVENTS: {},
}))
vi.mock("@data/db.js", () => ({
    db: {},
}))
vi.mock("./broker.js", () => ({
    ContextBroker: {},
}))
vi.mock("./service.js", () => ({
    LlmService: {},
}))

describe("VisualsService", () => {
    describe("composeBasePrompt", () => {
        it("should strictly follow primacy hierarchy: Present > Eternal > Color", () => {
            const entity = {
                present: { physical: "wearing a trench coat" },
                eternal: { physical: "tall cyborg with glowing eyes" },
                visuals: { colorName: "neon blue" },
            }

            const prompt = VisualsService.composeBasePrompt(entity)
            const expectedStart =
                "wearing a trench coat, tall cyborg with glowing eyes, integrate neon blue into the image, potentially as background color"

            expect(prompt).toContain(expectedStart)
            expect(prompt).toContain(
                "high quality, hyper-realistic, volumetric lighting, 8k resolution"
            )
        })

        it("should convert known hex codes in signatureColor to semantic names", () => {
            const entity = {
                present: { physical: "robot" },
                visuals: { signatureColor: "#a855f7" }, // Royal Purple in config
            }

            const prompt = VisualsService.composeBasePrompt(entity)
            expect(prompt).toContain(
                "integrate Royal Purple into the image, potentially as background color"
            )
        })

        it("should ignore unknown hex codes in signatureColor", () => {
            const entity = {
                present: { physical: "robot" },
                visuals: { signatureColor: "#123456" }, // Unknown hex
            }

            const prompt = VisualsService.composeBasePrompt(entity)
            expect(prompt).not.toContain("#123456")
            expect(prompt).not.toContain("integrate")
        })

        it("should use signatureColor if it is NOT a hex code and colorName is missing", () => {
            const entity = {
                present: { physical: "robot" },
                visuals: { signatureColor: "crimson" },
            }

            const prompt = VisualsService.composeBasePrompt(entity)
            expect(prompt).toContain(
                "integrate crimson into the image, potentially as background color"
            )
        })

        it("should handle missing fields gracefully", () => {
            const entity = {
                present: { physical: "mysterious figure" },
            }

            const prompt = VisualsService.composeBasePrompt(entity)
            expect(prompt).toMatch(/^mysterious figure, high quality/)
        })
    })
})
