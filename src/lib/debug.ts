/* personal-assistant-thing/src/lib/debug.ts */

/**
 * Debug logging utility that only logs in development mode.
 * Accepts the same arguments as console.debug().
 */
export function debug(...args: any[]): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(...args);
  }
}

