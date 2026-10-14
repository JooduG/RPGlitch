import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import RelationalGraph from "./RelationalGraph.svelte";

vi.mock("@data", async (importOriginal) => {
  const actual = await importOriginal();
  const mock_list = [
    {
      id: "silvers",
      name: "Lord Benedict Silvers",
      type: "character",
      signature_color: "Crimson Red",
      present: {
        non_physical: "[@HANK: custom pyrotechnics]",
      },
    },
    {
      id: "hank",
      name: "Hank",
      type: "character",
      signature_color: "Rusty Orange",
      present: {
        non_physical: "[@LORD_BENEDICT_SILVERS: arms supplier debt]",
      },
    },
    { id: "julien", name: "Julien", type: "character", signature_color: "Soft Rose", present: { non_physical: "" } },
  ];
  return {
    ...actual,
    entities: {
      ...actual.entities,
      list: vi.fn(async (type) => (type === "character" ? mock_list : [])),
    },
  };
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
      present: {
        non_physical: "[@LORD_BENEDICT_SILVERS: arms supplier debt]",
      },
    };

    const on_select_entity = vi.fn();
    render(RelationalGraph, { props: { entity: mock_entity, on_select_entity } });

    // Center node
    expect(await screen.findByText("Hank")).toBeTruthy();
    // Satellite node
    expect(await screen.findByText("Lord Benedict Silvers")).toBeTruthy();
  });

  it("allows selecting a satellite node to trigger on_select_entity callback", async () => {
    const mock_entity = {
      id: "hank",
      name: "Hank",
      type: "character",
      signature_color: "Rusty Orange",
      present: {
        non_physical: "[@LORD_BENEDICT_SILVERS: arms supplier debt]",
      },
    };

    const on_select_entity = vi.fn();
    render(RelationalGraph, { props: { entity: mock_entity, on_select_entity } });

    const satellite_btn = await screen.findByRole("button", { name: /Lord Benedict Silvers/i });
    await fireEvent.click(satellite_btn);

    // Clicking satellite opens 360 dossier card
    const dossier = await screen.findByTestId("relational-dossier-card");
    expect(dossier).toBeTruthy();

    const open_profile_btn = await screen.findByRole("button", { name: /open full profile/i });
    await fireEvent.click(open_profile_btn);

    expect(on_select_entity).toHaveBeenCalledWith(expect.objectContaining({ id: "silvers", name: "Lord Benedict Silvers" }));
  });

  it("renders constellation nodes derived from universal bracket predicates in present.non_physical", async () => {
    const mock_entity = {
      id: "silvers",
      name: "Lord Benedict Silvers",
      type: "character",
      present: {
        non_physical: "[@HANK: arms supplier debt | w: 8]",
      },
    };

    render(RelationalGraph, { props: { entity: mock_entity } });

    // Center node
    expect(await screen.findByText("Lord Benedict Silvers")).toBeTruthy();
    // Satellite node harvested from bracket
    expect(await screen.findByText("Hank")).toBeTruthy();
  });

  it("opens 360° relational dossier showing 4 quadrants and epistemic lock for hidden brackets", async () => {
    const mock_entity = {
      id: "silvers",
      name: "Lord Benedict Silvers",
      type: "character",
      eternal: { physical: "Scarred hands", non_physical: "Former military officer" },
      present: {
        non_physical: "[@HANK: secret arms smuggling | hide | w: 9]",
      },
      past: ["Survived the Siege of Erebos"],
      future: "Secure a monopoly on munitions",
    };

    render(RelationalGraph, { props: { entity: mock_entity } });

    const center_node = await screen.findByRole("button", { name: /inspect central entity/i });
    await fireEvent.click(center_node);

    const dossier = await screen.findByTestId("relational-dossier-card");
    expect(dossier).toBeTruthy();
    expect(screen.getByText(/@SILVERS/i)).toBeTruthy();

    // 4 quadrants
    expect(screen.getByText(/Former military officer/i)).toBeTruthy();
    expect(screen.getByText(/secret arms smuggling/i)).toBeTruthy();
    expect(screen.getByText(/Survived the Siege of Erebos/i)).toBeTruthy();
    expect(screen.getByText(/Secure a monopoly on munitions/i)).toBeTruthy();

    // Omniscient Observer Mode: secret / epistemic lock indicator displayed
    expect(screen.getByText(/epistemic lock/i)).toBeTruthy();

    // Close button dismisses dossier
    const close_btn = screen.getByRole("button", { name: /close dossier/i });
    await fireEvent.click(close_btn);
    expect(screen.queryByTestId("relational-dossier-card")).toBeNull();
  });
});

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-10-14: Atom 3.5 — Added unit tests for 360° Relational Dossier card,
 *   4-quadrant state inspection, Omniscient Observer Mode epistemic lock, and
 *   card dismiss/open-profile interactions.
 * - 2026-10-04: Graph-only split — removed edge-deletion test with the retired
 *   bond-card editor; suite covers constellation rendering, bracket harvesting,
 *   and satellite-node selection.
 * - 2026-10-01: Universal Predicates Migration — updated test suite to drive
 *   constellation nodes 100% through universal bracket predicates.
 * - 2026-09-29: Added unit test verifying universal bracket relationship harvesting into constellation satellite nodes.
 * ============================================================================
 */
