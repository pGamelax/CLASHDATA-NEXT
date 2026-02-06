// Cache para dados de CWL com TTL de 5 minutos
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos em milissegundos
const CACHE_PREFIX = "cwl_";

interface CachedCWLData {
  data: any;
  timestamp: number;
}

// Normaliza dados de CWL para garantir que warsParticipated sempre existe
function normalizeCWLData(data: any[]): any[] {
  if (!Array.isArray(data)) return data;
  
  return data.map((player) => {
    // Converte seasonsParticipated antigo para warsParticipated se necessário
    if (player.seasonsParticipated !== undefined && player.seasonsParticipated !== null) {
      player.warsParticipated = player.seasonsParticipated;
      delete player.seasonsParticipated;
    }
    
    // Se não tiver warsParticipated, usa totalAttacks como fallback (1 ataque por guerra na CWL)
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

    // Verifica se o cache expirou
    if (now - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    // Normaliza os dados antes de retornar
    return normalizeCWLData(parsed.data);
  } catch (error) {
    console.error("[CWL Cache] Erro ao ler cache:", error);
    return null;
  }
}

export function setCachedCWLData(key: string, data: any): void {
  if (typeof window === "undefined") return;

  try {
    // Normaliza os dados antes de salvar
    const normalizedData = normalizeCWLData(data);
    
    const cached: CachedCWLData = {
      data: normalizedData,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
  } catch (error) {
    console.error("[CWL Cache] Erro ao salvar cache:", error);
    // Se o localStorage estiver cheio, tenta limpar caches antigos
    if (error instanceof DOMException && error.code === 22) {
      clearOldCaches();
      // Tenta novamente
      try {
        const normalizedData = normalizeCWLData(data);
        const cached: CachedCWLData = {
          data: normalizedData,
          timestamp: Date.now(),
        };
        localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
      } catch (retryError) {
        console.error("[CWL Cache] Erro ao salvar cache após limpeza:", retryError);
      }
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
    console.error("[CWL Cache] Erro ao limpar cache:", error);
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
          // Se não conseguir parsear, remove
          localStorage.removeItem(key);
          cleared++;
        }
      }
    });

    if (cleared > 0) {
      console.log(`[CWL Cache] Limpou ${cleared} entradas expiradas`);
    }
  } catch (error) {
    console.error("[CWL Cache] Erro ao limpar caches antigos:", error);
  }
}

