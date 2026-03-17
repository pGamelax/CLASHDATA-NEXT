import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { env } from "../env";
import { SeasonSnapshotService } from "../services/season-snapshot.service";
import { SeasonSnapshotRepository } from "../repositories/season-snapshot.repository";
import { ClanRepository } from "../repositories/clan.repository";
import { ClashOfClansService } from "../services/clash-of-clans.service";

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const seasonSnapshotQueue = new Queue("season-snapshot", { connection });

export const seasonSnapshotWorker = new Worker(
  "season-snapshot",
  async (job) => {
    const { seasonEndDateId } = job.data;

    console.log(`[SeasonSnapshot] Iniciando captura para temporada ${seasonEndDateId}`);

    const service = new SeasonSnapshotService(
      new ClanRepository(),
      new ClashOfClansService(),
      new SeasonSnapshotRepository()
    );

    await service.captureAllClans(seasonEndDateId);

    return {
      success: true,
      seasonEndDateId,
      completedAt: new Date().toISOString(),
    };
  },
  {
    connection,
    concurrency: 1,
    removeOnComplete: { age: 7 * 24 * 3600, count: 50 },
    removeOnFail: { age: 7 * 24 * 3600, count: 100 },
  }
);

// Schedule a snapshot job at 02:00 AM São Paulo (= 05:00 UTC)
export async function scheduleSeasonSnapshot(
  seasonEndDateId: string,
  date: string
): Promise<string> {
  // date format: "2026-03-19"
  const targetUTC = new Date(`${date}T05:00:00.000Z`);
  const delay = Math.max(0, targetUTC.getTime() - Date.now());

  const jobId = `season-snapshot-${seasonEndDateId}`;

  // Remove any existing job for this date
  const existing = await seasonSnapshotQueue.getJob(jobId);
  if (existing) await existing.remove();

  await seasonSnapshotQueue.add(
    "capture-season",
    { seasonEndDateId },
    {
      delay,
      jobId,
      removeOnComplete: { age: 7 * 24 * 3600 },
      removeOnFail: { age: 7 * 24 * 3600 },
    }
  );

  const scheduledFor = targetUTC.toISOString();
  console.log(`[SeasonSnapshot] Job agendado para ${scheduledFor} (delay: ${Math.round(delay / 60000)}min)`);

  return jobId;
}

export async function cancelSeasonSnapshot(jobId: string): Promise<void> {
  const job = await seasonSnapshotQueue.getJob(jobId);
  if (job) await job.remove();
}
