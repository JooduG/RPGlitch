<script>
    /**
     * LibraryDrawer - Slide-up bottom sheet for selecting entities.
     * Internalized drawer and card styling.
     */
    import { app } from "@state/app.svelte.js"
    import LibraryCard from "@ui/molecules/LibraryCard.svelte"
    import { quintOut } from "svelte/easing"
    import { fly } from "svelte/transition"

    import Backdrop from "@ui/molecules/Backdrop.svelte"

    // Derived from drawer state
    let isOpen = $derived(app.drawer.open)
    let drawerType = $derived(app.drawer.type)
    // ... derived values ...

    // Get the appropriate list based on drawer type
    let entityList = $derived(() => {
        if (drawerType === "ai") return app.aiList
        if (drawerType === "user") return app.userList
        if (drawerType === "fractal") return app.fractalList
        return []
    })

    function isDisabled(entity) {
        if (drawerType === "ai" && app.selectedUser?.id === entity.id)
            return true
        if (drawerType === "user" && app.selectedAi?.id === entity.id)
            return true
        return false
    }

    // Get drawer title
    let title = $derived(() => {
        if (drawerType === "ai") return "Select AI Companion"
        if (drawerType === "user") return "Select User Persona"
        if (drawerType === "fractal") return "Select Fractal"
        return "Select Entity"
    })

    function handleSelect(entity) {
        app.selectEntity(drawerType, entity)
    }

    function handleBackdropClick() {
        app.closeDrawer()
    }

    function handleKeydown(e) {
        if (e.key === "Escape" && isOpen) {
            app.closeDrawer()
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
    <!-- Backdrop -->
    <Backdrop
        onclick={handleBackdropClick}
        zIndex="calc(var(--z-drawer) - 1)"
    />

    <!-- Drawer -->
    <div
        class="entity-drawer"
        role="dialog"
        aria-labelledby="drawer-title"
        transition:fly={{ y: "100%", duration: 500, easing: quintOut }}
    >
        <div class="drawer-handle"></div>

        <header class="drawer-header">
            <h3 id="drawer-title">{title()}</h3>
        </header>

        <div class="drawer-content">
            {#if entityList().length === 0}
                <div class="drawer-empty">
                    <svg class="empty-icon" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"
                        />
                    </svg>
                    <h4>
                        No {drawerType === "fractal"
                            ? "Realities"
                            : "Characters"} Found
                    </h4>
                    <p>Create one to get started.</p>
                </div>
            {:else}
                <div class="drawer-grid">
                    <!-- Add New Card -->
                    <button
                        class="drawer-card drawer-card--new"
                        onclick={() => {
                            // TODO: Wire up to the Entity Factory / Wizard
                            app.log(
                                "Create New Entity Wizard coming soon!",
                                "system"
                            )
                        }}
                    >
                        <span class="drawer-card-icon">+</span>
                        <span class="drawer-card-label">Create New</span>
                    </button>

                    <!-- Entity Cards -->
                    {#each entityList() as entity (entity.id)}
                        <LibraryCard
                            {entity}
                            type={drawerType}
                            disabled={isDisabled(entity)}
                            onSelect={() => handleSelect(entity)}
                            onViewProfile={() => app.openProfile(entity)}
                        />
                    {/each}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style lang="scss">
    @use "@theme/abstracts/variables" as *;
    @use "@theme/abstracts/mixins" as *;
    @use "@theme/abstracts/placeholders" as *;

    /* --- DRAWER CONTAINER --- */
    .entity-drawer {
        /* Solid, fully opaque drawer - no glass effect */
        background: var(--bg-card);
        border: 0;
        border-bottom: none;
        box-shadow: var(--shadow-l);

        /* --- POSITIONING --- */
        position: fixed;
        bottom: 0;
        width: auto;
        max-height: 85vh;
        max-width: 80vw;
        justify-self: center;
        /* --- SHAPE & LAYERS --- */
        border-radius: var(--spacing-l) var(--spacing-l) 0 0;
        z-index: var(--z-drawer);
        display: flex;
        flex-direction: column;
        pointer-events: auto;
    }

    /* --- HEADER --- */
    .drawer-header {
        padding: var(--spacing-m) var(--spacing-l);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 0;
        background: var(--bg-app); /* Fully opaque, slightly darker */
        border-radius: var(--spacing-l) var(--spacing-l) 0 0; /* Match drawer corners */
        flex-shrink: 0;

        h3 {
            margin: 0;
            letter-spacing: 0.5px;
            font-weight: 800; /* Heavy weight */
            font-size: var(--font-size-xl); /* Size upgrade */
            font-family: var(--font-heading);
        }
    }

    /* --- CONTENT GRID --- */
    .drawer-content {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-m);

        @include custom-scrollbar;
    }

    .drawer-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--spacing-m);
        width: 100%;
    }

    .drawer-card--new {
        width: 140px;
        flex: 0 0 auto;
        aspect-ratio: 2 / 3;
        border: 0;
        background: transparent;
        border-radius: var(--spacing-m);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--app-muted);
        gap: var(--spacing-xs);
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            border-color: var(--app-primary);
            color: var(--app-primary);
            background: rgba(255, 255, 255, var(--opacity-xs));
            transform: translateY(-4px);
        }

        .drawer-card-icon {
            font-size: clamp(1.2rem, 4vw, 2.2rem);
            margin: 0;
        }

        .drawer-card-label {
            font-weight: 700;
        }
    }

    /* --- EMPTY STATE --- */
    .drawer-empty {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        width: 100%;
        color: var(--app-muted);
        text-align: center;
        padding: 2rem;
        gap: 1rem;

        .empty-icon {
            width: 5.5rem; /* Upgraded from 4rem */
            height: 5.5rem;
            opacity: 0.2;
            fill: currentcolor;
            margin-bottom: 0.5rem;
            transition: all 0.3s ease;
        }

        &:hover .empty-icon {
            transform: scale(1.1) rotate(-5deg);
            opacity: 0.3;
        }

        h4 {
            margin: 0;
            color: var(--signature-color);
            font-size: var(--font-size-xl); /* Upgraded from default */
            font-weight: 800; /* Bold */
        }

        p {
            margin: 0;
            font-size: 0.9rem;
            opacity: 0.7;
        }
    }

    @include mobile {
        .entity-drawer {
            width: 100vw;
            left: 0;
            transform: none;
            border-radius: 20px 20px 0 0;
            max-height: 85vh;
        }

        .drawer-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
            gap: 1rem;
        }
    }
</style>
