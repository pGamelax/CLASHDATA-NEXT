import { prisma } from "../lib/prisma";
import { PixPaymentStatus } from "../generated/prisma";

export class PixPaymentRepository {
  async create(data: {
    clanId: string;
    subscriptionId: string;
    amount: number;
    plan: string;
    period: string;
    upgradeOnly?: boolean;
    externalId?: string;
    pixCode?: string;
    pixQrCodeBase64?: string;
    pixExpiresAt?: Date;
    periodFrom?: Date;
    periodTo?: Date;
  }) {
    return await prisma.pixPayment.create({ data });
  }

  async findById(id: string) {
    return await prisma.pixPayment.findUnique({ where: { id } });
  }

  async findByExternalId(externalId: string) {
    return await prisma.pixPayment.findUnique({ where: { externalId } });
  }

  async findPendingByClanId(clanId: string) {
    return await prisma.pixPayment.findFirst({
      where: { clanId, status: PixPaymentStatus.PENDING },
      orderBy: { createdAt: "desc" },
    });
  }

  async findLatestByClanId(clanId: string) {
    return await prisma.pixPayment.findFirst({
      where: { clanId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(
    id: string,
    data: {
      status?: PixPaymentStatus;
      externalId?: string;
      pixCode?: string;
      pixQrCodeBase64?: string;
      pixExpiresAt?: Date;
      periodFrom?: Date;
      periodTo?: Date;
      paidAt?: Date;
    }
  ) {
    return await prisma.pixPayment.update({ where: { id }, data });
  }

  async markAsPaid(id: string) {
    return await prisma.pixPayment.update({
      where: { id },
      data: { status: PixPaymentStatus.PAID, paidAt: new Date() },
    });
  }

  async expireOldPending(clanId: string) {
    await prisma.pixPayment.updateMany({
      where: {
        clanId,
        status: PixPaymentStatus.PENDING,
        pixExpiresAt: { lt: new Date() },
      },
      data: { status: PixPaymentStatus.EXPIRED },
    });
  }
}
