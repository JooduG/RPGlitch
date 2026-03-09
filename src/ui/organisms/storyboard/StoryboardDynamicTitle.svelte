<script>
    import { app } from "@state/app.svelte.js"
    import { themeStore } from "@theme/palette.svelte.js"

    // ============================================
    // LOCAL STATE (Component-Owned)
    // ============================================
    let custom_title = $state("")
    let is_custom = $state(false)
    let reroll_count = $state(0)

    // ============================================
    // TITLE PREFIXES (Content, not state)
    // ============================================
    const STANDARD_PREFIXES = ["The Story of", "The Adventures of", "The Tale of", "The Legend of", "The Saga of", "Chronicles of", "The Journey of"]
    const FRACTAL_PREFIXES = ["Adventures in", "Tales from", "The Fractal of", "Journey to"]

    // ============================================
    // DERIVED TITLE PARTS
    // ============================================
    const pick_random = (arr) => arr[Math.floor(Math.random() * arr.length)]
    const get_color = (entity) => themeStore.getSignatureColor(entity)

    /**
     * Generates structured title parts with entity colors for rich rendering
     */
    let title_parts = $derived.by(() => {
        // If custom title is set, return plain text
        if (is_custom && custom_title) {
            return [{ text: custom_title }]
        }

        // Reference reroll_count to trigger recalculation
        void reroll_count

        const ai = app.selectedAi
        const user = app.selectedUser
        const fractal = app.selectedFractal

        // Standard mode - full format
        const has_entities = ai || user
        const has_fractal = !!fractal

        if (has_entities && has_fractal) {
            const prefix = pick_random(STANDARD_PREFIXES)
            const parts = [{ text: `${prefix} ` }]

            if (ai && user && ai.id === user.id) {
                parts.push({ text: ai.name, color: get_color(ai) })
            } else if (ai && user) {
                parts.push({ text: ai.name, color: get_color(ai) })
                parts.push({ text: " & " })
                parts.push({ text: user.name, color: get_color(user) })
            } else if (ai) {
                parts.push({ text: ai.name, color: get_color(ai) })
            } else {
                parts.push({ text: user.name, color: get_color(user) })
            }

            parts.push({ text: " in " })
            parts.push({ text: fractal.name, color: get_color(fractal) })
            return parts
        } else if (has_entities) {
            const prefix = pick_random(STANDARD_PREFIXES)
            const parts = [{ text: `${prefix} ` }]

            if (ai && user && ai.id === user.id) {
                parts.push({ text: ai.name, color: get_color(ai) })
            } else if (ai && user) {
                parts.push({ text: ai.name, color: get_color(ai) })
                parts.push({ text: " & " })
                parts.push({ text: user.name, color: get_color(user) })
            } else if (ai) {
                parts.push({ text: ai.name, color: get_color(ai) })
            } else {
                parts.push({ text: user.name, color: get_color(user) })
            }
            return parts
        } else if (has_fractal) {
            const prefix = pick_random(FRACTAL_PREFIXES)
            return [{ text: `${prefix} ` }, { text: fractal.name, color: get_color(fractal) }]
        }

        return [{ text: "Your story begins here..." }]
    })

    // ============================================
    // EVENT HANDLERS
    // ============================================

    function handle_input(e) {
        custom_title = e.currentTarget.textContent
        is_custom = true
    }

    function handle_dbl_click() {
        is_custom = false
        custom_title = ""
        reroll_count++
    }
</script>

<h1 contenteditable="true" title="Double-click to re-roll title" oninput={handle_input} ondblclick={handle_dbl_click}>
    <span class="title-content">
        {#each title_parts as part, i (i)}
            {#if part.color}
                <span class="entity-name" style="color: {part.color}">{part.text}</span>
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
        font-size: clamp(var(--font-size-xxxl), 5vw, var(--font-size-xxxxxl));
        line-height: var(--line-height-heading);
        min-height: calc(var(--line-height-heading) * 2em);
        margin: 0;
        font-family: "Satisfy", cursive;
        letter-spacing: 0.02em;
        cursor: text;
        transition: all var(--transition-speed) var(--physics-transition-elastic);
        border-radius: var(--border-radius-l);
        padding: var(--spacing-xxs) var(--spacing-s);
        text-wrap: balance;
        max-width: 80vw;
        margin-inline: auto;

        /* Soft ethereal glow */
        text-shadow:
            0 var(--spacing-xxs) var(--spacing-m) rgba(var(--pure-white-rgb), var(--opacity-xs)),
            0 0 var(--spacing-xl) rgba(var(--pure-white-rgb), var(--opacity-xxs));

        display: grid;
        place-content: center;
        min-width: 300px;
        text-align: center;

        &:hover {
            background: rgba(var(--pure-white-rgb), var(--opacity-xxs));
        }

        &:focus-within {
            outline: none;
            background: rgba(var(--pure-white-rgb), var(--opacity-xs));
            box-shadow: 0 0 0 var(--spacing-xxs) var(--signature-color, var(--color-accent));
        }

        .title-content {
            display: inline;
            text-wrap: balance;
        }

        .entity-name {
            font-weight: inherit;
            text-shadow: 0 var(--spacing-px) var(--spacing-xxs) rgba(var(--pure-black-rgb), var(--opacity-s));
            white-space: nowrap;
        }
    }
</style>
