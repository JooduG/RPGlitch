<script>
    /**
     * @file LibraryDrawer.svelte
     * 📚 THE ENTITY BIRTHPLACE
     * Slide-up sheet for selecting or creating entities (AI, User, or Fractal).
     */
    import { create_new } from "@data/content_normaliser.js"
    import { entities as repository } from "@data/repository.js"
    import { app } from "@state/app.svelte.js"
    import { quintOut } from "svelte/easing"
    import { fly } from "svelte/transition"

    import Backdrop from "@ui/molecules/dialogs/Backdrop.svelte"
    import LibraryCard from "./LibraryCard.svelte"

    // --- STATE & DERIVATIONS ---
    let is_open = $derived(app.drawer.open)
    let drawerType = $derived(app.drawer.type) // 'ai' | 'user' | 'fractal'

    /**
     * Dynamically maps the UI drawer type to the appropriate data list.
     */
    let entity_list = $derived(() => {
        if (drawerType === "ai") return app.ai_list
        if (drawerType === "user") return app.user_list
        if (drawerType === "fractal") return app.fractal_list
        return []
    })

    /**
     * Prevents the same entity from being used for both User and AI roles.
     */
    function isDisabled(entity) {
        if (drawerType === "ai" && app.selected_user?.id === entity.id) return true
        if (drawerType === "user" && app.selected_ai?.id === entity.id) return true
        return false
    }

    /**
     * Header Label Logic
     */
    let title = $derived(() => {
        const labels = {
            ai: "Select AI Companion",
            user: "Select User Persona",
            fractal: "Select Fractal",
        }
        return labels[drawerType] || "Select Entity"
    })

    // --- ACTIONS ---

    /**
     * THE BIRTH EVENT: handleCreateNew
     * Uses the Factory to generate a fresh entity and persists it to the DB.
     */
    async function handleCreateNew() {
        // 1. Map UI role to DB type
        const type = drawerType === "fractal" ? "fractal" : "character"

        // 2. Construct via Factory (Random color, Empty fields, Semantic Structure)
        const blueprint = create_new(type, {
            name: `New ${drawerType.toUpperCase()}`,
        })

        try {
            // 3. Save to Database via Repository
            const saved = await repository.upsert(type, blueprint)

            // 4. Log the event for telemetry
            app.log(`Birthed new ${type}: ${saved.id}`, "db")

            // 5. Select and Open for Editing
            // This closes the drawer and slides the Profile wing into view.
            app.select_entity(drawerType, saved)
            app.open_profile(saved)
        } catch (err) {
            app.log(`Creation failed: ${err.message}`, "error")
        }
    }

    function handle_select(entity) {
        app.select_entity(drawerType, entity)
    }

    function handleKeydown(e) {
        if (e.key === "Escape" && is_open) {
            app.close_drawer()
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if is_open}
    <Backdrop onclick={() => app.close_drawer()} zIndex="calc(var(--z-drawer) - 1)" />

    <div class="entity-drawer" role="dialog" aria-labelledby="drawer-title" transition:fly={{ y: "100%", duration: 500, easing: quintOut }}>
        <header class="drawer-header">
            <h3 id="drawer-title">{title()}</h3>
            <button class="close-btn" onclick={() => app.close_drawer()} aria-label="Close drawer">×</button>
        </header>

        <div class="drawer-content no-scrollbar">
            <div class="drawer-grid">
                <button class="drawer-card drawer-card--new" onclick={handleCreateNew} title="Initialize a new entity from template">
                    <div class="new-icon-wrap">
                        <span class="drawer-card-icon">+</span>
                    </div>
                    <span class="drawer-card-label">Create New</span>
                </button>

                {#each entity_list() as entity (entity.id)}
                    <LibraryCard {entity} type={drawerType} disabled={isDisabled(entity)} onSelect={() => handle_select(entity)} onViewProfile={() => app.open_profile(entity)} />
                {/each}
            </div>

            {#if entity_list().length === 0}
                <div class="drawer-empty">
                    <svg class="empty-icon" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z" />
                    </svg>
                    <h4>No {drawerType === "fractal" ? "Realities" : "Entities"} Found</h4>
                    <p>Click "Create New" to initialize one.</p>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .entity-drawer {
        background: var(--bg-card);
        box-shadow: var(--shadow-l);
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 1200px;
        max-height: 85vh;
        border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
        z-index: var(--z-drawer);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .drawer-header {
        padding: var(--spacing-m) var(--spacing-l);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-app);
    }

    .drawer-header h3 {
        margin: 0;
        letter-spacing: 0.5px;
        font-weight: 800;
        font-size: var(--font-size-xl);
        font-family: var(--font-header);
        text-transform: uppercase;
    }

    .drawer-header .close-btn {
        background: transparent;
        border: none;
        color: var(--font-muted);
        font-size: 2rem;
        cursor: pointer;
        line-height: 1;
    }

    .drawer-header .close-btn:hover {
        color: white;
    }

    .drawer-content {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-l);
    }

    .drawer-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: var(--spacing-l);
        width: 100%;
    }

    /* --- NEW ENTITY CARD --- */
    .drawer-card--new {
        background: var(--surface-sunken);
        box-shadow: inset 0 0 0 1px rgba(var(--pure-white-rgb), 0.05);
        border-radius: var(--border-radius-l);
        aspect-ratio: 2 / 3;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-m);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        color: var(--font-muted);
        border: none;
        padding: 0;
    }

    .drawer-card--new .new-icon-wrap {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(var(--pure-white-rgb), 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: inherit;
    }

    .drawer-card--new .drawer-card-icon {
        font-size: 2rem;
        line-height: 1;
    }

    .drawer-card--new .drawer-card-label {
        font-weight: 800;
        font-family: var(--font-header);
        text-transform: uppercase;
        font-size: var(--font-size-xs);
        letter-spacing: 1px;
    }

    .drawer-card--new:hover {
        color: white;
        background: rgba(var(--pure-white-rgb), 0.05);
        transform: translateY(-5px);
    }

    .drawer-card--new:hover .new-icon-wrap {
        background: var(--app-accent);
        box-shadow: 0 0 15px var(--app-accent);
    }

    /* --- EMPTY STATE --- */
    .drawer-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        text-align: center;
        color: var(--font-muted);
    }

    .drawer-empty .empty-icon {
        width: 80px;
        height: 80px;
        opacity: 0.1;
        margin-bottom: var(--spacing-m);
    }

    .drawer-empty h4 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 800;
    }

    .drawer-empty p {
        opacity: 0.6;
        margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
        .entity-drawer {
            max-width: 100vw;
            border-radius: 20px 20px 0 0;
        }
        .drawer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-m);
        }
    }
</style>
