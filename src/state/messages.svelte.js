import { events, EVENTS } from "@core/engine/bus.svelte.js"
import { Session } from "@core/engine/session-driver.js"

// 📜 SCRIBE: Message State Manager
export class MessageStore {
    feed = $state([])

    constructor() {
        this._initListeners()
    }

    _initListeners() {
        // 1. Full Refresh (DB Sync)
        events.addEventListener(EVENTS.CHAT_REFRESH, async ({ detail }) => {
            if (detail?.storyId) {
                const msgs = await Session.loadMessages(detail.storyId)
                this.feed = msgs
            }
        })

        // 2. Real-time Append (Stream/Single Message)
        events.addEventListener(EVENTS.MESSAGE_RECEIVED, ({ detail }) => {
            if (detail?.message) {
                this.add(detail.message)
            }
        })
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
