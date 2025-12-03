// apps/rpglitch/js/context-builder.js
import { state } from "./store.js";
import { entities } from "./entities.js";

// ==========================================
// CONFIGURATION: THE HEARTBEAT PROTOCOL
// ==========================================
const PROMETHEUS_CONFIG = {
    UPDATE_SCHEDULE: {
        3: 'ai_character',
        6: 'user_character',
        9: 'world'
    }
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
        const cycleIndex = this.runtimeState.turnCount % 10;
        const updateTarget = PROMETHEUS_CONFIG.UPDATE_SCHEDULE[cycleIndex] || null;

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

    // --- VARIANCE INJECTION (RE-ROLL) ---
    async buildWithVariance(varianceInstruction) {
        const payload = await this.build("");
        payload.system += `\n\n${varianceInstruction}`;
        return payload;
    }

    // --- BACKGROUND UPDATER (THE PHYSICIST) ---
    async buildUpdater(targetType) {
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
            roleInstruction = `You are ${ai.name} observing ${user.name}. Update your notes.`;
        } else {
            targetEntity = world;
            roleInstruction = `You are the State Manager for the World: ${world.name}. Update the environment.`;
        }

        const currentDynamics = targetEntity.dynamics || { entropy: 10, permeability: 50, velocity: 10, resonance: 10 };

        const system = `[SYSTEM: NARRATIVE_PHYSICS_ENGINE]
<INSTRUCTION>
${roleInstruction}
Read the recent conversation. Update the entity state based on the **Laws of Narrative Physics**:

1. **The Adrenaline Shield:** IF Velocity > 80 (Rushing/Combat), THEN Permeability MUST decrease by -20 (Defenses Up).
2. **The Fog of War:** IF Entropy > 80 (Chaos), THEN Resonance MUST decrease by -10 (Noise kills Signal).
3. **The Glass Cannon:** IF Permeability > 80 (Vulnerable), THEN double any Resonance gains (Critical Hit).
4. **The Cool-Down:** IF Velocity < 20 (Calm), THEN Entropy decreases by -10.

**Task:**
1. UPDATE <DYNAMICS> (0-100):
   - **ENTROPY**: Disorder, Confusion, Violence.
   - **PERMEABILITY**: Openness, Vulnerability.
   - **VELOCITY**: Pacing, Speed, Adrenaline.
   - **RESONANCE**: Impact, Significance, Lore Weight.

2. UPDATE <PRESENT> (Mutable):
   - Reflect the math. (High Entropy = Messy/Bleeding. Low Permeability = Guarded Stance).
   - Update Clothing, Inventory, Wounds.

3. UPDATE <PAST> (Log):
   - Append significant events only.

4. UPDATE <FOREVER>:
   - Only for permanent biological/physical changes (Scars, Amputation).

Current State:
${JSON.stringify({
            forever: targetEntity.forever,
            present: targetEntity.present,
            past: targetEntity.past,
            future: targetEntity.future,
            dynamics: currentDynamics
        }, null, 2)}
</INSTRUCTION>

<FORMAT_MANDATE>
Return ONLY valid JSON.
{ 
  "forever": "string",
  "present": "string",
  "past": "string",
  "future": "string",
  "dynamics": { "entropy": number, "permeability": number, "velocity": number, "resonance": number }
}
</FORMAT_MANDATE>`;

        return {
            system: system,
            messages: this._sanitizeHistory(recentHistory),
            params: { ...state.settings, maxTokens: 1000, temperature: 0.5 },
            targetEntityId: targetEntity.id,
            targetType: targetEntity.type
        };
    }

    // --- OPENING SCENE DIRECTOR ---
    async buildOpening() {
        const story = state.story.byId[this.storyId];
        if (!story) throw new Error(`Story ${this.storyId} not found`);

        // FIX: Removed unused 'user' variable (replaced with empty slot)
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
2. SIMULATION: <WORLD_CONTEXT> defines physics.
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