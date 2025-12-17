/* personal-assistant-thing/src/lib/cache.ts */

import { promises as fs } from "fs";
import { join } from "path";
import { debug } from "./debug";

/**
 * Cache entry with optional expiration timestamp.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt?: number; // Unix timestamp in milliseconds
}

/**
 * Cache data structure stored on disk.
 */
interface CacheData {
  [key: string]: CacheEntry<any>;
}

const CACHE_FILE = join(process.cwd(), "data", "cache.json");

/**
 * Loads cache data from disk.
 * Returns empty object if file doesn't exist or can't be read.
 *
 * @returns Cache data object
 */
async function loadCache(): Promise<CacheData> {
  try {
    const data = await fs.readFile(CACHE_FILE, "utf-8");
    const cache = JSON.parse(data) as CacheData;

    // Clean up expired entries
    const now = Date.now();
    const cleanedCache: CacheData = {};
    for (const [key, entry] of Object.entries(cache)) {
      if (!entry.expiresAt || entry.expiresAt > now) {
        cleanedCache[key] = entry;
      }
    }

    // If we removed expired entries, save the cleaned cache
    if (Object.keys(cleanedCache).length !== Object.keys(cache).length) {
      await saveCache(cleanedCache);
    }

    return cleanedCache;
  } catch (error: any) {
    // File doesn't exist or can't be read - this is fine
    if (error.code === "ENOENT") {
      debug(`[Cache] No existing cache file found, starting fresh`);
      return {};
    }
    debug(`[Cache] Error loading cache: ${error.message}`);
    return {};
  }
}

/**
 * Saves cache data to disk.
 * Creates the data directory if it doesn't exist.
 *
 * @param cache - The cache data to save
 */
async function saveCache(cache: CacheData): Promise<void> {
  try {
    const dataDir = join(process.cwd(), "data");
    // Ensure data directory exists
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
    debug(`[Cache] Cache saved to ${CACHE_FILE}`);
  } catch (error: any) {
    debug(`[Cache] Error saving cache: ${error.message}`);
    // Don't throw - cache operations should continue even if persistence fails
  }
}

/**
 * Sets a value in the cache with an optional TTL (time-to-live).
 *
 * @param key - The cache key
 * @param value - The value to cache (must be JSON-serializable)
 * @param ttlMs - Optional time-to-live in milliseconds. If provided, the entry will expire after this duration.
 * @returns Promise that resolves when the value is cached
 */
export async function setCache<T>(key: string, value: T, ttlMs?: number): Promise<void> {
  const cache = await loadCache();
  const entry: CacheEntry<T> = {
    value,
  };

  if (ttlMs && ttlMs > 0) {
    entry.expiresAt = Date.now() + ttlMs;
  }

  cache[key] = entry;
  await saveCache(cache);
  debug(`[Cache] Set key: ${key}${ttlMs ? ` (TTL: ${ttlMs}ms)` : ""}`);
}

/**
 * Gets a value from the cache.
 *
 * @param key - The cache key
 * @returns The cached value, or null if not found or expired
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const cache = await loadCache();
  const entry = cache[key];

  if (!entry) {
    debug(`[Cache] Cache miss for key: ${key}`);
    return null;
  }

  // Check if expired
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    // Remove expired entry
    delete cache[key];
    await saveCache(cache);
    debug(`[Cache] Cache expired for key: ${key}`);
    return null;
  }

  debug(`[Cache] Cache hit for key: ${key}`);
  return entry.value as T;
}

/**
 * Removes a key from the cache.
 *
 * @param key - The cache key to remove
 * @returns Promise that resolves when the key is removed
 */
export async function deleteCache(key: string): Promise<void> {
  const cache = await loadCache();
  if (key in cache) {
    delete cache[key];
    await saveCache(cache);
    debug(`[Cache] Deleted key: ${key}`);
  }
}

/**
 * Clears all entries from the cache.
 *
 * @returns Promise that resolves when the cache is cleared
 */
export async function clearCache(): Promise<void> {
  await saveCache({});
  debug(`[Cache] Cache cleared`);
}

/**
 * Checks if a key exists in the cache and is not expired.
 *
 * @param key - The cache key to check
 * @returns true if the key exists and is not expired, false otherwise
 */
export async function hasCache(key: string): Promise<boolean> {
  const value = await getCache(key);
  return value !== null;
}
