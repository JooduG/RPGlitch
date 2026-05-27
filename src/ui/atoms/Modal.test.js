// Polyfill Element.animate for JSDOM
if (!Element.prototype.animate) {
  Element.prototype.animate = function () {
    /** @type {any} */
    const animation = {
      cancel: () => {},
      pause: () => {},
      play: () => {},
      reverse: () => {},
      finish: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      currentTime: 0,
      effect: null,
      id: "",
      oncancel: null,
      onfinish: null,
      onremove: null,
      playbackRate: 1,
      ready: Promise.resolve(),
      startTime: 0,
      timeline: null,
      pending: false,
      playState: "finished",
      replaceState: "active",
      commitStyles: () => {},
      updatePlaybackRate: () => {},
      persist: () => {},
      dispatchEvent: (/** @type {any} */) => true,
      finished: null,
    };
    animation.finished = Promise.resolve(animation);
    return animation;
  };
}
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import { test, expect, vi, describe, afterEach } from "vitest";
import ModalTestWrapper from "@/tests/ModalTestWrapper.svelte";
describe("Modal.svelte", () => {
  afterEach(() => {
    cleanup();
  });
  test("variant-profile modal correctly passes clicks to modal-layout when clicking outside content", async () => {
    const on_close = vi.fn();
    render(ModalTestWrapper, {
      on_close,
      variant: "profile",
    });
    // Find the backdrop which handles external clicks (in the portal)
    const backdrop = document.querySelector(".root");
    expect(backdrop).toBeTruthy();
    // Simulate click on the backdrop
    await fireEvent.click(/** @type {any} */ (backdrop));
    // Ensure on_close was called
    expect(on_close).toHaveBeenCalledTimes(1);
  });
  test("variant-profile modal closes when clicking explicitly on .modal background itself", async () => {
    const on_close = vi.fn();
    render(ModalTestWrapper, {
      on_close,
      variant: "profile",
    });

    // Find the modal content element
    const modalContent = document.querySelector(".root.profile");
    expect(modalContent).toBeTruthy();
    // Find the backdrop
    const backdrop = document.querySelector(".root");
    expect(backdrop).toBeTruthy();
    // Clicking the backdrop should trigger on_close
    await fireEvent.click(/** @type {any} */ (backdrop));
    // Ensure on_close was called
    expect(on_close).toHaveBeenCalledTimes(1);
  });
  test("variant-profile modal does not close when clicking on its content", async () => {
    const on_close = vi.fn();
    const { getByTestId } = render(ModalTestWrapper, {
      on_close,
      variant: "profile",
    });
    const content = getByTestId("modal-content");
    await fireEvent.click(content);
    expect(on_close).not.toHaveBeenCalled();
  });
});
