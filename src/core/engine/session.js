import { db } from "@data/db.js"
import { applyPatch, events, EVENTS } from "./bus.js"

/**
 * SESSION MANAGER
 * Handles persistence and state for the active story.
 * Replaces the old src/gamemaster/engine/session.js
 */
export const Session = {
    /**
     * get the active story ID or throw.
     */
    requireActive: () => {
        if (typeof window === "undefined") return null
        const id = localStorage.getItem("rpg_session_id")
        if (!id) throw new Error("No active session found.")
        return parseInt(id, 10)
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

        localStorage.setItem("rpg_session_id", id.toString())
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
    addAiMessage: async (text, characterName) => {
        const storyId = Session.requireActive()
        await db.messages.add({
            storyId,
            role: "assistant", // Using 'assistant' for AI role standard
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
}
