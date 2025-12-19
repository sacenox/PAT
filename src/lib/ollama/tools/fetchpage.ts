/* personal-assistant-thing/src/lib/ollama/tools/fetchpage.ts */

import { getCache, setCache } from "../../cache";
import { createRateLimiter } from "../../ratelimit";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const fetchPageRateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  identifier: "fetchpage",
});

/**
 * Sanitizes HTML content by extracting text and removing scripts, styles, and other non-content elements.
 * Returns a clean text string with normalized whitespace.
 */
function sanitizeHtml(html: string): string {
  // Remove script and style tags and their content
  let sanitized = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  sanitized = sanitized.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");

  // Remove HTML comments
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, "");

  // Extract text from common content tags
  const textMatches = sanitized.match(
    /<(?:p|div|h[1-6]|article|section|main|header|footer|li|td|th|span|a|strong|em|b|i|blockquote|pre|code)[^>]*>([\s\S]*?)<\/[^>]+>/gi
  );

  if (!textMatches || textMatches.length === 0) {
    // Fallback: extract all text between tags
    sanitized = sanitized.replace(/<[^>]+>/g, " ");
  } else {
    // Extract text content from matched tags
    sanitized = textMatches
      .map((match) => {
        // Remove nested tags and extract text
        return match.replace(/<[^>]+>/g, " ").trim();
      })
      .join("\n");
  }

  // Remove remaining HTML tags
  sanitized = sanitized.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  sanitized = sanitized
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Normalize whitespace
  sanitized = sanitized
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();

  return sanitized;
}

/**
 * Fetches a web page from the given URL and returns sanitized text content.
 * Results are cached for 6 hours.
 *
 * @param url - The URL of the web page to fetch.
 * @returns A sanitized string containing the text content of the page.
 */
export async function fetchPage(url: string): Promise<string> {
  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Only HTTP and HTTPS URLs are allowed");
    }
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  // Check cache first
  const cacheKey = `fetchpage:${url}`;
  const cached = await getCache<string>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Check rate limit
  const rateLimitCheck = await fetchPageRateLimiter.check();
  if (!rateLimitCheck.allowed) {
    throw new Error("Service temporarily unavailable");
  }

  await fetchPageRateLimiter.increment();

  try {
    // Fetch the page with a timeout and user agent
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PersonalAssistant/1.0)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    const html = await response.text();
    const sanitized = sanitizeHtml(html);

    if (!sanitized || sanitized.trim().length === 0) {
      const result = `No text content found at: ${url}`;
      await setCache(cacheKey, result, CACHE_TTL_MS);
      return result;
    }

    // Limit result length to prevent excessive token usage
    const maxLength = 10000;
    const result =
      sanitized.length > maxLength
        ? `${sanitized.substring(0, maxLength)}... [content truncated]`
        : sanitized;

    await setCache(cacheKey, result, CACHE_TTL_MS);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout: The page took too long to load");
      }
      throw error;
    }
    throw new Error("Unknown error occurred while fetching the page");
  }
}

export const fetchPageTool = {
  type: "function" as const,
  function: {
    name: "fetch_page",
    description:
      "Fetches a web page from a given URL and returns sanitized text content. Use this tool when asked to fetch a web page, retrieve content from a URL, or read information from a specific webpage.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL of the web page to fetch (must be HTTP or HTTPS).",
        },
      },
      required: ["url"],
    },
  },
};
