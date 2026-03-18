import { auth } from "../auth";
import { prisma } from "../lib/prisma";

type ElysiaContext = {
  params?: Record<string, string>;
  body?: any;
  request: Request;
  status: (code: number, data?: any) => any;
};

async function requireAdmin(request: Request, status: ElysiaContext["status"]) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return status(401, { message: "Não autenticado" });
  if (session.user.role !== "admin") return status(403, { message: "Acesso negado" });
  return null;
}

export class AnnouncementController {
  async getActive(_context: ElysiaContext) {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return announcements;
  }

  async getAll(context: ElysiaContext) {
    const { request, status } = context;
    const deny = await requireAdmin(request, status);
    if (deny) return deny;

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return announcements;
  }

  async create(context: ElysiaContext) {
    const { request, body, status } = context;
    const deny = await requireAdmin(request, status);
    if (deny) return deny;

    const { title, content } = body as { title: string; content: string };
    const announcement = await prisma.announcement.create({
      data: { title, content },
    });
    return announcement;
  }

  async update(context: ElysiaContext) {
    const { request, body, params, status } = context;
    const deny = await requireAdmin(request, status);
    if (deny) return deny;

    const { id } = params!;
    const data = body as { title?: string; content?: string; isActive?: boolean };
    const announcement = await prisma.announcement.update({
      where: { id },
      data,
    });
    return announcement;
  }

  async delete(context: ElysiaContext) {
    const { request, params, status } = context;
    const deny = await requireAdmin(request, status);
    if (deny) return deny;

    const { id } = params!;
    await prisma.announcement.delete({ where: { id } });
    return { success: true };
  }
}
