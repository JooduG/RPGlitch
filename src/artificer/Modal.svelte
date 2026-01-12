<script>
    let { 
        title, 
        icon, 
        onclose, 
        variant = 'standard', // 'standard' | 'entity' | 'transparent' | 'media'
        children 
    } = $props();

    function handleKeydown(e) {
        if (e.key === 'Escape') onclose();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div 
    class="modal-backdrop" 
    onclick={(e) => { if(e.target === e.currentTarget) onclose(); }}
    onkeydown={(e) => { if (e.key === 'Escape') onclose(); }}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
>
    <div 
        class="modal-shell variant-{variant}"
        onclick={(e) => { 
            // For canvas mode, creating a "pass-through" click handler
            // If the user clicks the layout container (empty space), close the modal
            if (variant === 'canvas' && e.target === e.currentTarget) onclose(); 
        }}
        onkeydown={(e) => { if (e.key === 'Escape') onclose(); }}
        role="presentation"
    >
        
        {#if variant === 'standard' && title}
            <div class="modal-header">
                <span class="title">{icon} {title}</span>
                <button class="close-btn" onclick={onclose}>×</button>
            </div>
        {/if}

        <div class="modal-body">
            {@render children()}
        </div>

        {#if variant === 'entity'}
            <button class="entity-close" onclick={onclose}>×</button>
        {/if}
    </div>
</div>

<style lang="scss">
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(5px);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fade-in 0.2s ease-out;
        padding: 1rem;
        pointer-events: auto; /* Re-enable clicks inside the modal */
    }

    .modal-shell {
        display: flex;
        flex-direction: column;
        animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        
        &.variant-standard {
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 8px;
            width: 450px;
            max-width: 100%;
            max-height: 85vh;
            .modal-body { padding: 1rem; overflow-y: auto; }
        }

        &.variant-entity {
            background: #09090b; /* Darker background */
            border: 1px solid #27272a;
            border-radius: 12px;
            
            /* Flexible Sizing per user request */
            width: 900px;
            max-width: 95vw;
            height: 700px;
            max-height: 95vh;
            
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            
            .modal-body { 
                padding: 0; /* Full bleed */
                height: 100%; 
                overflow: hidden; /* Prevent spill */
                border-radius: 12px;
            }
        }

        &.variant-transparent {
            background: transparent;
            width: 400px;
            max-width: 100%;
            max-height: 90vh;
            .modal-body { padding: 0; overflow-y: auto; }
        }

        &.variant-canvas {
            background: transparent;
            border: none;
            width: 100%;
            height: 100%;
            max-width: none;
            max-height: none;
            pointer-events: none; /* Layout container only */
            
            .modal-body { 
                width: 100%; 
                height: 100%; 
                padding: 2rem; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                pointer-events: auto; /* Re-enable content interaction */
                overflow: hidden;
            }
        }
    }

    .entity-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(0,0,0,0.5);
        color: white;
        border: none;
        width: 32px; height: 32px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 100; /* Above everything */
        font-size: 1.2rem;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s;
        
        &:hover { background: #ef4444; }
    }

    .modal-header { padding: 0.75rem 1rem; display: flex; justify-content: space-between; border-bottom: 1px solid #333; color: #ccc; }
    .close-btn { background: none; border: none; color: #aaa; cursor: pointer; font-size: 1.2rem; }

    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scale-in { from { transform: scale(0.98); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
