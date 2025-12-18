/* personal-assistant-thing/src/lib/cache/index.ts */

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
    } else {
      await valkey.set(key, serialized);
    }
  } catch (error: unknown) {
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
      return null;
    }

    return JSON.parse(serialized) as T;
  } catch (error: unknown) {
    return null;
  }
}
