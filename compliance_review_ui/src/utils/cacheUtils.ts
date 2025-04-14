// Cache utilities for storing and retrieving email content
const DB_NAME = 'compliance-review-cache';
const DB_VERSION = 1;
const EMAIL_STORE = 'email-content';

interface EmailCache {
  reviewId: string;
  content: string;
  subject: string;
  timestamp: number;
}

/**
 * Initialize the IndexedDB database for caching
 */
const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create email content store with reviewId as key path
      if (!db.objectStoreNames.contains(EMAIL_STORE)) {
        db.createObjectStore(EMAIL_STORE, { keyPath: 'reviewId' });
      }
    };
  });
};

/**
 * Cache email content for a specific review
 */
export const cacheEmailContent = async (
  reviewId: string, 
  content: string, 
  subject: string
): Promise<void> => {
  try {
    const db = await initializeDB();
    
    const transaction = db.transaction([EMAIL_STORE], 'readwrite');
    const store = transaction.objectStore(EMAIL_STORE);
    
    // Store email content with timestamp
    const emailCache: EmailCache = {
      reviewId,
      content,
      subject,
      timestamp: Date.now(),
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(emailCache);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to cache email content'));
    });
    
    db.close();
  } catch (error) {
    console.error('Error caching email content:', error);
    // Fail silently - caching is a non-critical enhancement
  }
};

/**
 * Get cached email content for a specific review
 * Returns null if no cached content exists or if the cache is older than maxAge
 */
export const getCachedEmailContent = async (
  reviewId: string, 
  maxAge: number = 1000 * 60 * 60 // Default 1 hour
): Promise<{ content: string; subject: string } | null> => {
  try {
    const db = await initializeDB();
    
    const transaction = db.transaction([EMAIL_STORE], 'readonly');
    const store = transaction.objectStore(EMAIL_STORE);
    
    const cachedContent = await new Promise<EmailCache | undefined>((resolve, reject) => {
      const request = store.get(reviewId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to retrieve cached email content'));
    });
    
    db.close();
    
    // Check if we have cached content and if it's within the maxAge
    if (cachedContent && (Date.now() - cachedContent.timestamp) < maxAge) {
      return { 
        content: cachedContent.content, 
        subject: cachedContent.subject 
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving cached email content:', error);
    return null;
  }
};

/**
 * Clear all cached email content
 */
export const clearEmailCache = async (): Promise<void> => {
  try {
    const db = await initializeDB();
    
    const transaction = db.transaction([EMAIL_STORE], 'readwrite');
    const store = transaction.objectStore(EMAIL_STORE);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear email cache'));
    });
    
    db.close();
  } catch (error) {
    console.error('Error clearing email cache:', error);
  }
}; 