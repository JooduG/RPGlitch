import './profile-router.js';
import {
  applyBrand,
  debounce,
  chin,
  dismissLoadingUI,
  startUIWatchdog,
  installUIRecoveryHooks,
  installUIBlockerAttributeObserver,
  enableAutoUnlock,
  setSelected,
  deriveBrand,
  _uiWatchdogStarted,
} from './utils.js';
import {
  entities,
  getPictureHTML,
  getPremadeItems,
  _allItemsCache
} from './entities.js';


/* global DOMPurify */

const TEST_MODE = (() => {
  if (globalThis.__TEST__) {
    return true;
  }
  try {
    return /jsdom/i.test(globalThis?.navigator?.userAgent || "");
  } catch {
    return false;
  }
})();

const MAX_INIT_RETRIES = TEST_MODE ? 1 : 40;
const INIT_BACKOFF_MS = TEST_MODE ? 0 : 250;

const DATA_KEYS = ["stories", "characters", "worlds"];

let _cardNavAttached = false;
let _suppressNextBlur = false;
let _optionsListenersAttached = false;
let _contentListenersAttached = false;
let _chinSearchBound = false;
let _bootBound = false;
let _bootStarted = false;

// UI Elements Cache
const ui = {};

export function _getUIElements() {
  const doc = document;
  const ui = {}; // Initialize ui object inside the function

  ui.topBarLeft = doc.querySelector("#top-bar-left");
  ui.chinContainer = doc.querySelector("#chin-container");
  ui.topBarButtons =
    ui.topBarLeft ?
    ui.topBarLeft.querySelectorAll("button[data-chin]") :
    [];
  ui.topBarRightStoryboard =
    doc.querySelector("#top-bar-right-storyboard");
  ui.topBarRightForm =
    doc.querySelector("#top-bar-right-form");
  ui.topBarRightProfile =
    doc.querySelector("#top-bar-right-profile");

  // Option chin actions
  ui.uploadBackupInput =
    doc.querySelector("#upload-backup");
  ui.uploadBackupTrigger =
    doc.querySelector('[data-trigger="upload-backup"]');
  ui.downloadBackupButton =
    doc.querySelector("#download-backup");
  ui.deleteAllDataButton =
    doc.querySelector("#delete-all-data");

  // Story chin actions
  ui.newStoryButton = doc.querySelector("#new-story");
  ui.uploadStoryTrigger =
    doc.querySelector('[data-trigger="upload-story"]');
  ui.uploadStoryInput =
    doc.querySelector("#upload-story");

  // Character chin actions
  ui.newCharacterButton =
    doc.querySelector("#new-character");
  ui.uploadCharacterTrigger =
    doc.querySelector('[data-trigger="upload-character"]');
  ui.uploadCharacterInput =
    doc.querySelector("#upload-character");

  // World chin actions
  ui.newWorldButton = doc.querySelector("#new-world");
  ui.uploadWorldTrigger =
    doc.querySelector('[data-trigger="upload-world"]');
  ui.uploadWorldInput =
    doc.querySelector("#upload-world");

  return ui;
}

export function _attachChinSearchHandlers() {
  if (_chinSearchBound) return;
  _chinSearchBound = true;
  const inputs = document.querySelectorAll(".chin-search");
  inputs.forEach((input) => {
    if (input._chinSearchBound) return; // idempotent
    const container = input.closest(".chin") || input.closest(".chin-widget");
    const list = container?.querySelector(".chin-grid");
    if (!list || input._chinSearchBound) return;

    const doFilter = () => {
      const term = input.value.toLowerCase();
      list.querySelectorAll("[data-title]").forEach((card) => {
        const title = (card.dataset.title || "").toLowerCase();
        const match = title.includes(term);
        card.hidden = !match;
      });
    };

    const handler = TEST_MODE ?
      doFilter :
      debounce(doFilter, 250);
    input.addEventListener("input", handler);
    input._chinSearchBound = true;
  });
}

export function loadStoredItems(key) {
  try {
    const storage = localStorage;
    if (!storage) return [];
    const data = storage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Failed to parse localStorage item with key "${key}":`, e);
    return [];
  }
}

export function resetStoryboard() {
  // placeholder for future storyboard reset logic
}



export function getAllItems(key, refresh = false) {
  if (!refresh && Array.isArray(_allItemsCache[key]))
    return [..._allItemsCache[key]];

  if (
    (key === "characters" || key === "worlds") &&
    entities &&
    typeof entities.list === "function"
  ) {
    if (refresh) {
      delete _allItemsCache[key];
    }
    const items = entities.list(key.slice(0, -1));
    _allItemsCache[key] = items;
    return items;
  }

  const premadeItems = getPremadeItems(key).map((item) => ({
    ...item,
    isPremade: true,
  }));
  const stored = loadStoredItems(key).map((item) => ({
    ...item,
    isPremade: false,
  }));
  const data = premadeItems.concat(stored);
  _allItemsCache[key] = data;
  return data;
}

function renderList(containerId, key) {
  const container = document.querySelector(`#${containerId}`);
  if (!container) return;

  container
    .querySelectorAll('img.entity-image[src^="blob:"]')
    .forEach((img) => {
      URL.revokeObjectURL(img.src);
    });

  container.textContent = "";
  const all = getAllItems(key);
  const frag = document.createDocumentFragment();

  if (all.length === 0) {
    const message = document.createElement("p");
    message.className = "chin-empty";
    message.textContent =
      key === "stories" ?
      "Empty here—time to write your first story!" :
      key === "characters" ?
      "No characters found yet" :
      key === "worlds" ?
      "No worlds found yet" :
      "No items found";
    container.appendChild(message);
    return;
  }

  const tpl = document.querySelector("#chin-card-template");

  all.forEach((item) => {
    let card;

    if (tpl && tpl.content) {
      card = tpl.content.firstElementChild.cloneNode(true);
    } else {
      card = document.createElement("div");
      card.className = "chin-card";
      card.innerHTML = `
        <div class="media"></div>
        <div class="body"><p class="description"></p></div>`;
      const t = document.createElement("h4");
      t.className = "title";
      card.querySelector(".media").appendChild(t);
      const b = document.createElement("div");
      b.className = "badge";
      b.hidden = true;
      card.querySelector(".media").appendChild(b);
    }

    card.dataset.title = item.title || item.name || "Empty";
    if (item.id) {
      card.dataset.id = item.id;
      card.dataset.type = key.slice(0, -1);
      card.dataset.entityId = item.id;
      card.dataset.entityType = key.slice(0, -1);
    }
    if (item.isPremade) card.dataset.premade = "true";

    card.setAttribute("aria-label", item.title || "Open");

    const media = card.querySelector(".media");
    if (typeof getPictureHTML === "function") {
      const maybe = getPictureHTML(item, {
        cover: true
      });
      if (maybe instanceof Node) {
        media.prepend(maybe);
      } else if (typeof maybe === "string") {
        const t = document.createElement("template");
        t.innerHTML = DOMPurify ? DOMPurify.sanitize(maybe.trim()) : maybe.trim();
        const node = t.content.firstElementChild;
        if (node) media.prepend(node);
      }
    }

    applyBrand(card, item);
    try {
      applyBrand?.(media, item);
    } catch (e) {
      void e;
    }

    if (media) {
      const row = document.createElement("div");
      row.className = "chip-row";
      const chips = [];
      if (item.isPremade) chips.push("Premade");
      if (Array.isArray(item.tags)) chips.push(...item.tags.slice(0, 3));
      chips.forEach((txt) => {
        const span = document.createElement("span");
        span.className = "chip";
        const sm = document.createElement("small");
        sm.textContent = txt;
        span.appendChild(sm);
        row.appendChild(span);
      });
      media.appendChild(row);
    }

    const titleEl = card.querySelector(".title");
    if (titleEl) titleEl.textContent = item.title || item.name || "Empty";

    const badge = card.querySelector(".badge");
    if (badge) badge.hidden = !item.isPremade;

    const descEl = card.querySelector(".description");
    if (descEl) {
      descEl.textContent = item.description ? item.description : "";
      descEl.classList.add("muted");
    }

    card.addEventListener("click", (ev) => {
      if (ev.target.closest("button, a, input, select, textarea")) return;
      const type = card.dataset.entityType || card.dataset.type;
      const id = card.dataset.entityId || card.dataset.id;
      if (type && id) router.navigate(`#profile/${type}/${id}`);
    });
    card.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      const type = card.dataset.entityType || card.dataset.type;
      const id = card.dataset.entityId || card.dataset.id;
      if (type && id) router.navigate(`#profile/${type}/${id}`);
    });

    frag.appendChild(card);
  });
  container.appendChild(frag);
}

export function renderDropdown(selectId, key) {
  const select = document.querySelector(`#${selectId}`);
  if (!select) return;
  const existingPlaceholder = select.querySelector('option[value=""]');
  const placeholderText = existingPlaceholder ?
    existingPlaceholder.textContent :
    select.dataset.placeholder || "";
  select.dataset.placeholder = placeholderText;
  const placeholder = existingPlaceholder ?
    existingPlaceholder.cloneNode(true) :
    document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = placeholderText;
  select.textContent = "";
  select.appendChild(placeholder);
  const items = getAllItems(key);
  const premadeGroup = document.createElement("optgroup");
  premadeGroup.label = "Premade";
  const customGroup = document.createElement("optgroup");
  customGroup.label = "Custom";
  let premadeCount = 0;
  let customCount = 0;
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id || item.title;
    option.textContent = item.title || "";
    if (item.isPremade) {
      premadeGroup.appendChild(option);
      premadeCount += 1;
    } else {
      customGroup.appendChild(option);
      customCount += 1;
    }
  });
  if (premadeCount > 0) select.appendChild(premadeGroup);
  if (customCount > 0) select.appendChild(customGroup);
}

export function renderStoryList() {
  renderList("chin-story-grid", "stories");
}

export function renderCharacterList() {
  renderList("chin-character-grid", "characters");
}

export function renderWorldList() {
  renderList("chin-world-grid", "worlds");
}

export function refreshAllLists() {
  DATA_KEYS.forEach((key) => getAllItems(key, true));
  renderStoryList?.();
  renderCharacterList?.();
  renderWorldList?.();
}

export function _attachCardNavigation() {
  if (_cardNavAttached) return;

  if (typeof _suppressNextBlur === "undefined") {
    _suppressNextBlur = false;
  }

  const container = document.querySelector("#chin-container");
  if (container) {
    container.addEventListener("click", (e) => {
      if (e.target.closest("button, a, input, select, textarea")) return;
      const card = e.target.closest(".chin-card[data-type][data-id]");
      if (!card) return;
      setSelected?.(
        card,
        container.querySelectorAll(".chin-card[data-type][data-id]")
      );
      const {
        type,
        id
      } = card.dataset;
      if (type && id) router.navigate(`#profile/${type}/${id}`);
    });

    container.addEventListener("keydown", (e) => {
      const card = e.target.closest(".chin-card[data-type][data-id]");
      if (!card) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const {
          type,
          id
        } = card.dataset;
        if (type && id) router.navigate(`#profile/${type}/${id}`);
      }
    });
  }

  const storyboard = document.querySelector("#storyboard-grid");
  if (storyboard && !storyboard._bound) {
    storyboard._bound = true;

    storyboard.addEventListener(
      "pointerdown",
      (e) => {
        if (e.target.closest(".storyboard-card")) {
          _suppressNextBlur = true;
          setTimeout(() => {
            _suppressNextBlur = false;
          }, 1200);
        }
      }, {
        passive: true,
        capture: true
      }
    );

    function openSelectSafely(select) {
      if (!select) return;
      try {
        const inIframe = (() => {
          try {
            return window.top !== window;
          } catch {
            return true;
          }
        })();
        if (!inIframe && typeof select.showPicker === "function") {
          try {
            select.showPicker();
            return;
          } catch {
            // SecurityError or unsupported context – fall back
          }
        }
      } catch {
        /* ignore */
      }
      try {
        select.focus();
      } catch {
        /* noop */
      }
      try {
        select.click();
      } catch {
        /* noop */
      }
    }

    storyboard.addEventListener("click", (e) => {
      if (e.target.closest("select, button, a, input, textarea")) return;

      const card = e.target.closest(".storyboard-card");
      if (!card) return;

      const select = card.querySelector("select");

      const all = storyboard.querySelectorAll(".storyboard-card");
      setSelected(card, all);

      const type = card.dataset.entityType || card.dataset.type;
      const id = card.dataset.entityId || select?.value || "";

      if (!id && select) {
        e.preventDefault();
        e.stopPropagation();

        _suppressNextBlur = true;

        requestAnimationFrame(() => {
          openSelectSafely(select);
          setTimeout(() => {
            _suppressNextBlur = false;
          }, 1200);
        });
        return;
      }

      if (type && id) router.navigate(`#profile/${type}/${id}`);
    });

    storyboard.addEventListener("keydown", (e) => {
      const card = e.target.closest(".storyboard-card");
      if (!card) return;
      if (e.key !== "Enter" && e.key !== " ") return;

      e.preventDefault();

      const select = card.querySelector("select");
      const type = card.dataset.entityType || card.dataset.type;
      const id = card.dataset.entityId || select?.value || "";

      if (!id && select) {
        _suppressNextBlur = true;
        requestAnimationFrame(() => {
          openSelectSafely(select);
          setTimeout(() => {
            _suppressNextBlur = false;
          }, 1200);
        });
        return;
      }

      if (type && id) router.navigate(`#profile/${type}/${id}`);
    });

    storyboard.querySelectorAll(".storyboard-card").forEach((c) => {
      if (!c.hasAttribute("tabindex")) c.tabIndex = 0;
      c.setAttribute("role", "group");
      const select = c.querySelector("select");
      if (select && !select.hasAttribute("aria-label")) {
        select.setAttribute("aria-label", "Select entity");
      }

      if (!c._navBound) {
        c.addEventListener("click", (ev) => {
          if (ev.target.closest("select, button, a, input, textarea")) return;
          const type = c.dataset.entityType || c.dataset.type;
          const id =
            c.dataset.entityId || c.querySelector("select")?.value || "";
          if (type && id) router.navigate?.(`#profile/${type}/${id}`);
        });
        c.addEventListener("keydown", (ev) => {
          if (ev.key !== "Enter" && ev.key !== " ") return;
          ev.preventDefault();
          const type = c.dataset.entityType || c.dataset.type;
          const id =
            c.dataset.entityId || c.querySelector("select")?.value || "";
          if (type && id) router.navigate?.(`#profile/${type}/${id}`);
        });
        c._navBound = true;
      }
    });

    ["mousedown", "pointerdown", "click"].forEach((evt) => {
      storyboard.addEventListener(
        evt,
        (ev) => {
          if (ev.target.closest("select")) {
            ev.stopPropagation();
          }
        },
        true
      );
    });
  }

  _cardNavAttached = true;
}

function updateStoryboardCard(target, entityOrKey, opts = {}) {
  let card, entity;

  if (target && target.tagName === "SELECT") {
    const select = target;
    card = select.closest(".storyboard-card");
    const type =
      card?.dataset?.type ||
      select.dataset.entityType ||
      select.dataset.type ||
      "";
    const id = select.value || "";
    const key = entityOrKey;

    if (id) {
      const list =
        typeof entities.list === "function" ?
        entities.list(type || (key ? key.replace(/s$/, "") : "")) :
        [];
      entity = list.find((e) => String(e.id) === String(id)) || null;
    } else {
      entity = null;
    }
  } else {
    card =
      typeof target === "string" ? document.querySelector(target) : target;
    entity = entityOrKey || null;
  }

  if (!card) return;

  const left = card.querySelector(".storyboard-card-left");
  const descEl = card.querySelector(".storyboard-card-right .desc");
  const tag = card.querySelector("footer small");
  const select = card.querySelector("select");

  if (descEl && !descEl.dataset.placeholder) {
    descEl.dataset.placeholder = descEl.textContent || "";
  }

  const buildPictureNode = (ent, {
    preferTemplateForEmpty = true
  } = {}) => {
    const kind = (ent && ent.kind) || "";
    const isEmpty = !ent || !ent.imageUrl;

    const hasEntity = !!(ent && (ent.id || ent.title || ent.name));
    if (preferTemplateForEmpty && isEmpty && !hasEntity) {
      const id = kind ?
        `tpl-storyboard-picture-${kind}` :
        "tpl-storyboard-picture-default";
      const tpl =
        document.querySelector(`#${id}`) ||
        document.querySelector("#tpl-storyboard-picture-default");
      if (tpl && tpl.content && tpl.content.firstElementChild) {
        return tpl.content.firstElementChild.cloneNode(true);
      }
    }

    let out = null;
    try {
      if (typeof getPictureHTML === "function") {
        const maybe = getPictureHTML(ent || {
          kind
        }, {
          context: "storyboard",
          cover: true,
          neutralPlaceholder: !hasEntity,
        });
        if (maybe instanceof Node) {
          out = maybe;
        } else if (typeof maybe === "string") {
          const tpl = document.createElement("template");
          tpl.innerHTML = DOMPurify ?
            DOMPurify.sanitize(maybe.trim()) :
            maybe.trim();
          out = tpl.content.firstElementChild;
        }
      }
    } catch {
      /* empty */
    }

    if (!out) {
      const div = document.createElement("div");
      div.className = "picture picture--cover";
      out = div;
    }

    const img = out.querySelector?.("img");
    if (img) {
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.alt = img.alt || (ent?.kind ? `${ent.kind} image` : "image");
    }
    return out;
  };

  if (entity) {
    if (descEl) descEl.textContent = entity.description || "";
    if (tag) {
      tag.textContent = "";
      tag.style.display = "none";
    }
    if (left) {
      left.textContent = "";
      left.appendChild(buildPictureNode(entity));
      applyBrand?.(left, entity);
    }
    try {
      const footer = card.querySelector(".storyboard-card-right footer");
      if (footer) {
        footer.querySelectorAll(".chip").forEach((n) => n.remove());
        if (entity.isPremade) {
          const pill = document.createElement("span");
          pill.className = "chip";
          const sm = document.createElement("small");
          sm.textContent = "Premade";
          pill.appendChild(sm);
          footer.appendChild(pill);
        }
      }
    } catch {
      /* noop */
    }
    applyBrand(card, entity);
    card.dataset.entityType = card.dataset.type || entity.kind || "";
    card.dataset.entityId = entity.id;
    if (select && select.value !== String(entity.id)) {
      select.value = String(entity.id);
    }
  } else {
    if (descEl) descEl.textContent = descEl.dataset.placeholder || "";
    if (tag) tag.textContent = "";
    if (left) {
      left.textContent = "";
      left.appendChild(buildPictureNode({
        kind: card.dataset.type
      }));
      card?.style?.removeProperty("--brand");
      left?.style?.removeProperty("--brand");
    }
    try {
      const footer = card.querySelector(".storyboard-card-right footer");
      if (footer) footer.querySelectorAll(".chip").forEach((n) => n.remove());
    } catch {
      /* noop */
    }
    delete card.dataset.entityType;
    delete card.dataset.entityId;

    if (select && select.value !== "") {
      select.value = "";
      select.dispatchEvent(new Event("change", {
        bubbles: true
      }));
    }
  }
}

const titlePrompts = [
  "Once upon a time",
  "The tale of",
  "Chronicles of",
  "Legend speaks of",
  "Adventures of",
];

function randPrompt() {
  return titlePrompts[Math.floor(Math.random() * titlePrompts.length)];
}

export function _defaultStoryboardTitle() {
  const getTitle = (id, key) => {
    const select = document.querySelector(`#${id}`);
    const value = select ? select.value : "";
    if (!value) return null;
    const item = App.getAllItems(key).find(
      (i) => (i.id ?? i.title) === value
    );
    return item ? item.title || null : null;
  };
  const ai = getTitle("storyboard-ai-select", "characters");
  const user = getTitle("storyboard-user-select", "characters");
  const world = getTitle("storyboard-world-select", "worlds");
  const subjects = [ai, user].filter(Boolean).join(" & ");

  let title;
  if (subjects && world) {
    title = `${randPrompt()} ${subjects} in ${world}`;
  } else if (subjects) {
    title = `${randPrompt()} ${subjects}`;
  } else if (world) {
    title = `${randPrompt()} a story in ${world}`;
  } else {
    title = "Your story begins…";
  }

  return title.length > 80 ? `${title.slice(0, 77)}…` : title;
}

function setDynamicTitle(title, {
  manual = false
} = {}) {
  const el = document.querySelector("#storyboard-dynamic-title");
  if (!el) return;
  if (!el.dataset.manual || el.dataset.manual === "false" || manual) {
    el.textContent = title || _defaultStoryboardTitle?.() || "";
    el.dataset.manual = manual ? "true" : "false";
  }
}

function _setupStoryboardTitle() {
  const titleEl = document.querySelector("#storyboard-dynamic-title");
  if (!titleEl) return;
  if (titleEl.dataset.editable) return;
  titleEl.dataset.editable = "true";

  titleEl.setAttribute("role", "textbox");
  titleEl.setAttribute("aria-multiline", "false");
  if (!titleEl.hasAttribute("aria-label")) {
    titleEl.setAttribute("aria-label", "Storyboard title");
  }

  titleEl.autocapitalize = "off";
  titleEl.autocorrect = "off";
  titleEl.spellcheck = false;
  titleEl.setAttribute("autocomplete", "off");
  titleEl.setAttribute("autocapitalize", "off");
  titleEl.setAttribute("autocorrect", "off");
  titleEl.setAttribute("spellcheck", "false");

  const finishEditing = () => {
    titleEl.contentEditable = "false";
  };

  titleEl.addEventListener("click", () => {
    titleEl.contentEditable = "true";
    titleEl.dataset.manual = "true";
    const sel = getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(titleEl);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    titleEl.focus();
  });

  titleEl.addEventListener("blur", finishEditing);
  titleEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      titleEl.blur();
    }
  });
}

function populateStoryboardSelects() {
  const configs = [{
    id: "storyboard-ai-select",
    key: "characters"
  }, {
    id: "storyboard-user-select",
    key: "characters"
  }, {
    id: "storyboard-world-select",
    key: "worlds"
  }, ];
  configs.forEach(({
    id,
    key
  }) => {
    renderDropdown(id, key); // Use the existing renderDropdown function
    const select = document.querySelector(`#${id}`);
    if (select) {
      select.addEventListener("change", onStoryboardChange);
      onStoryboardChange({
        target: select
      });
    }
  });
}

function onStoryboardChange(e) {
  const select = e.target;
  updateStoryboardCard(select);
  setDynamicTitle?.();
  if (typeof _suppressNextBlur !== "undefined") {
    _suppressNextBlur = false;
  }

  try {
    const card = select.closest(".storyboard-card");
    const left = card?.querySelector(".storyboard-card-left");
    const type = card?.dataset?.type || "";
    const id = select.value || "";
    if (type && id && typeof entities.list === "function") {
      const entity = entities
        .list(type)
        .find((e) => String(e.id) === String(id));
      if (entity) {
        applyBrand?.(left, entity);
        (function applyCardBrandShim() {
          const brand = deriveBrand ? deriveBrand(entity) : null;
          if (brand && card && card.style)
            card.style.setProperty("--brand", brand);
        })();
      }
    }
  } catch {
    /* noop */
  }
}

export function _attachStoryboardListeners() {
  populateStoryboardSelects();
  _setupStoryboardTitle();
  const title = document.querySelector("#storyboard-dynamic-title");
  if (title) {
    title.addEventListener("input", () => {
      title.dataset.manual = "true";
    });
    title.addEventListener("dblclick", () => {
      title.dataset.manual = "false";
      setDynamicTitle();
    });
  }
  const shuffleBtn = document.querySelector("#shuffle-btn");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      [
        "storyboard-ai-select",
        "storyboard-user-select",
        "storyboard-world-select",
      ].forEach((id) => {
        const s = document.querySelector(`#${id}`);
        if (!s) return;
        const opts = Array.from(s.options).filter((o) => o.value);
        if (opts.length)
          s.value = opts[Math.floor(Math.random() * opts.length)].value;
        s.dispatchEvent(new Event("change", {
          bubbles: true
        }));
      });
      setDynamicTitle?.();
    });
  }
  document.querySelectorAll(".storyboard-card").forEach((card) => {
    const type = card.dataset.entityType;
    const id = card.dataset.entityId || "";
    const entity = entities.get?.(type, id);
    updateStoryboardCard(card, entity);
  });
}

export function _attachOptionChinActions() {
  if (_optionsListenersAttached) return;
  const ui = _getUIElements();
  const {
    uploadBackupTrigger,
    uploadBackupInput,
    downloadBackupButton,
    deleteAllDataButton,
  } = ui;

  if (uploadBackupTrigger && uploadBackupInput) {
    uploadBackupTrigger.addEventListener("click", () =>
      uploadBackupInput.click()
    );
    uploadBackupInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file && typeof importAllData === "function")
        importAllData(file);
    });
  }

  if (downloadBackupButton) {
    downloadBackupButton.addEventListener("click", () => {
      if (typeof exportAllData === "function") exportAllData();
    });
  }

  if (deleteAllDataButton) {
    deleteAllDataButton.addEventListener("click", () => {
      if (typeof deleteAllData === "function") deleteAllData();
    });
  }

  _optionsListenersAttached = true;
}

export function _attachContentChinActions() {
  if (_contentListenersAttached) return;
  const ui = _getUIElements();

  const configs = [{
    key: "stories",
    newButton: ui.newStoryButton,
    uploadTrigger: ui.uploadStoryTrigger,
    uploadInput: ui.uploadStoryInput,
  }, {
    key: "characters",
    newButton: ui.newCharacterButton,
    uploadTrigger: ui.uploadCharacterTrigger,
    uploadInput: ui.uploadCharacterInput,
  }, {
    key: "worlds",
    newButton: ui.newWorldButton,
    uploadTrigger: ui.uploadWorldTrigger,
    uploadInput: ui.uploadWorldInput,
  }, ];

  configs.forEach(({
    key,
    newButton,
    uploadTrigger,
    uploadInput
  }) => {
    if (newButton) {
      newButton.addEventListener("click", () => {
        if (key === "stories") {
          resetStoryboard?.();
          router.navigate("#storyboard");
          return;
        }
        if (key === "characters" || key === "worlds") {
          router.navigate(`#form/${key.slice(0, -1)}/new`);
        }
      });
    }

    if (uploadTrigger && uploadInput) {
      uploadTrigger.addEventListener("click", () => uploadInput.click());
      uploadInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) return;
            const current = loadStoredItems(key);
            localStorage.setItem(
              key,
              JSON.stringify(current.concat(data))
            );
            refreshAllLists();
          } catch (err) {
            console.error("Failed to import", err);
          }
          uploadInput.value = null;
        };
        reader.readAsText(file);
      });
    }
  });

  // Add event listeners for the new close buttons
  document.querySelectorAll(".chin-close-button").forEach((button) => {
    button.addEventListener("click", () => {
      chin.closeAll();
    });
  });

  _contentListenersAttached = true;
}

let initializeWhenReadyRetryCount = 0;
export async function initializeWhenReady() {
  try {
    console.log('[RPGlitch] initializeWhenReady start', {
      retry: initializeWhenReadyRetryCount
    });
  } catch { /* ignore */ }

  try {
    _getUIElements();
    if (!TEST_MODE) chin.init?.();
    _attachOptionChinActions?.();
    _attachContentChinActions?.();
    _attachCardNavigation?.();
    _attachChinSearchHandlers();
    refreshAllLists?.();
    _attachStoryboardListeners?.();
    try {
      chin.open?.('stories');
    } catch { /* ignore */ }
    try {
      dismissLoadingUI?.();
    } catch {
      void 0;
    }
    try {
      startUIWatchdog?.();
    } catch {
      void 0;
    }
    try {
      installUIRecoveryHooks?.();
    } catch {
      void 0;
    }
    try {
      installUIBlockerAttributeObserver?.();
    } catch {
      void 0;
    }
    try {
      enableAutoUnlock?.();
    } catch {
      void 0;
    }
    try {
      let attempts = 0;
      const maxAttempts = 24;
      const rearm = () => {
        attempts++;
        if (_uiWatchdogStarted || attempts > maxAttempts) {
          clearInterval(timer);
          return;
        }
        try {
          startUIWatchdog?.();
        } catch {
          void 0;
        }
        try {
          installUIRecoveryHooks?.();
        } catch {
          void 0;
        }
        try {
          installUIBlockerAttributeObserver?.();
        } catch {
          void 0;
        }
        try {
          enableAutoUnlock?.();
        } catch {
          void 0;
        }
      };
      const timer = setInterval(rearm, 250);
      setTimeout(rearm, 0);
    } catch {
      void 0;
    }
    initializeWhenReadyRetryCount = 0;
    try {
      console.log('[RPGlitch] initializeWhenReady success');
    } catch { /* ignore */ }
    return true;
  } catch (error) {
    const retryCount = initializeWhenReadyRetryCount + 1;
    initializeWhenReadyRetryCount = retryCount;
    try {
      console.error(`❗ App initialization failed (attempt ${retryCount}/${MAX_INIT_RETRIES})`, error && (error.stack || error), error);
    } catch { /* ignore */ }
    if (TEST_MODE) {
      return false;
    }
    if (retryCount < MAX_INIT_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, INIT_BACKOFF_MS));
      return initializeWhenReady();
    }
    console.error(`❌ App initialization failed after ${MAX_INIT_RETRIES} attempts.`, error);
    throw error;
  }
}

export function importAllData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      DATA_KEYS.forEach((key) => {
        if (Array.isArray(data[key])) {
          localStorage.setItem(key, JSON.stringify(data[key]));
        }
      });
      refreshAllLists();
    } catch (err) {
      console.error("Failed to import backup", err);
    } finally {
      const ui = _getUIElements();
      if (ui.uploadBackupInput) ui.uploadBackupInput.value = null;
    }
  };
  reader.readAsText(file);
}

export function exportAllData() {
  const data = {};
  DATA_KEYS.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      data[key] = value ? JSON.parse(value) : [];
    } catch {
      data[key] = [];
    }
  });
  const blob = new Blob([JSON.stringify(data)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rpglitch-backup.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function deleteAllData() {
  DATA_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
  refreshAllLists();
}

try {
  if (!_bootBound) {
    _bootBound = true;
    const boot = async () => {
      try {
        if (TEST_MODE) return;
        if (_bootStarted) return;
        _bootStarted = true;
        await initializeWhenReady?.();
      } catch (err) {
        console.error("RPGlitch boot failed:", err);
      }
    };
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(boot, 0);
    } else {
      document.addEventListener("DOMContentLoaded", boot, {
        once: true
      });
      window.addEventListener("load", boot, {
        once: true
      });
    }
  }
} catch { /* empty */ }

document.addEventListener(
  "DOMContentLoaded",
  () => {
    initializeWhenReady();
  }, {
    once: true
  }
);
