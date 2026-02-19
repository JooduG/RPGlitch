import { app } from "@state/app.svelte.js"
import { messages } from "@state/messages.svelte.js"
import { session } from "@state/session.svelte.js"
import { engineState } from "@state/status.svelte.js"
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { beforeEach, describe, expect, it, vi } from "vitest"
import ProsePanel from "./ProsePanel.svelte"

// Mock child components
vi.mock("./Message.svelte", async () => {
    return await import("./MockMessage.svelte")
})

describe("ProsePanel Integration (Isolated)", () => {
    beforeEach(() => {
        cleanup()
        vi.clearAllMocks()
        // Reset Real State
        messages.feed = []
        app.streaming = { active: false, content: "", nodeId: null }
        app.selectedAi = { name: "TestAI" }
        engineState.phase = "idle"
        engineState.role = null
    })

    it("renders empty state when no messages", () => {
        render(ProsePanel)
        expect(screen.getByText(/Establishing context stream/i)).toBeDefined()
        // Check for Retry Button
        expect(screen.getByText("Retry Connection")).toBeDefined()
    })

    it("renders messages using MockMessage", async () => {
        messages.add({
            id: "1",
            text: "Hello Mock",
            role: "user",
            timestamp: new Date(),
        })

        render(ProsePanel)
        expect(screen.getByText("Hello Mock")).toBeDefined()
    })

    it("renders thinking state", async () => {
        engineState.phase = "generating"
        render(ProsePanel)
        expect(screen.getByTestId("mock-message-thinking")).toBeDefined()
    })

    it("renders streaming content", async () => {
        app.streaming = { active: true, content: "Streaming...", nodeId: null }
        render(ProsePanel)
        expect(screen.getByText("Streaming...")).toBeDefined()
    })

    it("handles message deletion", async () => {
        const deleteSpy = vi.spyOn(session, "deleteMessage").mockResolvedValue()
        messages.add({ id: "msg-123", text: "To Delete", role: "user" })

        render(ProsePanel)
        const deleteBtn = screen.getByTestId("mock-delete")
        await fireEvent.click(deleteBtn)

        expect(deleteSpy).toHaveBeenCalledWith("msg-123")
    })

    it("handles message editing", async () => {
        const editSpy = vi.spyOn(session, "editMessage").mockResolvedValue()
        vi.spyOn(window, "prompt").mockReturnValue("New Text")

        messages.add({ id: "msg-456", text: "To Edit", role: "user" })

        render(ProsePanel)
        const editBtn = screen.getByTestId("mock-edit")
        await fireEvent.click(editBtn)

        expect(window.prompt).toHaveBeenCalledWith("Edit message:", "To Edit")
        expect(editSpy).toHaveBeenCalledWith("msg-456", "New Text")
    })
})
