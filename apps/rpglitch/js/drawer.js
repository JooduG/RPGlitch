
import { entities, getPictureHTML } from "./entities.js";
import { log, error } from "./utils.js";

/**
 * Storyboard Drawer Module
 * Manages the bottom drawer for entity selection in the Storyboard.
 * Replaces the legacy "Chin" system for this specific use case.
 */

const DRAWER_ID = "storyboard-drawer";
const BACKDROP_ID = "storyboard-drawer-backdrop";
const CONTENT_ID = "storyboard-drawer-content";

let _onSelectCallback = null;

/**
 * Initialize the drawer system.
 * Ensures the drawer DOM elements exist.
 */
export function initDrawer() {
    console.log("[Drawer] initDrawer called");
    let drawer = document.getElementById(DRAWER_ID);

    if (!drawer) {
        // Create drawer structure if it doesn't exist
        drawer = document.createElement("div");
        drawer.id = DRAWER_ID;
        drawer.className = "storyboard-drawer";
        drawer.setAttribute("hidden", "");
        drawer.setAttribute("aria-hidden", "true");

        const content = document.createElement("div");
        content.id = CONTENT_ID;
        content.className = "storyboard-drawer-content";
        drawer.appendChild(content);

        document.body.appendChild(drawer);
    }

    let backdrop = document.getElementById(BACKDROP_ID);
    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = BACKDROP_ID;
        backdrop.className = "storyboard-drawer-backdrop";
        backdrop.setAttribute("hidden", "");
        backdrop.setAttribute("aria-hidden", "true");
        backdrop.addEventListener("click", closeDrawer);
        document.body.appendChild(backdrop);
    }

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen()) {
            closeDrawer();
        }
    });
}

/**
 * Check if the drawer is currently open.
 */
export function isOpen() {
    const drawer = document.getElementById(DRAWER_ID);
    return drawer && !drawer.hasAttribute("hidden");
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

    if (!drawer || !content) return;

    // Show loading state
    content.innerHTML = '<div class="drawer-loading">Loading...</div>';

    drawer.removeAttribute("hidden");
    drawer.setAttribute("aria-hidden", "false");
    drawer.classList.add("is-open"); // Add class for CSS transition

    backdrop.removeAttribute("hidden");
    backdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");

    try {
        // entities.list is async, so we await it
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
        drawer.classList.remove("is-open"); // Remove class for CSS transition
        // Wait for transition to finish before hiding (optional, but good for UX)
        setTimeout(() => {
            drawer.setAttribute("hidden", "");
            drawer.setAttribute("aria-hidden", "true");
        }, 300); // Match CSS transition duration
    }

    if (backdrop) {
        backdrop.setAttribute("hidden", "");
        backdrop.setAttribute("aria-hidden", "true");
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

    if (items.length === 0) {
        content.innerHTML = '<div class="drawer-empty">No items found. Create one!</div>';
        return;
    }

    const grid = document.createElement("div");
    grid.className = "drawer-grid";

    // Add "New" card
    const newCard = createCard({ name: `New ${type}`, isNew: true }, type);
    grid.appendChild(newCard);

    items.forEach(item => {
        const card = createCard(item, type);
        grid.appendChild(card);
    });

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
      <div class="drawer-card-icon">+</div>
      <div class="drawer-card-label">${item.name}</div>
    `;
        card.addEventListener("click", () => {
            // Navigate to creation form
            // This is a bit of a hack, ideally we'd pass a specific callback for "new"
            window.location.hash = `#profile/${type}/new`;
            closeDrawer();
        });
    } else {
        // Use getPictureHTML for consistent rendering
        const pic = getPictureHTML(item, { cover: false });
        card.appendChild(pic);

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
