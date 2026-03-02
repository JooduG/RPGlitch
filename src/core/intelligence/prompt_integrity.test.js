import { describe, expect, it } from "vitest"
import { SYSTEM_PROMPTS } from "./prompt_builder.js"

describe("PromptBuilder XML Integrity", () => {
    it("should NOT double-wrap <HISTORY> tags", () => {
        const state = {
            recentMessages: [{ role: "user", content: "test" }],
        }
        const prompt = SYSTEM_PROMPTS.simulation({
            active_signals: {},
            state,
            input: "action",
        })

        const historyOpenTags = prompt.match(/<HISTORY>/g) || []
        const historyCloseTags = prompt.match(/<\/HISTORY>/g) || []

        expect(historyOpenTags.length).toBe(1)
        expect(historyCloseTags.length).toBe(1)

        // Ensure it's not nested like <HISTORY><HISTORY>...</HISTORY></HISTORY>
        expect(prompt).not.toContain("<HISTORY>\n<HISTORY>")
    })
})
