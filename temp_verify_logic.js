import { PromptBuilder } from "./src/core/intelligence/PromptBuilder.js"
import { VectorEngine } from "./src/core/intelligence/vector_engine.js"

async function run_verification() {
    console.log("🚀 STARTING VERIFICATION: Vector Lifecycle & Associative Logic\n")

    // 1. Test Vector Resolution
    console.log("--- 1. Testing resolve_vector ---")
    const entity = {
        name: "TestBot",
        future: {
            vectors: [
                { id: "v1", text: "Objective A", entity_tags: [] },
                { id: "v2", text: "Objective B", entity_tags: [] },
            ],
        },
        past: { vectors: [] },
    }

    console.log("Initial Future:", entity.future.vectors.length)
    VectorEngine.resolve_vector(entity, "v1", "SUCCESS")
    console.log("Post-Resolution Future:", entity.future.vectors.length)
    console.log("Post-Resolution Past:", entity.past.vectors.length)
    console.log("Resolved Vector Tags:", entity.past.vectors[0].entity_tags)

    if (entity.past.vectors[0].entity_tags.includes("RESOLUTION:SUCCESS")) {
        console.log("✅ resolve_vector passed.\n")
    } else {
        console.log("❌ resolve_vector FAILED.\n")
    }

    // 2. Test Associative Threading Rendering
    console.log("--- 2. Testing render_associated ---")
    const entities = {
        AI: { name: "AI", layers: { ETERNAL: [] } },
        associated_entities: [
            {
                name: "The Grand Cafe",
                fragments: [
                    { type: "Sensory", text: "Smell of roasted beans." },
                    { type: "Atmosphere", text: "Dimly lit, cozy." },
                ],
            },
        ],
    }

    const render_atom = PromptBuilder.create_render_atom(entities, "test input", [])
    const associated_xml = render_atom.render_associated()
    console.log("Associated XML:\n", associated_xml)

    if (associated_xml.includes("CONTEXTUAL_RESONANCE") && associated_xml.includes("The Grand Cafe")) {
        console.log("✅ render_associated passed.\n")
    } else {
        console.log("❌ render_associated FAILED.\n")
    }

    // 3. Test Whitespace Normalization
    console.log("--- 3. Testing PromptBuilder.clean ---")
    const messy_prompt = `
    Line 1
    
    
    Line 2
    
    Line 3
    `
    const clean_prompt = PromptBuilder.clean(messy_prompt)
    console.log("Messy Prompt Character Count:", messy_prompt.length)
    console.log("Clean Prompt Character Count:", clean_prompt.length)
    console.log("Clean Prompt:\n", clean_prompt)

    const newline_count = (clean_prompt.match(/\n/g) || []).length
    console.log("Newline count in clean prompt:", newline_count)

    if (newline_count <= 2) {
        console.log("✅ clean passed (newlines collapsed).\n")
    } else {
        console.log("❌ clean FAILED (too many newlines).\n")
    }

    console.log("🏁 VERIFICATION COMPLETE.")
}

run_verification().catch(console.error)
