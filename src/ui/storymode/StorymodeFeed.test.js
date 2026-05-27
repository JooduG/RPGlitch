import { app, session, simulation_log, simulationState } from "@state";
import StorymodeFeed from "@storymode/StorymodeFeed.svelte";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    app.streaming = {
      active: false,
      content: "",
      text: "",
      node_id: null,
      nodeId: null,
      role: "ai",
      abort_controller: null,
    };
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
    app.streaming = {
      active: true,
      content: "Streaming...",
      text: "Streaming...",
      node_id: null,
      nodeId: null,
      role: "ai",
      abort_controller: null,
    };
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
    const modal = screen.queryByRole("dialog") || screen.getByRole("alertdialog");
    const confirmBtn = within(modal).getByText("Delete");
    await fireEvent.click(confirmBtn);

    expect(deleteSpy).toHaveBeenCalledWith("msg-123");
  });
  it("handles message editing", async () => {
    const editSpy = vi.spyOn(session, "edit_log_entry").mockResolvedValue();
    simulation_log.add({ id: "msg-456", text: "To Edit", role: "user" });
    render(StorymodeFeed);

    // 1. Click edit button to toggle editing mode
    const editBtn = screen.getByTestId("mock-edit");
    await fireEvent.click(editBtn);

    // 2. Locate input and edit text
    const input = /** @type {HTMLInputElement} */ (screen.getByTestId("mock-edit-input"));
    expect(input.value).toBe("To Edit");
    await fireEvent.input(input, { target: { value: "New Text" } });

    // 3. Click save button
    const saveBtn = screen.getByTestId("mock-save");
    await fireEvent.click(saveBtn);

    expect(editSpy).toHaveBeenCalledWith("msg-456", "New Text");
  });

  it("handles message edit cancellation", async () => {
    simulation_log.add({ id: "msg-456", text: "To Edit", role: "user" });
    render(StorymodeFeed);

    // 1. Toggle editing mode
    const editBtn = screen.getByTestId("mock-edit");
    await fireEvent.click(editBtn);

    // 2. Verify we are in edit mode
    expect(screen.getByTestId("mock-edit-input")).toBeDefined();

    // 3. Cancel editing
    const cancelBtn = screen.getByTestId("mock-cancel");
    await fireEvent.click(cancelBtn);

    // 4. Verify we are back to read-only view
    expect(screen.queryByTestId("mock-edit-input")).toBeNull();
    expect(screen.getByText("To Edit")).toBeDefined();
  });
});
