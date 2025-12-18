/* personal-assistant-thing/src/lib/cache/index.ts */

import { debug } from "../debug";
import ValKey from "iovalkey";

const valkey = new ValKey(process.env.VALKEY_URL);

/**
 * Sets a value in the cache with an optional TTL (time-to-live).
 *
 * @param key - The cache key
 * @param value - The value to cache (must be JSON-serializable)
 * @param ttlMs - Optional time-to-live in milliseconds. If provided, the entry will expire after this duration.
 * @returns Promise that resolves when the value is cached
 */
export async function setCache<T>(key: string, value: T, ttlMs?: number): Promise<void> {
  try {
    const serialized = JSON.stringify(value);

    if (ttlMs && ttlMs > 0) {
      // Convert milliseconds to seconds for Valkey
      const ttlSeconds = Math.ceil(ttlMs / 1000);
      await valkey.setex(key, ttlSeconds, serialized);
      debug(`[Cache] Set key: ${key} (TTL: ${ttlMs}ms)`);
    } else {
      await valkey.set(key, serialized);
      debug(`[Cache] Set key: ${key}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    debug(`[Cache] Error setting cache: ${message}`);
    // Don't throw - cache operations should continue even if persistence fails
  }
}

/**
 * Gets a value from the cache.
 *
 * @param key - The cache key
 * @returns The cached value, or null if not found or expired
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const serialized = await valkey.get(key);

    if (!serialized) {
      debug(`[Cache] Cache miss for key: ${key}`);
      return null;
    }

    debug(`[Cache] Cache hit for key: ${key}`);
    return JSON.parse(serialized) as T;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    debug(`[Cache] Error getting cache: ${message}`);
    return null;
  }
}
