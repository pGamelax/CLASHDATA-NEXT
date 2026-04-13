import { prisma } from "../lib/prisma";
import { PendingClanPaymentStatus } from "../generated/prisma";

export class PendingClanPaymentRepository {
  async create(data: {
    userId: string;
    clanTag: string;
    clanName: string;
    plan: string;
    period: string;
    amount: number;
    externalId?: string;
    pixCode?: string;
    pixQrCodeBase64?: string;
    pixExpiresAt?: Date;
  }) {
    return await prisma.pendingClanPayment.create({ data });
  }

  async findByExternalId(externalId: string) {
    return await prisma.pendingClanPayment.findUnique({ where: { externalId } });
  }

  async findPendingByUserId(userId: string) {
    return await prisma.pendingClanPayment.findFirst({
      where: { userId, status: PendingClanPaymentStatus.PENDING },
      orderBy: { createdAt: "desc" },
    });
  }

  async markAsPaid(id: string) {
    return await prisma.pendingClanPayment.update({
      where: { id },
      data: { status: PendingClanPaymentStatus.PAID, paidAt: new Date() },
    });
  }

  async expireOldPending(userId: string) {
    await prisma.pendingClanPayment.updateMany({
      where: {
        userId,
        status: PendingClanPaymentStatus.PENDING,
        pixExpiresAt: { lt: new Date() },
      },
      data: { status: PendingClanPaymentStatus.EXPIRED },
    });
  }
}
