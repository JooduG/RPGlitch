import { tooltip_state } from "@primitives";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EntityCard from "./EntityCard.svelte";
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
      { key: "DEBT", value: "@SILVERS arms supplier debt", is_hidden: false },
      { key: "RIVALRY", value: "@SILVERS bitter orbital rivalry", is_hidden: false },
      { key: "OLD_PACT", value: "@SILVERS forged scrap deal", is_hidden: false },
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
    expect(container.textContent).toContain("RIVALRY");
    expect(container.textContent).toContain("OLD_PACT");
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
    expect(tooltip_state.bracket_items).toEqual([{ key: "PYRO", value: "@HANK custom pyrotechnics", is_hidden: true }]);

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
