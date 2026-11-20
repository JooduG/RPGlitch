import { set_tooltip_suppressed, tooltip, tooltip_state, unpin_tooltip } from "@primitives";
import { app } from "@state";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContextMenu from "./ContextMenu.svelte";
import { claim_menu } from "./ContextMenu.svelte.js";
import EntityCard from "./EntityCard.svelte";
import MacroText from "./MacroText.svelte";
import RelationalGraph from "./RelationalGraph.svelte";

vi.mock("@data", async (importOriginal) => {
  const actual = await importOriginal();
  const mock_list = [
    {
      id: "silvers",
      name: "Lord Benedict Silvers",
      type: "character",
      signature_color: "Crimson Red",
      present: { non_physical: "[PYRO: @HANK custom pyrotechnics]" },
    },
    { id: "hank", name: "Hank", type: "character", signature_color: "Rusty Orange", present: { non_physical: "[DEBT: @SILVERS arms supplier debt]" } },
    { id: "julien", name: "Julien", type: "character", signature_color: "Soft Rose", present: { non_physical: "[PLOT: secret betrayal of @HANK | hide]" } },
  ];
  return { ...actual, list_entities: vi.fn(async (type) => (type === "character" ? mock_list : [])) };
});

describe("RelationalGraph (Radial Constellation UI)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tooltip_state.active = false;
    tooltip_state.text = null;
    tooltip_state.entity = null;
    tooltip_state.bracket_items = null;
    tooltip_state.description_owner = null;
    tooltip_state.incoming_only = false;
    tooltip_state.target = null;
    tooltip_state.pinned = false;
    tooltip_state.actions = [];
    set_tooltip_suppressed(false);
  });

  it("renders empty state when entity has no relationships", async () => {
    const mock_entity = { id: "julien", name: "Julien", type: "character", relationships: [] };
    render(RelationalGraph, { props: { entity: mock_entity } });

    expect(await screen.findByText(/No recorded relationships yet/i)).toBeTruthy();
  });

  it("renders constellation nodes for both outgoing and incoming relationships", async () => {
    const mock_entity = {
      id: "hank",
      name: "Hank",
      type: "character",
      signature_color: "Rusty Orange",
      present: { non_physical: "[DEBT: @SILVERS arms supplier debt]" },
    };

    const on_select_entity = vi.fn();
    render(RelationalGraph, { props: { entity: mock_entity, on_select_entity } });

    // Center node (@ID handle)
    expect(await screen.findByText("@HANK")).toBeTruthy();
    // Satellite node (@ID handle)
    expect(await screen.findByText("@SILVERS")).toBeTruthy();
    // Hidden incoming edge from Julien must not leak across the Epistemic Wall
    expect(screen.queryByText("@JULIEN")).toBeNull();
  });

  it("collects all outgoing brackets across quadrants into Tooltip preview payload and renders structured BracketList on EntityCard", async () => {
    const mock_entity = {
      id: "hank",
      name: "Hank",
      type: "character",
      signature_color: "Rusty Orange",
      eternal: { non_physical: "[RIVALRY: @SILVERS bitter orbital rivalry]" },
      present: { non_physical: "[DEBT: @SILVERS arms supplier debt]" },
      past: "[OLD_PACT: @SILVERS forged scrap deal]",
    };

    const on_select_entity = vi.fn();
    render(RelationalGraph, { props: { entity: mock_entity, on_select_entity } });

    const satellite_btn = await screen.findByRole("button", { name: /Lord Benedict Silvers/i });
    const handle_el = await screen.findByText("@SILVERS");
    expect(satellite_btn.contains(handle_el)).toBe(true);

    await fireEvent.mouseOver(handle_el, { clientX: 55, clientY: 75 });
    await new Promise((r) => setTimeout(r, 20));

    expect(tooltip_state.active).toBe(true);
    expect(tooltip_state.entity).toEqual(expect.objectContaining({ id: "silvers", name: "Lord Benedict Silvers" }));
    expect(tooltip_state.incoming_only).toBe(false);
    expect(tooltip_state.bracket_items).toEqual([
      { key: "DEBT", value: "@SILVERS arms supplier debt", is_hidden: false, quadrant: "present" },
      { key: "RIVALRY", value: "@SILVERS bitter orbital rivalry", is_hidden: false, quadrant: "eternal" },
      { key: "OLD_PACT", value: "@SILVERS forged scrap deal", is_hidden: false, quadrant: "past" },
    ]);

    const { container } = render(EntityCard, {
      props: {
        variant: "library",
        entity: tooltip_state.entity,
        bracket_items: tooltip_state.bracket_items,
        description_owner: tooltip_state.description_owner,
        incoming_only: tooltip_state.incoming_only,
      },
    });
    const card_root = container.querySelector("[data-card-root]");
    expect(card_root?.className).not.toContain("opacity-muted");
    expect(card_root?.className).not.toContain("grayscale");
    expect(container.querySelector(".overflow-y-auto")).toBeNull();
    // Multiple brackets drop the entity title first to avoid scrollbars
    expect(container.textContent).not.toContain("Lord Benedict Silvers");
    expect(container.textContent).toContain("DEBT");
    expect(container.textContent).toContain("present");
    expect(container.textContent).toContain("RIVALRY");
    expect(container.textContent).toContain("eternal");
    expect(container.textContent).toContain("OLD_PACT");
    expect(container.textContent).toContain("past");
    expect(container.textContent).toContain("arms supplier debt");
    expect(container.textContent).toContain("bitter orbital rivalry");
    expect(container.textContent).not.toContain("[DEBT:");

    await fireEvent.click(satellite_btn);
    expect(on_select_entity).toHaveBeenCalledWith(expect.objectContaining({ id: "silvers", name: "Lord Benedict Silvers" }));
  });

  it("applies opacity-muted grayscale to incoming-only satellite nodes and their EntityCard, while keeping one-way outgoing nodes full saturation", async () => {
    const mock_entity = {
      id: "hank",
      name: "Hank",
      type: "character",
      signature_color: "Rusty Orange",
      present: { non_physical: "[ALLY: @JULIEN one-way outgoing bond]" },
    };

    const { container } = render(RelationalGraph, { props: { entity: mock_entity } });

    const silvers_btn = await screen.findByRole("button", { name: /Lord Benedict Silvers/i });
    const julien_btn = await screen.findByRole("button", { name: /Julien/i });

    const silvers_wrapper = silvers_btn.closest('[data-testid="relational-satellite-node"]');
    const julien_wrapper = julien_btn.closest('[data-testid="relational-satellite-node"]');
    expect(silvers_wrapper?.className).toContain("opacity-muted");
    expect(silvers_wrapper?.className).toContain("grayscale");
    expect(julien_wrapper?.className).not.toContain("opacity-muted");
    expect(julien_wrapper?.className).not.toContain("grayscale");

    await fireEvent.mouseOver(silvers_btn, { clientX: 60, clientY: 80 });
    expect(tooltip_state.incoming_only).toBe(true);
    expect(tooltip_state.bracket_items).toEqual([{ key: "PYRO", value: "@HANK custom pyrotechnics", is_hidden: true, quadrant: "present" }]);

    const { container: card_container } = render(EntityCard, {
      props: {
        variant: "library",
        entity: tooltip_state.entity,
        bracket_items: tooltip_state.bracket_items,
        description_owner: tooltip_state.description_owner,
        incoming_only: tooltip_state.incoming_only,
      },
    });
    const card_root = card_container.querySelector("[data-card-root]");
    expect(card_root?.className).toContain("opacity-muted");
    expect(card_root?.className).toContain("grayscale");
    expect(card_container.querySelector(".overflow-y-auto")).toBeNull();
    // Single short bracket preserves the entity title
    expect(card_container.textContent).toContain("Lord Benedict Silvers");
    expect(card_container.textContent).toContain("PYRO");
    expect(card_container.textContent).toContain("custom pyrotechnics");

    await fireEvent.mouseOut(silvers_btn);

    const center_node = await screen.findByTestId("relational-center-node");
    await fireEvent.pointerEnter(center_node);
    const glow_paths = container.querySelectorAll('path[filter="url(#mesh-glow)"]');
    expect(glow_paths.length).toBeGreaterThan(0);
  });

  it("renders constellation nodes derived from value-referenced brackets in present.non_physical", async () => {
    const mock_entity = {
      id: "silvers",
      name: "Lord Benedict Silvers",
      type: "character",
      present: { non_physical: "[DEBT: @HANK arms supplier debt | w: 8]" },
    };

    render(RelationalGraph, { props: { entity: mock_entity } });

    // Center node (@ID handle)
    expect(await screen.findByText("@SILVERS")).toBeTruthy();
    // Satellite node harvested from bracket (@ID handle)
    expect(await screen.findByText("@HANK")).toBeTruthy();
  });

  it("does not fall back to ALL_PREMADES when a premade entity is absent from the DB", async () => {
    const mock_entity = { id: "custom_hero", name: "Custom Hero", type: "character", present: { non_physical: "[RIVALRY: @ORION rival | show]" } };

    const on_select_entity = vi.fn();
    render(RelationalGraph, { props: { entity: mock_entity, on_select_entity } });

    expect(await screen.findByText(/No recorded relationships yet/i)).toBeTruthy();
    expect(screen.queryByText("@ORION")).toBeNull();
    expect(on_select_entity).not.toHaveBeenCalled();
  });

  it("opens profile/select on EntityCard left-click and ContextMenu (with empty state) on right-click", async () => {
    const entity = { id: "silvers", name: "Lord Benedict Silvers", type: "character", signature_color: "Crimson Red" };
    const on_select = vi.fn();

    const { container } = render(EntityCard, { props: { variant: "panel", entity, actions: [], on_select } });

    const card_root = container.querySelector("[data-card-root]");
    await fireEvent.click(card_root);
    expect(on_select).toHaveBeenCalledTimes(1);
    expect(document.body.querySelector('[role="menu"]')).toBeNull();

    await fireEvent.contextMenu(card_root, { clientX: 120, clientY: 140 });
    const menu = document.body.querySelector('[role="menu"]');
    expect(menu).toBeTruthy();
    expect(menu.textContent).toContain("Lord Benedict Silvers");
    expect(menu.textContent).toContain("No actions available");

    await fireEvent.pointerDown(document.body);
    expect(document.body.querySelector('[role="menu"]')).toBeNull();
  });

  it("opens profile on @ID left-click and pins card-back ContextMenu with entity actions on @ID right-click in MacroText", async () => {
    const open_spy = vi.spyOn(app, "open_profile").mockImplementation(() => {});
    const preview_spy = vi.spyOn(app, "open_image_preview").mockImplementation(() => {});
    const target = {
      id: "silvers",
      name: "Lord Benedict Silvers",
      type: "character",
      signature_color: "Crimson Red",
      profile_picture: "https://example.com/silvers.png",
    };

    render(MacroText, { props: { text: "Refuses @SILVERS", entities: { ALL: [target] } } });

    const handle_btn = await screen.findByRole("button", { name: "@SILVERS" });
    await fireEvent.click(handle_btn);
    expect(open_spy).toHaveBeenCalledWith(target);

    await fireEvent.contextMenu(handle_btn, { clientX: 80, clientY: 90 });
    expect(tooltip_state.active).toBe(true);
    expect(tooltip_state.pinned).toBe(true);
    expect(tooltip_state.entity).toEqual(target);
    expect(tooltip_state.actions.map((a) => a.label)).toEqual(["Profile", "Profile Picture"]);

    tooltip_state.actions[0].onSelect();
    expect(open_spy).toHaveBeenCalledTimes(2);
    tooltip_state.actions[1].onSelect();
    expect(preview_spy).toHaveBeenCalledWith({ src: "https://example.com/silvers.png", metadata: null });

    unpin_tooltip();
    expect(tooltip_state.pinned).toBe(false);
    expect(tooltip_state.active).toBe(false);
    open_spy.mockRestore();
    preview_spy.mockRestore();
  });

  it("pins card-back ContextMenu with Profile action on RelationalGraph satellite right-click", async () => {
    const on_select_entity = vi.fn();
    const mock_entity = {
      id: "hank",
      name: "Hank",
      type: "character",
      signature_color: "Rusty Orange",
      present: { non_physical: "[DEBT: @SILVERS arms supplier debt]" },
    };

    render(RelationalGraph, { props: { entity: mock_entity, on_select_entity } });
    const satellite_btn = await screen.findByRole("button", { name: /Lord Benedict Silvers/i });

    await fireEvent.contextMenu(satellite_btn, { clientX: 60, clientY: 70 });
    expect(tooltip_state.active).toBe(true);
    expect(tooltip_state.pinned).toBe(true);
    expect(tooltip_state.entity).toEqual(expect.objectContaining({ id: "silvers", name: "Lord Benedict Silvers" }));
    expect(tooltip_state.actions.map((a) => a.label)).toEqual(["Profile"]);

    tooltip_state.actions[0].onSelect();
    expect(on_select_entity).toHaveBeenCalledWith(expect.objectContaining({ id: "silvers" }));

    unpin_tooltip();
    expect(tooltip_state.active).toBe(false);
    expect(tooltip_state.pinned).toBe(false);
  });

  it("renders frosted portrait backdrop on embedded ContextMenu and guards modal dismissal", async () => {
    const on_close = vi.fn();
    const { container } = render(ContextMenu, {
      props: { embedded: true, open: true, target_name: "Lord Benedict Silvers", portrait_src: "https://example.com/silvers.png", actions: [], on_close },
    });

    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("https://example.com/silvers.png");
    expect(container.textContent).toContain("Lord Benedict Silvers");
    expect(container.textContent).toContain("No actions available");
  });

  it("marks outside pointerdown defaultPrevented when dismissing standalone ContextMenu and ignores button 2", async () => {
    render(ContextMenu, { props: { open: true, epoch: claim_menu(), x: 100, y: 100, target_name: "Hank", actions: [] } });
    expect(document.body.querySelector('[role="menu"]')).toBeTruthy();

    await fireEvent.pointerDown(document.body, { button: 2 });
    expect(document.body.querySelector('[role="menu"]')).toBeTruthy();

    const outside_event = new PointerEvent("pointerdown", { bubbles: true, cancelable: true, button: 0 });
    document.body.dispatchEvent(outside_event);
    await new Promise((r) => setTimeout(r, 0));

    expect(outside_event.defaultPrevented).toBe(true);
    expect(document.body.querySelector('[role="menu"]')).toBeNull();
  });

  it("enforces global 1-tooltip rule and suppresses hover tooltips when suppressed", () => {
    const el1 = document.createElement("button");
    const el2 = document.createElement("button");
    document.body.append(el1, el2);

    const a1 = tooltip(el1, { text: "First", delay: 0 });
    const a2 = tooltip(el2, { text: "Second", delay: 0 });

    el1.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 10, clientY: 10 }));
    expect(tooltip_state.active).toBe(true);
    expect(tooltip_state.text).toBe("First");
    expect(tooltip_state.target).toBe(el1);

    el2.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 20, clientY: 20 }));
    expect(tooltip_state.active).toBe(true);
    expect(tooltip_state.text).toBe("Second");
    expect(tooltip_state.target).toBe(el2);

    set_tooltip_suppressed(true);
    expect(tooltip_state.active).toBe(false);

    el1.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 10, clientY: 10 }));
    expect(tooltip_state.active).toBe(false);

    set_tooltip_suppressed(false);
    a1.destroy();
    a2.destroy();
    el1.remove();
    el2.remove();
  });
});

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-10-14: Atom 3.5 - Added unit tests for 360° Relational Dossier card,
 *   4-quadrant state inspection, Omniscient Observer Mode epistemic lock, and
 *   card dismiss/open-profile interactions.
 * - 2026-10-04: Graph-only split - removed edge-deletion test with the retired
 *   bond-card editor; suite covers constellation rendering, bracket harvesting,
 *   and satellite-node selection.
 * - 2026-10-01: Universal Predicates Migration - updated test suite to drive
 *   constellation nodes 100% through universal bracket predicates.
 * - 2026-09-29: Added unit test verifying universal bracket relationship harvesting into constellation satellite nodes.
 * ============================================================================
 */
