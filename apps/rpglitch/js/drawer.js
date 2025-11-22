import { entities, getPictureHTML } from "./entities.js";
import { log, error } from "./utils.js";

/**
 * Storyboard Drawer Module
 * Manages the bottom drawer for entity selection in the Storyboard.
 * Toggles visibility of pre-existing DOM elements and populates content.
 */

const DRAWER_ID = "storyboard-drawer";
const BACKDROP_ID = "storyboard-drawer-backdrop";
const CONTENT_ID = "storyboard-drawer-content";
const TITLE_ID = "drawer-title";

let _onSelectCallback = null;

/**
 * Initialize the drawer system.
 * Checks if required DOM elements exist and binds close handlers.
 */
export function initDrawer() {
    const drawer = document.getElementById(DRAWER_ID);
    const backdrop = document.getElementById(BACKDROP_ID);

    if (!drawer || !backdrop) {
        console.warn("[Drawer] Elements not found in HTML. Ensure #storyboard-drawer exists.");
        return;
    }

    // Bind close button
    const closeBtn = drawer.querySelector(".close-drawer");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeDrawer);
    }

    // Bind backdrop click
    backdrop.addEventListener("click", closeDrawer);

    // Bind Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen()) {
            closeDrawer();
        }
    });

    log("[Drawer] Initialized.");
}

/**
 * Check if the drawer is currently open.
 */
export function isOpen() {
    const drawer = document.getElementById(DRAWER_ID);
    return drawer && drawer.classList.contains("is-open");
}

/**
 * Open the drawer with entities of the specified type.
 * @param {string} type - 'character' or 'world'
 * @param {Function} onSelect - Callback function(entityId) when an item is selected
 */
export function openDrawer(type, onSelect) {
    _onSelectCallback = onSelect;

    const drawer = document.getElementById(DRAWER_ID);
    const backdrop = document.getElementById(BACKDROP_ID);
    const content = document.getElementById(CONTENT_ID);
    const title = document.getElementById(TITLE_ID);

    if (!drawer || !content) return;

    // 1. Update Title
    if (title) {
        title.textContent = `Select ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    }

    // 2. Show Loading State
    content.innerHTML = '<div class="drawer-loading" style="text-align:center; opacity:0.5; padding:2rem;">Loading...</div>';

    // 3. Reveal UI (CSS Transitions)
    drawer.removeAttribute("hidden");
    drawer.setAttribute("aria-hidden", "false");

    // Force reflow to ensure transition triggers
    void drawer.offsetWidth;
    drawer.classList.add("is-open");

    backdrop.removeAttribute("hidden");
    void backdrop.offsetWidth;
    backdrop.setAttribute("aria-hidden", "false");

    document.body.classList.add("drawer-open");

    // 4. Load Data
    try {
        entities.list(type).then(items => {
            renderDrawerItems(items, type);
        }).catch(err => {
            error("Failed to load drawer items:", err);
            content.innerHTML = '<div class="drawer-error">Failed to load items.</div>';
        });
    } catch (err) {
        error("Failed to initiate drawer load:", err);
    }
}

/**
 * Close the drawer.
 */
export function closeDrawer() {
    const drawer = document.getElementById(DRAWER_ID);
    const backdrop = document.getElementById(BACKDROP_ID);

    if (drawer) {
        drawer.classList.remove("is-open");

        // Wait for transition to finish before setting hidden
        setTimeout(() => {
            if (!drawer.classList.contains("is-open")) { // Double check
                drawer.setAttribute("hidden", "");
                drawer.setAttribute("aria-hidden", "true");
            }
        }, 400); // Match CSS transition duration
    }

    if (backdrop) {
        backdrop.setAttribute("aria-hidden", "true");
        setTimeout(() => {
            if (!drawer.classList.contains("is-open")) {
                backdrop.setAttribute("hidden", "");
            }
        }, 400);
    }

    document.body.classList.remove("drawer-open");
    _onSelectCallback = null;
}

/**
 * Render entity cards into the drawer content area.
 * @param {Array} items - List of entity objects
 * @param {string} type - Entity type
 */
function renderDrawerItems(items, type) {
    const content = document.getElementById(CONTENT_ID);
    if (!content) return;

    content.innerHTML = "";

    const grid = document.createElement("div");
    grid.className = "drawer-grid";

    // 1. Add "New" card
    const newCard = createCard({ name: `New ${type}`, isNew: true }, type);
    grid.appendChild(newCard);

    // 2. Add Entity cards
    if (items.length > 0) {
        items.forEach(item => {
            const card = createCard(item, type);
            grid.appendChild(card);
        });
    } else {
        // Optional: Message if empty, but "New" card is already there
    }

    content.appendChild(grid);
}

/**
 * Create a single entity card element.
 * @param {Object} item - Entity object
 * @param {string} type - Entity type
 */
function createCard(item, type) {
    const card = document.createElement("button");
    card.className = "drawer-card";
    card.type = "button";

    if (item.isNew) {
        card.classList.add("drawer-card--new");
        card.innerHTML = `
            <div class="drawer-card-icon" style="font-size:2rem; margin-bottom:0.5rem;">+</div>
            <div class="drawer-card-label">Create New</div>
        `;
        card.addEventListener("click", () => {
            window.location.hash = `#profile/${type}/new`;
            closeDrawer();
        });
    } else {
        // Use getPictureHTML for consistent rendering (cover mode)
        if (typeof getPictureHTML === 'function') {
            const pic = getPictureHTML(item, { cover: true });
            card.appendChild(pic);
        } else {
            // Fallback if utility missing
            card.textContent = item.name;
        }

        const label = document.createElement("div");
        label.className = "drawer-card-label";
        label.textContent = item.name;
        card.appendChild(label);

        card.addEventListener("click", () => {
            if (_onSelectCallback) {
                _onSelectCallback(item.id);
            }
            closeDrawer();
        });
    }

    return card;
}