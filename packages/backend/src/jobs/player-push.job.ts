import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { env } from "../env";
import { ClashOfClansService } from "../services/clash-of-clans.service";
import { PlayerRepository } from "../repositories/player.repository";
import { LegendLeagueLogRepository } from "../repositories/legend-league-log.repository";
import { ClanRepository } from "../repositories/clan.repository";
import { PlayerPushService } from "../services/player-push.service";

// Criar conexão Redis
const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const playerPushQueue = new Queue("player-push", {
  connection,
});

// Worker para processar os jobs
export const playerPushWorker = new Worker(
  "player-push",
  async (job) => {
    const startTime = Date.now();
    const jobId = job.id;
    
    console.log(`[${new Date().toISOString()}] 🚀 Iniciando job de player push: ${jobId}`);
    console.log(`[${new Date().toISOString()}] 📊 Job data:`, JSON.stringify(job.data));
    
    try {
      // Atualizar progresso
      await job.updateProgress(10);
      
      // Inicializar dependências
      console.log(`[${new Date().toISOString()}] ⚙️  Inicializando dependências...`);
      const clashOfClansService = new ClashOfClansService();
      const playerRepository = new PlayerRepository();
      const legendLeagueLogRepository = new LegendLeagueLogRepository();
      const clanRepository = new ClanRepository();
      
      await job.updateProgress(20);
      
      const playerPushService = new PlayerPushService(
        clashOfClansService,
        playerRepository,
        legendLeagueLogRepository,
        clanRepository
      );

      await job.updateProgress(30);
      
      // Processar todos os clans
      console.log(`[${new Date().toISOString()}] 🔄 Processando todos os clans...`);
      await playerPushService.processAllClans();
      
      await job.updateProgress(100);
      
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] ✅ Job de player push concluído: ${jobId} (${duration}ms)`);
      
      return {
        success: true,
        duration,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${new Date().toISOString()}] ❌ Erro ao processar job ${jobId}:`, error);
      console.error(`[${new Date().toISOString()}] 📝 Stack trace:`, error instanceof Error ? error.stack : 'N/A');
      
      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Processar um job por vez
    removeOnComplete: {
      age: 3600, // Manter jobs completos por 1 hora
      count: 50, // Manter últimos 50 jobs
    },
    removeOnFail: {
      age: 24 * 3600, // Manter jobs falhos por 24 horas
      count: 100, // Manter últimos 100 jobs falhos
    },
  }
);

// Configurar job recorrente a cada 2 minutos
export async function setupPlayerPushJob() {
  try {
    // Limpar jobs existentes (opcional, comentado para não perder histórico)
    // await playerPushQueue.obliterate({ force: true });
    
    // Verificar se já existe um job recorrente
    const repeatableJobs = await playerPushQueue.getRepeatableJobs();
    const existingJob = repeatableJobs.find(job => job.name === "process-clans");
    
    if (existingJob) {
      // Remover job existente antes de criar um novo
      await playerPushQueue.removeRepeatableByKey(existingJob.key);
    }
    
    // Adicionar job recorrente
    await playerPushQueue.add(
      "process-clans",
      {},
      {
        repeat: {
          every: 2 * 60 * 1000, // 2 minutos em milissegundos
        },
        removeOnComplete: {
          age: 3600, // Manter jobs completos por 1 hora
          count: 10, // Manter últimos 10 jobs
        },
        removeOnFail: {
          age: 24 * 3600, // Manter jobs falhos por 24 horas
        },
      }
    );

    console.log(`[${new Date().toISOString()}] ✅ Job de player push configurado para executar a cada 2 minutos`);
    
    // Log de informações da queue
    const waiting = await playerPushQueue.getWaitingCount();
    const active = await playerPushQueue.getActiveCount();
    const completed = await playerPushQueue.getCompletedCount();
    const failed = await playerPushQueue.getFailedCount();
    
    console.log(`[${new Date().toISOString()}] 📊 Status da queue:`);
    console.log(`  - Waiting: ${waiting}`);
    console.log(`  - Active: ${active}`);
    console.log(`  - Completed: ${completed}`);
    console.log(`  - Failed: ${failed}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Erro ao configurar job de player push:`, error);
    throw error;
  }
}
