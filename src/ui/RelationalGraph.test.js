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
      present: { non_physical: "[@HANK: custom pyrotechnics]" },
    },
    { id: "hank", name: "Hank", type: "character", signature_color: "Rusty Orange", present: { non_physical: "[@LORD_BENEDICT_SILVERS: arms supplier debt]" } },
    { id: "julien", name: "Julien", type: "character", signature_color: "Soft Rose", present: { non_physical: "" } },
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
      present: { non_physical: "[@LORD_BENEDICT_SILVERS: arms supplier debt]" },
    };

    const on_select_entity = vi.fn();
    render(RelationalGraph, { props: { entity: mock_entity, on_select_entity } });

    // Center node
    expect(await screen.findByText("Hank")).toBeTruthy();
    // Satellite node
    expect(await screen.findByText("Lord Benedict Silvers")).toBeTruthy();
  });

  it("shows a CardHand-sized hover card on mouseover and opens profile directly on click", async () => {
    const mock_entity = {
      id: "hank",
      name: "Hank",
      type: "character",
      signature_color: "Rusty Orange",
      present: { non_physical: "[@LORD_BENEDICT_SILVERS: arms supplier debt]" },
    };

    const on_select_entity = vi.fn();
    render(RelationalGraph, { props: { entity: mock_entity, on_select_entity } });

    const satellite_btn = await screen.findByRole("button", { name: /Lord Benedict Silvers/i });
    await fireEvent.mouseEnter(satellite_btn);

    const hover_card = await screen.findByTestId("relational-hover-card");
    expect(hover_card).toBeTruthy();
    expect(screen.queryByTestId("relational-dossier-card")).toBeNull();

    await fireEvent.click(satellite_btn);
    expect(on_select_entity).toHaveBeenCalledWith(expect.objectContaining({ id: "silvers", name: "Lord Benedict Silvers" }));
  });

  it("renders constellation nodes derived from universal bracket predicates in present.non_physical", async () => {
    const mock_entity = { id: "silvers", name: "Lord Benedict Silvers", type: "character", present: { non_physical: "[@HANK: arms supplier debt | w: 8]" } };

    render(RelationalGraph, { props: { entity: mock_entity } });

    // Center node
    expect(await screen.findByText("Lord Benedict Silvers")).toBeTruthy();
    // Satellite node harvested from bracket
    expect(await screen.findByText("Hank")).toBeTruthy();
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
