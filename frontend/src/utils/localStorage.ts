// Local storage utilities for caching job data

// Cache expiration time (7 days in milliseconds)
export const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Save data to localStorage with a timestamp
 * @param key The localStorage key
 * @param data The data to store
 */
export const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    const item = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Error saving to localStorage (key: ${key}):`, error);
  }
};

/**
 * Load data from localStorage with expiration check
 * @param key The localStorage key
 * @param expirationMs Expiration time in milliseconds
 * @returns The stored data or null if not found or expired
 */
export const loadFromLocalStorage = <T>(key: string, expirationMs = CACHE_EXPIRATION): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsedItem = JSON.parse(item);
    const now = Date.now();
    
    // Check if the data has expired
    if (now - parsedItem.timestamp > expirationMs) {
      localStorage.removeItem(key); // Clean up expired data
      return null;
    }
    
    return parsedItem.data;
  } catch (error) {
    console.error(`Error loading from localStorage (key: ${key}):`, error);
    return null;
  }
};

/**
 * Remove an item from localStorage
 * @param key The localStorage key
 */
export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (key: ${key}):`, error);
  }
};
