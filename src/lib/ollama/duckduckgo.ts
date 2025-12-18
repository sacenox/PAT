/* personal-assistant-thing/src/lib/ollama/duckduckgo.ts */

import { getCache, setCache } from "../cache";
import { createRateLimiter } from "../ratelimit";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const duckDuckGoRateLimiter = createRateLimiter({
  maxRequests: 500,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  identifier: "duckduckgo",
});

/**
 * Queries DuckDuckGo Instant Answer API. Results cached 6h.
 */
export async function queryDuckDuckGo(query: string): Promise<string> {
  // Check cache first
  const cacheKey = `duckduckgo:${query.toLowerCase().trim()}`;
  const cached = await getCache<string>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const rateLimitCheck = await duckDuckGoRateLimiter.check();
  if (!rateLimitCheck.allowed) {
    throw new Error("Service temporarily unavailable");
  }

  await duckDuckGoRateLimiter.increment();
  const url = "https://api.duckduckgo.com/";
  const params = new URLSearchParams({
    q: query,
    format: "json",
    no_html: "1",
    skip_disambig: "1",
  });

  const response = await fetch(`${url}?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Service error");
  }

  const data = await response.json();

  const parts: string[] = [];
  if (data.Answer) parts.push(data.Answer);
  if (data.AbstractText) parts.push(data.AbstractText);
  if (data.Definition) parts.push(data.Definition);
  if (data.Heading && !parts.length) parts.push(data.Heading);

  if (parts.length === 0) {
    const result = `No answer found for: ${query}`;
    await setCache(cacheKey, result, CACHE_TTL_MS);
    return result;
  }

  let result = parts[0];
  if (data.AbstractURL) result += ` (${data.AbstractURL})`;
  if (data.RelatedTopics?.length > 0) {
    const topics = data.RelatedTopics.slice(0, 2)
      .map((t: { Text?: string }) => t.Text)
      .filter(Boolean)
      .join(", ");
    if (topics) result += ` | Related: ${topics}`;
  }

  await setCache(cacheKey, result, CACHE_TTL_MS);
  return result;
}

export const duckDuckGoTool = {
  type: "function" as const,
  function: {
    name: "query_duckduckgo",
    description: "Get quick info from DuckDuckGo about topics, people, places, or concepts.",
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
