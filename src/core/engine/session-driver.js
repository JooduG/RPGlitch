import { db } from "@data/db.js"
import { messages } from "@state/messages.svelte.js"
import { runtime } from "@state/runtime.svelte.js"

/**
 * SESSION MANAGER
 * Handles persistence and state for the active story.
 * Replaces the old src/gamemaster/engine/session.js
 */
export const Session = {
    activeId: null,

    /**
     * get the active story ID or throw.
     */
    requireActive: function () {
        if (!this.activeId) throw new Error("No active session found.")
        return this.activeId
    },

    /**
     * Set active session ID and persist it.
     */
    setActive: async function (id) {
        this.activeId = id
        runtime.storyId = id
        if (typeof window !== "undefined") {
            await db.kv_settings.put({ key: "active_session_id", value: id })
            // also log to history
            await db.sessions.add({ sessionId: id, timestamp: Date.now() })
        }
    },

    /**
     * Initialize session from DB.
     */
    init: async function () {
        if (typeof window === "undefined") return
        const entry = await db.kv_settings.get("active_session_id")
        if (entry) {
            this.activeId = entry.value
            runtime.storyId = entry.value
        }
    },

    /**
     * Create a new story from lobby selection
     */
    createFromSelection: async function ({ aiId, userId, fractalId, storyTitle }) {
        const storyData = {
            title: storyTitle,
            aiId,
            userId,
            fractalId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        const id = await db.stories.add(storyData)

        // [FIX] Inject ID back into payload for state
        storyData.id = id

        // [CRITICAL] Synchronize Global State immediately
        // Replace legacy applyPatch with direct mutation
        runtime.story.byId[id] = storyData
        runtime.story.activeId = id

        await this.setActive(id)

        // [R5] Synchronize Global State immediately
        await runtime.sync(id)

        return id
    },

    /**
     * Load messages for a story
     */
    loadMessages: async (storyId) => {
        return await db.messages.where("storyId").equals(storyId).toArray()
    },

    /**
     * Send a user message (Action)
     */
    send: async (text) => {
        const storyId = Session.requireActive()
        await db.messages.add({
            storyId,
            role: "user",
            type: "text",
            text,
            createdAt: Date.now(),
        })
        messages.refresh()
    },

    /**
     * Add an AI message (Response)
     */
    addAiMessage: async (text, characterName, role = "assistant") => {
        const storyId = Session.requireActive()
        await db.messages.add({
            storyId,
            role, // role: "assistant" | "fractal"
            type: "text",
            characterName,
            text,
            createdAt: Date.now(),
        })
        messages.refresh()
    },

    /**
     * Regenerate: Delete last AI message
     */
    regenerate: async () => {
        const storyId = Session.requireActive()
        const lastMsg = await db.messages.where("storyId").equals(storyId).last()

        if (lastMsg && (lastMsg.role === "assistant" || lastMsg.role === "ai")) {
            await db.messages.delete(lastMsg.id)
            messages.refresh()
        }
    },

    /**
     * Delete a specific message by ID
     */
    deleteMessage: async (id) => {
        Session.requireActive()
        await db.messages.delete(id)
        messages.refresh()
    },

    /**
     * Edit a specific message text
     */
    editMessage: async (id, newText) => {
        Session.requireActive()
        await db.messages.update(id, { text: newText })
        messages.refresh()
    },
}
