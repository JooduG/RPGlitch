export { app, register_image_preview_handlers } from "./app.svelte.js";
export { runtime } from "./runtime.svelte.js";
export { simulationState, uiState } from "./status.svelte.js";
export { simulation_log } from "./log.svelte.js";
export {
  imageRegenerate,
  startRegenerate,
  deliverCandidates,
  openPicker,
  selectCandidate,
  closeRegenerate,
  setRegenerateError,
  closePicker,
  getPersistedMeta,
} from "./image-regenerate.svelte.js";

import { register_state_accessors, register_stream_handlers } from "@utils";
import { session_driver } from "@engine";
import { app } from "./app.svelte.js";
import { runtime } from "./runtime.svelte.js";
import { simulationState } from "./status.svelte.js";
import { simulation_log } from "./log.svelte.js";

register_state_accessors({ app, runtime, simulationState, simulation_log, session_driver });
register_stream_handlers({
  start: (id, role) => app.start_stream(id, role),
  update: (chunk) => app.update_stream(chunk),
  end: () => app.end_stream(),
  error: (nodeId) => app.signal_stream_error(nodeId),
  is_active: () => app.streaming.active,
});
