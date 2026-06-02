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
import { mount, unmount } from "svelte";
import { test, expect, vi, describe, afterEach } from "vitest";
import { tick } from "svelte";
import ModalTestWrapper from "@/tests/ModalTestWrapper.svelte";

describe("Modal.svelte", () => {
  /** @type {any} */
  let component;

  afterEach(() => {
    if (component) {
      unmount(component);
      component = undefined;
    }
    document.body.innerHTML = "";
  });

  test("variant-profile modal correctly passes clicks to modal-layout when clicking outside content", async () => {
    const on_close = vi.fn();
    component = mount(ModalTestWrapper, {
      target: document.body,
      props: { on_close, variant: "profile" },
    });
    await tick();
    await tick();

    // Find the backdrop which handles external clicks (in the portal)
    const backdrop = document.querySelector(".root");
    expect(backdrop).toBeTruthy();

    // Simulate click on the backdrop
    backdrop?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await tick();

    // Ensure on_close was called
    expect(on_close).toHaveBeenCalledTimes(1);
  });

  test("variant-profile modal closes when clicking explicitly on .modal background itself", async () => {
    const on_close = vi.fn();
    component = mount(ModalTestWrapper, {
      target: document.body,
      props: { on_close, variant: "profile" },
    });
    await tick();
    await tick();

    // Find the modal content element
    const modalContent = document.querySelector(".root.profile");
    expect(modalContent).toBeTruthy();

    // Find the backdrop
    const backdrop = document.querySelector(".root");
    expect(backdrop).toBeTruthy();

    // Clicking the backdrop should trigger on_close
    backdrop?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await tick();

    // Ensure on_close was called
    expect(on_close).toHaveBeenCalledTimes(1);
  });

  test("variant-profile modal does not close when clicking on its content", async () => {
    const on_close = vi.fn();
    component = mount(ModalTestWrapper, {
      target: document.body,
      props: { on_close, variant: "profile" },
    });
    await tick();
    await tick();

    const content = document.querySelector('[data-testid="modal-content"]');
    expect(content).toBeTruthy();

    content?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await tick();

    expect(on_close).not.toHaveBeenCalled();
  });
});
