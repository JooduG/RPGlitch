/**
 * @file src/ui/organisms/CardHand.test.js
 * Unit test suite verifying CardHand click-outside, backdrop layering, and import behavior.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import CardHand from "./CardHand.svelte";
import { app } from "@state";
import * as engine from "@engine";

describe("CardHand", () => {
  beforeEach(() => {
    app.card_hand.open = false;
    app.card_hand.type = null;
    app.selected_ai = null;
    app.selected_user = null;
    app.selected_fractal = null;
  });

  it("closes when clicking outside on the backdrop", async () => {
    const close_spy = vi.spyOn(app, "close_card_hand");
    const { container } = render(CardHand, { is_open: true, card_hand_type: "ai" });

    const backdrop = container.querySelector('[data-modal-layer="cardhand"]');
    expect(backdrop).not.toBeNull();

    // Trigger pointerdown then click directly on the backdrop element
    await fireEvent.pointerDown(backdrop);
    await fireEvent.click(backdrop);

    expect(close_spy).toHaveBeenCalled();
    close_spy.mockRestore();
  });

  it("opens the import modal without prematurely closing card_hand", async () => {
    const { getAllByRole, getByLabelText } = render(CardHand, { is_open: true, card_hand_type: "user" });

    const import_button = getByLabelText("Import");
    expect(import_button).toBeDefined();

    await fireEvent.click(import_button);

    // Both the card hand dialog and the import modal dialog are now mounted
    const dialogs = getAllByRole("dialog");
    expect(dialogs.length).toBeGreaterThanOrEqual(2);
  });

  it("selects user persona when importing from user card_hand", async () => {
    const mock_character = { id: "char-123", name: "Imported User", type: "character" };
    vi.spyOn(engine, "import_entities").mockResolvedValue({ character: mock_character, fractal: null });
    const select_spy = vi.spyOn(app, "select_entity");
    const close_spy = vi.spyOn(app, "close_card_hand");

    const { getByLabelText, getByRole } = render(CardHand, { is_open: true, card_hand_type: "user" });

    // Open import modal
    await fireEvent.click(getByLabelText("Import"));

    // Find textarea and enter text
    const textarea = getByRole("textbox");
    await fireEvent.input(textarea, { target: { value: '{"name": "Imported User"}' } });

    // Click download/import button
    const submit_button = getByLabelText("Import entity");
    await fireEvent.click(submit_button);

    expect(engine.import_entities).toHaveBeenCalled();
    expect(select_spy).toHaveBeenCalledWith("user", mock_character);
    expect(close_spy).toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
