import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing localStorage
 * @param key - The localStorage key
 * @param initialValue - The initial value if no value exists in localStorage
 * @returns A tuple of [value, setValue] similar to useState
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const getValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }
      return JSON.parse(item) as T;
    } catch {
      window.localStorage.removeItem(key);
      return initialValue;
    }
  }, [key, initialValue]);

  const [value, setValueState] = useState<T>(getValue);

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(getValue()) : newValue;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          // Dispatch custom event to notify other hooks using the same key
          window.dispatchEvent(new CustomEvent(`localStorage-${key}`, { detail: valueToStore }));
        }
        setValueState(valueToStore);
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, getValue]
  );

  // Listen for changes to this localStorage key from other components
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<T>;
      setValueState(customEvent.detail);
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValueState(JSON.parse(e.newValue) as T);
        } catch {
          // Ignore parse errors
        }
      }
    };

    const eventName = `localStorage-${key}`;
    window.addEventListener(eventName, handleStorageChange);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener(eventName, handleStorageChange);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [key]);

  return [value, setValue];
}
