<script>
    import { cubicOut } from "svelte/easing"
    import { scale } from "svelte/transition"

    let {
        text = "",
        visible = false,
        x = 0,
        y = 0,
        position = "top", // top, bottom, left, right
    } = $props()
</script>

{#if visible && text}
    <div
        class="artificer-tooltip {position}"
        style="--tx: {x}px; --ty: {y}px;"
        transition:scale={{ duration: 150, start: 0.95, easing: cubicOut }}
    >
        <div class="content">
            {text}
        </div>
        <div class="arrow"></div>
    </div>
{/if}

<style lang="scss">
    @use "../mesmer/scss/abstracts/placeholders" as *;

    .artificer-tooltip {
        position: absolute;
        z-index: 1000;
        pointer-events: none;
        white-space: nowrap;

        /* Precision Anchoring */
        top: 0;
        left: 50%;
        transform: translate(-50%, -100%);
        margin-top: -12px;

        .content {
            @extend %material-glass;
            color: white;
            padding: 4px 10px;
            font-size: 0.75rem;
            font-family: var(--font-ui);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .arrow {
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid rgba(0, 0, 0, 0.85);
        }

        &.bottom {
            transform: translate(-50%, 0);
            margin-top: 8px;
            .arrow {
                bottom: auto;
                top: -4px;
                border-top: none;
                border-bottom: 5px solid rgba(0, 0, 0, 0.85);
            }
        }
    }
</style>
