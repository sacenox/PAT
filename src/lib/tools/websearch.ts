/* personal-assistant-thing/src/lib/ollama/tools/websearch.ts */

import { google } from "googleapis";
import { getCache, setCache } from "@/src/lib/cache";
import { createRateLimiter } from "@/src/lib/ratelimit";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const webSearchRateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  identifier: "websearch",
});

/**
 * Performs web search via Google Custom Search API. Results cached 6h.
 */
export async function queryWebSearch(query: string): Promise<string> {
  // Check cache first
  const cacheKey = `websearch:${query.toLowerCase().trim()}`;
  const cached = await getCache<string>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    throw new Error("Service unavailable");
  }

  const rateLimitCheck = await webSearchRateLimiter.check();
  if (!rateLimitCheck.allowed) {
    throw new Error("Service temporarily unavailable");
  }

  await webSearchRateLimiter.increment();

  const customsearch = google.customsearch("v1");
  const res = await customsearch.cse.list({
    cx: cx,
    q: query,
    auth: apiKey,
  });

  if (!res.data.items || res.data.items.length === 0) {
    const result = `No results for: ${query}`;
    await setCache(cacheKey, result, CACHE_TTL_MS);
    return result;
  }

  const results = res.data.items
    .slice(0, 5)
    .map((item) => {
      const parts: string[] = [];
      if (item.title) parts.push(item.title);
      if (item.snippet) parts.push(item.snippet);
      if (item.link) parts.push(`(${item.link})`);
      return parts.join(" | ");
    })
    .join("\n");

  await setCache(cacheKey, results, CACHE_TTL_MS);
  return results;
}

export const webSearchTool = {
  type: "function" as const,
  function: {
    name: "query_web_search",
    description: "Search the web for current info, news, articles, or any content.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
      },
      required: ["query"],
    },
  },
};
