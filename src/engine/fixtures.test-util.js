/**
 * src/engine/fixtures.test-util.js
 * ============================================================================
 * 📜 CANONICAL ENGINE TEST FIXTURES
 * ============================================================================
 *
 * Deterministic entity, dynamics, and history fixtures for engine unit tests.
 * ============================================================================
 */

export function create_contract_fixtures() {
  const entities = {
    AI: {
      id: "ALICE",
      name: "Alice",
      type: "character",
      pov: "1st_person",
      eternal: { physical: "[BUILD: tall and athletic]", non_physical: "Analytical cybernetic specialist." },
      present: { physical: "[JACKET: worn leather] [POSTURE: alert]", non_physical: "Guarded vigilance. [@BOB: guarded trust]" },
      future: "Infiltrate the mainframe.",
      past: [],
      dynamics: { chaos: 30, intensity: 70, openness: 40, affinity: 20 },
    },
    USER: {
      id: "BOB",
      name: "Bob",
      type: "character",
      pov: "1st_person",
      eternal: { physical: "[BUILD: broad shoulders]", non_physical: "Veteran decker." },
      present: { physical: "[COAT: dark trench coat]", non_physical: "Patient. [@ALICE: protective ally]" },
      future: "Provide tactical cover.",
      past: [],
      dynamics: { chaos: 20, intensity: 50, openness: 60, affinity: 70 },
    },
    FRACTAL: {
      id: "SECTOR_FOUR",
      name: "Sector Four",
      type: "fractal",
      eternal: { physical: "[LANDMARKS: rusted catwalks] [ATMOSPHERE: neon haze]", non_physical: "Degraded industrial district." },
      present: { physical: "[WEATHER: acid drizzle]", non_physical: "Hostile and oppressive." },
      future: "Decay under acid rain.",
      past: [],
      dynamics: { velocity: 50, entropy: 80 },
    },
  };

  const npc = {
    id: "MERCHANT",
    name: "Merchant",
    type: "npc",
    pov: "1st_person",
    eternal: { physical: "[BUILD: stooped]", non_physical: "Scavenger." },
    present: { physical: "[CLOTHING: rags]", non_physical: "Suspicious. [@ALICE: wary curiosity]" },
    future: "Survive.",
    past: [],
    dynamics: { chaos: 15, intensity: 25, openness: 15, affinity: 10 },
  };

  const snapshot = { ai: { dynamics: entities.AI.dynamics }, fractal: { dynamics: entities.FRACTAL.dynamics }, flags: {} };
  const history = [
    { role: "user", text: "We move at dawn." },
    { role: "ai", text: "Alice nods." },
  ];

  return { entities, npc, snapshot, history };
}
