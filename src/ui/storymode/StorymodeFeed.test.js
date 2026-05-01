import { app } from "@state/app.svelte.js";
import { session } from "@state/session.svelte.js";
import { simulation_log } from "@state/simulation-log.svelte.js";
import { simulationState } from "@state/status.svelte.js";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StorymodeFeed from "@storymode/StorymodeFeed.svelte";
// Mock child components
vi.mock("@storymode/Message.svelte", async () => {
  return await import("@/tests/MockMessage.svelte");
});
describe("StorymodeFeed Integration (Isolated)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    // Reset Real State
    simulation_log.feed = [];
    app.streaming = { active: false, content: "", node_id: null, role: "ai" };
    app.selected_ai = { name: "TestAI" };
    simulationState.phase = "idle";
    simulationState.role = null;
  });
  it("renders empty state when no messages", () => {
    render(StorymodeFeed);
    expect(screen.getByText(/Establishing context stream/i)).toBeDefined();
    // Check for Retry Button
    expect(screen.getByText("Retry Connection")).toBeDefined();
  });
  it("renders messages using MockMessage", async () => {
    simulation_log.add({
      id: "1",
      text: "Hello Mock",
      role: "user",
      timestamp: new Date(),
    });
    render(StorymodeFeed);
    expect(screen.getByText("Hello Mock")).toBeDefined();
  });
  it("renders thinking state", async () => {
    simulationState.phase = "generating";
    render(StorymodeFeed);
    expect(screen.getByTestId("mock-message-thinking")).toBeDefined();
  });
  it("renders streaming content", async () => {
    app.streaming = { active: true, content: "Streaming...", node_id: null, role: "ai" };
    render(StorymodeFeed);
    expect(screen.getByText("Streaming...")).toBeDefined();
  });
  it("handles message deletion", async () => {
    const deleteSpy = vi.spyOn(session, "delete_log_entry").mockResolvedValue();
    simulation_log.add({ id: "msg-123", text: "To Delete", role: "user" });
    render(StorymodeFeed);
    const deleteBtn = screen.getByTestId("mock-delete");
    await fireEvent.click(deleteBtn);

    // Click confirm in the Modal (Need to be specific as "Delete" appears twice)
    const modal = screen.getByRole("dialog");
    const confirmBtn = within(modal).getByText("Delete");
    await fireEvent.click(confirmBtn);

    expect(deleteSpy).toHaveBeenCalledWith("msg-123");
  });
  it("handles message editing", async () => {
    const editSpy = vi.spyOn(session, "edit_log_entry").mockResolvedValue();
    vi.spyOn(window, "prompt").mockReturnValue("New Text");
    simulation_log.add({ id: "msg-456", text: "To Edit", role: "user" });
    render(StorymodeFeed);
    const editBtn = screen.getByTestId("mock-edit");
    await fireEvent.click(editBtn);
    expect(window.prompt).toHaveBeenCalledWith("Edit log entry:", "To Edit");
    expect(editSpy).toHaveBeenCalledWith("msg-456", "New Text");
  });
});
