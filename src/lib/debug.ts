/* personal-assistant-thing/src/lib/debug.ts */

import { promises as fs } from "fs";
import { join } from "path";

/**
 * Debug logging utility that only logs in development mode.
 * Accepts the same arguments as console.debug().
 */
export function debug(...args: any[]): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(...args);
  }
}

/**
 * Rate limit state structure for persistence.
 */
export interface RateLimitState {
  windowStart: number;
  requestCount: number;
}

const RATE_LIMIT_FILE = join(process.cwd(), "data", "rate-limit-state.json");

/**
 * Loads rate limit state from disk.
 * Returns null if the file doesn't exist or can't be read.
 *
 * @returns Rate limit state or null if not found/invalid
 */
export async function loadRateLimitState(): Promise<RateLimitState | null> {
  try {
    const data = await fs.readFile(RATE_LIMIT_FILE, "utf-8");
    const state = JSON.parse(data) as RateLimitState;

    // Validate the loaded state
    if (
      typeof state.windowStart === "number" &&
      typeof state.requestCount === "number" &&
      state.requestCount >= 0
    ) {
      return state;
    }

    debug(`[RateLimit] Invalid state format in ${RATE_LIMIT_FILE}`);
    return null;
  } catch (error: any) {
    // File doesn't exist or can't be read - this is fine
    if (error.code === "ENOENT") {
      debug(`[RateLimit] No existing state file found, starting fresh`);
      return null;
    }
    debug(`[RateLimit] Error loading state: ${error.message}`);
    return null;
  }
}

/**
 * Saves rate limit state to disk.
 * Creates the data directory if it doesn't exist.
 *
 * @param state - The rate limit state to save
 */
export async function saveRateLimitState(state: RateLimitState): Promise<void> {
  try {
    const dataDir = join(process.cwd(), "data");
    // Ensure data directory exists
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    await fs.writeFile(RATE_LIMIT_FILE, JSON.stringify(state, null, 2), "utf-8");
    debug(`[RateLimit] State saved to ${RATE_LIMIT_FILE}`);
  } catch (error: any) {
    debug(`[RateLimit] Error saving state: ${error.message}`);
    // Don't throw - rate limiting should continue even if persistence fails
  }
}
