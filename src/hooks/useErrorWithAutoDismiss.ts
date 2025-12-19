import { useState, useEffect } from "react";

/**
 * Custom hook for managing error state with automatic dismissal.
 * Errors are automatically cleared after a specified duration.
 *
 * @param dismissAfterMs - Time in milliseconds before auto-dismissing (default: 3000)
 * @returns Tuple of [error, setError] similar to useState
 */
export function useErrorWithAutoDismiss(
  dismissAfterMs = 3000
): [string | null, (error: string | null) => void] {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, dismissAfterMs);
      return () => clearTimeout(timer);
    }
  }, [error, dismissAfterMs]);

  return [error, setError];
}
