import { entities, copyEntity } from "./entity-crud.js";
import { premade, getVisualState } from "./entity-structs.js";
import { getPictureHTML, getSignature } from "./core-utils.js";
import { state } from "./app-state.js";
import { VisualManager } from "./manager-visuals.js";
import {
    escapeHtml, handleAsyncError, error, setTopBarRight,
    renderTags, isValidImageUrl, sanitizeHtml
} from "./core-utils.js";

// CALLBACK: Router must inject this
let _onUpdateSelection = null;
export function setProfileCallbacks(callbacks) {
    if (callbacks.onUpdateSelection) _onUpdateSelection = callbacks.onUpdateSelection;
}

// Shared State (Local to this module)
let activeSlotKey = null;

// --- CONSTANTS ---
const SECTION_DEFINITIONS = {
    forever: {
        label: "Forever",
        sublabels: { character: "Core Identity & Permanent Features", world: "Eternal Truths & Laws of Nature" },
    },
    past: {
        label: "Past",
        sublabels: { character: "Background & Memories", world: "History & Ancient Lore" },
    },
    present: {
        label: "Present",
        sublabels: { character: "Mood & Conditions", world: "State of the World & Current Situation" },
    },
    future: {
        label: "Future",
        sublabels: { character: "Goals & Prophecies", world: "Impending Events & Prophecies" },
    },
};

// --- MODAL MANAGEMENT ---
export function closeProfileModal() {
    const screen = document.querySelector("#profile-screen");
    if (screen) {
        screen.classList.remove("is-open");
        screen.setAttribute("hidden", "");
        screen.classList.remove("profile-view--world");
        if (location.hash.includes("#profile")) {
            const base = location.pathname + location.search;
            history.replaceState("", document.title, base + (document.body.classList.contains("mode-gameplay") ? "#story" : ""));
        }
    }
    document.body.classList.remove("profile-view-active");
    activeSlotKey = null;
}

export function openProfileModal(type, id, slotKey = null) {
    activeSlotKey = slotKey;
    renderProfilePage(type.toLowerCase(), id);
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

// --- PROFILE RENDERER ---
export async function renderProfilePage(type, id, forceEditMode = false) {
    const screen = document.querySelector("#profile-screen");
    if (!screen) return;

    screen.removeAttribute("hidden");
    document.body.classList.add("profile-view-active");
    screen.classList.add("is-open");

    const isWorld = type === 'world';
    if (isWorld) screen.classList.add("profile-view--world");
    else screen.classList.remove("profile-view--world");

    // Check Gameplay Status (Lock)
    const isGameplay = document.body.classList.contains("mode-gameplay");
    let isEditing = (id === "new" || forceEditMode) && !isGameplay;

    let entity;

    if (id === "new") {
        if (window.ephemeralEntity) {
            entity = { ...window.ephemeralEntity, kind: type };
            delete entity.id;
        } else {
            entity = { kind: type, type: type, sections: {} };
        }
        isEditing = true;
    } else {
        entity = await handleAsyncError(
            async () => await entities.get(type, id),
            { errorMessage: "Could not load profile.", context: "load profile", fallback: null }
        );
    }

    if (!entity) { closeProfileModal(); return; }

    // Identify Blueprint for Factory Revert
    const blueprint = entity.originId
        ? (type === 'character' ? premade.characters : premade.worlds).find(p => p.id === entity.originId)
        : null;

    screen.textContent = "";
    screen.className = "profile-view";
    screen.classList.add("is-open");
    if (isWorld) screen.classList.add("profile-view--world");
    screen.classList.toggle("is-editing", isEditing);

    const template = document.querySelector("#tpl-profile-page");
    if (!template) return;
    const layout = template.content.firstElementChild.cloneNode(true);

    // --- HERO & IMAGE HANDLING ---
    const heroWrap = layout.querySelector(".hero-wrap");

    // Visual State Management
    let localVisuals = getVisualState(entity);

    const applyVisualsToImage = (imgEl) => {
        if (!imgEl) return;
        if (localVisuals.flipped) imgEl.classList.add("img-flipped");
        else imgEl.classList.remove("img-flipped");
    };

    if (getPictureHTML) {
        const heroPic = getPictureHTML(entity, { cover: true, landscape: isWorld });
        if (heroPic) {
            heroPic.classList.add("hero-bleed");
            // Apply flip state immediately on render
            applyVisualsToImage(heroPic.querySelector("img"));
            heroWrap.appendChild(heroPic);
        }
    }

    // [UPDATED] Flip Button (Live Control with Auto-Save)
    const flipBtn = document.createElement("button");
    flipBtn.className = "btn-visual-flip";
    flipBtn.innerHTML = "⇄"; // Icon
    flipBtn.title = "Flip Orientation";
    flipBtn.type = "button"; // Prevent form submit
    flipBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Toggle Local State
        localVisuals.flipped = !localVisuals.flipped;

        // 2. Update DOM Instantly (Feedback)
        const imgs = heroWrap.querySelectorAll("img");
        imgs.forEach(applyVisualsToImage);

        // 3. Persist State (If not a "New" entity)
        if (id !== "new" && !isEditing) {
            try {
                // Update the entity object in memory
                if (!entity.visuals) entity.visuals = {};
                entity.visuals.flipped = localVisuals.flipped;

                // [FIX] Use upsert, not update
                // This saves the flip state immediately to the DB
                await entities.upsert(type, entity);

                // Notify other components (Chat, Drawer)
                window.dispatchEvent(new CustomEvent('entity-visual-update', { detail: { id: entity.id } }));

                console.log("[Profile] Visual flip saved automatically.");
            } catch (err) {
                console.error("Failed to auto-save flip state:", err);
            }
        }
    };
    heroWrap.appendChild(flipBtn);


    const imageOverlay = layout.querySelector(".profile-hero-overlay");
    const imageInput = imageOverlay.querySelector('[data-profile-field="profilePictureUrl"]');
    const actionButton = imageOverlay.querySelector(".profile-main-action");
    const fileInput = imageOverlay.querySelector('[data-profile-field="fileInput"]');
    const paletteSelect = imageOverlay.querySelector('select[name="signatureColour"]');
    const extractBtn = imageOverlay.querySelector('button[data-action="extract"]');
    const stylizeBtn = imageOverlay.querySelector('button[data-action="stylize"]');
    const form = layout.querySelector("form");
    const secWrap = form.querySelector("[data-profile-sections]");

    if (imageInput) {
        imageInput.disabled = false;
        imageInput.removeAttribute("aria-busy");
        imageInput.value = entity.profilePictureUrl || "";
    }
    if (actionButton) { actionButton.disabled = false; actionButton.removeAttribute("aria-busy"); }

    const setEditMode = (editing) => {
        if (isGameplay) return; // Cannot switch to edit mode in game
        isEditing = editing;
        screen.classList.toggle("is-editing", editing);
        setTopBarRight(editing ? "form" : "profile");
        if (imageOverlay) imageOverlay.style.display = editing ? "flex" : "none";
        renderProfilePage(type, id, editing);
    };

    // --- UI STATE HELPERS ---
    const elementLockList = [imageInput, actionButton, fileInput, paletteSelect, extractBtn, stylizeBtn].filter(Boolean);

    const setBusy = (busy) => {
        // Apply busy state to the entire container for the overlay effect
        if (heroWrap) {
            const wrapper = heroWrap.closest('.profile-hero');
            if (wrapper) {
                if (busy) wrapper.setAttribute("aria-busy", "true");
                else wrapper.removeAttribute("aria-busy");
            }
        }
        // Lock the overlay interaction
        if (imageOverlay) imageOverlay.classList.toggle("is-locked", busy);

        elementLockList.forEach(el => {
            el.disabled = busy;
            if (!busy) el.removeAttribute("aria-busy");
        });

        // Visual tweak (opacity)
        if (extractBtn) extractBtn.style.opacity = busy ? "0.5" : "1";
        if (stylizeBtn) stylizeBtn.style.opacity = busy ? "0.5" : "1";
    };

    const updatePreview = (urlOverride) => {
        const val = urlOverride || imageInput.dataset.pendingUrl || imageInput.value.trim();
        if (val && isValidImageUrl(val, true)) {
            const safeVal = sanitizeHtml(val);
            const newPic = getPictureHTML({ ...entity, profilePictureUrl: safeVal }, { cover: true, landscape: isWorld });
            const curPic = heroWrap.querySelector(".picture");
            if (newPic) {
                newPic.classList.add("hero-bleed");
                // [FIX] Ensure flip state persists on preview update
                applyVisualsToImage(newPic.querySelector("img"));

                if (curPic) curPic.replaceWith(newPic);
                else heroWrap.appendChild(newPic);
            }
        }
    };

    function updateButtonState() {
        const val = imageInput.value.trim();
        // Toggle Helper Visibility
        if (extractBtn) extractBtn.style.display = (val === "") ? "block" : "none";
        if (stylizeBtn) stylizeBtn.style.display = (val !== "") ? "block" : "none";

        const hasPending = !!imageInput.dataset.pendingUrl;

        if (val === "" && !hasPending) { actionButton.textContent = "Upload"; actionButton.dataset.action = "upload"; }
        else if ((val && !isValidImageUrl(val, true)) || hasPending) { actionButton.textContent = "Generate"; actionButton.dataset.action = "generate"; }
        else { actionButton.textContent = "Use URL"; actionButton.dataset.action = "use-url"; }
    }

    imageInput.addEventListener("input", () => {
        if (imageInput.dataset.pendingUrl) delete imageInput.dataset.pendingUrl;
        updateButtonState();
        updatePreview();
    });
    updateButtonState();

    // --- MAIN ACTION BUTTON (Generate / Upload) ---
    actionButton.addEventListener("click", async () => {
        const action = actionButton.dataset.action;
        if (action === "generate") {
            try {
                setBusy(true);
                const prompt = imageInput.value.trim();
                const resolution = isWorld ? "768x512" : "512x768";
                const removeBgCheckbox = layout.querySelector("#gen-transparent-bg");
                const isTransparent = removeBgCheckbox ? removeBgCheckbox.checked : false;

                const url = await VisualManager.generate(prompt, {
                    resolution,
                    removeBackground: isTransparent
                });

                if (url) {
                    imageInput.dataset.pendingUrl = url;
                    updatePreview(url);
                }
            } catch (e) { error(e); }
            finally { setBusy(false); updateButtonState(); }
        }
    });

    // --- AI HELPER: EXTRACT (Magic Wand) ---
    if (extractBtn) {
        extractBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                setBusy(true);
                const result = await VisualManager.extractTraits(entity, type);
                imageInput.value = result;
                imageInput.dispatchEvent(new Event('input'));
            } catch (err) {
                console.error("Extraction failed", err);
                alert("Failed to extract traits. AI might be offline.");
            } finally {
                setBusy(false);
            }
        });
    }

    // --- AI HELPER: STYLIZE (Brush) ---
    if (stylizeBtn) {
        stylizeBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const current = imageInput.value.trim();
            if (!current) return alert("Please enter a description first!");

            if (current.includes("cinematic wide shot") || current.includes("high-fidelity character portrait")) {
                if (!confirm("This prompt looks stylized already. Re-apply?")) return;
            }

            const selectedColorName = paletteSelect ? paletteSelect.value : (entity.signatureColour || "default");
            const colorTerm = (selectedColorName === "default" || !selectedColorName) ? "cinematic" : selectedColorName;

            try {
                setBusy(true);
                const final = await VisualManager.stylize(current, colorTerm, type);
                imageInput.value = final;
                imageInput.dispatchEvent(new Event('input'));
            } catch (err) {
                console.error("Stylize failed", err);
            } finally {
                setBusy(false);
            }
        });
    }

    // --- FILE UPLOAD ---
    fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setBusy(true);
            const url = await VisualManager.upload(file);
            if (url) {
                imageInput.value = url;
                imageInput.dispatchEvent(new Event('input'));
            }
        } catch (err) { error(err); }
        finally { setBusy(false); updateButtonState(); fileInput.value = null; }
    });

    // --- COLOR PALETTE & PREVIEW ---
    const currentColor = entity.signatureColour || "default";
    Array.from(paletteSelect.options).forEach(opt => { opt.selected = opt.value === currentColor; });

    paletteSelect.addEventListener("change", () => {
        const newColor = paletteSelect.value;
        const urlToCheck = imageInput.dataset.pendingUrl || imageInput.value.trim();
        const newPic = getPictureHTML({ ...entity, signatureColour: newColor, profilePictureUrl: urlToCheck }, { cover: true, landscape: isWorld });
        const curPic = heroWrap.querySelector(".picture");
        if (curPic && newPic) {
            newPic.classList.add("hero-bleed");
            // [FIX] Preserve flip state on color change
            applyVisualsToImage(newPic.querySelector("img"));
            curPic.replaceWith(newPic);
        }

        const nameInput = form.querySelector('.profile-name-input');
        const nameDisplay = form.querySelector('.profile-name-display');
        const colorStyle = getSignature ? getSignature({ ...entity, signatureColour: newColor }) : "white";
        if (nameInput) nameInput.style.color = colorStyle;
        if (nameDisplay) nameDisplay.style.color = colorStyle;
    });

    // --- HEADER (Name/Desc) ---
    const headerWrap = form.querySelector("[data-profile-header]");
    headerWrap.innerHTML = "";

    if (isEditing) {
        const nameInput = document.createElement("textarea");
        nameInput.className = "profile-name-input";
        nameInput.dataset.editField = "name";
        nameInput.value = entity.name || "";
        nameInput.placeholder = "Name";
        nameInput.rows = 1;
        nameInput.style.color = getSignature(entity);
        nameInput.addEventListener('input', () => autoResize(nameInput));
        headerWrap.appendChild(nameInput);
        setTimeout(() => autoResize(nameInput), 0);

        const descInput = document.createElement("textarea");
        descInput.className = "profile-desc-input";
        descInput.dataset.editField = "description";
        descInput.value = entity.description || "";
        descInput.placeholder = "Short description...";
        descInput.rows = 1;
        descInput.addEventListener('input', () => autoResize(descInput));
        headerWrap.appendChild(descInput);
        setTimeout(() => autoResize(descInput), 0);
    } else {
        const nameDisplay = document.createElement("h1");
        nameDisplay.className = "profile-name-display";
        nameDisplay.style.color = getSignature(entity);
        nameDisplay.textContent = entity.name || "Unknown";
        headerWrap.appendChild(nameDisplay);

        const descDisplay = document.createElement("p");
        descDisplay.className = "profile-desc-display";
        descDisplay.textContent = entity.description || "";
        headerWrap.appendChild(descDisplay);
    }

    // --- TAGS ---
    const tagsRow = document.createElement("div");
    tagsRow.className = "field-row";
    tagsRow.hidden = true;

    if (isEditing) {
        tagsRow.innerHTML = `
      <div class="field-label"><label>Tags</label><small class="muted">Comma separated</small></div>
      <div class="field-input">
        <textarea data-edit-field="tags" rows="1" placeholder="e.g. warrior, magic, dark">${(entity.tags || []).join(", ")}</textarea>
      </div>`;
        const tagInput = tagsRow.querySelector("textarea");
        tagInput.addEventListener('input', () => autoResize(tagInput));
        setTimeout(() => autoResize(tagInput), 0);
    } else {
        tagsRow.innerHTML = `<div class="field-label"><label>Tags</label></div><div class="field-input"></div>`;
        const inputContainer = tagsRow.querySelector(".field-input");
        if (renderTags) {
            renderTags(inputContainer, entity);
        } else {
            inputContainer.textContent = (entity.tags || []).join(", ");
        }
    }
    headerWrap.after(tagsRow);

    // --- SECTIONS (Forever, Past, etc.) ---
    const createRow = (key, def) => {
        const div = document.createElement("div"); div.className = "field-row";
        const sublabel = def.sublabels[type] || "";

        div.innerHTML = `
        <div class="field-label">
            <label>${def.label}</label>
            ${sublabel ? `<small class="muted">${sublabel}</small>` : ''}
        </div>
        <div class="field-input">
            <div data-read class="profile-field-text-read">${escapeHtml(entity[key] || "")}</div>
        </div>`;

        if (isEditing) {
            const input = document.createElement("textarea");
            input.value = entity[key] || "";
            input.dataset.editField = key;
            input.rows = 1;
            input.addEventListener('input', () => autoResize(input));
            div.querySelector(".field-input").appendChild(input);
            div.querySelector("[data-read]").style.display = "none";
        }
        secWrap.appendChild(div);
    };

    Object.keys(SECTION_DEFINITIONS).forEach(k => createRow(k, SECTION_DEFINITIONS[k]));

    // --- DYNAMICS (Director Mode) ---
    if (state.settings.directorMode && type === 'character') {
        const dynRow = document.createElement("div");
        dynRow.className = "field-row";
        const dyns = entity.dynamics || { entropy: 50, permeability: 50, velocity: 50, resonance: 50 };

        if (isEditing) {
            dynRow.innerHTML = `
                <div class="field-label"><label>Dynamics</label><small class="muted">Director Mode</small></div>
                <div class="field-input" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                    ${['entropy', 'permeability', 'velocity', 'resonance'].map(k => `
                        <label style="font-size: 0.8rem; text-transform: capitalize;">
                            ${k} <input type="number" data-edit-dynamic="${k}" value="${dyns[k] !== undefined ? dyns[k] : 50}" min="0" max="100">
                        </label>
                    `).join('')}
                </div>`;
        } else {
            dynRow.innerHTML = `
                <div class="field-label"><label>Dynamics</label><small class="muted">Director Mode</small></div>
                <div class="field-input" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                     ${['entropy', 'permeability', 'velocity', 'resonance'].map(k => `
                        <div style="background: var(--pico-card-background-color); padding: 0.5rem; border-radius: 4px; border: 1px solid var(--pico-muted-border-color); text-align: center;">
                            <div style="font-size: 0.65rem; text-transform: uppercase; opacity: 0.7; margin-bottom: 0.25rem;">${k}</div>
                            <div style="font-family: monospace; font-size: 1.1rem; font-weight: 800; color: var(--pico-primary);">${dyns[k] !== undefined ? dyns[k] : 50}%</div>
                        </div>
                    `).join('')}
                </div>`;
        }
        secWrap.appendChild(dynRow);
    }

    // --- FOOTER ACTIONS ---
    const footerActions = document.createElement("div");
    footerActions.className = "profile-actions-footer";

    if (isGameplay) {
        const statusMsg = document.createElement("div");
        statusMsg.className = "muted";
        statusMsg.style.width = "100%";
        statusMsg.style.textAlign = "center";
        statusMsg.innerHTML = "<em>Entity is active in story. Changes are managed by the AI.</em>";
        footerActions.appendChild(statusMsg);

    } else if (isEditing) {
        // Revert
        if (blueprint) {
            const revertBtn = document.createElement("button");
            revertBtn.className = "secondary outline warning";
            revertBtn.textContent = "Revert to Default";
            revertBtn.onclick = (e) => {
                e.preventDefault();
                if (confirm("Reset this character? All changes will be lost.")) {
                    const flatBp = { ...blueprint, ...(blueprint.sections || {}) };
                    screen.querySelector('[data-edit-field="name"]').value = flatBp.name;
                    screen.querySelector('[data-edit-field="description"]').value = flatBp.description;
                    Object.keys(SECTION_DEFINITIONS).forEach(k => {
                        const el = screen.querySelector(`[data-edit-field="${k}"]`);
                        if (el) el.value = flatBp[k] || "";
                    });
                    if (flatBp.profilePictureUrl) {
                        imageInput.value = flatBp.profilePictureUrl;
                        imageInput.dispatchEvent(new Event('input'));
                    }
                    screen.querySelectorAll('textarea').forEach(t => t.dispatchEvent(new Event('input')));
                }
            };
            footerActions.appendChild(revertBtn);
        }

        // Save
        const saveBtn = document.createElement("button");
        saveBtn.className = "primary"; saveBtn.textContent = "Save";
        saveBtn.onclick = async (e) => {
            e.preventDefault();
            const nameVal = screen.querySelector('[data-edit-field="name"]').value.trim();
            if (!nameVal) return alert("Name is required");

            const tagsInput = screen.querySelector('[data-edit-field="tags"]').value;
            const tagsArray = tagsInput.split(",").map(t => t.trim()).filter(Boolean);

            const data = {
                name: escapeHtml(nameVal),
                description: escapeHtml(screen.querySelector('[data-edit-field="description"]').value.trim()),
                profilePictureUrl: escapeHtml(imageInput.dataset.pendingUrl || imageInput.value.trim()),
                signatureColour: escapeHtml(paletteSelect.value.trim()),
                tags: tagsArray,
                // Persist the visual state (flipped, etc)
                visuals: localVisuals
            };
            Object.keys(SECTION_DEFINITIONS).forEach(k => {
                const el = screen.querySelector(`[data-edit-field="${k}"]`);
                if (el) data[k] = escapeHtml(el.value.trim());
            });

            if (state.settings.directorMode) {
                const dyn = {};
                ['entropy', 'permeability', 'velocity', 'resonance'].forEach(k => {
                    const el = screen.querySelector(`[data-edit-dynamic="${k}"]`);
                    if (el) dyn[k] = parseInt(el.value, 10) || 0;
                });
                data.dynamics = dyn;
            }

            const saved = await entities.upsert(type, id === "new" || entity.isPremade ? data : { ...data, id });

            if (activeSlotKey && _onUpdateSelection) {
                _onUpdateSelection({ [activeSlotKey]: saved });
            }

            // Notify Global State (so Chat/Drawer update too)
            window.dispatchEvent(new CustomEvent('entity-visual-update', { detail: { id: saved.id } }));

            if (id === "new") closeProfileModal();
            else { entity = await entities.get(type, saved.id); setEditMode(false); }
        };

        // Delete
        if (id !== "new") {
            const delBtn = document.createElement("button");
            delBtn.className = "secondary outline danger"; delBtn.textContent = "Delete";
            delBtn.onclick = async (e) => {
                e.preventDefault();
                if (confirm("Delete this entity?")) {
                    await entities.remove(type, id);
                    if (_onUpdateSelection) {
                        const update = {};
                        update[activeSlotKey] = null;
                        _onUpdateSelection(update);
                    }
                    closeProfileModal();
                }
            };
            footerActions.appendChild(delBtn);
        }
        footerActions.appendChild(saveBtn);

    } else {
        // View Mode
        if (entity.isPremade && !entity.originId) {
            const cloneBtn = document.createElement("button");
            cloneBtn.className = "primary"; cloneBtn.textContent = "Clone";
            cloneBtn.onclick = async (e) => {
                e.preventDefault();
                const newEntity = await copyEntity(type, entity.id);
                if (newEntity) { window.ephemeralEntity = newEntity; openProfileModal(type, "new", activeSlotKey); }
            };
            footerActions.appendChild(cloneBtn);
        } else {
            const editBtn = document.createElement("button");
            editBtn.className = "secondary outline"; editBtn.textContent = "Edit";
            editBtn.onclick = (e) => { e.preventDefault(); setEditMode(true); };
            footerActions.appendChild(editBtn);
        }
    }

    layout.querySelector(".profile-right-content").appendChild(footerActions);
    screen.appendChild(layout);

    screen.onclick = (e) => { if (e.target === screen) closeProfileModal(); };
    if (imageOverlay) imageOverlay.style.display = isEditing ? "flex" : "none";
}