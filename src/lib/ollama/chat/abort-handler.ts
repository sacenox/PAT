/* personal-assistant-thing/src/lib/ollama/chat/abort-handler.ts */

/**
 * Sets up an abort handler for the given signal.
 * When the signal is aborted, the handler will call the provided callback.
 *
 * @param signal - The AbortSignal to listen to
 * @param onAbort - Callback to execute when abort is triggered
 * @returns A cleanup function to remove the event listener
 */
export function setupAbortHandler(signal: AbortSignal, onAbort: () => void): () => void {
  signal.addEventListener("abort", onAbort);
  return () => {
    signal.removeEventListener("abort", onAbort);
  };
}

/**
 * Checks if the signal is aborted or if the controller is closed.
 *
 * @param signal - AbortSignal to check
 * @param isClosed - Function that returns whether controller is closed
 * @returns Boolean indicating if aborted or closed
 */
export function isAbortedOrClosed(signal: AbortSignal, isClosed: () => boolean): boolean {
  return signal.aborted || isClosed();
}
