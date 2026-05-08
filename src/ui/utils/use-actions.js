/**
 * @typedef {import('svelte/action').Action} Action
 */

/**
 * @file use-actions.js
 * 🔗 UNIVERSAL ACTION BRIDGE
 * Orchestrates multiple Svelte actions on a single node with Map-based reconciliation.
 *
 * @param {HTMLElement} node
 * @param {Array<Action | [Action, any]>} actions - Array of actions or [action, params] tuples.
 */
export function use_actions(node, actions) {
  let instances = new Map();

  /**
   * @param {(import("svelte/action").Action<HTMLElement, undefined, any> | [import("svelte/action").Action<HTMLElement, undefined, any>, any])[] | [any, any][]} new_actions
   */
  function update(new_actions) {
    const next_instances = new Map();

    new_actions.forEach((item) => {
      if (!item) return;
      const [action, params] = Array.isArray(item) ? item : [item, undefined];
      const existing = instances.get(action);

      if (existing) {
        existing.update?.(params);
        next_instances.set(action, existing);
        instances.delete(action);
      } else {
        next_instances.set(action, action(node, params));
      }
    });

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
