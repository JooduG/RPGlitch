// apps/rpglitch/js/drawer.js
import { entities } from "./entity-crud.js"; // Renamed import
import { getPictureHTML } from "./entity-structs.js"; // Renamed import
import { log, error } from "./core-utils.js"; // Renamed import

const DRAWER_ID = "storyboard-drawer";
const BACKDROP_ID = "storyboard-drawer-backdrop";
const CONTENT_ID = "storyboard-drawer-content";
const TITLE_ID = "drawer-title";

let _onSelectCallback = null;

export function initDrawer() {
    const drawer = document.getElementById(DRAWER_ID);
    const backdrop = document.getElementById(BACKDROP_ID);
    if (!drawer || !backdrop) return;

    const closeBtn = drawer.querySelector(".close-drawer");
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen()) closeDrawer();
    });

    window.addEventListener("resize", () => {
        if (isOpen()) closeDrawer();
    });

    log("[Drawer] Initialized.");
}

export function isOpen() {
    const drawer = document.getElementById(DRAWER_ID);
    return drawer && drawer.classList.contains("is-open");
}

export function openDrawer(type, onSelect, triggerElement) {
    _onSelectCallback = onSelect;

    const drawer = document.getElementById(DRAWER_ID);
    const backdrop = document.getElementById(BACKDROP_ID);
    const content = document.getElementById(CONTENT_ID);
    const title = document.getElementById(TITLE_ID);

    if (!drawer || !content) return;

    if (title) title.textContent = `Select ${type}`;

    // --- ROBUST POSITIONING LOGIC ---
    if (triggerElement) {
        const rect = triggerElement.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        // 1. Reset styles to prevent conflict
        drawer.style.cssText = '';
        drawer.classList.remove('drop-up');
        drawer.classList.remove('centered-modal');

        // 2. Width & X-Position
        drawer.style.width = `${rect.width}px`;

        // Clamp horizontal to viewport
        let leftPos = rect.left;
        if (leftPos + rect.width > viewportW) {
            leftPos = viewportW - rect.width - 10; // Buffer
        }
        if (leftPos < 10) leftPos = 10;
        drawer.style.left = `${leftPos}px`;

        // 3. Vertical Position Strategy
        const spaceBelow = viewportH - rect.bottom;
        const spaceAbove = rect.top;
        const GAP = 8;
        const SAFE_MARGIN = 16;
        const MIN_USABLE_HEIGHT = 200; // Minimum height for a usable drawer

        // Check if we have enough space anywhere
        const canGoDown = spaceBelow >= MIN_USABLE_HEIGHT;
        const canGoUp = spaceAbove >= MIN_USABLE_HEIGHT;

        if (canGoDown) {
            // --- DROP DOWN ---
            drawer.style.top = `${rect.bottom + GAP}px`;
            drawer.style.bottom = 'auto';
            drawer.style.maxHeight = `${spaceBelow - SAFE_MARGIN}px`;
            drawer.style.transformOrigin = 'top center';

        } else if (canGoUp) {
            // --- DROP UP ---
            drawer.style.bottom = `${viewportH - rect.top + GAP}px`;
            drawer.style.top = 'auto';
            drawer.style.maxHeight = `${spaceAbove - SAFE_MARGIN}px`;
            drawer.classList.add('drop-up');
            drawer.style.transformOrigin = 'bottom center';

        } else {
            // --- FALLBACK: CENTERED MODAL ---
            // Not enough space above or below (card is huge or screen is tiny)
            drawer.style.top = '50%';
            drawer.style.left = '50%';
            drawer.style.transform = 'translate(-50%, -50%)';
            drawer.style.width = 'min(400px, 90vw)';
            drawer.style.maxHeight = '60vh';
            drawer.classList.add('centered-modal');
        }

    } else {
        // Mobile / No Trigger Fallback
        drawer.style.width = '100%';
        drawer.style.left = '0';
        drawer.style.bottom = '0';
        drawer.style.top = 'auto';
        drawer.style.maxHeight = '60vh';
    }

    content.innerHTML = '<div class="drawer-loading" style="text-align:center; opacity:0.5; padding:2rem;">Loading...</div>';

    drawer.removeAttribute("hidden");
    void drawer.offsetWidth; // Force reflow
    drawer.classList.add("is-open");

    backdrop.removeAttribute("hidden");
    backdrop.setAttribute("aria-hidden", "false");

    entities.list(type).then(items => {
        renderDrawerItems(items, type);
    }).catch(err => {
        error("Failed to load drawer items:", err);
        content.innerHTML = '<div class="drawer-error">Failed to load items.</div>';
    });
}

export function closeDrawer() {
    const drawer = document.getElementById(DRAWER_ID);
    const backdrop = document.getElementById(BACKDROP_ID);

    if (drawer) {
        drawer.classList.remove("is-open");
        setTimeout(() => {
            if (!drawer.classList.contains("is-open")) {
                drawer.setAttribute("hidden", "");
                drawer.style.cssText = ''; // Reset all inline styles
            }
        }, 200);
    }

    if (backdrop) {
        backdrop.setAttribute("aria-hidden", "true");
        setTimeout(() => {
            if (!drawer.classList.contains("is-open")) {
                backdrop.setAttribute("hidden", "");
            }
        }, 200);
    }
    _onSelectCallback = null;
}

function renderDrawerItems(items, type) {
    const content = document.getElementById(CONTENT_ID);
    if (!content) return;

    content.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "drawer-grid";

    grid.appendChild(createCard({ name: `New ${type}`, isNew: true }, type));

    items.forEach(item => {
        grid.appendChild(createCard(item, type));
    });

    content.appendChild(grid);
}

function createCard(item, type) {
    const card = document.createElement("button");
    card.className = "drawer-card";
    card.type = "button";

    if (item.isNew) {
        card.classList.add("drawer-card--new");
        card.innerHTML = `<div class="drawer-card-icon" style="font-size:1.5rem;">+</div><div class="drawer-card-label">Create New</div>`;
        card.addEventListener("click", () => {
            window.location.hash = `#profile/${type}/new`;
            closeDrawer();
        });
    } else {
        if (item.signatureColour) {
            card.style.setProperty("--card-signature", `var(--signature-${item.signatureColour})`);
        }
        if (typeof getPictureHTML === 'function') {
            const pic = getPictureHTML(item, { cover: true });
            card.appendChild(pic);
        } else {
            card.textContent = item.name;
        }
        const label = document.createElement("div");
        label.className = "drawer-card-label";
        label.textContent = item.name;
        card.appendChild(label);

        card.addEventListener("click", () => {
            if (_onSelectCallback) _onSelectCallback(item.id);
            closeDrawer();
        });
    }
    return card;
}