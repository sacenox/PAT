/* personal-assistant-thing/src/lib/ollama/duckduckgo.ts */

import { debug } from "../debug";
import { getCache, setCache } from "../cache";
import { createRateLimiter } from "../ratelimit";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Rate limiter for DuckDuckGo API requests.
 * Tracks requests per 24-hour rolling window.
 */
const duckDuckGoRateLimiter = createRateLimiter({
  maxRequests: 500,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  identifier: "duckduckgo",
});

/**
 * Queries DuckDuckGo's Instant Answer API for information about a given query.
 * Results are cached for 6 hours.
 *
 * @param query - The search query to send to DuckDuckGo.
 * @returns A formatted string containing the instant answer information.
 */
export async function queryDuckDuckGo(query: string): Promise<string> {
  if (!query || typeof query !== "string") {
    return `Error: Invalid query parameter. Expected a non-empty string, got: ${typeof query}`;
  }

  // Check cache first
  const cacheKey = `duckduckgo:${query.toLowerCase().trim()}`;
  const cached = await getCache<string>(cacheKey);
  if (cached !== null) {
    debug(`[DuckDuckGo] Cache hit for: "${query}"`);
    return cached;
  }

  debug(`[DuckDuckGo] Querying: "${query}"`);

  // Check rate limit before making the request
  const rateLimitCheck = await duckDuckGoRateLimiter.check();
  if (!rateLimitCheck.allowed) {
    const hoursRemaining = rateLimitCheck.hoursUntilReset || 0;
    return `Error: DuckDuckGo API rate limit exceeded. Maximum of 500 requests per 24 hours has been reached. Please try again in approximately ${hoursRemaining} hour${hoursRemaining !== 1 ? "s" : ""}.`;
  }

  try {
    // Increment rate limit counter before making the request
    // This ensures all API attempts are counted, not just successful ones
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
      debug(`[DuckDuckGo] Error: HTTP ${response.status}`);
      return `Error: Failed to fetch data from DuckDuckGo (${response.status})`;
    }

    const data = await response.json();

    // Build a comprehensive response from available fields
    const parts: string[] = [];

    if (data.Heading) {
      parts.push(`Heading: ${data.Heading}`);
    }

    if (data.AbstractText) {
      parts.push(`Abstract: ${data.AbstractText}`);
    }

    if (data.AbstractURL) {
      parts.push(`Source: ${data.AbstractURL}`);
    }

    if (data.Answer) {
      parts.push(`Answer: ${data.Answer}`);
    }

    if (data.Definition) {
      parts.push(`Definition: ${data.Definition}`);
    }

    if (data.Type) {
      parts.push(`Type: ${data.Type}`);
    }

    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const topics = data.RelatedTopics.slice(0, 3)
        .map((topic: any) => topic.Text || topic.FirstURL)
        .filter(Boolean)
        .join(", ");
      if (topics) {
        parts.push(`Related Topics: ${topics}`);
      }
    }

    if (parts.length === 0) {
      // DuckDuckGo Instant Answer API has limitations - it doesn't support all query types
      // (e.g., weather forecasts, real-time data). This is expected behavior.
      debug(`[DuckDuckGo] No instant answer data available for this query type`);
      const result = `No instant answer available for query: "${query}". Note: DuckDuckGo Instant Answer API has limited coverage and may not support weather forecasts, real-time data, or certain query types.`;
      // Cache even "no answer" responses to avoid repeated API calls
      await setCache(cacheKey, result, CACHE_TTL_MS);
      return result;
    }

    const result = parts.join("\n\n");
    // Cache successful results
    await setCache(cacheKey, result, CACHE_TTL_MS);
    return result;
  } catch (error) {
    // Don't cache errors
    return `Error querying DuckDuckGo: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Defines the DuckDuckGo search tool for Ollama.
 */
export const duckDuckGoTool = {
  type: "function" as const,
  function: {
    name: "query_duckduckgo",
    description:
      "Query DuckDuckGo's Instant Answer API to get quick information about a topic, person, place, or concept. Use this when you need current or factual information that might not be in your training data.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to send to DuckDuckGo",
        },
      },
      required: ["query"],
    },
  },
};
