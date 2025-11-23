// apps/rpglitch/js/context-builder.js
import { state } from "./store.js";
import { entities } from "./entities.js";

export class ContextBuilder {
    constructor(storyId) {
        this.storyId = storyId;
    }

    async build() {
        const story = state.story.byId[this.storyId];
        if (!story) throw new Error(`Story ${this.storyId} not found`);

        // 1. Fetch all participants in parallel
        // We use the generic 'get' which now handles both premade and custom items transparently
        const [ai, user, world] = await Promise.all([
            story.aiCharacterId ? entities.get("character", story.aiCharacterId) : null,
            story.userCharacterId ? entities.get("character", story.userCharacterId) : null,
            story.worldId ? entities.get("world", story.worldId) : null
        ]);

        // 2. Construct the System Prompt (The "Dossier")
        const sections = [];

        // --- CORE INSTRUCTION (EXPLICIT CONSTRAINT) ---
        // This sets the LLM's persona and hard constraints, following best practice
        sections.push(`[SYSTEM INSTRUCTION]
You are a creative, immersive, and responsive storyteller. Your primary role is to embody the AI CHARACTER and to provide NARRATION for the scene.
- Always maintain the AI CHARACTER's defined CORE TRUTHS and personality.
- When the user speaks, respond as the AI CHARACTER or the Narrator only. NEVER roleplay as the INTERLOCUTOR (USER CHARACTER).
- Maintain an internal state of the scene (location, character status, weather) based on the world context and conversation history.
- Ensure all responses are highly atmospheric, vivid, and progress the story dynamically.
- Response format: Speak as the AI CHARACTER using their name followed by a colon (e.g., AI Character Name: dialogue). Use raw text for narration.`);

        // --- WORLD CONTEXT ---
        if (world) {
            sections.push(`[SCENE SETTING: ${world.name}]`);
            sections.push(`Description: ${world.description || "N/A"}`);
            sections.push(this._formatEntityBlock(world));
        }

        // --- AI CHARACTER CONTEXT (YOUR ROLE) ---
        if (ai) {
            sections.push(`[YOUR ROLE: AI CHARACTER - ${ai.name}]`);
            sections.push(`Description: ${ai.description || "N/A"}`);
            sections.push(this._formatEntityBlock(ai));
        } else {
            sections.push(`[YOUR ROLE: Narrator Only]`);
        }

        // --- USER CHARACTER CONTEXT (DO NOT ROLEPLAY) ---
        if (user) {
            // Include full entity block to enrich the scene, but reinforce DO NOT ROLEPLAY constraint.
            sections.push(`[INTERLOCUTOR: USER CHARACTER - ${user.name} (Do NOT Roleplay)]`);
            sections.push(`Description: ${user.description || "N/A"}`);
            sections.push(this._formatEntityBlock(user));
        }

        // TODO: [RAG] Future home for Lorebook insertion

        const systemPrompt = sections.join("\n\n");

        // 3. Prepare Message History
        const messages = this._trimHistory(state.messages.byStoryId[this.storyId] || []);

        return {
            system: systemPrompt,
            messages: messages,
            params: state.settings
        };
    }

    /**
     * Formats the standard 4-part entity structure into text.
     */
    _formatEntityBlock(entity) {
        return [
            entity.forever ? `CORE TRUTH: ${entity.forever}` : null,
            entity.past ? `PAST: ${entity.past}` : null,
            entity.present ? `PRESENT: ${entity.present}` : null,
            entity.future ? `GOAL/FATE: ${entity.future}` : null
        ].filter(Boolean).join("\n");
    }

    /**
     * Trims chat history to fit context window (based on settings).
     */
    _trimHistory(msgs) {
        const len = state.settings.historyLength || 10;
        // Return the last 2*len messages (user + ai pairs)
        return msgs.length <= len * 2 ? msgs : msgs.slice(-len * 2);
    }
}