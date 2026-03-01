import { Session } from "@core/engine/session-driver.js"
import { runtime } from "@state/runtime.svelte.js"

// 📜 SCRIBE: Message State Manager
export class MessageStore {
    feed = $state([])

    constructor() {}

    /**
     * Synchronize with persistence.
     */
    async refresh() {
        if (!runtime.storyId) return
        const msgs = await Session.loadMessages(runtime.storyId)
        this.feed = msgs
    }

    /**
     * @param {Object} msg - The message object to add
     */
    add(msg) {
        // Prevent duplicates if ID exists
        if (msg.id && this.feed.some((m) => m.id === msg.id)) return
        this.feed.push(msg)
    }

    /**
     * @param {string} id - Message ID to remove
     */
    remove(id) {
        this.feed = this.feed.filter((m) => m.id !== id)
    }

    /**
     * Clear all messages (e.g. on story switch if not handled by refresh)
     */
    clear() {
        this.feed = []
    }
}

export const messages = new MessageStore()
