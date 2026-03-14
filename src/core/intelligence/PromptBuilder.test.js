import { describe, expect, it } from "vitest"
import { PromptBuilder } from "./PromptBuilder.js"

describe("PromptBuilder (Refactored)", () => {
    describe("Static Helpers", () => {
        it("render_history() should map roles correctly", () => {
            const history = [
                { role: "user", content: "Hello" },
                { role: "assistant", content: "Greetings", character_name: "Viper" },
                { role: "prologue", content: "The scene opens." },
            ]
            const result = PromptBuilder.render_history(history)
            expect(result).toContain('role="USER_PERSONA">Hello')
            expect(result).toContain('role="AI_CHARACTER" name="Viper">Greetings')
            expect(result).toContain('role="FRACTAL">The scene opens.')
        })

        it("render_protocols() should return bulleted list of defined protocols", () => {
            const result = PromptBuilder.render_protocols("MOMENTUM, HYGIENE")
            expect(result).toContain("- MOMENTUM:")
            expect(result).toContain("- HYGIENE:")
        })
    })

    describe("SYSTEM_PROMPTS XML Integrity", () => {
        const mock_payload = {
            turn: 1,
            entities: {
                AI: {
                    name: "Viper",
                    properties: { eternal: { non_physical: "Eternal AI" }, present: { non_physical: "Present AI" } },
                    fragments: [{ type: "Core", text: "Cold." }],
                },
                USER: {
                    name: "Player",
                    properties: { eternal: { physical: "Eternal User" }, present: { physical: "Present User" } },
                    fragments: [],
                },
                FRACTAL: {
                    name: "City",
                    properties: { eternal: { non_physical: "Eternal City" }, present: { non_physical: "Present City" } },
                    fragments: [],
                },
            },
            history: { messages: "", dynamics: {} },
            input: "test action",
        }

        const mock_snapshot = {
            behaviors: ["Pacing"],
            flags: ["ADRENALINE"],
            dynamics: { intensity: 80 },
        }

        it("synthesize() should return system prompt and meta", () => {
            const result = PromptBuilder.synthesize(mock_payload, mock_snapshot)
            expect(result.system).toContain('<SYSTEM role="Viper"')
            expect(result.system).toContain('turn="1"')
            expect(result.system).toContain("<INPUT_COMMAND>test action</INPUT_COMMAND>")
            expect(result.meta.dynamics.intensity).toBe(80)
        })

        it("should include protocols in the generated prompt", () => {
            const result = PromptBuilder.synthesize(mock_payload, mock_snapshot)
            expect(result.system).toContain("MOMENTUM:")
            expect(result.system).toContain("FIRST_PERSON:")
        })

        it("should use THIRD_PERSON in prologue mode", () => {
            const prologue_payload = { ...mock_payload, type: "prologue" }
            const result = PromptBuilder.synthesize(prologue_payload, {})
            expect(result.system).toContain("THIRD_PERSON:")
            expect(result.system).not.toContain("FIRST_PERSON:")
        })
    })

    describe("Special Modes", () => {
        it("build_epilogue() should return epilogue system prompt", () => {
            const result = PromptBuilder.build_epilogue()
            expect(result.system).toContain('<SYSTEM role="NARRATOR">')
        })

        it("build_memory_prompt() should return memory XML", () => {
            const result = PromptBuilder.build_memory_prompt("Viper", "Cold entity", "Past events")
            expect(result.system).toContain("<MEMORY_PROTOCOL")
            expect(result.system).toContain('role="Viper"')
        })
    })
})
