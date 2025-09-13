import {
  showEl,
  hideEl,
  dismissLoadingUI,
  chin,
  log,
  unlockNow,
  setTopBarRight
} from './utils.js';
import {
  renderProfile
} from './profile.js';
import {
  renderForm
} from './entity-form.js';
import {
  refreshAllLists
} from './index.js';

function showStoryboard() {
  showEl("#storyboard-screen");
  hideEl("#profile-screen");
  hideEl("#character-form-screen");
  hideEl("#world-form-screen");
}

function parseHash() {
  const [path] = location.hash.slice(1).split("?");
  return path.split("/").filter(Boolean);
}

function handleRoute() {
  try {
    dismissLoadingUI?.();
  } catch (e) {
    void e;
  }
  const [section, type, id] = parseHash();
  const isType = (t) => t === "character" || t === "world";
  chin.closeAll?.();
  try {
    log?.('router.handleRoute', {
      section,
      type,
      id
    });
  } catch (e) {
    void e;
  }
  if (section === "profile" && isType(type) && id) {
    // if (
    //   typeof canAccessProfile === "function" &&
    //   !canAccessProfile(type, id)
    // ) {
    //   showStoryboard();
    //   return;
    // }
    setTopBarRight?.("profile");
    hideEl("#storyboard-screen");
    hideEl("#character-form-screen");
    hideEl("#world-form-screen");
    renderProfile?.(type, id);
    try {
      chin.closeAll?.();
      dismissLoadingUI?.();
      unlockNow?.();
    } catch (e) {
      void e;
    }
  } else if (section === "form" && isType(type)) {
    // if (
    //   typeof canAccessForm === "function" &&
    //   !canAccessForm(type, id)
    // ) {
    //   showStoryboard();
    //   return;
    // }
    setTopBarRight?.("form");
    hideEl("#storyboard-screen");
    hideEl("#profile-screen");
    renderForm?.(type, id || "new");
    try {
      chin.closeAll?.();
      dismissLoadingUI?.();
      unlockNow?.();
    } catch (e) {
      void e;
    }
  } else {
    setTopBarRight?.("storyboard");
    showStoryboard();
    try {
      // chin.open?.('stories'); // removed to prevent auto-opening chin on load
      log?.('router.defaultedToStoryboard');
    } catch (e) {
      void e;
    }
  }
}

window.addEventListener("hashchange", handleRoute);

document.addEventListener(
  "DOMContentLoaded",
  () => {
    handleRoute();

    document.querySelectorAll("button[data-chin]").forEach((btn) => {
      btn.classList.add("chin-button");
    });

    document.querySelectorAll('form[role="search"]').forEach((form) => {
      form.addEventListener("submit", (e) => e.preventDefault());
      const btn = form.querySelector("button");
      if (btn) {
        btn.type = "button";
        btn.addEventListener("click", () => {
          form.querySelectorAll('input[type="search"]').forEach((i) => {
            i.value = "";
          });
          refreshAllLists?.();
        });
      }
    });
  }, {
    once: true
  }
);

export const router = {
  navigate(hash) {
    location.hash = hash;
  },
  parseHash,
  handleRoute,
};


