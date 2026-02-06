// Sistema de cache para dados de guerra
const CACHE_KEY_PREFIX = "war_cache_";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos em milissegundos

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

    // Verifica se o cache ainda é válido
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    // Cache expirado, remove
    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error("Erro ao ler cache de guerra:", error);
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
  } catch (error) {
    console.error("Erro ao salvar cache de guerra:", error);
  }
}

export function clearWarCache(key?: string): void {
  if (typeof window === "undefined") return;

  try {
    if (key) {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      localStorage.removeItem(cacheKey);
    } else {
      // Remove todos os caches de guerra
      const keys = Object.keys(localStorage);
      keys.forEach((k) => {
        if (k.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(k);
        }
      });
    }
  } catch (error) {
    console.error("Erro ao limpar cache de guerra:", error);
  }
}

