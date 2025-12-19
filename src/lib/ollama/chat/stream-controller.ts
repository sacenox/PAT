/* personal-assistant-thing/src/lib/ollama/chat/stream-controller.ts */

/**
 * Creates safe close and enqueue functions for a ReadableStream controller.
 * These functions prevent double-close errors and handle closed controller states gracefully.
 */
export function createStreamController(controller: ReadableStreamDefaultController<Uint8Array>) {
  let isControllerClosed = false;

  const safeClose = () => {
    if (!isControllerClosed) {
      isControllerClosed = true;
      try {
        controller.close();
      } catch {
        // Controller may already be closed, ignore
      }
    }
  };

  const encoder = new TextEncoder();
  const safeEnqueue = (data: unknown) => {
    if (!isControllerClosed) {
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      } catch {
        // Controller may be closed, ignore
      }
    }
  };

  const isClosed = () => isControllerClosed;

  return { safeClose, safeEnqueue, isClosed };
}
