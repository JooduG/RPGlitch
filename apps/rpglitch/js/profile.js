import {
  entities
} from './entities.js';
import {
  hideEl,
  showEl,
  applyBrand,
  setProfileLayoutSizing,
  debounce,
  goBackWithFallback,
  copyEntity,
  buildHero,
  BASE_COLOUR_MAP,
  replaceEventHandler,
  PROFILE_RESIZE_DEBOUNCE_MS,
  handleAsyncError
} from './utils.js';
import {
  router
} from './profile-router.js';

let profileResizeBound = false;
export async function renderProfile(type, id) { // <-- Made this function async
  const sb = document.querySelector("#storyboard-screen");
  if (sb) hideEl(sb);

  await handleAsyncError(async () => {
    const entity = await entities.get(type, id);

    if (!entity) {
      throw new Error(`Entity not found for profile: ${type}/${id}`);
    }

  const screen = document.querySelector("#profile-screen");
  if (!screen) return;

  screen.textContent = "";
  screen.setAttribute("aria-live", "polite");
  screen.className = "profile-view";

  const layout = document.createElement("div");
  layout.className = "profile-layout";

  const leftCol = document.createElement("div");
  leftCol.className = "profile-left";
  const hero = buildHero(entity, { singleTag: true });
  leftCol.appendChild(hero);
  applyBrand?.(leftCol, entity);

  const rightCol = document.createElement("div");
  rightCol.className = "profile-right";

  const content = document.createElement("div");
  content.className = "profile-right-content";

  const h1 = document.createElement("h1");
  h1.className = "profile-name";
  h1.textContent = entity.name || "Empty";

  // Signature Colour implementation
  const signatureColour = entity.signatureColour || 'default';
  const colourMap = { default: 'var(--pico-h1-color)', ...BASE_COLOUR_MAP };
  h1.style.color = colourMap[signatureColour] || colourMap.default;

  content.appendChild(h1);

  if (entity.description) {
    const p = document.createElement("p");
    p.className = "profile-description";
    p.textContent = entity.description;
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

  // Note: tags are now rendered in the hero (left column) as a single tag pill
  // No need to render tags again in the content area

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
        debounce(() => setProfileLayoutSizing?.(0.35), PROFILE_RESIZE_DEBOUNCE_MS)
      );
    }
  } catch {
    /* noop */
  }

  const backBtn = document.querySelector("#profile-back");
  const editBtn = document.querySelector("#profile-edit");
  const copyBtn = document.querySelector("#profile-copy");

  if (copyBtn) {
    const copyHandler = async () => {
      const newEntity = await copyEntity?.(type, id);
      if (newEntity) {
        window.ephemeralEntity = newEntity;
        router.navigate(
          `#form/${type}/new?clone=true&return=#profile/${type}/${id}`
        );
      } else {
        console.error("Copy operation failed or returned no entity.");
      }
    };
    replaceEventHandler(copyBtn, 'click', copyHandler, '_copyHandler');
  }
  
  if (copyBtn) copyBtn.hidden = !entity.isPremade;
  if (editBtn) editBtn.hidden = entity.isPremade;
  if (backBtn) backBtn.addEventListener("click", () => goBackWithFallback("#storyboard", "#storyboard", router));
  editBtn?.addEventListener("click", () => {
    router.navigate(
      `#form/${type}/${entity.id}?return=#profile/${type}/${entity.id}`
    );
  });
  }, {
    errorMessage: 'Could not load profile. Please try again.',
    context: 'load profile',
    fallback: null
  });

  // Navigate away on error (after handleAsyncError shows alert)
  if (!document.querySelector("#profile-screen")?.textContent) {
    router.navigate("#");
  }
}