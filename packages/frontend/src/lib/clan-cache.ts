const CACHE_KEY_PREFIX = "clan_cache_";
const CACHE_DURATION = 5 * 60 * 1000;

interface CachedClanData {
  data: any;
  timestamp: number;
}

export function getCachedClanData(tag: string): any | null {
  if (typeof window === "undefined") return null;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${tag}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;

    const { data, timestamp }: CachedClanData = JSON.parse(cached);
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

export function setCachedClanData(tag: string, data: any): void {
  if (typeof window === "undefined") return;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${tag}`;
    const cached: CachedClanData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (error) {}
}

export function clearClanCache(tag?: string): void {
  if (typeof window === "undefined") return;

  try {
    if (tag) {
      const cacheKey = `${CACHE_KEY_PREFIX}${tag}`;
      localStorage.removeItem(cacheKey);
    } else {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {}
}

