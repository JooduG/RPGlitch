import {
  entities,
  getPictureHTML
} from './entities.js';
import {
  hideEl,
  showEl,
  applyBrand,
  setProfileLayoutSizing,
  debounce,
  goBackWithFallback,
  copyEntity // Import the async version
} from './utils.js';
import {
  router
} from './profile-router.js';
// Removed redundant copyEntity import

function renderTags(container, tags) {
  if (!tags || !tags.length) return;
  const wrap = document.createElement("div");
  wrap.className = "tag-chips";
  tags.forEach((t) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = t;
    wrap.appendChild(chip);
  });
  container.appendChild(wrap);
}

function buildHero(entity) {
  const wrap = document.createElement("div");
  wrap.className = "hero-wrap";
  const pic = getPictureHTML ?
    getPictureHTML(entity, {
      cover: true
    }) :
    null;
  if (pic) {
    pic.classList?.add("hero-bleed");
    wrap.appendChild(pic);
  }
  const chips = Array.isArray(entity.tags) ? [...entity.tags] : [];
  if (entity.isPremade) chips.unshift("Premade");
  renderTags(wrap, chips);
  return wrap;
}

let profileResizeBound = false;
export async function renderProfile(type, id) { // <-- Made this function async
  const sb = document.querySelector("#storyboard-screen");
  if (sb) hideEl(sb);

  // v-- This is the key change: we await the database call --v
  const entity = await entities.get(type, id); 
  
  if (!entity) {
    console.warn(`Entity not found for profile: ${type}/${id}. Redirecting.`);
    router.navigate("#");
    return;
  }
  // ^-- From here down, the code is the same because `entity` is now populated --^

  const screen = document.querySelector("#profile-screen");
  if (!screen) return;

  screen.textContent = "";
  screen.setAttribute("aria-live", "polite");

  const layout = document.createElement("div");
  layout.className = "profile-layout";

  const leftCol = document.createElement("div");
  leftCol.className = "profile-left";
  const hero = buildHero(entity);
  leftCol.appendChild(hero);
  applyBrand?.(leftCol, entity);

  const rightCol = document.createElement("div");
  rightCol.className = "profile-right";

  const content = document.createElement("div");
  content.className = "profile-right-content";

  const h1 = document.createElement("h1");
  h1.className = "profile-name";
  h1.textContent = entity.name || entity.title || "Empty";
  content.appendChild(h1);

  if (entity.summary) {
    const p = document.createElement("p");
    p.className = "profile-description";
    p.textContent = entity.summary;
    content.appendChild(p);
  }

  const sections = entity.sections || {};
  const secWrap = document.createElement("div");
  secWrap.className = "profile-fields";

  ["forever", "past", "present", "future"].forEach((key) => {
    const value = sections[key] !== undefined ? sections[key] : null;
    if (value) {
      const field = document.createElement("div");
      field.className = "profile-field";

      const label = document.createElement("div");
      label.className = "profile-field-label";
      label.textContent = key.charAt(0).toUpperCase() + key.slice(1);

      const text = document.createElement("div");
      text.className = "profile-field-text";
      text.textContent = value;

      field.append(label, text);
      secWrap.appendChild(field);
    }
  });
  content.appendChild(secWrap);

  rightCol.appendChild(content);
  layout.append(leftCol, rightCol);
  screen.appendChild(layout);
  showEl(screen);

  try {
    setProfileLayoutSizing?.(0.35);
    if (!profileResizeBound) {
      profileResizeBound = true;
      window.addEventListener(
        "resize",
        debounce(() => setProfileLayoutSizing?.(0.35), 150)
      );
    }
  } catch {
    /* noop */
  }

  const backBtn = document.querySelector("#profile-back");
  const editBtn = document.querySelector("#profile-edit");
  const copyBtn = document.querySelector("#profile-copy");

  if (copyBtn) {
    // 1. Remove the old handler if it exists to prevent the stale closure bug.
    if (copyBtn._copyHandler) {
      copyBtn.removeEventListener('click', copyBtn._copyHandler);
    }

    // 2. Define the new handler. This function must be defined inside the renderProfile
    //    function's scope so it correctly closes over the new 'type' and 'id'.
    const copyHandler = async () => {
      // Use the correctly scoped 'id' and 'type' variables.
      const newEntity = await copyEntity?.(type, id);
      if (newEntity && newEntity.id) {
        router.navigate(
          `#form/${type}/${newEntity.id}?return=#profile/${type}/${newEntity.id}`
        );
      } else {
        console.error("Copy operation failed or returned no entity.");
      }
    };

    // 3. Attach the new handler and store its reference for next time.
    copyBtn.addEventListener("click", copyHandler);
    copyBtn._copyHandler = copyHandler;
  }
  // ^-- End of changed block --^
  
  if (copyBtn) copyBtn.hidden = !entity.isPremade;
  if (editBtn) editBtn.hidden = entity.isPremade;
  if (backBtn) backBtn.addEventListener("click", () => goBackWithFallback("#storyboard", "#storyboard", router));
  editBtn?.addEventListener("click", () => {
    router.navigate(
      `#form/${type}/${entity.id}?return=#profile/${type}/${entity.id}`
    );
  });
}