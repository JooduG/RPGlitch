<script>
    import Modal from '../artificer/Modal.svelte';
    import Panel from '../artificer/Panel.svelte';
    import Button from '../artificer/Button.svelte';
    import { app } from '../artificer/stores/app.svelte.js';

    function handleAction(action) { console.log("Action:", action); }
    function handleReset() { 
        if(confirm("This will wash away all memories. Are you sure?")) { 
            localStorage.clear(); window.location.reload(); 
        } 
    }
</script>

<Modal variant="transparent" onclose={() => app.toggleControlPanel()}>
    
    <div class="header">
        <h2>Weaving</h2>
        <button class="close" onclick={() => app.toggleControlPanel()}>×</button>
    </div>

    <Panel>
        <div class="row">
            <span class="label">Sound Effects</span>
            <Button 
                label={app.settings.sound ? "On" : "Off"} 
                variant={app.settings.sound ? "primary" : "secondary"} 
                onclick={app.toggleSound} 
            />
        </div>
        <div class="row">
            <span class="label">Stream Text</span>
            <Button 
                label={app.settings.streamText ? "Flow" : "Instant"} 
                variant={app.settings.streamText ? "primary" : "secondary"} 
                onclick={app.toggleStreamText} 
            />
        </div>
        <div class="row">
            <span class="label">Auto-Scroll</span>
            <Button 
                label={app.settings.autoScroll ? "Follow" : "Stay"} 
                variant={app.settings.autoScroll ? "primary" : "secondary"} 
                onclick={app.toggleAutoScroll} 
            />
        </div>
    </Panel>

    {#if app.view === 'game'}
        <Panel>
            <div class="grid">
                <Button label="Ghostwrite" variant="primary" onclick={() => handleAction('Ghostwrite')} />
                <Button label="Request Photo" variant="secondary" onclick={() => handleAction('RequestPhoto')} />
            </div>
            <div style="margin-top: 0.5rem">
                <Button label="End Story" variant="danger" onclick={() => handleAction('EndStory')} />
            </div>
        </Panel>
    {/if}

    <Panel>
        <div class="row">
            <span class="label">Developer Mode</span>
            <Button 
                label={app.settings.devMode ? "Active" : "Hidden"} 
                variant={app.settings.devMode ? "warden" : "secondary"} 
                onclick={app.toggleDevMode} 
            />
        </div>
        <div style="margin-top: 0.5rem">
            <Button label="Reset World" variant="danger" onclick={handleReset} />
        </div>
    </Panel>

</Modal>

<style lang="scss">
    .header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 0 0.5rem; margin-bottom: 0.5rem;
        
        h2 { font-family: serif; font-weight: normal; font-size: 1.2rem; color: #e4e4e7; margin: 0; font-style: italic; }
        .close { background: none; border: none; font-size: 1.5rem; color: #71717a; cursor: pointer; transition: color 0.2s; &:hover { color: #fff; } }
    }

    .row {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;
        .label { font-size: 0.9rem; color: #a1a1aa; font-family: sans-serif; }
    }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
</style>
