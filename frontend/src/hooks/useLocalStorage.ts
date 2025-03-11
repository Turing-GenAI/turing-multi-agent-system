import { useState, useEffect } from 'react';

// Custom hook for persistent state with localStorage
function useLocalStorage<T>(key: string, initialValue: T, expirationMs?: number) {
  // Get from localStorage then parse stored json or return initialValue
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      const storedData = JSON.parse(item);
      
      // Check if data has expired (if expiration is provided)
      if (expirationMs && storedData.timestamp) {
        const now = Date.now();
        if (now - storedData.timestamp > expirationMs) {
          // Data has expired, return initial value
          return initialValue;
        }
      }
      
      return storedData.value || initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage with timestamp
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          key,
          JSON.stringify({
            value: valueToStore,
            timestamp: Date.now()
          })
        );
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes to this localStorage key in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const newStoredValue = JSON.parse(e.newValue);
          setStoredValue(newStoredValue.value);
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue] as const;
}

export default useLocalStorage;
