/**
 * @typedef {import('svelte/action').Action} Action
 * @typedef {Action & { is_kinetic?: boolean }} KineticAction
 * @typedef {import('svelte/action').ActionReturn} ActionReturn
 */

/**
 * @file use-actions.js
 * 🔗 UNIVERSAL ACTION BRIDGE
 * Orchestrates multiple Svelte actions on a single node with Map-based reconciliation.
 * Now detects kinetic actions to enable CSS-based transition stabilization.
 *
 * @param {HTMLElement} node
 * @param {Array<KineticAction | [KineticAction, any] | null | undefined>} actions - Array of actions or [action, params] tuples.
 */
export function use_actions(node, actions) {
  /** @type {Map<KineticAction, ActionReturn | void | undefined>} */
  let instances = new Map();

  /**
   * @param {Array<KineticAction | [KineticAction, any] | null | undefined>} new_actions
   */
  function update(new_actions) {
    /** @type {Map<KineticAction, ActionReturn | void | undefined>} */
    const next_instances = new Map();
    let has_kinetic = false;

    new_actions.forEach((item) => {
      if (!item) return;

      /** @type {KineticAction} */
      let action;
      /** @type {any} */
      let params;

      if (Array.isArray(item)) {
        [action, params] = item;
      } else {
        action = item;
        params = undefined;
      }

      if (!action) return;

      // Detect kinetic actions for CSS stabilization
      if (action.is_kinetic) has_kinetic = true;

      const existing = instances.get(action);

      if (existing) {
        existing.update?.(params);
        next_instances.set(action, existing);
        instances.delete(action);
      } else {
        next_instances.set(action, action(node, params));
      }
    });

    // Apply kinetic signaling for CSS
    if (has_kinetic) node.setAttribute("data-kinetic", "true");
    else node.removeAttribute("data-kinetic");

    // Cleanup removed actions
    instances.forEach((result) => result?.destroy?.());
    instances = next_instances;
  }

  update(actions);

  return {
    update,
    destroy: () => instances.forEach((result) => result?.destroy?.()),
  };
}
