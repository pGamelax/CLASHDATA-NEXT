const CACHE_KEY_PREFIX = "war_cache_";
const CACHE_DURATION = 10 * 60 * 1000;

interface CachedWarData {
  data: any;
  timestamp: number;
}

export function getCachedWarData(key: string): any | null {
  if (typeof window === "undefined") return null;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;

    const { data, timestamp }: CachedWarData = JSON.parse(cached);
    const now = Date.now();

    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    return null;
  }
}

export function setCachedWarData(key: string, data: any): void {
  if (typeof window === "undefined") return;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
    const cached: CachedWarData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (error) {}
}

export function clearWarCache(key?: string): void {
  if (typeof window === "undefined") return;

  try {
    if (key) {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      localStorage.removeItem(cacheKey);
    } else {
      const keys = Object.keys(localStorage);
      keys.forEach((k) => {
        if (k.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(k);
        }
      });
    }
  } catch (error) {}
}

