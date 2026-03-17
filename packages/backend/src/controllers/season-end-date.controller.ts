import { auth } from "../auth";
import { SeasonSnapshotRepository } from "../repositories/season-snapshot.repository";
import {
  scheduleSeasonSnapshot,
  cancelSeasonSnapshot,
  seasonSnapshotQueue,
} from "../jobs/season-snapshot.job";

const repository = new SeasonSnapshotRepository();

async function requireAdmin({ request, set }: any) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    set.status = 401;
    return { error: "Não autenticado" };
  }
  if (session.user.role !== "admin") {
    set.status = 403;
    return { error: "Acesso negado" };
  }
  return null;
}

export class SeasonEndDateController {
  async create({ body, request, set }: any) {
    const denied = await requireAdmin({ request, set });
    if (denied) return denied;

    const { date, label } = body as { date: string; label?: string };

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      set.status = 400;
      return { error: "Data inválida. Use o formato YYYY-MM-DD" };
    }

    const seasonDate = await repository.createSeasonEndDate({ date, label });
    const jobId = await scheduleSeasonSnapshot(seasonDate.id, date);
    await repository.updateSeasonEndDate(seasonDate.id, { jobId });

    return { data: { ...seasonDate, jobId } };
  }

  async list({ request, set }: any) {
    const denied = await requireAdmin({ request, set });
    if (denied) return denied;

    const dates = await repository.getAllSeasonEndDates();
    return { data: dates };
  }

  async remove({ params, request, set }: any) {
    const denied = await requireAdmin({ request, set });
    if (denied) return denied;

    const existing = await repository.getSeasonEndDateById(params.id);
    if (!existing) {
      set.status = 404;
      return { error: "Temporada não encontrada" };
    }

    if (existing.jobId) {
      await cancelSeasonSnapshot(existing.jobId);
    }

    await repository.deleteSeasonEndDate(params.id);
    return { success: true };
  }

  // Admin: trigger immediately (for testing or manual override)
  async triggerNow({ params, request, set }: any) {
    const denied = await requireAdmin({ request, set });
    if (denied) return denied;

    const existing = await repository.getSeasonEndDateById(params.id);
    if (!existing) {
      set.status = 404;
      return { error: "Temporada não encontrada" };
    }

    await seasonSnapshotQueue.add(
      "capture-season-manual",
      { seasonEndDateId: params.id },
      { removeOnComplete: { age: 7 * 24 * 3600 } }
    );

    return { success: true, message: "Captura iniciada manualmente" };
  }

  // Public (clan page): get snapshots for a clan
  async getSnapshotsByClan({ params }: any) {
    const raw = params.clanTag as string;
    const clanTag = raw.startsWith("#") ? raw : `#${raw}`;
    const snapshots = await repository.getSnapshotsByClanTag(clanTag);
    return { data: snapshots };
  }
}
