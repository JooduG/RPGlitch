describe("protocols.js - Track 3.4 AGENCY retirement", () => {
  it("does not define AGENCY in PROSE_DISCIPLINE under single-source Sovereignty", async () => {
    const { PROTOCOL_LIBRARY } = await import("./protocols.js");
    expect(PROTOCOL_LIBRARY.CORE_PROTOCOLS.PROSE_DISCIPLINE.AGENCY).toBeUndefined();
  });
});
