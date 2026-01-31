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
        if (app.aiList.length)
            app.selectedAi =
                app.aiList[Math.floor(Math.random() * app.aiList.length)]

        if (app.userList.length)
            app.selectedUser =
                app.userList[Math.floor(Math.random() * app.userList.length)]

        if (app.fractalList.length)
            app.selectedFractal =
                app.fractalList[
                    Math.floor(Math.random() * app.fractalList.length)
                ]

        // Ensure title updates on shuffle
        app.rerollTitle()
    },

    /**
     * Begin the story with current selections.
     */
    async beginStory() {
        // 🛡️ LOBBY BYPASS LOGIC
        if (app.settings.devMode) {
            app.log("Lobby Bypass Triggered (DEV_MODE)", "system")

            const selection = {
                ai: app.selectedAi || { id: "dev_ai", name: "Dev AI" },
                user: app.selectedUser || { id: "dev_user", name: "Dev User" },
                fractal: app.selectedFractal || {
                    id: "dev_world",
                    name: "Dev World",
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
