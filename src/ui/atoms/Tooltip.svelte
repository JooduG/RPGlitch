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
    <div class="ui-tooltip {position}" class:fixed class:manual-pos={x !== null} use:portalAction style="--tx: {x ?? 0}px; --ty: {y ?? 0}px;" transition:scale={{ duration: 150, start: 0.95, easing: cubicOut }}>
        <div class="content">
            {text}
        </div>
        <div class="arrow"></div>
    </div>
{/if}

<style>
    .ui-tooltip {
        position: absolute;
        z-index: var(--z-index-tooltip);
        pointer-events: none;
        white-space: nowrap;

        /* Default: Absolute Centered (Parent Relative) */
        top: 0;
        left: 50%;
        transform: translate(-50%, -100%);
        margin-top: calc(var(--spacing-s) * -1);
    }

    /* Manual Positioning Mode (Absolute) */
    .ui-tooltip.manual-pos {
        left: var(--tx, 0);
    }

    /* Mode: Fixed Viewport Positioning */
    .ui-tooltip.fixed {
        position: fixed;
        top: var(--ty, 0);
        left: var(--tx, 0);
        transform: translate(-50%, -100%);
        margin-top: calc(var(--spacing-s) * -1);
    }

    .ui-tooltip .content {
        background: var(--bg-tooltip);
        backdrop-filter: blur(var(--blur-s));
        box-shadow: var(--glass-border), var(--shadow-l);
        color: var(--app-color);
        padding: var(--spacing-xxs) var(--spacing-s);
        font-size: var(--font-size-xs);
        font-family: var(--font-ui);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: var(--letter-spacing-l);
    }

    .ui-tooltip .arrow {
        position: absolute;
        bottom: calc(var(--spacing-xxs) * -1);
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: var(--spacing-xxs) solid transparent;
        border-right: var(--spacing-xxs) solid transparent;
        border-top: var(--spacing-xxs) solid var(--bg-tooltip);
    }

    .ui-tooltip.bottom {
        transform: translate(-50%, 0);
        margin-top: var(--spacing-s);
    }

    .ui-tooltip.bottom .arrow {
        bottom: auto;
        top: calc(var(--spacing-xxs) * -1);
        border-top: none;
        border-bottom: var(--spacing-xxs) solid var(--bg-tooltip);
    }
</style>
