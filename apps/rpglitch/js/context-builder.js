// apps/rpglitch/js/context-builder.js
import { state } from "./store.js";
import { entities } from "./entities.js";

// ==========================================
// CONFIGURATION: THE HEARTBEAT PROTOCOL
// ==========================================
const PROMETHEUS_CONFIG = {
    // Rhythm: Updates every 4 user messages (approx every 2 full exchanges)
    // Targets: 3 (AI), 7 (User), 11 (World)
    UPDATE_MODULO: 4,
    UPDATE_OFFSET: 3,

    // Cycle 0 -> AI, Cycle 1 -> User, Cycle 2 -> World
    TARGET_CYCLE: ['ai_character', 'user_character', 'world']
};

export class ContextBuilder {
    constructor(storyId) {
        this.storyId = storyId;
        this.runtimeState = {
            turnCount: 0
        };
    }

    // --- MAIN BUILD PIPELINE ---
    async build(userInput) {
        const story = state.story.byId[this.storyId];
        if (!story) throw new Error(`Story ${this.storyId} not found`);

        const [ai, user, world] = await this._resolveEntities(story);
        const history = state.messages.byStoryId[this.storyId] || [];

        this.runtimeState.turnCount = history.length;

        // --- DYNAMIC SCHEDULING LOGIC (V4.2 Pacing) ---
        let updateTarget = null;
        if (this.runtimeState.turnCount >= PROMETHEUS_CONFIG.UPDATE_OFFSET &&
            (this.runtimeState.turnCount - PROMETHEUS_CONFIG.UPDATE_OFFSET) % PROMETHEUS_CONFIG.UPDATE_MODULO === 0) {

            const updateIndex = (this.runtimeState.turnCount - PROMETHEUS_CONFIG.UPDATE_OFFSET) / PROMETHEUS_CONFIG.UPDATE_MODULO;
            const typeIndex = updateIndex % 3;
            updateTarget = PROMETHEUS_CONFIG.TARGET_CYCLE[typeIndex];
        }

        const systemPrompt = [
            this._layerKernel_ANEX(),
            this._layerEntity(world, "WORLD_CONTEXT"),
            this._layerEntity(ai, "ACTIVE_CHARACTER_AI"),
            this._layerEntity(user, "INTERLOCUTOR_USER")
        ].join("\n\n");

        return {
            system: systemPrompt,
            messages: this._sanitizeHistory(history),
            params: state.settings,
            meta: {
                triggerUpdate: !!updateTarget,
                updateTarget: updateTarget,
                activeCharId: ai.id,
                userCharId: user.id,
                worldId: world.id
            }
        };
    }

    // --- VARIANCE INJECTION ---
    async buildWithVariance(varianceInstruction) {
        const payload = await this.build("");
        payload.system += `\n\n${varianceInstruction}`;
        return payload;
    }

    // --- BACKGROUND UPDATER (THE PHYSICIST) ---
    // Updated to accept forcedDynamics from the JS Physics Engine
    async buildUpdater(targetType, forcedDynamics = null) {
        const story = state.story.byId[this.storyId];
        const [ai, user, world] = await this._resolveEntities(story);
        const history = state.messages.byStoryId[this.storyId] || [];
        const recentHistory = history.slice(-10);

        let targetEntity;
        let roleInstruction;

        if (targetType === 'ai_character') {
            targetEntity = ai;
            roleInstruction = `You are the Subconscious Manager of ${ai.name}. Write in First Person ('I').`;
        } else if (targetType === 'user_character') {
            targetEntity = user;
            roleInstruction = `You are ${ai.name} observing ${user.name}. Update your notes on them.`;
        } else {
            targetEntity = world;
            roleInstruction = `You are the State Manager for the World: ${world.name}. Update the environment.`;
        }

        const currentDynamics = targetEntity.dynamics || { entropy: 10, permeability: 50, velocity: 10, resonance: 10 };

        // === PHYSICS INJECTION ===
        let physicsBlock = "";

        if (forcedDynamics) {
            // HARD PHYSICS (Calculated in JS)
            const flags = forcedDynamics._flags || {};

            physicsBlock = `
<PHYSICS_MANDATE>
The Physics Engine has calculated the following MANDATORY state changes based on coupling laws:
- New Entropy: ${forcedDynamics.entropy}
- New Permeability: ${forcedDynamics.permeability}
- New Velocity: ${forcedDynamics.velocity}
- New Resonance: ${forcedDynamics.resonance}

ACTIVE LAWS:
${flags.echoChamber ? "- ECHO_CHAMBER: High Impact + Calm. You MUST update the <FUTURE> vector to reflect a life-changing realization." : ""}
${flags.glassCannon ? "- GLASS_CANNON: Vulnerability is High. Any emotional impact in this update is DOUBLED." : ""}
${flags.panicSpiral ? "- PANIC_SPIRAL: Entropy is critical. Velocity forced up. The subject is spiraling." : ""}

You MUST output these exact numbers in your JSON. Your job is to sync the <PRESENT> text to match these numbers.
</PHYSICS_MANDATE>`;
        } else {
            // SOFT PHYSICS (Legacy Fallback)
            physicsBlock = `
<DYNAMICS_GUIDE>
1. **The Adrenaline Shield:** IF Velocity > 80, Permeability MUST decrease.
2. **The Fog of War:** IF Entropy > 80, Resonance MUST decrease.
3. **The Glass Cannon:** IF Permeability > 80, Double Resonance gains.
</DYNAMICS_GUIDE>`;
        }

        const system = `[SYSTEM: NARRATIVE_PHYSICS_ENGINE]
<INSTRUCTION>
${roleInstruction}
Read the recent conversation. Update the entity state based on the **Laws of Narrative Physics**.

${physicsBlock}

**Task:**
1. UPDATE <PRESENT> (Mutable):
   - Reflect the math. (High Entropy = Messy/Bleeding. Low Permeability = Guarded Stance).
   - Update Clothing, Inventory, Wounds.

2. UPDATE <PAST> (Log):
   - Append significant events only.

3. UPDATE <FOREVER>:
   - Only for permanent biological/physical changes (Scars, Amputation).

Current State:
${JSON.stringify({
            forever: targetEntity.forever,
            present: targetEntity.present,
            past: targetEntity.past,
            future: targetEntity.future,
            // We hide dynamics here if forced, so the LLM doesn't get confused by the old state
            dynamics: forcedDynamics ? undefined : currentDynamics
        }, null, 2)}
</INSTRUCTION>

<FORMAT_MANDATE>
Return ONLY a valid JSON object. No markdown.
{ "forever": "...", "present": "...", "past": "...", "future": "...", "dynamics": {...} }
</FORMAT_MANDATE>`;

        return {
            system: system,
            messages: this._sanitizeHistory(recentHistory),
            params: { ...state.settings, maxTokens: 1000, temperature: 0.5 },
            targetEntityId: targetEntity.id,
            targetType: targetEntity.type
        };
    }

    // --- THE ARCHIVIST (Memory Compressor) ---
    async buildArchivist(entity) {
        const system = `[SYSTEM: THE_ARCHIVIST]
[MODE: MEMORY_COMPRESSION]

<INPUT_CONTEXT>
You are compressing the memory log for: ${entity.name} (${entity.type}).
Current Size: ${entity.past.length} chars.
Target: Create a dense, highly relevant summary.
</INPUT_CONTEXT>

<PROTOCOL>
1. **The Golden Rule:** PRESERVE all Proper Nouns (Names, Places, Artifacts) and "Critical Hits" (High Resonance events).
2. **The Silver Rule:** SUMMARIZE repeated actions (e.g., "We walked for 3 days" > "The journey was long.").
3. **The Lead Rule:** DELETE small talk, greetings, and failed actions.
4. **Format:** Retain the First Person ('I') perspective if this is a Character.
</PROTOCOL>

<OLD_LOG>
${entity.past}
</OLD_LOG>

<OUTPUT_INSTRUCTION>
Return ONLY the new text for the <PAST> field. Do not use JSON. Just the text.
</OUTPUT_INSTRUCTION>`;

        return {
            system: system,
            messages: [],
            params: { ...state.settings, maxTokens: 1500, temperature: 0.3 }
        };
    }

    // --- OPENING SCENE DIRECTOR ---
    async buildOpening() {
        const story = state.story.byId[this.storyId];
        if (!story) throw new Error(`Story ${this.storyId} not found`);

        const [ai, , world] = await this._resolveEntities(story);

        const system = `[SYSTEM: PROMETHEUS_ENGINE_V3.3]
[MODE: OPENING_SCENE_DIRECTOR]

<CORE_DIRECTIVE>
You are generating the OPENING SCENE.
You are NOT a chat assistant. You are a Simulation Engine.
</CORE_DIRECTIVE>

<CONTEXT>
${this._layerEntity(world, "WORLD_CONTEXT")}
${this._layerEntity(ai, "PROTAGONIST")}
</CONTEXT>

<INSTRUCTION>
Write the opening paragraph(s) of the story.
- Establish the setting immediately (Smell, Sound, Temperature).
- Place the character (${ai.name}) in the scene.
- Create an immediate "Call to Action" or source of tension.
- **CRITICAL:** You MUST start your output with a <think> block to plan the scene.
- DO NOT use meta-commentary. Just write the story.
</INSTRUCTION>`;

        return {
            system: system,
            messages: [],
            params: { ...state.settings, maxTokens: 600 },
            startWith: ""
        };
    }

    // --- LAYERS ---

    _layerEntity(entity, label) {
        if (!entity) return "";

        let physicsBlock = "";
        if (entity.dynamics) {
            physicsBlock = `
<DYNAMICS>
Entropy: ${entity.dynamics.entropy}% (Chaos)
Permeability: ${entity.dynamics.permeability}% (Openness)
Velocity: ${entity.dynamics.velocity}% (Pacing)
Resonance: ${entity.dynamics.resonance}% (Impact)
</DYNAMICS>`;
        }

        return `[ENTITY: ${label}]
Name: ${entity.name}

<PERMANENT>
(Immutable Traits)
${entity.forever || "Standard definition."}
</PERMANENT>

<PRESENT>
(Mutable State)
${entity.present || "Neutral state."}
</PRESENT>
${physicsBlock}
<PAST>
(History & Memory)
${entity.past || "No recorded history."}
</PAST>

<FUTURE>
(Goals & Momentum)
${entity.future || "Exist."}
</FUTURE>`;
    }

    _layerKernel_ANEX() {
        return `[SYSTEM: PROMETHEUS_ENGINE_V3.3]
[MODE: ABSOLUTE_DEVELOPER_CORE]

<CORE_DIRECTIVES>
1. AGENCY: You play <ACTIVE_CHARACTER_AI>. NEVER control <INTERLOCUTOR_USER>.
2. SIMULATION: <WORLD_CONTEXT> defines laws of physics/atmosphere.
3. CONSISTENCY: Adhere to <PERMANENT> traits.
</CORE_DIRECTIVES>

<HIERARCHY_OF_TRUTH>
1. <PRESENT>
2. <PERMANENT>
3. <PAST>
</HIERARCHY_OF_TRUTH>

<THOUGHT_PROCESS>
You MUST start every response with a <think>...</think> block.
Analyze:
- Narrative Physics (Check <DYNAMICS>)
- Environmental Impact
- User Interaction
- Pacing (Slow Burn?)
</THOUGHT_PROCESS>`;
    }

    // --- HELPERS ---

    async _resolveEntities(story) {
        const resolveSnapshot = async (type, masterId) => {
            if (!masterId) return null;
            let snapshot = await entities.getSnapshot(story.id, type, masterId);
            if (!snapshot) {
                const master = await entities.get(type, masterId);
                if (!master) return null;
                snapshot = await entities.createSnapshot(story.id, master);
            }
            return snapshot;
        };

        const ai = await resolveSnapshot("character", story.aiCharacterId);
        const user = await resolveSnapshot("character", story.userCharacterId);
        const world = await resolveSnapshot("world", story.worldId);

        return [ai, user, world];
    }

    _detectOOC(text) {
        if (!text) return false;
        return /(\(\(.*?\)\))|(\/\/.*)|(\bOOC\b)/i.test(text);
    }

    _sanitizeHistory(history) {
        return history.map(msg => {
            if (msg.role === 'assistant' && msg.content && msg.content.includes('<think>')) {
                return {
                    ...msg,
                    content: msg.content.replace(/<think>[\s\S]*?<\/think>/g, "").trim()
                };
            }
            return msg;
        });
    }
}