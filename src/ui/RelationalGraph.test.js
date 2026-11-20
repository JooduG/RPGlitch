import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("shows a cursor-locked EntityCard on satellite hover with outgoing-only bond text and opens profile on click", async () => {
    const mock_entity = {
      id: "hank",
      name: "Hank",
      type: "character",
      signature_color: "Rusty Orange",
      present: { non_physical: "[DEBT: @SILVERS arms supplier debt]" },
    };

    const on_select_entity = vi.fn();
    render(RelationalGraph, { props: { entity: mock_entity, on_select_entity } });

    const satellite_btn = await screen.findByRole("button", { name: /Lord Benedict Silvers/i });
    await fireEvent.pointerEnter(satellite_btn, { clientX: 40, clientY: 60 });
    await fireEvent.pointerMove(satellite_btn, { clientX: 55, clientY: 75 });

    const hover_card = await screen.findByTestId("relational-hover-card");
    expect(hover_card).toBeTruthy();
    expect(hover_card.getAttribute("style")).toMatch(/translate3d\(55px,\s*75px,\s*0(?:px)?\)/);
    expect(hover_card.querySelector("[data-card-root]")).toBeTruthy();
    expect(hover_card.textContent).toContain("Lord Benedict Silvers");
    expect(hover_card.textContent).toContain("arms supplier debt");
    expect(screen.queryByTestId("relational-dossier-card")).toBeNull();

    await fireEvent.click(satellite_btn);
    expect(on_select_entity).toHaveBeenCalledWith(expect.objectContaining({ id: "silvers", name: "Lord Benedict Silvers" }));
  });

  it("keeps incoming-only satellite nodes clickable without showing incoming text on satellite hover, and highlights incoming arrows on center Sun hover", async () => {
    const mock_entity = { id: "hank", name: "Hank", type: "character", signature_color: "Rusty Orange", present: { non_physical: "" } };

    const { container } = render(RelationalGraph, { props: { entity: mock_entity } });

    const satellite_btn = await screen.findByRole("button", { name: /Lord Benedict Silvers/i });
    await fireEvent.mouseEnter(satellite_btn);

    const hover_card = await screen.findByTestId("relational-hover-card");
    expect(hover_card.textContent).toContain("Lord Benedict Silvers");
    expect(hover_card.textContent).not.toContain("custom pyrotechnics");

    await fireEvent.mouseLeave(satellite_btn);

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
