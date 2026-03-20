// Polyfill Element.animate for JSDOM
if (!Element.prototype.animate) {
    Element.prototype.animate = function() {
        return {
            finished: Promise.resolve(),
            cancel: () => {},
            pause: () => {},
            play: () => {},
            reverse: () => {},
            finish: () => {},
            addEventListener: () => {},
            removeEventListener: () => {}
        };
    };
}
import { render, fireEvent, cleanup } from "@testing-library/svelte"
import { test, expect, vi, describe, afterEach } from "vitest"
import Modal from "./Modal.svelte"

import ModalTestWrapper from "./ModalTestWrapper.svelte"

describe("Modal.svelte", () => {
    afterEach(() => {
        cleanup()
    })

    test("variant-profile modal correctly passes clicks to modal-layout when clicking outside content", async () => {
        const on_close = vi.fn()

        const { container } = render(Modal, {
            on_close,
            variant: "profile",
        })

        // Find the outer layout which acts as the backdrop
        const layout = container.querySelector(".modal-layout")
        expect(layout).toBeTruthy()

        // Simulate click on the layout (which would be blocked if min-height: 100% was on .modal)
        await fireEvent.click(layout)

        // Ensure on_close was called
        expect(on_close).toHaveBeenCalledTimes(1)
    })

    test("variant-profile modal closes when clicking explicitly on .modal background itself", async () => {
        const on_close = vi.fn()

        const { container } = render(Modal, {
            on_close,
            variant: "profile",
        })

        // Find the modal element
        const modal = container.querySelector(".modal.variant-profile")
        expect(modal).toBeTruthy()

        // Simulate click on the empty space of the modal container
        await fireEvent.click(modal)

        // Ensure on_close was called
        expect(on_close).toHaveBeenCalledTimes(1)
    })

    test("variant-profile modal does not close when clicking on its content", async () => {
        const on_close = vi.fn()

        const { getByTestId } = render(ModalTestWrapper, {
            on_close,
            variant: "profile"
        })

        const content = getByTestId("modal-content")
        await fireEvent.click(content)

        expect(on_close).not.toHaveBeenCalled()
    })
})
