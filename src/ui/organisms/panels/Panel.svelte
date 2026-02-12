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

<style lang="scss">
    .panel {
        background: var(--app-component-bg); /* Zinc 950 essentially */
        box-shadow:
            0 0 0 1px var(--ui-glass-border),
            0 10px 15px -3px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;

        .panel-header {
            background: rgba(255, 255, 255, 0.02);
            padding: 0.75rem 1rem;
            box-shadow: 0 1px 0 0 var(--ui-glass-border);
            border-bottom: none;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .title-text {
                font-size: 0.875rem; /* 14px */
                text-transform: uppercase;
                letter-spacing: 0.05em;
                font-weight: 600;
                color: var(--app-muted); /* Zinc 400 */
                font-family: var(--font-heading);
            }
        }

        .panel-body {
            padding: 1rem;
            flex: 1;
            overflow-y: auto;
            color: var(--app-color); /* Zinc 300 */
            font-size: 0.95rem;
        }
    }
</style>
