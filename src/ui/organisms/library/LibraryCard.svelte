<script>
    /**
     * @file LibraryCard.svelte
     * 🃏 THE ARCHIVE TAROT
     * A compact version of StoryboardCard for the Library drawer.
     * Flattened Schema Compliant.
     */
    let {
        entity,
        type = "ai", // "ai" | "user" | "fractal"
        disabled = false,
        onSelect,
        onViewProfile,
    } = $props()

    import { themeStore } from "@theme/palette.svelte.js"
    import ProfilePicture from "@ui/atoms/ProfilePicture.svelte"
    import { fitText } from "@ui/utils/actions/fitText.js"

    let signatureColor = $derived(themeStore.getSignatureColor(entity))
    let signatureRgb = $derived(themeStore.hexToRgb(signatureColor))
    let name = $derived(entity?.name || "Untitled")

    function handleSelect() {
        if (!disabled && onSelect) onSelect()
    }
</script>

<button
    class="drawer-card"
    class:fractal-card={type === "fractal"}
    class:is-disabled={disabled}
    style="--signature-color: {signatureColor}; --signature-rgb: {signatureRgb};"
    onclick={handleSelect}
    {disabled}
    title={disabled ? "Already selected" : `Select ${name}`}
    oncontextmenu={(e) => {
        e.preventDefault()
        if (onViewProfile) onViewProfile()
    }}
>
    <div class="card-visual">
        <ProfilePicture {entity} />
    </div>

    <div class="card-info">
        <h5>
            <span class="entity-name" use:fitText>{name}</span>
        </h5>
    </div>

    <div class="signature-bar"></div>
</button>

<style lang="scss">
    @use "sass:color";
    @use "@theme/abstracts/variables" as *;
    @use "@theme/abstracts/mixins" as *;
    @use "@theme/abstracts/placeholders" as *;

    .drawer-card {
        aspect-ratio: 2 / 3;
        background: var(--bg-card);
        /* Border purged */
        border-radius: var(--spacing-s);
        position: relative;
        overflow: hidden;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        padding: 0;
        transition: all var(--transition-speed) var(--physics-transition-elastic);
        text-align: left;
        width: 8.75rem;
        flex: 0 0 auto;
        border: 0;

        @extend %material-interactive;

        &:hover {
            transform: translateY(var(--physics-hover-y));
            /* Border-color purged */
            box-shadow: var(--shadow-m);
        }

        &.is-disabled {
            opacity: 0.5;
            filter: grayscale(1);
            cursor: not-allowed;
            pointer-events: none;

            &:hover {
                transform: none;
                box-shadow: none;
            }
        }

        .card-visual {
            flex: 1.5;
            background: var(--glass-m);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }

        .card-info {
            flex: 0.6;
            padding: var(--spacing-s);
            display: flex;
            align-items: center;
            background: var(--bg-app);

            h5 {
                margin: 0;
                padding: 0;
                width: 100%;
            }

            .entity-name {
                color: var(--signature-color);
                text-wrap: balance;
                display: -webkit-box;
                line-clamp: 2;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                margin: 0;
                padding: 0;
            }
        }
    }
</style>
