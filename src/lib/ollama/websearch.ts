/* personal-assistant-thing/src/lib/ollama/websearch.ts */

import { google } from "googleapis";
import { debug, loadRateLimitState, saveRateLimitState } from "../debug";

/**
 * Rate limiter for web search requests.
 * Tracks requests per 24-hour rolling window.
 */
const WEB_SEARCH_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  windowStart: Date.now(),
  requestCount: 0,
};

/**
 * Initializes the rate limit state from disk.
 * Should be called once when the module loads.
 */
async function initializeRateLimitState(): Promise<void> {
  const savedState = await loadRateLimitState();
  if (savedState) {
    const now = Date.now();
    const timeSinceWindowStart = now - savedState.windowStart;

    // If 24 hours have passed, reset; otherwise use saved state
    if (timeSinceWindowStart >= WEB_SEARCH_RATE_LIMIT.windowMs) {
      WEB_SEARCH_RATE_LIMIT.windowStart = now;
      WEB_SEARCH_RATE_LIMIT.requestCount = 0;
      debug(`[WebSearch] Rate limit window reset (loaded from disk)`);
      // Save the reset state
      await saveRateLimitState({
        windowStart: WEB_SEARCH_RATE_LIMIT.windowStart,
        requestCount: WEB_SEARCH_RATE_LIMIT.requestCount,
      });
    } else {
      WEB_SEARCH_RATE_LIMIT.windowStart = savedState.windowStart;
      WEB_SEARCH_RATE_LIMIT.requestCount = savedState.requestCount;
      debug(
        `[WebSearch] Rate limit state loaded: ${WEB_SEARCH_RATE_LIMIT.requestCount}/${WEB_SEARCH_RATE_LIMIT.maxRequests} requests used`
      );
    }
  }
}

// Initialize rate limit state on module load
initializeRateLimitState().catch((error) => {
  debug(`[WebSearch] Error initializing rate limit state: ${error.message}`);
});

/**
 * Checks if a web search request can be made within the rate limit.
 * Resets the counter if 24 hours have passed since the window started.
 *
 * @returns true if request is allowed, false if rate limit exceeded
 */
function checkWebSearchRateLimit(): boolean {
  const now = Date.now();
  const timeSinceWindowStart = now - WEB_SEARCH_RATE_LIMIT.windowStart;

  // Reset if 24 hours have passed
  if (timeSinceWindowStart >= WEB_SEARCH_RATE_LIMIT.windowMs) {
    WEB_SEARCH_RATE_LIMIT.windowStart = now;
    WEB_SEARCH_RATE_LIMIT.requestCount = 0;
    debug(`[WebSearch] Rate limit window reset`);
    // Save the reset state
    saveRateLimitState({
      windowStart: WEB_SEARCH_RATE_LIMIT.windowStart,
      requestCount: WEB_SEARCH_RATE_LIMIT.requestCount,
    }).catch(() => {
      // Error already logged in saveRateLimitState
    });
  }

  // Check if we've exceeded the limit
  if (WEB_SEARCH_RATE_LIMIT.requestCount >= WEB_SEARCH_RATE_LIMIT.maxRequests) {
    const hoursRemaining = Math.ceil(
      (WEB_SEARCH_RATE_LIMIT.windowMs - timeSinceWindowStart) / (60 * 60 * 1000)
    );
    debug(
      `[WebSearch] Rate limit exceeded: ${WEB_SEARCH_RATE_LIMIT.requestCount}/${WEB_SEARCH_RATE_LIMIT.maxRequests} requests used, ${hoursRemaining} hours until reset`
    );
    return false;
  }

  return true;
}

/**
 * Increments the web search request counter and saves state to disk.
 */
function incrementWebSearchRateLimit(): void {
  WEB_SEARCH_RATE_LIMIT.requestCount++;
  debug(
    `[WebSearch] Rate limit: ${WEB_SEARCH_RATE_LIMIT.requestCount}/${WEB_SEARCH_RATE_LIMIT.maxRequests} requests used`
  );
  // Save state to disk
  saveRateLimitState({
    windowStart: WEB_SEARCH_RATE_LIMIT.windowStart,
    requestCount: WEB_SEARCH_RATE_LIMIT.requestCount,
  }).catch(() => {
    // Error already logged in saveRateLimitState
  });
}

/**
 * Performs a web search using Google Custom Search API.
 * Enforces a rate limit of 100 requests per 24 hours.
 *
 * @param query - The search query to execute.
 * @returns A formatted string containing search results.
 */
export async function queryWebSearch(query: string): Promise<string> {
  debug(`[WebSearch] Querying: "${query}"`);

  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    debug(`[WebSearch] Missing API credentials - API_KEY: ${!!apiKey}, CX: ${!!cx}`);
    return `Error: Google Custom Search API credentials not configured. Please set GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID environment variables.`;
  }

  // Check rate limit before making the request
  if (!checkWebSearchRateLimit()) {
    const timeSinceWindowStart = Date.now() - WEB_SEARCH_RATE_LIMIT.windowStart;
    const hoursRemaining = Math.ceil(
      (WEB_SEARCH_RATE_LIMIT.windowMs - timeSinceWindowStart) / (60 * 60 * 1000)
    );
    return `Error: Web search rate limit exceeded. Maximum of ${WEB_SEARCH_RATE_LIMIT.maxRequests} requests per 24 hours has been reached. Please try again in approximately ${hoursRemaining} hour${hoursRemaining !== 1 ? "s" : ""}.`;
  }

  try {
    // Increment rate limit counter before making the request
    // This ensures all API attempts are counted, not just successful ones
    incrementWebSearchRateLimit();

    const customsearch = google.customsearch("v1");
    const res = await customsearch.cse.list({
      auth: apiKey,
      cx: cx,
      q: query,
      num: 10, // Maximum number of results (1-10)
    });

    if (!res.data.items || res.data.items.length === 0) {
      debug(`[WebSearch] No results found for query: "${query}"`);
      return `No search results found for query: "${query}"`;
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

    return parts.join("\n").trim();
  } catch (error) {
    console.error("Web search error:", error);
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

