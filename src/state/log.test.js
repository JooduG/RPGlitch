import { beforeEach, describe, expect, it, vi } from "vitest";
import { SimulationLogStore, simulation_log } from "./log.svelte.js";
import { runtime } from "./runtime.svelte.js";
import { session_driver } from "@data";

vi.mock("@data", () => ({
  session_driver: {
    load_log: vi.fn().mockResolvedValue([]),
    delete_log_entry: vi.fn().mockResolvedValue({}),
    delete_log_attachment: vi.fn().mockResolvedValue({}),
    edit_log_entry: vi.fn().mockResolvedValue({}),
  },
}));

describe("SimulationLogStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    simulation_log.clear();
  });

  it("exports a singleton simulation_log instance", () => {
    expect(simulation_log).toBeInstanceOf(SimulationLogStore);
  });

  it("adds entries with deduplication against existing IDs", () => {
    const entry1 = { id: "msg-1", role: "user", text: "Hello" };
    const entry2 = { id: "msg-1", role: "user", text: "Duplicate" };
    const entry3 = { id: "msg-2", role: "model", text: "Greetings" };

    simulation_log.add(entry1);
    simulation_log.add(entry2);
    simulation_log.add(entry3);

    expect(simulation_log.feed.length).toBe(2);
    expect(simulation_log.feed[0].text).toBe("Hello");
    expect(simulation_log.feed[1].text).toBe("Greetings");
  });

  it("updates an existing entry in the feed", () => {
    simulation_log.add({ id: "msg-1", role: "user", text: "Initial" });
    simulation_log.update("msg-1", { text: "Updated text" });
    expect(simulation_log.feed[0].text).toBe("Updated text");
  });

  it("removes an entry from the feed and allows re-adding the ID", () => {
    simulation_log.add({ id: "msg-1", role: "user", text: "First" });
    expect(simulation_log.feed.length).toBe(1);

    simulation_log.remove("msg-1");
    expect(simulation_log.feed.length).toBe(0);

    simulation_log.add({ id: "msg-1", role: "user", text: "Re-added" });
    expect(simulation_log.feed.length).toBe(1);
    expect(simulation_log.feed[0].text).toBe("Re-added");
  });

  it("refreshes the feed from session_driver when story_id is set", async () => {
    runtime.story_id = "story-test";
    const mock_messages = [
      { id: "msg-1", role: "user", text: "Prompt 1" },
      { id: "msg-2", role: "model", text: "Response 1" },
    ];
    session_driver.load_log.mockResolvedValueOnce(mock_messages);

    await simulation_log.refresh();
    expect(simulation_log.feed.length).toBe(2);
    expect(simulation_log.feed[0].text).toBe("Prompt 1");
  });

  it("clears the feed on refresh if story_id is not set", async () => {
    simulation_log.add({ id: "msg-1", role: "user", text: "Prompt 1" });
    runtime.story_id = null;

    await simulation_log.refresh();
    expect(simulation_log.feed.length).toBe(0);
  });

  it("deletes an entry in persistence and feed via delete_entry", async () => {
    simulation_log.add({ id: "msg-del", role: "user", text: "To delete" });
    await simulation_log.delete_entry("msg-del");
    expect(session_driver.delete_log_entry).toHaveBeenCalledWith("msg-del");
    expect(simulation_log.feed.length).toBe(0);
  });

  it("edits an entry in persistence and feed via edit_entry", async () => {
    simulation_log.add({ id: "msg-edit", role: "user", text: "Original" });
    await simulation_log.edit_entry("msg-edit", "New text");
    expect(session_driver.edit_log_entry).toHaveBeenCalledWith("msg-edit", "New text");
    expect(simulation_log.feed[0].text).toBe("New text");
  });

  it("delegates attachment deletion to session_driver", async () => {
    await simulation_log.delete_attachment("msg-attach", 2);
    expect(session_driver.delete_log_attachment).toHaveBeenCalledWith("msg-attach", 2);
  });
});
