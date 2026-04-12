/**
 * @file swarm-engine.d.ts
 * Type declarations for the JavaScript SwarmEngine module.
 * Provides TypeScript consumers with a fully-typed interface so that
 * importing scripts require no 'as any' casts or 'unknown' annotations.
 */

import {
  SwarmTask,
  SwarmError,
  DispatchResult,
  DispatchOptions,
  InputTask,
  StreamHandlers,
} from "./swarm-types.js";

export declare class SwarmEngine {
  get tasks(): SwarmTask[];
  get processed_count(): number;
  get active_agent_count(): number;
  get errors(): SwarmError[];
  get progress(): number;
  get is_complete(): boolean;
  get confidence_score(): number;

  dispatch_manifest(
    manifest: (SwarmTask | InputTask)[],
    options?: DispatchOptions,
  ): Promise<DispatchResult>;
  parse_markdown_manifest(content: string): Promise<SwarmTask[]>;
  query(queryObj: Record<string, unknown>): Promise<unknown[]>;
  logStream(session: any, handlers?: StreamHandlers): Promise<void>;

  static bootstrap(args: string[]): Promise<void>;
  static show_meta(flags?: { agent: boolean }): void;
}

export declare const swarm: SwarmEngine;
