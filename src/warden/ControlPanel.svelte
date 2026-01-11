<script>
    import Modal from '../artificer/Modal.svelte';
    import Panel from '../artificer/Panel.svelte';
    import Button from '../artificer/Button.svelte';
    import { app } from '../artificer/stores/app.svelte.js';

    function handleAction(actionName) {
        console.log(`[Warden] Executing Action: ${actionName}`);
        // Connect to GameMaster logic later
    }

    function handleReset() {
        if(confirm("⚠ RESET DATA: This deletes everything. Are you sure?")) {
            localStorage.clear(); 
            window.location.reload();
        }
    }
</script>

<Modal variant={"transparent"} onclose={() => app.toggleControlPanel()}>
    
    <div class="cp-header">
        <span class="title">COMMAND // {app.view.toUpperCase()}</span>
        <button class="close-x" onclick={() => app.toggleControlPanel()}>✕</button>
    </div>

    <Panel title={"Sensory & Interface"} icon={"👁️"}>
        <div class="control-row">
            <span class="label">Notification Sounds</span>
            <Button 
                label={app.settings.sound ? "ON" : "OFF"} 
                variant={app.settings.sound ? "primary" : "secondary"}
                onclick={() => app.toggleSound()} 
            />
        </div>
        <div class="control-row">
            <span class="label">Call Mode</span>
            <Button 
                label={app.settings.callMode ? "ACTIVE" : "INACTIVE"} 
                variant={app.settings.callMode ? "primary" : "secondary"}
                onclick={() => app.toggleCallMode()} 
            />
        </div>
        
        <div class="divider"></div>
        
        <div class="control-row">
            <span class="label">Stream Text</span>
            <Button 
                label={app.settings.streamText ? "ON" : "OFF"} 
                variant={app.settings.streamText ? "primary" : "secondary"}
                onclick={() => app.toggleStreamText()} 
            />
        </div>
        <div class="control-row">
            <span class="label">Auto-Scroll</span>
            <Button 
                label={app.settings.autoScroll ? "ON" : "OFF"} 
                variant={app.settings.autoScroll ? "primary" : "secondary"}
                onclick={() => app.toggleAutoScroll()} 
            />
        </div>
    </Panel>

    {#if app.view === 'lobby'}
        <Panel title={"Storyboard Actions"} icon={"🚀"}>
            <Button label={"Prologue Instructions"} variant={"ghost"} onclick={() => handleAction('ShowInstructions')} />
        </Panel>
    {/if}

    {#if app.view === 'game'}
        <Panel title={"Narrative Actions"} icon={"🎲"}>
            <Button label={"Ghostwrite"} variant={"primary"} onclick={() => handleAction('Ghostwrite')} />
            <div class="grid-2">
                <Button label={"Request Photo"} variant={"secondary"} onclick={() => handleAction('RequestPhoto')} />
                <Button label={"End Story"} variant={"danger"} onclick={() => handleAction('EndStory')} />
            </div>
        </Panel>
    {/if}

    <Panel title={"System"} icon={"🛡️"}>
        <div class="control-row">
            <span class="label">Developer Mode</span>
            <Button 
                label={app.settings.devMode ? "ENABLED" : "DISABLED"} 
                variant={app.settings.devMode ? "warden" : "secondary"}
                onclick={() => app.toggleDevMode()} 
            />
        </div>
        <div style="margin-top: 0.5rem;">
            <Button label={"Reset Data"} variant={"danger"} onclick={handleReset} />
        </div>
    </Panel>

</Modal>

<style lang="scss">
    .cp-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #71717a;
        padding: 0 0.5rem;
        margin-bottom: -0.5rem;
        
        .title { 
            font-size: 0.7rem; 
            font-weight: 800; 
            letter-spacing: 2px;
        }
        
        .close-x {
            background: none;
            border: none;
            color: inherit;
            font-size: 1.2rem;
            cursor: pointer;
            &:hover { color: white; }
        }
    }

    .control-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        
        .label { font-size: 0.8rem; color: #d4d4d8; }
        :global(button) { width: auto; min-width: 80px; padding: 0.25rem 0.5rem; font-size: 0.7rem; }
    }

    .divider {
        height: 1px;
        background: #27272a;
        margin: 0.75rem 0;
    }

    .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }
</style>
