import { cleanup, render, screen } from "@testing-library/svelte"
import { describe, expect, it } from "vitest"
import Trivial from "./Trivial.svelte"

describe("Trivial Component", () => {
    it("renders correctly", () => {
        cleanup()
        render(Trivial, { name: "Vitest" })
        expect(screen.getByText("Hello Vitest")).toBeDefined()
    })
})
