import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [
      todayReservations,
      pendingReservations,
      todayOrders,
      pendingOrders,
      preparingOrders,
      servedOrders,
      todayRevenue,
    ] = await Promise.all([
      this.prisma.reservation.count({ where: { dateTime: { gte: startOfDay, lt: endOfDay } } }),
      this.prisma.reservation.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfDay, lt: endOfDay } } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'PREPARING' } }),
      this.prisma.order.count({ where: { status: 'SERVED', createdAt: { gte: startOfDay, lt: endOfDay } } }),
      // Revenue counts money actually collected, so it keys off payment time.
      this.prisma.order.aggregate({
        _sum: { totalCents: true },
        where: { paidAt: { gte: startOfDay, lt: endOfDay } },
      }),
    ]);

    return {
      todayReservations,
      pendingReservations,
      todayOrders,
      pendingOrders,
      preparingOrders,
      servedOrders,
      todayRevenueCents: todayRevenue._sum.totalCents ?? 0,
    };
  }
}
