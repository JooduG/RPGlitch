import { describe, expect, it } from "vitest"
import { ContextBroker } from "./intelligence_broker.js"
import { inject, list_history, PromptBuilder, SYSTEM_PROMPTS } from "./prompt_builder.js"

/************************************************************************************
 * 🧩 [SECTION: ATOMIC TOOLKIT TESTS]
 * ----------------------------------------------------------------------------------
 * Pure helpers. No XML wrappers. Return raw inner content only.
 * All structural XML lives in SYSTEM_PROMPTS templates.
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
        snapshot: "[User]: test",
    }

    it("should NOT include <HISTORY_SNAPSHOT> tags (handled by raw history)", () => {
        const prompt = SYSTEM_PROMPTS.simulation({
            active_signals: {},
            state,
            input: "action",
        })

        const open = prompt.match(/<HISTORY_SNAPSHOT>/g) || []
        const close = prompt.match(/<\/HISTORY_SNAPSHOT>/g) || []
        expect(open.length).toBe(0)
        expect(close.length).toBe(0)
    })

    it("contains named SYSTEM role attribute for AI_CHARACTER", () => {
        const prompt = SYSTEM_PROMPTS.simulation({
            active_signals: {},
            state,
            input: "",
        })
        expect(prompt).toContain('role="AI_CHARACTER"')
    })

    it("omits <INPUT_COMMAND> block when input is empty", () => {
        const prompt = SYSTEM_PROMPTS.simulation({ active_signals: {}, state, input: "" })
        expect(prompt).not.toContain("<INPUT_COMMAND>")
    })

    it("includes <INPUT_COMMAND> block when input is provided", () => {
        const prompt = SYSTEM_PROMPTS.simulation({ active_signals: {}, state, input: "go north" })
        expect(prompt).toContain("<INPUT_COMMAND>")
    })

    it("includes FIRST_PERSON and essential protocols", () => {
        const prompt = SYSTEM_PROMPTS.simulation({ active_signals: {}, state, input: "" })
        expect(prompt).toContain("FIRST_PERSON:")
        expect(prompt).toContain("EPISTEMIC_WALL:")
        expect(prompt).toContain("PLACEMENT:")
        expect(prompt).toContain("MOMENTUM:")
        expect(prompt).not.toContain("SENSORY:")
    })
})

/************************************************************************************
 * 🧩 [SECTION: BUILD_PROLOGUE METADATA]
 ************************************************************************************/

describe("PromptBuilder.build_prologue()", () => {
    it("injects 'Seed' fragments when entities are missing (Prologue Fallback)", () => {
        // We need to temporarily mock or use a broker instance with this state
        // Since the broker imports runtime globally, we might need to be careful.
        // For this test, let's assume the broker handles the provided runtime or we mock it.
        // NOTE: ContextBroker is not imported in this file, this test will fail without it.
        // Assuming ContextBroker is available in the test environment or will be imported.
        const broker_res = ContextBroker.pull_entities()
        const ai_entity = broker_res.list.find((e) => e.role === "AI")
        const bootstrap = ai_entity.fragments.find((f) => f.enhancer === "SYSTEM_BOOTSTRAP")

        expect(bootstrap).toBeDefined()
        expect(bootstrap.text).toContain("nascent")
    })

    it("includes GRIT protocol in simulation and prologue", () => {
        const sim = SYSTEM_PROMPTS.simulation({ active_signals: {}, state: {}, input: "" })
        const pro = SYSTEM_PROMPTS.prologue({ state: {}, input: "" })

        expect(sim).toContain("- GRIT:")
        expect(pro).toContain("- GRIT:")
    })

    it("enforces NARRATIVE_LENS assignment", () => {
        const sim = SYSTEM_PROMPTS.simulation({ active_signals: {}, state: {}, input: "" })
        const pro = SYSTEM_PROMPTS.prologue({ state: {}, input: "" })

        // Simulation is 1st person
        expect(sim).toContain("FIRST_PERSON:")
        // Prologue is 3rd person
        expect(pro).toContain("THIRD_PERSON:")
    })

    it("returns role: FRACTAL in metadata", () => {
        const builder = new PromptBuilder()
        const result = builder.build_prologue({})
        expect(result.role).toBe("FRACTAL")
    })

    it("contains named SYSTEM role attribute for FRACTAL", () => {
        const builder = new PromptBuilder()
        const result = builder.build_prologue({})
        expect(result.system).toContain('role="FRACTAL"')
    })

    it("uses TASK_INSTRUCTION tag for prologue", () => {
        const builder = new PromptBuilder()
        const result = builder.build_prologue({})
        expect(result.system).toContain("<TASK_INSTRUCTION>")
    })

    it("includes THIRD_PERSON and essential protocols", () => {
        const builder = new PromptBuilder()
        const result = builder.build_prologue({})
        expect(result.system).toContain("THIRD_PERSON:")
        expect(result.system).toContain("EPISTEMIC_WALL:")
        expect(result.system).toContain("PLACEMENT:")
        expect(result.system).toContain("MOMENTUM:")
    })
})
