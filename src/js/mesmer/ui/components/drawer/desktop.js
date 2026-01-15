// apps/rpglitch/js/drawer.js
import { entities } from "../../../../../scholar/database/repository.js";
import { log, error } from "../../../../gamemaster/utils.js";
import { getPictureHTML } from "../../core/utils.js";

import { ThemeService } from "../../core/theme.js";

const DRAWER_ID = "entity-drawer";
const BACKDROP_ID = "entity-drawer-backdrop";
const CONTENT_ID = "entity-drawer-content";
const TITLE_ID = "entity-drawer-title";

let _onSelectCallback = null;

export function initDrawer() {
  const drawer = document.getElementById(DRAWER_ID);
  const backdrop = document.getElementById(BACKDROP_ID);
  if (!drawer || !backdrop) return;

  backdrop.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeDrawer();
  });

  log("[Drawer] Initialized.");
}

export function isOpen() {
  const drawer = document.getElementById(DRAWER_ID);
  return drawer && drawer.classList.contains("is-open");
}

export async function openDrawer(
  type,
  onSelect,
  triggerElement,
  onCreate,
  titleOverride,
) {
  _onSelectCallback = onSelect;

  const drawer = document.getElementById(DRAWER_ID);
  const backdrop = document.getElementById(BACKDROP_ID);
  const content = document.getElementById(CONTENT_ID);
  const title = document.getElementById(TITLE_ID);

  if (!drawer || !content) return;

  if (title) title.textContent = titleOverride || `Select ${type}`;

  // --- CLEAN CSS-ONLY POSITIONING ---
  drawer.style.cssText = ""; // Reset any legacy inline styles
  drawer.removeAttribute("hidden");
  drawer.setAttribute("aria-hidden", "false");

  // Force reflow
  void drawer.offsetWidth;

  // Use requestAnimationFrame to ensure the transition plays
  requestAnimationFrame(() => {
    drawer.classList.add("is-open");
  });

  // Show Backdrop
  if (backdrop) {
    backdrop.removeAttribute("hidden");
    backdrop.setAttribute("aria-hidden", "false");
  }

  // Load Content
  content.innerHTML =
    '<div class="drawer-loading" style="text-align:center; opacity:0.5; padding:2rem;">Loading...</div>';

  try {
    const items = await entities.list(type);
    renderDrawerItems(items, type, onCreate);
  } catch (err) {
    error("Failed to load drawer items:", err);
    content.innerHTML = '<div class="drawer-error">Failed to load items.</div>';
  }
}

export function closeDrawer() {
  const drawer = document.getElementById(DRAWER_ID);
  const backdrop = document.getElementById(BACKDROP_ID);

  if (drawer) {
    drawer.classList.remove("is-open");
    setTimeout(() => {
      if (!drawer.classList.contains("is-open")) {
        drawer.setAttribute("hidden", "");
        drawer.setAttribute("aria-hidden", "true");
        drawer.style.cssText = "";
      }
    }, 300);
  }

  if (backdrop) {
    backdrop.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      if (!drawer.classList.contains("is-open")) {
        backdrop.setAttribute("hidden", "");
      }
    }, 300);
  }
  _onSelectCallback = null;
}

function renderDrawerItems(items, type, onCreate) {
  const content = document.getElementById(CONTENT_ID);
  if (!content) return;

  content.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "drawer-grid";

  // "Create New" Card
  grid.appendChild(
    createCard({ name: `New ${type}`, isNew: true }, type, onCreate),
  );

  // Entity Cards
  items.forEach((item) => {
    grid.appendChild(createCard(item, type));
  });

  content.appendChild(grid);
}

function createCard(item, type, onCreate) {
  const card = document.createElement("button");
  card.className = "drawer-card";
  card.type = "button";

  if (item.isNew) {
    card.classList.add("drawer-card--new");
    card.innerHTML = `<div class="drawer-card-icon" style="font-size:1.5rem;">+</div><div class="drawer-card-label">Create New</div>`;
    card.addEventListener("click", () => {
      if (onCreate) {
        onCreate();
      } else {
        window.location.hash = `#profile/${type}/new`;
      }
      closeDrawer();
    });
  } else {
    if (item.signatureColor) {
      ThemeService.apply(card, item.signatureColor);
    }

    if (typeof getPictureHTML === "function") {
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
