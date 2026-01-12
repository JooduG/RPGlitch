<script>
    import Panel from '../artificer/Panel.svelte';
    import { runtime } from './stores/runtime.svelte.js';

    // Reactive Calculations
    let hpPercent = $derived((runtime.character.health / runtime.character.maxHealth) * 100);
    let enPercent = $derived((runtime.character.energy / runtime.character.maxEnergy) * 100);
</script>

<div class="vitals-pane">
    <Panel title={runtime.character.name} icon="👤">
        <div class="stats-grid">
            <div class="stat-row">
                <span class="label">HP</span>
                <div class="bar-track">
                    <div 
                        class="bar-fill hp" 
                        style="width: {hpPercent}%"
                    ></div>
                </div>
                <span class="value">{runtime.character.health}</span>
            </div>

            <div class="stat-row">
                <span class="label">EN</span>
                <div class="bar-track">
                    <div 
                        class="bar-fill energy" 
                        style="width: {enPercent}%"
                    ></div>
                </div>
                <span class="value">{runtime.character.energy}</span>
            </div>
        </div>
    </Panel>
</div>

<style lang="scss">
    .vitals-pane {
        width: 260px;
        pointer-events: auto;
    }

    .stat-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;

        &:last-child { margin-bottom: 0; }

        .label {
            color: #71717a; /* Zinc 500 */
            width: 20px;
            font-weight: bold;
        }

        .value {
            color: #e4e4e7;
            width: 30px;
            text-align: right;
        }

        .bar-track {
            flex: 1;
            height: 6px;
            background: #27272a; /* Zinc 800 */
            border-radius: 3px;
            overflow: hidden;
        }

        .bar-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &.hp { background: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
            &.energy { background: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
        }
    }
</style>
