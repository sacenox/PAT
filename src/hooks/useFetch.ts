import { useCallback } from "react";
import { getErrorMessage, getParseErrorMessage, handleError } from "@/src/lib/errors";

export interface FetchOptions extends RequestInit {
  errorMessage?: string;
  throwOnError?: boolean;
  onError?: (error: string) => void;
}

/**
 * Custom hook that provides a reusable fetch function with standardized error handling.
 * Handles response validation, JSON parsing, and error callbacks.
 *
 * @returns A fetch function that handles errors automatically
 */
export function useFetch() {
  const fetchWithErrorHandling = useCallback(
    async <T = unknown>(url: string, options: FetchOptions = {}): Promise<T | null> => {
      const { errorMessage, throwOnError, onError, ...fetchOptions } = options;

      try {
        const res = await fetch(url, fetchOptions);
        if (!res.ok) {
          const defaultError = errorMessage || `Failed to fetch: ${res.status}`;
          try {
            const errorData = await res.json();
            throw new Error(errorData.error || defaultError);
          } catch (parseError) {
            if (parseError instanceof Error && parseError.message !== defaultError) {
              throw parseError;
            }
            throw new Error(getParseErrorMessage(parseError));
          }
        }
        // Handle empty responses (e.g., 204 No Content)
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return {} as T;
        }
        const text = await res.text();
        if (!text.trim()) {
          return {} as T;
        }
        const data = JSON.parse(text);
        return data as T;
      } catch (error) {
        const errorMsg = getErrorMessage(error, errorMessage || "Unknown error");
        handleError(errorMsg, onError);
        if (throwOnError) {
          throw error;
        }
        return null;
      }
    },
    []
  );

  return fetchWithErrorHandling;
}
