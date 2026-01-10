import { GameMaster } from "../../../gamemaster/index.js";
import { sanitizeHtml } from "../../../gamemaster/utils.js";

/**
 * Standardized Modal Service
 * Handles Alert, Confirm, Prompt, and Error dialogs.
 */

const getDialog = (id) => {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const dialog = document.createElement("dialog");
  dialog.id = id;
  dialog.className = "modal";
  return dialog;
};

export const showAlert = (title, message) => {
  return new Promise((resolve) => {
    const tpl = document.getElementById("tpl-alert-modal");
    if (!tpl) {
      console.error(`[Modal Fallback] ${title}: ${message}`);
      return resolve();
    }
    const dialog = getDialog("alert-modal");
    dialog.style.zIndex = "10001";
    dialog.appendChild(tpl.content.cloneNode(true));
    document.body.appendChild(dialog);

    dialog.querySelector("h3").textContent = title;
    dialog.querySelector("p").textContent = message;

    const cleanup = () => {
      dialog.remove();
      resolve();
    };

    dialog.querySelector("#btn-alert-ok").onclick = cleanup;
    dialog.onclick = (e) => (e.target === dialog ? cleanup() : null);
    dialog.showModal();
  });
};

export const showConfirm = (title, message) => {
  return new Promise((resolve) => {
    const tpl = document.getElementById("tpl-confirm-modal");
    if (!tpl) {
      console.warn(`[Modal Fallback] Confirm: ${title}: ${message}`);
      return resolve(true); // Default to true in fallback?
    }

    const dialog = getDialog("confirm-modal");
    dialog.style.zIndex = "10000";
    dialog.appendChild(tpl.content.cloneNode(true));
    document.body.appendChild(dialog);

    dialog.querySelector("h3").textContent = title;
    dialog.querySelector("p").textContent = message;

    const cleanup = (result) => {
      dialog.remove();
      resolve(result);
    };

    dialog.querySelector("#btn-confirm-cancel").onclick = () => cleanup(false);
    dialog.querySelector("#btn-confirm-ok").onclick = () => cleanup(true);
    dialog.onclick = (e) => (e.target === dialog ? cleanup(false) : null);
    dialog.showModal();
  });
};

export const showPrompt = (title, message, defaultValue = "") => {
  return new Promise((resolve, reject) => {
    const tpl = document.getElementById("tpl-prompt-modal");
    if (!tpl) {
      console.warn(`[Modal Fallback] Prompt: ${title}: ${message}`);
      return resolve(defaultValue);
    }

    const dialog = getDialog("prompt-modal");
    dialog.style.zIndex = "10002";
    dialog.appendChild(tpl.content.cloneNode(true));
    document.body.appendChild(dialog);

    dialog.querySelector("h3").textContent = title;
    dialog.querySelector("p").textContent = message;

    const input = dialog.querySelector("input");
    if (input) {
      input.value = defaultValue;
      requestAnimationFrame(() => input.focus());
      input.onkeydown = (e) =>
        e.key === "Enter" ? cleanup(input.value) : null;
    }

    const cleanup = (val) => {
      dialog.remove();
      if (val !== undefined) resolve(val);
      else reject();
    };

    dialog.querySelector("#btn-prompt-cancel").onclick = () =>
      cleanup(undefined);
    dialog.querySelector("#btn-prompt-ok").onclick = () =>
      cleanup(input?.value ?? "");
    dialog.onclick = (e) => (e.target === dialog ? cleanup(undefined) : null);
    dialog.showModal();
  });
};

export const showErrorModal = (
  errorType,
  message = "Something went wrong.",
) => {
  const dialog = getDialog("error-modal");
  // 🛡️ SENTINEL SECURITY PATCH: [Risk Mitigated]
  // Sanitized innerHTML assignment to prevent XSS via error messages.
  dialog.innerHTML = `
    <article class="modal-content">
      <header>
        <h3>The Engine Stalled</h3>
        <button type="button" class="close" aria-label="Close" onclick="this.closest('dialog').remove()">
          <svg class="icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </header>
      <div class="modal-body">
        <p id="error-msg">${errorType === "network" ? "The connection to the AI was lost or timed out." : sanitizeHtml(message)}</p>
      </div>
      <footer>
        <button id="btn-err-retry-vanilla" class="secondary">Retry (Vanilla)</button>
        <button id="btn-err-retry-spicy" class="contrast">Retry (Spicy)</button>
      </footer>
    </article>
  `;

  document.body.appendChild(dialog);

  dialog.querySelector("#btn-err-retry-vanilla").onclick = () => {
    dialog.remove();
    if (GameMaster.regenerate) GameMaster.regenerate("VANILLA");
  };

  dialog.querySelector("#btn-err-retry-spicy").onclick = () => {
    dialog.remove();
    if (GameMaster.regenerate) GameMaster.regenerate();
  };

  dialog.showModal();
};

export const closeAll = () => {
  document.querySelectorAll("dialog.modal").forEach((d) => d.remove());
};

export const Modal = {
  showAlert,
  showConfirm,
  showPrompt,
  showErrorModal,
  closeAll,
};
