// apps/rpglitch/js/app-state.js
export const state = {
    storyTitle: "My Story",
    selectedAI: null,
    selectedWorld: null,
    selectedUser: null,
    mode: "storyboard",
    isCustomTitle: false,
    story: { byId: {}, activeId: null },
    messages: { byStoryId: {} },
    settings: {
        temperature: 0.7,
        top_p: 1.0,
        maxTokens: 512,
        stop: [],
        model: "default",
        historyLength: 10,
        // >>> DIRECTOR MODE ADDED HERE <<<
        directorMode: false
    },
    ui: { fsm: "idle" },
};

export function applyPatch(patch) {
    const merge = (target, source) => {
        for (const key in source) {
            if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                merge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
        return target;
    };

    merge(state, patch);
    document.dispatchEvent(new CustomEvent("state:changed", { detail: { patch } }));
}