const CACHE_TTL = 5 * 60 * 1000;
const CACHE_PREFIX = "cwl_";

interface CachedCWLData {
  data: any;
  timestamp: number;
}

function normalizeCWLData(data: any[]): any[] {
  if (!Array.isArray(data)) return data;
  
  return data.map((player) => {
    if (player.seasonsParticipated !== undefined && player.seasonsParticipated !== null) {
      player.warsParticipated = player.seasonsParticipated;
      delete player.seasonsParticipated;
    }
    
    if (player.warsParticipated === undefined || player.warsParticipated === null) {
      player.warsParticipated = player.totalAttacks || 0;
    }
    return player;
  });
}

export function getCachedCWLData(key: string): any | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const parsed: CachedCWLData = JSON.parse(cached);
    const now = Date.now();

    if (now - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return normalizeCWLData(parsed.data);
  } catch (error) {
    return null;
  }
}

export function setCachedCWLData(key: string, data: any): void {
  if (typeof window === "undefined") return;

  try {
    const normalizedData = normalizeCWLData(data);
    
    const cached: CachedCWLData = {
      data: normalizedData,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
  } catch (error) {
    if (error instanceof DOMException && error.code === 22) {
      clearOldCaches();
      try {
        const normalizedData = normalizeCWLData(data);
        const cached: CachedCWLData = {
          data: normalizedData,
          timestamp: Date.now(),
        };
        localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
      } catch (retryError) {}
    }
  }
}

export function clearCWLCache(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {

  }
}

function clearOldCaches(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let cleared = 0;

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed: CachedCWLData = JSON.parse(cached);
            if (now - parsed.timestamp > CACHE_TTL) {
              localStorage.removeItem(key);
              cleared++;
            }
          }
        } catch {
          localStorage.removeItem(key);
          cleared++;
        }
      }
    });
  } catch (error) {}
}

