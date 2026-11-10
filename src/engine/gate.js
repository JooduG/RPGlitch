/**
 * src/engine/gate.js
 * ============================================================================
 * 🚦 GLOBAL LLM PRIORITY GATE: Serialized, Preemptible Generation Dispatch
 * ============================================================================
 *
 * Core Responsibilities:
 * - Enforces single in-flight Perchance text generation at a time.
 * - Priority scheduling: foreground (user-visible) turns outrank background work (caretaker/optics).
 * - Preemption: aborts active background work when foreground jobs queue.
 * - Telemetry: exposes queue status for watchdog and devmode.
 * ============================================================================
 */

import { TIMING_MS } from "@config";

export const LLM_PRIORITY = Object.freeze({
  FOREGROUND: 10,
  BACKGROUND: 1,
});

/** @type {any} */
let active_job = null;
/** @type {AbortController | null} */
let active_controller = null;
/** @type {number} */
let active_priority = 0;
/** @type {Array<any>} */
const waiting = [];
/** @type {number} */
let sequence = 0;

function release_slot(job) {
  if (active_job !== job) return;
  active_job = null;
  active_controller = null;
  active_priority = 0;
  pump();
}

function preempt_active() {
  const job = active_job;
  if (!job || !active_controller) return;
  try {
    active_controller.abort();
  } catch {
    /* Signal already aborted */
  }
  const controller = active_controller;
  setTimeout(() => {
    if (active_job === job && active_controller === controller) {
      release_slot(job);
    }
  }, TIMING_MS.INTERACTION);
}

function pump() {
  if (active_job) {
    const foreground_waiting = waiting.some((job) => job.priority >= LLM_PRIORITY.FOREGROUND);
    if (active_priority < LLM_PRIORITY.FOREGROUND && foreground_waiting) preempt_active();
    return;
  }

  if (waiting.length === 0) return;

  waiting.sort((a, b) => b.priority - a.priority || a.seq - b.seq);
  const job = waiting.shift();
  if (!job) return;

  const controller = new AbortController();
  active_job = job;
  active_controller = controller;
  active_priority = job.priority;

  Promise.resolve()
    .then(() => job.run(controller.signal))
    .then(
      (value) => {
        release_slot(job);
        job.resolve(value);
      },
      (error) => {
        release_slot(job);
        job.reject(error);
      },
    );
}

/**
 * Enqueues an LLM generation under the global gate.
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} run - Job body; abort `signal` on preemption.
 * @param {number} [priority=LLM_PRIORITY.FOREGROUND] - Scheduling priority.
 * @returns {Promise<T>}
 */
export function run_llm_job(run, priority = LLM_PRIORITY.FOREGROUND) {
  return new Promise((resolve, reject) => {
    waiting.push({ run, priority, seq: sequence++, resolve, reject });
    pump();
  });
}

/**
 * Maps a transport priority name to its gate constant (single home for the
 * foreground/background string boundary; model/transport layers speak lowercase).
 * @param {string} [priority_name] - "background" for background work, anything else foreground.
 * @returns {number} LLM_PRIORITY member.
 */
export function resolve_priority(priority_name) {
  return priority_name === "background" ? LLM_PRIORITY.BACKGROUND : LLM_PRIORITY.FOREGROUND;
}

/**
 * Reports gate telemetry for diagnostics and the freeze watchdog.
 * @returns {{ active: boolean, active_priority: number, queued: number, foreground_queued: number }}
 */
export function get_llm_gate_status() {
  return {
    active: active_job !== null,
    active_priority,
    queued: waiting.length,
    foreground_queued: waiting.filter((job) => job.priority >= LLM_PRIORITY.FOREGROUND).length,
  };
}

/**
 * Resets gate state (strictly for test suites).
 */
export function _reset_gate_for_testing() {
  active_job = null;
  active_controller = null;
  active_priority = 0;
  waiting.length = 0;
  sequence = 0;
}
