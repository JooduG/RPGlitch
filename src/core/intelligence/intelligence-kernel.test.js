import { describe, expect, it, vi, beforeEach } from "vitest";
import { gamemaster } from "./intelligence-kernel.js";
import { context_broker } from "./context-broker.js";
import { prompt_builder } from "./prompt-builder.js";
import { llm_service } from "./llm-service.js";

// Mock dependencies
vi.mock("./context-broker.js", () => ({
  context_broker: {
    hydrate: vi.fn(),
  },
}));

vi.mock("./prompt-builder.js", () => ({
  prompt_builder: {
    synthesize: vi.fn(),
    build_epilogue: vi.fn(),
    render_history: vi.fn(),
    render_protocols: vi.fn(),
  },
}));

vi.mock("./llm-service.js", () => ({
  llm_service: {
    generate: vi.fn(),
  },
}));

vi.mock("@core/engine/session-driver.svelte.js", () => ({
  session_driver: {
    load_log: vi.fn().mockResolvedValue([]),
    log_turn: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@state/runtime.svelte.js", () => ({
  runtime: {
    active_ai: { name: "Viper" },
    active_fractal: { name: "Void" },
    round: 1,
    turn_type: "USER_TURN",
    add_vector: vi.fn(),
  },
}));

vi.mock("@state/app.svelte.js", () => ({
  app: {
    log: vi.fn(),
  },
}));

vi.mock("./vector-engine.js", () => ({
  vector_engine: {
    ensure_momentum: vi.fn(),
  },
}));

vi.mock("./memory-engine.js", () => ({
  memory_engine: {
    consolidate: vi.fn(),
  },
}));

describe("gamemaster (Intelligence Kernel)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("execute_turn() coordinates hydration, synthesis, and generation", async () => {
    // Provide a full mock payload to satisfy TS/Lint
    const mockPayload = {
      input: "Hello",
      type: "simulation",
      round: 1,
      entities: {
        AI: { name: "Viper" },
        USER: { name: "Ghost" },
        FRACTAL: { name: "Void" },
      },
      simulation_log: "",
      rawMessages: [],
      meta: { active_vector: null, timestamp: new Date().toISOString() },
    };

    vi.mocked(context_broker.hydrate).mockResolvedValue(mockPayload);
    vi.mocked(prompt_builder.synthesize).mockReturnValue({
      system: "PROMPT",
      meta: { ai: {}, fractal: {}, flags: {}, signal_prompts: [] },
    });
    vi.mocked(llm_service.generate).mockResolvedValue("Identified.");

    const result = await gamemaster.execute_turn("story-123", {
      input: "Hello",
      role: "ai",
    });

    expect(context_broker.hydrate).toHaveBeenCalled();
    expect(prompt_builder.synthesize).toHaveBeenCalled();
    expect(llm_service.generate).toHaveBeenCalled();
    expect(result.response).toBe("Identified.");
  });

  it("execute_epilogue() executes a targeted epilogue completion", async () => {
    vi.mocked(prompt_builder.build_epilogue).mockReturnValue({ system: "EPILOGUE", messages: [] });
    vi.mocked(llm_service.generate).mockResolvedValue("And so it ends.");

    const result = await gamemaster.execute_epilogue("story-123");

    expect(prompt_builder.build_epilogue).toHaveBeenCalled();
    expect(llm_service.generate).toHaveBeenCalled();
    expect(result).toBe("And so it ends.");
  });
});
