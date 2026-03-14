import { LlmService } from "@core/intelligence/LlmService.js"
import { describe, expect, it, vi } from "vitest"
import { ImageGeneration } from "./image_engine.js"
import { PromptEngine } from "./image_prompts.js"

// Mock dependencies
vi.mock("@data/db.js", () => ({
    db: {},
}))
vi.mock("@core/intelligence/ContextBroker.js", () => ({
    ContextBroker: {},
}))
vi.mock("@core/intelligence/intelligence_service.js", () => ({
    LlmService: {
        generate: vi.fn(),
    },
}))

describe("ImageGeneration", () => {
    describe("composeBasePrompt", () => {
        it("should strictly follow primacy hierarchy: Present > Eternal > Color", () => {
            const entity = {
                present: { physical: "wearing a trench coat" },
                eternal: { physical: "tall cyborg with glowing eyes" },
                visuals: { colorName: "neon blue" },
            }

            const prompt = ImageGeneration.composeBasePrompt(entity)
            const expectedStart = "wearing a trench coat, tall cyborg with glowing eyes, integrate neon blue into the image, potentially as background color"

            expect(prompt).toContain(expectedStart)
            expect(prompt).toContain("high quality, hyper-realistic, volumetric lighting, 8k resolution")
        })

        it("should convert known hex codes in signature_color to semantic names", () => {
            const entity = {
                present: { physical: "robot" },
                signature_color: "#a855f7", // Royal Purple in config
            }

            const prompt = ImageGeneration.composeBasePrompt(entity)
            expect(prompt).toContain("integrate Royal Purple into the image, potentially as background color")
        })

        it("should ignore unknown hex codes in signature_color", () => {
            const entity = {
                present: { physical: "robot" },
                signature_color: "#123456", // Unknown hex
            }

            const prompt = ImageGeneration.composeBasePrompt(entity)
            expect(prompt).not.toContain("#123456")
            expect(prompt).not.toContain("integrate")
        })

        it("should use signature_color if it is NOT a hex code and colorName is missing", () => {
            const entity = {
                present: { physical: "robot" },
                signature_color: "crimson",
            }

            const prompt = ImageGeneration.composeBasePrompt(entity)
            expect(prompt).toContain("integrate crimson into the image, potentially as background color")
        })

        it("should handle missing fields gracefully", () => {
            const entity = {
                present: { physical: "mysterious figure" },
            }

            const prompt = ImageGeneration.composeBasePrompt(entity)
            expect(prompt).toMatch(/^mysterious figure, high quality/)
        })
    })

    describe("AestheticRouter", () => {
        it("should select matching tokens from panel lists", async () => {
            // Use vi.stubGlobal for cleaner window mocking
            vi.stubGlobal("window", {
                rpgLists: {
                    styles: ["Cyberpunk, high tech", "Oil Painting, classical"],
                    lighting: ["Neon glow, city lights", "Natural light"],
                    mood: ["Gritty, harsh", "Peaceful"],
                    quality: ["4k resolution"],
                },
            })

            const characterData = {
                physical: "A cyberpunk gritty cyborg with a neon glow",
                fragments: ["Cybernetic"],
            }

            // Mock LlmService.generate to see the system prompt
            LlmService.generate = vi.fn().mockImplementation((payload) => {
                return payload.system
            })

            const result = await PromptEngine.optimize("A character", characterData)

            // Should contain matches
            expect(result).toContain("Cyberpunk")
            expect(result).toContain("Neon glow")
            expect(result).toContain("Gritty")
            expect(result).toContain("4k resolution")

            vi.unstubAllGlobals()
        })

        it("should fallback to quality tokens if no matches found", async () => {
            vi.stubGlobal("window", {
                rpgLists: {
                    styles: ["Cyberpunk"],
                    lighting: ["Neon"],
                    mood: ["Gritty"],
                    quality: ["professional photography"],
                },
            })

            const characterData = { physical: "a flower in a field" }

            LlmService.generate = vi.fn().mockImplementation((payload) => {
                return payload.system
            })

            const result = await PromptEngine.optimize("A flower", characterData)

            expect(result).toContain("professional photography")
            expect(result).not.toContain("Cyberpunk")

            vi.unstubAllGlobals()
        })
    })
})
