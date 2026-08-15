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

    const [todayReservations, pendingReservations, categories, publishedProducts] = await Promise.all([
      this.prisma.reservation.count({ where: { dateTime: { gte: startOfDay, lt: endOfDay } } }),
      this.prisma.reservation.count({ where: { status: 'PENDING' } }),
      this.prisma.category.count({ where: { visible: true } }),
      this.prisma.product.count({ where: { status: 'PUBLISHED' } }),
    ]);

    return { todayReservations, pendingReservations, categories, publishedProducts };
  }
}
