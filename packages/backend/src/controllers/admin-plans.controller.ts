import { auth } from "../auth";
import { PlanRepository } from "../repositories/plan.repository";

type ElysiaContext = {
  params?: Record<string, string>;
  body?: any;
  request: Request;
  status: (code: number, data?: any) => any;
};

export class AdminPlansController {
  private planRepo = new PlanRepository();

  private async requireAdmin(request: Request, status: ElysiaContext["status"]) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return status(401, { message: "Não autenticado" });
    if (session.user.role !== "admin") return status(403, { message: "Apenas admins" });
    return session;
  }

  async getPlans({ request, status }: ElysiaContext) {
    const s = await this.requireAdmin(request, status);
    if (!s || typeof s !== "object" || !("user" in s)) return s;
    const plans = await this.planRepo.findAll();
    return { success: true, plans };
  }

  async seedPlans({ request, status }: ElysiaContext) {
    const s = await this.requireAdmin(request, status);
    if (!s || typeof s !== "object" || !("user" in s)) return s;
    const result = await this.planRepo.seedDefaults();
    return { success: true, ...result };
  }

  async createPlan({ body, request, status }: ElysiaContext) {
    const s = await this.requireAdmin(request, status);
    if (!s || typeof s !== "object" || !("user" in s)) return s;
    try {
      const plan = await this.planRepo.create(body);
      return { success: true, plan };
    } catch (err: any) {
      if (err?.code === "P2002") return status(409, { message: "Já existe um plano com essa key" });
      return status(500, { message: err?.message ?? "Erro ao criar plano" });
    }
  }

  async updatePlan({ params, body, request, status }: ElysiaContext) {
    const s = await this.requireAdmin(request, status);
    if (!s || typeof s !== "object" || !("user" in s)) return s;
    const id = params?.id;
    if (!id) return status(400, { message: "id é obrigatório" });
    try {
      const plan = await this.planRepo.update(id, body);
      return { success: true, plan };
    } catch (err: any) {
      if (err?.code === "P2025") return status(404, { message: "Plano não encontrado" });
      if (err?.code === "P2002") return status(409, { message: "Já existe um plano com essa key" });
      return status(500, { message: err?.message ?? "Erro ao atualizar plano" });
    }
  }

  async deletePlan({ params, request, status }: ElysiaContext) {
    const s = await this.requireAdmin(request, status);
    if (!s || typeof s !== "object" || !("user" in s)) return s;
    const id = params?.id;
    if (!id) return status(400, { message: "id é obrigatório" });
    try {
      await this.planRepo.delete(id);
      return { success: true };
    } catch (err: any) {
      if (err?.code === "P2025") return status(404, { message: "Plano não encontrado" });
      return status(500, { message: err?.message ?? "Erro ao excluir plano" });
    }
  }
}
