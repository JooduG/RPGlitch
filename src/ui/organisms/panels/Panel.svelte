<script>
    let { title, children } = $props()
</script>

<div class="panel">
    {#if title}
        <div class="panel-header">
            <span class="title-text">{title}</span>
        </div>
    {/if}
    <div class="panel-body">
        {@render children()}
    </div>
</div>

<style>
    .panel {
        background: var(--app-component-bg); /* Zinc 950 essentially */
        box-shadow:
            0 0 0 var(--spacing-px) var(--border-light),
            var(--shadow-l);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .panel-header {
        background: var(--surface-sunken);
        padding: var(--spacing-s) var(--spacing-m);
        box-shadow: 0 var(--spacing-px) 0 0 var(--border-light);
        border-bottom: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .panel-header .title-text {
        font-size: var(--font-size-s); /* 14px */
        text-transform: uppercase;
        letter-spacing: var(--letter-spacing-m);
        font-weight: 600;
        color: var(--font-muted); /* Zinc 400 */
        font-family: var(--font-heading);
    }

    .panel-body {
        padding: var(--spacing-m);
        flex: 1;
        overflow-y: auto;
        color: var(--font-color); /* Zinc 300 */
        font-size: var(--font-size-base);
    }
</style>
