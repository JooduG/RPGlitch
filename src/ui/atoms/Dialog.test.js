import { render } from "@testing-library/svelte";
import { expect, test, describe, vi } from "vitest";
import Dialog from "./Dialog.svelte";

describe("Dialog Atom (Headless AlertDialog)", () => {
  test("renders with default system alert layout", () => {
    const { getByText } = render(Dialog, {
      open: true,
      title: "Security Threat",
      message: "An illegal modification has been scanned.",
    });

    expect(getByText("Security Threat")).toBeDefined();
    expect(getByText("An illegal modification has been scanned.")).toBeDefined();
    expect(getByText("OK")).toBeDefined();
  });

  test("renders confirm configuration buttons and handles cancellation click", () => {
    const onCancel = vi.fn();
    const { getByText } = render(Dialog, {
      open: true,
      type: "confirm",
      title: "Wipe Memories",
      message: "Are you sure?",
      confirm_label: "Format Now",
      cancel_label: "Abort",
      on_cancel: onCancel,
    });

    expect(getByText("Wipe Memories")).toBeDefined();
    expect(getByText("Are you sure?")).toBeDefined();

    const cancelButton = getByText("Abort");
    expect(cancelButton).toBeDefined();
    cancelButton.click();

    expect(onCancel).toHaveBeenCalled();
  });

  test("handles confirmation trigger", () => {
    const onConfirm = vi.fn();
    const { getByText } = render(Dialog, {
      open: true,
      type: "confirm",
      title: "Initialize Boot Sequence",
      message: "Ready to proceed?",
      confirm_label: "Execute",
      on_confirm: onConfirm,
    });

    const confirmButton = getByText("Execute");
    expect(confirmButton).toBeDefined();
    confirmButton.click();

    expect(onConfirm).toHaveBeenCalled();
  });
});
