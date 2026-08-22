import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseCategory, Prisma } from '../generated/prisma/client';

export interface ExpenseFilters {
  category?: ExpenseCategory;
  period?: string;
  from?: Date;
  to?: Date;
  search?: string;
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ExpenseFilters) {
    const where = this.buildWhere(filters);
    return this.prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Dépense introuvable.');
    return expense;
  }

  async create(dto: CreateExpenseDto, actor: { name: string }) {
    return this.prisma.expense.create({
      data: {
        title: dto.title.trim(),
        category: dto.category,
        amountCents: dto.amountCents,
        date: dto.date ? new Date(dto.date) : new Date(),
        paymentMethod: dto.paymentMethod,
        invoiceNumber: dto.invoiceNumber?.trim() || null,
        note: dto.note?.trim() || null,
        createdBy: actor.name,
      },
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findOne(id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.amountCents !== undefined && { amountCents: dto.amountCents }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.paymentMethod !== undefined && { paymentMethod: dto.paymentMethod }),
        ...(dto.invoiceNumber !== undefined && { invoiceNumber: dto.invoiceNumber?.trim() || null }),
        ...(dto.note !== undefined && { note: dto.note?.trim() || null }),
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async summary(filters: ExpenseFilters) {
    const where = this.buildWhere(filters);
    const expenses = await this.prisma.expense.findMany({ where });

    const totalCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);
    const totalCount = expenses.length;

    // Grouping by category
    const byCategory: Record<string, { count: number; totalCents: number; percentage: number }> = {};
    for (const cat of Object.values(ExpenseCategory)) {
      byCategory[cat] = { count: 0, totalCents: 0, percentage: 0 };
    }

    for (const expense of expenses) {
      if (!byCategory[expense.category]) {
        byCategory[expense.category] = { count: 0, totalCents: 0, percentage: 0 };
      }
      byCategory[expense.category].count += 1;
      byCategory[expense.category].totalCents += expense.amountCents;
    }

    if (totalCents > 0) {
      for (const cat of Object.keys(byCategory)) {
        byCategory[cat].percentage = Number(((byCategory[cat].totalCents / totalCents) * 100).toFixed(1));
      }
    }

    // Also calculate revenue collected in the same period from paid orders to give Net Profit
    const dateRange = this.buildDateRange(filters);
    const orderWhere: Prisma.OrderWhereInput = {
      paidAt: dateRange ? { not: null, ...dateRange } : { not: null },
    };
    const paidOrders = await this.prisma.order.findMany({
      where: orderWhere,
      select: { totalCents: true },
    });
    const revenueCents = paidOrders.reduce((sum, o) => sum + o.totalCents, 0);
    const netProfitCents = revenueCents - totalCents;

    return {
      totalCount,
      totalCents,
      revenueCents,
      netProfitCents,
      byCategory,
    };
  }

  private buildWhere(filters: ExpenseFilters): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { note: { contains: q, mode: 'insensitive' } },
      ];
    }

    const dateRange = this.buildDateRange(filters);
    if (dateRange) {
      where.date = dateRange;
    }

    return where;
  }

  private buildDateRange(filters: ExpenseFilters): { gte?: Date; lte?: Date; lt?: Date } | null {
    if (filters.from || filters.to) {
      return {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      };
    }
    if (filters.period) {
      const now = new Date();
      if (filters.period === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        return { gte: start, lt: end };
      }
      if (filters.period === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return { gte: start, lt: end };
      }
      if (filters.period === 'year') {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear() + 1, 0, 1);
        return { gte: start, lt: end };
      }
    }
    return null;
  }
}
