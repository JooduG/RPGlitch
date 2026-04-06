/**
 * @file swarm-engine.d.ts
 * Type declarations for the JavaScript SwarmEngine module.
 * Provides TypeScript consumers with a fully-typed interface so that
 * importing scripts require no 'as any' casts or 'unknown' annotations.
 */

export interface SwarmTask {
  id: string;
  prompt?: string;
  instructions?: string;
  files?: string[];
  new_files?: string[];
  test_files?: string[];
  target_files?: string[];
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

export declare class SwarmEngine {
  get tasks(): SwarmTask[];
  get processed_count(): number;
  get active_agent_count(): number;
  get errors(): SwarmError[];
  get progress(): number;
  get is_complete(): boolean;
  get confidence_score(): number;

  dispatch_manifest(manifest: SwarmTask[], options?: DispatchOptions): Promise<DispatchResult>;
  parse_markdown_manifest(content: string): Promise<SwarmTask[]>;
  query(queryObj: Record<string, unknown>): Promise<unknown[]>;
  logStream(session: unknown, handlers?: Record<string, (data: unknown) => void>): Promise<void>;

  static bootstrap(args: string[]): Promise<void>;
  static show_meta(flags?: { agent: boolean }): void;
}

export declare const swarm: SwarmEngine;
