import { log } from "../../../gamemaster/utils.js";
import { applyPatch, store as state } from "../../../gamemaster/index.js";
import {
  renderProfilePage,
  closeProfileModal,
} from "../components/profile/controller.js";
import { closeDrawer } from "../components/drawer/desktop.js";

/**
 * THE ROUTER (Mesmer Core)
 * Handles URL Hash changes and Mode Switching (Lobby <-> Game <-> Profile)
 */
export const Router = {
  parseHash: () => {
    const [path] = location.hash.slice(1).split("?");
    return path.split("/").filter(Boolean);
  },

  handleRoute: () => {
    const [section, entityType, id] = Router.parseHash();
    const isType = (t) => t === "character" || t === "fractal";

    closeDrawer();

    if (document.body.classList.contains("storymode")) {
      if (section !== "story" && section !== "profile") {
        log("🚫 Access Denied: Story in progress.");
        location.hash = "#story";
        return;
      }
    }

    if (section === "profile" && isType(entityType) && id) {
      if (state.mode !== "storymode") {
        applyPatch({ mode: "storyboard" });
      }
      renderProfilePage(entityType, id);
      closeDrawer();
    } else if (section === "story") {
      applyPatch({ mode: "storymode" });
      closeProfileModal();
    } else {
      applyPatch({ mode: "storyboard" });
      closeProfileModal();
    }
  },

  init: () => {
    window.addEventListener("hashchange", Router.handleRoute);

    // Initial Route
    log("[Router] Processing initial route...");
    Router.handleRoute();
  },
};
