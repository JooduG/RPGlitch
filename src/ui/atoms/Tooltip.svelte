<script>
    import { portal } from "@ui/utils/actions/portal.js"
    import { cubicOut } from "svelte/easing"
    import { scale } from "svelte/transition"

    let {
        text = "",
        visible = false,
        x = null,
        y = null,
        position = "top", // top, bottom, left, right
        fixed = false, // Toggle between absolute (parent-relative) and fixed (viewport)
    } = $props()

    function portalAction(node) {
        if (!fixed) return // Do nothing if not fixed mode
        return portal(node)
    }
</script>

{#if visible && text}
    <div
        class="artificer-tooltip {position}"
        class:fixed
        class:manual-pos={x !== null}
        use:portalAction
        style="--tx: {x ?? 0}px; --ty: {y ?? 0}px;"
        transition:scale={{ duration: 150, start: 0.95, easing: cubicOut }}
    >
        <div class="content">
            {text}
        </div>
        <div class="arrow"></div>
    </div>
{/if}

<style lang="scss">
    @use "@theme/abstracts/placeholders" as *;

    .artificer-tooltip {
        position: absolute;
        z-index: 99999;
        pointer-events: none;
        white-space: nowrap;

        /* Default: Absolute Centered (Parent Relative) */
        top: 0;
        left: 50%;
        transform: translate(-50%, -100%);
        margin-top: -12px;

        /* Manual Positioning Mode (Absolute) */
        &.manual-pos {
            left: var(--tx, 0);
            /* Reset centering transform if needed, but keeping X-center on the calculated point is usually desired for knobs. */
            /* If we want to center ON the point (tx), we need translate(-50%, ...) */
            /* The default transform has -50% X. This works if tx is the center of the knob. */
        }

        /* Mode: Fixed Viewport Positioning */
        &.fixed {
            position: fixed;
            top: var(--ty, 0);
            left: var(--tx, 0);
            /* Reset absolute defaults */
            transform: translate(-50%, -100%);
            margin-top: -12px;
        }

        .content {
            /* @extend %material-glass; - Too transparent */
            background: rgba(20, 20, 23, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
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
