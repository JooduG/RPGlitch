import { describe, expect, it } from "vitest"
import { inject, list_history, PromptBuilder, SYSTEM_PROMPTS } from "./prompt_builder.js"

/************************************************************************************
 * 🧩 [SECTION: ATOMIC TOOLKIT TESTS]
 ************************************************************************************/

describe("inject()", () => {
    const mock_state = {
        entity: {
            list: [
                {
                    role: "AI",
                    fragments: [
                        { section: "ETERNAL", text: "I am ancient." },
                        { section: "PRESENT", text: "I stand here now." },
                    ],
                },
            ],
        },
    }

    it("returns raw <FRAGMENT> lines without an outer XML wrapper", () => {
        const result = inject(mock_state, "AI_CHARACTER", "ETERNAL, PRESENT")
        expect(result).toContain("<FRAGMENT")
        // The result must NOT be wrapped in a parent tag like <YOUR_IDENTITY> or <AI_CHARACTER>
        const trimmed = result.trim()
        expect(trimmed.startsWith("<FRAGMENT")).toBe(true)
    })

    it("maps AI_CHARACTER role to internal AI entity", () => {
        const result = inject(mock_state, "AI_CHARACTER", "ETERNAL")
        expect(result).toContain("I am ancient.")
    })

    it("returns Status fragment when entity not found", () => {
        const result = inject(mock_state, "USER_PERSONA", "ETERNAL")
        expect(result).toContain('<FRAGMENT type="Status">')
    })
})

/************************************************************************************
 * 🧩 [SECTION: LIST_HISTORY TESTS]
 ************************************************************************************/

describe("list_history()", () => {
    it("maps user role to USER_PERSONA", () => {
        const result = list_history([{ role: "user", content: "Hello" }])
        expect(result).toContain('role="USER_PERSONA"')
    })

    it("maps assistant role to AI_CHARACTER", () => {
        const result = list_history([{ role: "assistant", content: "Greetings" }])
        expect(result).toContain('role="AI_CHARACTER"')
    })

    it("maps prologue role to FRACTAL", () => {
        const result = list_history([{ role: "prologue", content: "The scene opens." }])
        expect(result).toContain('role="FRACTAL"')
    })

    it("returns empty string for empty array", () => {
        expect(list_history([])).toBe("")
    })
})

/************************************************************************************
 * 🧩 [SECTION: SYSTEM_PROMPTS XML INTEGRITY]
 ************************************************************************************/

describe("SYSTEM_PROMPTS.simulation XML Integrity", () => {
    const state = {
        recentMessages: [{ role: "user", content: "test" }],
    }

    it("should NOT double-wrap <HISTORY> tags", () => {
        const prompt = SYSTEM_PROMPTS.simulation({
            active_signals: {},
            state,
            input: "action",
        })

        const open = prompt.match(/<HISTORY>/g) || []
        const close = prompt.match(/<\/HISTORY>/g) || []
        expect(open.length).toBe(1)
        expect(close.length).toBe(1)
        expect(prompt).not.toContain("<HISTORY>\n<HISTORY>")
    })

    it("contains ROLE identity anchor for AI_CHARACTER", () => {
        const prompt = SYSTEM_PROMPTS.simulation({
            active_signals: {},
            state,
            input: "",
        })
        expect(prompt).toContain("ROLE: You are the AI_CHARACTER.")
    })

    it("omits <INPUT_COMMAND> block when input is empty", () => {
        const prompt = SYSTEM_PROMPTS.simulation({ active_signals: {}, state, input: "" })
        expect(prompt).not.toContain("<INPUT_COMMAND>")
    })

    it("includes <INPUT_COMMAND> block when input is provided", () => {
        const prompt = SYSTEM_PROMPTS.simulation({ active_signals: {}, state, input: "go north" })
        expect(prompt).toContain("<INPUT_COMMAND>")
    })
})

/************************************************************************************
 * 🧩 [SECTION: BUILD_PROLOGUE METADATA]
 ************************************************************************************/

describe("PromptBuilder.build_prologue()", () => {
    it("returns role: FRACTAL in metadata", () => {
        const builder = new PromptBuilder()
        const result = builder.build_prologue({})
        expect(result.role).toBe("FRACTAL")
    })

    it("contains ROLE identity anchor for FRACTAL", () => {
        const builder = new PromptBuilder()
        const result = builder.build_prologue({})
        expect(result.system).toContain("ROLE: You are the FRACTAL.")
    })

    it("uses TASK_INSTRUCTION tag (not legacy INSTRUCTION)", () => {
        const builder = new PromptBuilder()
        const result = builder.build_prologue({})
        expect(result.system).toContain("<TASK_INSTRUCTION>")
        expect(result.system).not.toContain("<INSTRUCTION>")
    })
})
