// src/core/session/utils.js

import { Security } from "@core/security/security.js"
import { PALETTE } from "./config.js"

// --- Color Re-exports ---
export const getSignatureColor = (key) => PALETTE[key] || PALETTE.default

// --- Debug & Logging ---
let isDebug = false

export const initDebugMode = async () => {
    try {
        const { db } = await import("@data/db.js")
        const settings = await db.settings.get("app-settings")
        if (settings && typeof settings.debugMode !== "undefined") {
            isDebug = !!settings.debugMode
        }
    } catch (e) {
        console.error("[Engine] Failed to load debug mode:", e)
        isDebug = false
    }
    return isDebug
}

export const log = (...args) => {
    if (isDebug) console.info("[Engine]", ...args)
}

export const error = (...args) => {
    console.error("[Engine]", ...args)
}

export const setDebug = async (on) => {
    isDebug = !!on
    try {
        const { db } = await import("@data/db.js")
        let settings = await db.settings.get("app-settings")
        if (!settings) settings = { id: "app-settings" }
        settings.debugMode = isDebug
        await db.settings.put(settings)
    } catch (e) {
        error("Failed to save debug mode to settings:", e)
    }
    return isDebug
}

// --- Generic Utilities ---
export const generateUUID = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID()
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

export const debounce = (fn, wait = 250) => {
    let t
    return (...args) => {
        clearTimeout(t)
        t = setTimeout(() => fn.apply(null, args), wait)
    }
}

export const parseMarkdown = (text) => {
    if (typeof text !== "string") return ""
    let html = Security.sanitize(text) // Use Security for sanitization
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")
    html = html.replace(/\n/g, "<br>")
    return html
}

// --- Plugins Mocking ---
export const mockPlugins = () => {
    if (!window["pluginAi"]) window["pluginAi"] = async () => "Mock AI Response"
    if (!window["pluginTextToImage"])
        window["pluginTextToImage"] = async () =>
            // [VISUALS MOCK] Mocks the generation plugin
            "https://via.placeholder.com/512x768"
    if (!window["pluginRemember"])
        window["pluginRemember"] = { get: () => null, set: () => {} }
    if (!window["pluginSuperFetch"])
        window["pluginSuperFetch"] = async () => ({ text: async () => "" })
    if (!window["pluginUpload"])
        window["pluginUpload"] = async (data) =>
            "https://via.placeholder.com/150"
}

export const clamp = (n, min = 0, max = 100) =>
    Math.min(max, Math.max(min, Number(n) || 0))
