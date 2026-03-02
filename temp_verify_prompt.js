import { PromptBuilder } from "../src/core/intelligence/prompt_builder.js"

const builder = new PromptBuilder()
const story = {
    turn: 1,
    objective: "Test double-wrapping",
    active_signals: {},
    recentMessages: [{ role: "user", content: "Hello world" }],
}

const prompt = builder.build(story, "Look around")
console.log("--- PROMPT START ---")
console.log(prompt)
console.log("--- PROMPT END ---")

const historyTags = prompt.match(/<HISTORY>/g) || []
console.log(`\nFound ${historyTags.length} <HISTORY> tags.`)

if (historyTags.length === 1) {
    console.log("SUCCESS: Unified <HISTORY> block confirmed.")
} else if (historyTags.length > 1) {
    console.log("FAILURE: Double-wrapping or multiple <HISTORY> blocks detected.")
} else {
    console.log("WARNING: No <HISTORY> block found (might be expected if history is empty).")
}
