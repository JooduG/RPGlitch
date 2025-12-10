/**
 * A simple Event Bus to decouple UI components from the Data Layer.
 * Extends EventTarget for native event handling capabilities.
 */
export class GlobalEventBus extends EventTarget {}

export const events = new GlobalEventBus();

export const EVENTS = {
  STATE_CHANGED: "state:changed",
  DB_UPDATED: "db:updated",
  TURN_COMPLETED: "turn:completed",
  STORY_LOADED: "story:loaded",
};
