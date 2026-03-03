/**
 * Storyboard Actions Module
 * Direct function calls for Perchance sandbox compatibility.
 * (CustomEvents are blocked in Perchance's sandbox)
 */
import { app } from "@state/app.svelte.js"
import { session } from "@state/session.svelte.js"

export const storyboard = {
    /**
     * Shuffle all selected entities randomly.
     */
    shuffle() {
        // 1. Shuffle AI
        if (app.aiList.length) {
            app.selectedAi = app.aiList[Math.floor(Math.random() * app.aiList.length)]
        }

        // 2. Shuffle User (Constraint: Must not be the same as AI)
        if (app.userList.length) {
            let availableUsers = app.userList

            // If we selected an AI, exclude it from the User pool to prevent duplicates
            if (app.selectedAi) {
                availableUsers = app.userList.filter((u) => u.id !== app.selectedAi.id)
            }

            // Fallback: If only 1 char exists, we might have no choice but to dup (or leave empty)
            // But if we have options, we pick from the filtered list
            if (availableUsers.length > 0) {
                app.selectedUser = availableUsers[Math.floor(Math.random() * availableUsers.length)]
            } else if (app.userList.length > 0) {
                // Determine fallback behavior. Users hate duplicates.
                // If only 1 char exists total, user likely accepts the dup or creates more.
                // For now, allow dup ONLY if strictly necessary (list len 1)
                app.selectedUser = app.userList[0]
            }
        }

        // 3. Shuffle Fractal
        if (app.fractalList.length) app.selectedFractal = app.fractalList[Math.floor(Math.random() * app.fractalList.length)]

        // Ensure title updates on shuffle
        app.rerollTitle()
    },

    /**
     * Begin the story with current selections.
     */
    async beginStory() {
        // 🛡️ LOBBY BYPASS LOGIC
        if (app.settings.dev_mode) {
            app.log("Lobby Bypass Triggered (DEV_MODE)", "system")

            const selection = {
                ai: app.selectedAi || { id: "dev_ai", name: "Dev AI" },
                user: app.selectedUser || { id: "dev_user", name: "Dev User" },
                fractal: app.selectedFractal || {
                    id: "dev_fractal",
                    name: "Dev Fractal",
                },
            }

            await session.start(selection)
            return
        }

        if (!app.selectedAi || !app.selectedUser || !app.selectedFractal) return

        await session.start({
            ai: app.selectedAi,
            user: app.selectedUser,
            fractal: app.selectedFractal,
        })
    },
}
