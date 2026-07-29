export { app, register_image_preview_handlers } from "./app.svelte.js";
export { runtime } from "./runtime.svelte.js";
export { simulation_state, ui_state } from "./status.svelte.js";
export { simulation_log } from "./log.svelte.js";

import { register_state_accessors, register_stream_handlers } from "@utils";
import { session_driver } from "@engine";
import { app } from "./app.svelte.js";
import { runtime } from "./runtime.svelte.js";
import { simulation_state } from "./status.svelte.js";
import { simulation_log } from "./log.svelte.js";

register_state_accessors({ app, runtime, simulation_state, simulation_log, session_driver });
register_stream_handlers({
  start: (id, role) => app.start_stream(id, role),
  update: (chunk) => app.update_stream(chunk),
  end: () => app.end_stream(),
  error: (node_id) => app.signal_stream_error(node_id),
  is_active: () => app.streaming.active,
});
