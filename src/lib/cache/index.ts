import ValKey from "iovalkey";

const valkeyUrl = process.env.VALKEY_URL;
if (!valkeyUrl) {
  throw new Error("VALKEY_URL environment variable is not set");
}

const valkey = new ValKey(valkeyUrl);

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
  } catch {
    // Don't throw - cache operations should continue even if persistence fails
  }
}

export async function incrementCache(key: string): Promise<void> {
  try {
    await valkey.incr(key);
  } catch {
    // Don't throw - cache operations should continue even if persistence fails
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const serialized = await valkey.get(key);

    if (!serialized) {
      return null;
    }

    return JSON.parse(serialized) as T;
  } catch {
    return null;
  }
}
