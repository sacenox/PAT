/* personal-assistant-thing/src/lib/ratelimit.ts */

import { getCache, setCache } from "./cache";

/**
 * Rate limit state structure.
 */
interface RateLimitState {
  windowStart: number; // Unix timestamp in milliseconds
  requestCount: number;
}

/**
 * Configuration for a rate limiter.
 */
export interface RateLimitConfig {
  maxRequests: number; // Maximum number of requests allowed
  windowMs: number; // Time window in milliseconds
  identifier: string; // Unique identifier for this rate limiter (used as cache key prefix)
}

/**
 * Result of a rate limit check.
 */
export interface RateLimitResult {
  allowed: boolean; // Whether the request is allowed
  remaining: number; // Number of requests remaining in the current window
  resetAt: number; // Unix timestamp when the rate limit window resets
  hoursUntilReset?: number; // Optional: hours until reset (for user-friendly messages)
}

/**
 * Creates a rate limiter with the specified configuration.
 * Uses the cache utility for persistence across restarts.
 *
 * @param config - Rate limit configuration
 * @returns Rate limiter functions
 */
export function createRateLimiter(config: RateLimitConfig) {
  const cacheKey = `ratelimit:${config.identifier}`;

  /**
   * Loads the current rate limit state from cache.
   * Automatically resets the window if it has expired.
   *
   * @returns Current rate limit state
   */
  async function loadState(): Promise<RateLimitState> {
    const cached = await getCache<RateLimitState>(cacheKey);
    const now = Date.now();

    if (!cached) {
      // No existing state, start fresh
      const newState: RateLimitState = {
        windowStart: now,
        requestCount: 0,
      };
      await setCache(cacheKey, newState);
      return newState;
    }

    const timeSinceWindowStart = now - cached.windowStart;

    // If the window has expired, reset it
    if (timeSinceWindowStart >= config.windowMs) {
      const newState: RateLimitState = {
        windowStart: now,
        requestCount: 0,
      };
      await setCache(cacheKey, newState);
      return newState;
    }

    return cached;
  }

  /**
   * Saves the rate limit state to cache.
   *
   * @param state - The state to save
   */
  async function saveState(state: RateLimitState): Promise<void> {
    await setCache(cacheKey, state);
  }

  /**
   * Checks if a request is allowed within the rate limit.
   *
   * @returns Rate limit check result
   */
  async function check(): Promise<RateLimitResult> {
    const state = await loadState();
    const now = Date.now();

    // Calculate when the window resets
    const resetAt = state.windowStart + config.windowMs;
    const hoursUntilReset = Math.ceil((resetAt - now) / (60 * 60 * 1000));

    // Check if we've exceeded the limit
    if (state.requestCount >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        hoursUntilReset,
      };
    }

    const remaining = config.maxRequests - state.requestCount;

    return {
      allowed: true,
      remaining,
      resetAt,
      hoursUntilReset,
    };
  }

  /**
   * Increments the request counter and saves the state.
   * Should be called after a request is made (or attempted).
   */
  async function increment(): Promise<void> {
    const state = await loadState();
    state.requestCount++;
    await saveState(state);
  }

  /**
   * Resets the rate limit window manually.
   */
  async function reset(): Promise<void> {
    const newState: RateLimitState = {
      windowStart: Date.now(),
      requestCount: 0,
    };
    await saveState(newState);
  }

  /**
   * Gets the current rate limit state without modifying it.
   *
   * @returns Current rate limit state
   */
  async function getState(): Promise<RateLimitResult> {
    const state = await loadState();
    const now = Date.now();
    const resetAt = state.windowStart + config.windowMs;
    const hoursUntilReset = Math.ceil((resetAt - now) / (60 * 60 * 1000));
    const remaining = Math.max(0, config.maxRequests - state.requestCount);

    return {
      allowed: state.requestCount < config.maxRequests,
      remaining,
      resetAt,
      hoursUntilReset,
    };
  }

  return {
    check,
    increment,
    reset,
    getState,
  };
}
