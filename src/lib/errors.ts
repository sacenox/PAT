/* personal-assistant-thing/src/lib/errors.ts */
// Centralized error handling utilities

/**
 * Extracts an error message from an error object.
 * @param error - The error to extract a message from
 * @param defaultMessage - Default message if error is not an Error instance
 * @returns The error message
 */
export function getErrorMessage(error: unknown, defaultMessage = "Unknown error"): string {
  return error instanceof Error ? error.message : defaultMessage;
}

/**
 * Handles an error by calling the error callback if provided.
 * @param error - The error to handle
 * @param onError - Optional error callback function
 */
export function handleError(error: unknown, onError?: (error: string) => void): void {
  if (onError) {
    onError(getErrorMessage(error));
  }
}

/**
 * Parses an error response from a fetch request.
 * @param parseError - The error that occurred during parsing
 * @returns A formatted error message
 */
export function getParseErrorMessage(parseError: unknown): string {
  return `Failed to parse error response: ${getErrorMessage(parseError, "Invalid JSON")}`;
}

