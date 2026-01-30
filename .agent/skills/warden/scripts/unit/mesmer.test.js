import { beforeEach, describe, expect, test, vi } from "vitest"
import { soundEffects } from "../../../../../src/mesmer/audio/sound-effects.js"
import { Mesmer } from "../../../../../src/mesmer/index.js"

// Mock dependencies
vi.mock("../../../../../src/mesmer/audio/sound-effects.js")

describe("Mesmer Engine", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("Audio (Identity)", () => {
        test("play() delegates to audioService", () => {
            Mesmer.play("notification")
            expect(soundEffects.play).toHaveBeenCalledWith("notification")
        })
    })

    describe("Theme (Mood)", () => {
        test("setTheme() sets css variable", () => {
            const el = document.createElement("div")
            Mesmer.setTheme(el, "cyan")
            expect(el.style.getPropertyValue("--primary")).toBe("cyan")
        })
    })

    describe("Visuals (Light) - Legacy Maestro", () => {
        test("templateVisual() generates correct prompt structure", () => {
            const context = {
                ai: { name: "Cortana", forever: { physical: "Blue Hologram" } },
                user: { name: "Chief" },
                history: "[Chief]: Hello",
            }

            const prompt = Mesmer.templateVisual("ai", "A test", context)

            expect(prompt).toContain("[SYSTEM: PROMETHEUS_MESMER_V3.0]")
            expect(prompt).toContain("[MODULE: VISUAL_REALITY_ENGINE]")
            expect(prompt).toContain("Blue Hologram") // Context Injection
            expect(prompt).toContain("[Chief]: Hello") // History Injection
        })

        test("templateVisual() handles extraction mode", () => {
            const prompt = Mesmer.templateVisual("ai", "Raw Text", {
                mode: "extract",
            })
            expect(prompt).toContain(
                "Objective: Scrape the provided Description/Profile"
            )
        })
    })
})
