/* personal-assistant-thing/src/lib/ollama/websearch.ts */

import { google } from "googleapis";
import { debug } from "../debug";
import { getCache, setCache } from "../cache";
import { createRateLimiter } from "../ratelimit";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Rate limiter for web search requests.
 * Tracks requests per 24-hour rolling window.
 */
const webSearchRateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  identifier: "websearch",
});

/**
 * Performs a web search using Google Custom Search API.
 * Enforces a rate limit of 100 requests per 24 hours.
 * Results are cached for 6 hours.
 *
 * @param query - The search query to execute.
 * @returns A formatted string containing search results.
 */
export async function queryWebSearch(query: string): Promise<string> {
  if (!query || typeof query !== "string") {
    return `Error: Invalid query parameter. Expected a non-empty string, got: ${typeof query}`;
  }

  // Check cache first
  const cacheKey = `websearch:${query.toLowerCase().trim()}`;
  const cached = await getCache<string>(cacheKey);
  if (cached !== null) {
    debug(`[WebSearch] Cache hit for: "${query}"`);
    return cached;
  }

  debug(`[WebSearch] Querying: "${query}"`);

  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    debug(`[WebSearch] Missing API credentials`);
    return `Error: Google Custom Search API credentials not configured. Please set GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID environment variables.`;
  }

  // Check rate limit before making the request
  const rateLimitCheck = await webSearchRateLimiter.check();
  if (!rateLimitCheck.allowed) {
    const hoursRemaining = rateLimitCheck.hoursUntilReset || 0;
    return `Error: Web search rate limit exceeded. Maximum of 100 requests per 24 hours has been reached. Please try again in approximately ${hoursRemaining} hour${hoursRemaining !== 1 ? "s" : ""}.`;
  }

  try {
    // Increment rate limit counter before making the request
    // This ensures all API attempts are counted, not just successful ones
    await webSearchRateLimiter.increment();

    const customsearch = google.customsearch("v1");
    const res = await customsearch.cse.list({
      cx: cx,
      q: query,
      auth: apiKey,
    });

    if (!res.data.items || res.data.items.length === 0) {
      debug(`[WebSearch] No results found for query: "${query}"`);
      const result = `No search results found for query: "${query}"`;
      // Cache even "no results" responses to avoid repeated API calls
      await setCache(cacheKey, result, CACHE_TTL_MS);
      return result;
    }

    debug(`[WebSearch] Found ${res.data.items.length} results`);

    const parts: string[] = [];
    parts.push(`Web search results for "${query}":\n`);

    res.data.items.forEach((item, index) => {
      parts.push(`${index + 1}. ${item.title || "Untitled"}`);
      if (item.link) {
        parts.push(`   URL: ${item.link}`);
      }
      if (item.snippet) {
        parts.push(`   ${item.snippet}`);
      }
      parts.push(""); // Empty line between results
    });

    const result = parts.join("\n").trim();
    // Cache successful results
    await setCache(cacheKey, result, CACHE_TTL_MS);
    return result;
  } catch (error) {
    // Don't cache errors
    return `Error performing web search: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Defines the web search tool for Ollama.
 */
export const webSearchTool = {
  type: "function" as const,
  function: {
    name: "query_web_search",
    description:
      "Perform a web search using Google Custom Search API to find current information, news, articles, or any content on the internet. Use this when you need to find recent information, verify facts, or search for content that may not be in your training data.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to execute on the web",
        },
      },
      required: ["query"],
    },
  },
};
