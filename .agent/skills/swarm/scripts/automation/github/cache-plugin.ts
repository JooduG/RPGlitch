// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { Octokit } from "@octokit/core";
import type { RequestOptions, OctokitResponse } from "@octokit/types";

/**
 * Octokit plugin that caches responses using GitHub's ETag mechanism.
 * 304 Not Modified responses don't count against your rate limit.
 */
export function cachePlugin(octokit: Octokit) {
  const cache = new Map<string, { etag: string; data: unknown }>();

  octokit.hook.wrap("request", async (request, options: RequestOptions) => {
    const key = `${options.method} ${options.url}`;
    const cached = cache.get(key);

    if (cached) {
      options.headers = {
        ...options.headers,
        "if-none-match": cached.etag,
      };
    }

    try {
      const response = (await request(options)) as OctokitResponse<unknown>;
      const etag = response.headers.etag as string | undefined;
      if (etag) {
        cache.set(key, { etag, data: response.data });
      }
      return response;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 304 &&
        cached
      ) {
        return {
          ...(error as { response: OctokitResponse<unknown> }).response,
          data: cached.data,
          status: 200,
        };
      }
      throw error;
    }
  });
}
