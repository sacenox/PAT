export function debug(...args: Parameters<typeof console.debug>): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(...args);
  }
}
