/**
 * @file swarm-types.ts
 * Shared type definitions for the SwarmEngine and its automation pipeline.
 */

export interface InputTask {
  id: string;
  prompt?: string;
  instructions?: string;
  files?: string[];
  new_files?: string[];
  test_files?: string[];
  target_files?: string[];
}

export interface SwarmTask extends InputTask {
  status: "pending" | "executing" | "completed" | "failed";
  sessionId?: string;
  score: number;
  rationale: string | null;
  result: string | null;
  error: string | null;
}

export interface SwarmError {
  taskId?: string;
  message: string;
}

export interface DispatchResult {
  success: boolean;
  score: number;
  results: SwarmTask[];
}

export interface DispatchOptions {
  max_concurrency?: number;
  stop_on_error?: boolean;
  base_branch?: string;
  repo_full_name?: string;
  delay_ms?: number;
}
