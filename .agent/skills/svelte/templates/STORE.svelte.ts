/**
 * ⚡ Global State Module (Runes)
 * Replaces legacy 'svelte/store'
 */

class AppState {
    version = $state("1.0.0")
    theme = $state("system")

    // Derived getter
    get isDark() {
        return this.theme === "dark"
    }

    // Actions
    toggleTheme() {
        this.theme = this.theme === "light" ? "dark" : "light"
    }
}

export const appState = new AppState()
