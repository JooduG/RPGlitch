<script>
    import { app } from "@state/app.svelte.js"
    import { themeStore } from "@theme/palette.svelte.js"

    // ============================================
    // LOCAL STATE (Component-Owned)
    // ============================================
    let customTitle = $state("")
    let isCustom = $state(false)
    let rerollCount = $state(0)

    // ============================================
    // TITLE PREFIXES (Content, not state)
    // ============================================
    const STANDARD_PREFIXES = [
        "The Story of",
        "The Adventures of",
        "The Tale of",
        "The Legend of",
        "The Saga of",
        "Chronicles of",
        "The Journey of",
    ]

    const SMARTPHONE_PREFIXES = [
        "Chat Log:",
        "Session:",
        "Messenger.exe:",
        "New Thread:",
        "Encrypted Feed:",
        "Connection:",
        "Archive:",
        "RELAY //",
    ]

    const FRACTAL_PREFIXES = [
        "Adventures in",
        "Tales from",
        "The World of",
        "Journey to",
    ]

    // ============================================
    // DERIVED TITLE PARTS
    // ============================================
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
    const getColor = (entity) => themeStore.getSignatureColor(entity)

    /**
     * Generates structured title parts with entity colors for rich rendering
     * @returns {Array<{text: string, color?: string}>}
     */
    let titleParts = $derived.by(() => {
        // If custom title is set, return plain text
        if (isCustom && customTitle) {
            return [{ text: customTitle }]
        }

        // Reference rerollCount to trigger recalculation
        void rerollCount

        const ai = app.selectedAi
        const user = app.selectedUser
        const fractal = app.selectedFractal
        const isSmartphone = app.settings.callMode

        // Smartphone mode - simpler format
        if (isSmartphone) {
            const prefix = pick(SMARTPHONE_PREFIXES)
            const parts = [{ text: `${prefix} ` }]

            if (ai && user) {
                parts.push({ text: ai.name, color: getColor(ai) })
                parts.push({ text: " & " })
                parts.push({ text: user.name, color: getColor(user) })
            } else if (ai) {
                parts.push({ text: ai.name, color: getColor(ai) })
            } else if (user) {
                parts.push({ text: user.name, color: getColor(user) })
            } else {
                parts.push({ text: "Guest User" })
            }
            return parts
        }

        // Standard mode - full format
        const hasEntities = ai || user
        const hasFractal = !!fractal

        if (hasEntities && hasFractal) {
            const prefix = pick(STANDARD_PREFIXES)
            const parts = [{ text: `${prefix} ` }]

            if (ai && user) {
                parts.push({ text: ai.name, color: getColor(ai) })
                parts.push({ text: " & " })
                parts.push({ text: user.name, color: getColor(user) })
            } else if (ai) {
                parts.push({ text: ai.name, color: getColor(ai) })
            } else {
                parts.push({ text: user.name, color: getColor(user) })
            }

            parts.push({ text: " in " })
            parts.push({ text: fractal.name, color: getColor(fractal) })
            return parts
        } else if (hasEntities) {
            const prefix = pick(STANDARD_PREFIXES)
            const parts = [{ text: `${prefix} ` }]

            if (ai && user) {
                parts.push({ text: ai.name, color: getColor(ai) })
                parts.push({ text: " & " })
                parts.push({ text: user.name, color: getColor(user) })
            } else if (ai) {
                parts.push({ text: ai.name, color: getColor(ai) })
            } else {
                parts.push({ text: user.name, color: getColor(user) })
            }
            return parts
        } else if (hasFractal) {
            const prefix = pick(FRACTAL_PREFIXES)
            return [
                { text: `${prefix} ` },
                { text: fractal.name, color: getColor(fractal) },
            ]
        }

        return [{ text: "Your story begins here..." }]
    })

    // ============================================
    // EVENT HANDLERS
    // ============================================

    /**
     * Handles manual input to lock the title
     */
    function handleInput(e) {
        customTitle = e.currentTarget.textContent
        isCustom = true
    }

    /**
     * Handles double-click to re-roll prefixes
     */
    function handleDblClick() {
        isCustom = false
        customTitle = ""
        rerollCount++
    }
</script>

<h1
    contenteditable="true"
    title="Double-click to re-roll title"
    oninput={handleInput}
    ondblclick={handleDblClick}
>
    <span class="title-content">
        {#each titleParts as part, i (i)}
            {#if part.color}
                <span class="entity-name" style="color: {part.color}"
                    >{part.text}</span
                >
            {:else}
                {part.text}
            {/if}
        {/each}
    </span>
</h1>

<style lang="scss">
    /* Import Satisfy font for the special story title */
    @import url("https://fonts.googleapis.com/css2?family=Satisfy&display=swap");

    h1 {
        font-size: clamp(1.8rem, 5vw, 3rem);
        line-height: 1.2;
        min-height: calc(1.2em * 2);
        margin: 0;
        font-family: "Satisfy", cursive;
        letter-spacing: 0.02em;
        cursor: text;
        transition:
            color 0.2s ease,
            text-shadow 0.3s ease;
        border-radius: 8px;
        padding: 0.25rem 0.75rem;
        text-wrap: balance;
        max-width: 80vw;
        margin-inline: auto;

        /* Soft ethereal glow */
        text-shadow:
            0 2px 10px rgba(255, 255, 255, 0.15),
            0 0 30px rgba(255, 255, 255, 0.08);

        display: grid;
        place-content: center;
        min-width: 300px;
        text-align: center;

        &:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        &:focus-within {
            outline: none;
            background: rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 0 2px var(--primary-color);
        }

        .title-content {
            display: inline;
            text-wrap: balance;
        }

        .entity-name {
            font-weight: inherit;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            white-space: nowrap;
        }
    }
</style>
