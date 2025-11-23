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

        // --- WORLD CONTEXT ---
        if (world) {
            sections.push(`[SCENE SETTING: ${world.name}]`);
            sections.push(this._formatEntityBlock(world));
        }

        // --- AI CHARACTER CONTEXT ---
        if (ai) {
            sections.push(`[YOUR ROLE: ${ai.name}]`);
            sections.push(`Description: ${ai.description || "N/A"}`);
            sections.push(this._formatEntityBlock(ai));
        } else {
            sections.push(`[YOUR ROLE: Narrator]`);
        }

        // --- USER CHARACTER CONTEXT ---
        if (user) {
            sections.push(`[INTERLOCUTOR: ${user.name}]`);
            sections.push(`Description: ${user.description || "N/A"}`);
            // We provide less info about the user to avoid the AI "playing" them
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