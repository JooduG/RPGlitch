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
      relationships: ["Lord Benedict Silvers → Hank: custom pyrotechnics"],
    },
    {
      id: "hank",
      name: "Hank",
      type: "character",
      signature_color: "Rusty Orange",
      relationships: ["Hank → Lord Benedict Silvers: arms supplier debt"],
    },
    { id: "julien", name: "Julien", type: "character", signature_color: "Soft Rose", relationships: [] },
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
      relationships: ["Hank → Lord Benedict Silvers: arms supplier debt"],
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
      relationships: ["Hank → Lord Benedict Silvers: arms supplier debt"],
    };

    const on_select_entity = vi.fn();
    render(RelationalGraph, { props: { entity: mock_entity, on_select_entity } });

    const satellite_btn = await screen.findByRole("button", { name: /Lord Benedict Silvers/i });
    await fireEvent.click(satellite_btn);

    expect(on_select_entity).toHaveBeenCalledWith(expect.objectContaining({ id: "silvers", name: "Lord Benedict Silvers" }));
  });
});
