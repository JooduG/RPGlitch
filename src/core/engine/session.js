import { db } from "@data/db.js"
import { applyPatch, events, EVENTS } from "./bus.js"

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
        }
    },

    /**
     * Create a new story from lobby selection
     */
    createFromSelection: async ({ aiId, userId, fractalId, storyTitle }) => {
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
        // ContextBuilder relies on state.story.byId[id] existing synchronously
        applyPatch({
            story: {
                byId: { [id]: storyData },
                activeId: id,
            },
        })

        await this.setActive(id)
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
        events.dispatchEvent(
            new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } })
        )
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
        events.dispatchEvent(
            new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } })
        )
    },

    /**
     * Regenerate: Delete last AI message
     */
    regenerate: async () => {
        const storyId = Session.requireActive()
        const lastMsg = await db.messages
            .where("storyId")
            .equals(storyId)
            .last()

        if (
            lastMsg &&
            (lastMsg.role === "assistant" || lastMsg.role === "ai")
        ) {
            await db.messages.delete(lastMsg.id)
            events.dispatchEvent(
                new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } })
            )
        }
    },

    /**
     * Delete a specific message by ID
     */
    deleteMessage: async (id) => {
        const storyId = Session.requireActive()
        await db.messages.delete(id)
        events.dispatchEvent(
            new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } })
        )
    },

    /**
     * Edit a specific message text
     */
    editMessage: async (id, newText) => {
        const storyId = Session.requireActive()
        await db.messages.update(id, { text: newText })
        events.dispatchEvent(
            new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } })
        )
    },
}
