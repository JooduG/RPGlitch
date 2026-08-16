/**
 * src/utils/job-queue.js
 * 🔀 DIRECTOR ASYNCHRONOUS JOB QUEUE — Parallel Background Workers
 * Concurrency engine for non-critical background work (Memory Forge, visual
 * prompt synthesis, Dexie checkpoints, ghost sweeps) that must never block the
 * critical narrative path or the UI.
 *
 * Semantics:
 *  - Worker Concurrency: up to `max_concurrency` tasks run in parallel while a
 *    caller may still serialize its own DB commits through `latest` tasks.
 *  - Latest-Pending: a `run(task, { latest: true })` call supersedes any older
 *    still-queued `latest` task — only the freshest snapshot executes; the
 *    superseded promise settles `{ superseded: true }` without running.
 *  - Error Isolation: a failing worker rejects only its own promise; the queue
 *    keeps draining, so one auxiliary failure never stalls the rest.
 */

export function create_job_queue(options = {}) {
  const max_concurrency = Math.max(1, Number(options?.max_concurrency) || 1);
  let active = 0;
  let sequence = 0;
  /** @type {{ task: () => Promise<any>, latest: boolean, superseded: boolean, seq: number, resolve: (value: any) => void, reject: (error: any) => void }[]} */
  const waiting = [];

  const _cleared = { cleared: true };
  const _superseded = { superseded: true };

  function _drain() {
    while (active < max_concurrency && waiting.length > 0) {
      const job = waiting.shift();
      if (job.superseded) {
        job.resolve(_superseded);
        continue;
      }
      active += 1;
      Promise.resolve()
        .then(() => job.task())
        .then(
          (value) => {
            active -= 1;
            job.resolve(value);
            _drain();
          },
          (error) => {
            active -= 1;
            job.reject(error);
            _drain();
          },
        );
    }
  }

  return {
    /**
     * Enqueue an async background task; resolves with its result.
     * @param {() => Promise<any>} task
     * @param {{ latest?: boolean }} [opts]
     * @returns {Promise<any>}
     */
    run(task, opts = {}) {
      return new Promise((resolve, reject) => {
        const job = {
          task,
          latest: !!opts?.latest,
          superseded: false,
          seq: ++sequence,
          resolve,
          reject,
        };
        if (job.latest) {
          for (let i = waiting.length - 1; i >= 0; i--) {
            if (waiting[i].latest) {
              waiting[i].superseded = true;
              break;
            }
          }
        }
        waiting.push(job);
        _drain();
      });
    },
    /**
     * True while any task is running or queued.
     * @returns {boolean}
     */
    is_busy() {
      return active > 0 || waiting.length > 0;
    },
    /**
     * Cancels all queued (not yet started) tasks; running workers finish
     * normally. Cancelled callers settle with `{ cleared: true }`.
     */
    clear() {
      const leftover = waiting.splice(0, waiting.length);
      for (const job of leftover) job.resolve(_cleared);
    },
  };
}
