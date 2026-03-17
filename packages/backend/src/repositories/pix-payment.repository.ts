import { prisma } from "../lib/prisma";
import { PixPaymentStatus } from "../generated/prisma";

export class PixPaymentRepository {
  async create(data: {
    organizationId: string;
    subscriptionId: string;
    amount: number;
    plan: string;
    period: string;
    syncpayId?: string;
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

  async findBySyncpayId(syncpayId: string) {
    return await prisma.pixPayment.findUnique({ where: { syncpayId } });
  }

  async findPendingByOrganizationId(organizationId: string) {
    return await prisma.pixPayment.findFirst({
      where: {
        organizationId,
        status: PixPaymentStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findLatestByOrganizationId(organizationId: string) {
    return await prisma.pixPayment.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, data: {
    status?: PixPaymentStatus;
    syncpayId?: string;
    pixCode?: string;
    pixQrCodeBase64?: string;
    pixExpiresAt?: Date;
    periodFrom?: Date;
    periodTo?: Date;
    paidAt?: Date;
  }) {
    return await prisma.pixPayment.update({ where: { id }, data });
  }

  async markAsPaid(id: string) {
    return await prisma.pixPayment.update({
      where: { id },
      data: {
        status: PixPaymentStatus.PAID,
        paidAt: new Date(),
      },
    });
  }

  async expireOldPending(organizationId: string) {
    await prisma.pixPayment.updateMany({
      where: {
        organizationId,
        status: PixPaymentStatus.PENDING,
        pixExpiresAt: { lt: new Date() },
      },
      data: { status: PixPaymentStatus.EXPIRED },
    });
  }
}
