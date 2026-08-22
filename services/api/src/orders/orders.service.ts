import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, OrderLineDto } from './dto/create-order.dto';
import { CreateStaffOrderDto } from './dto/create-staff-order.dto';
import { OrderSessionPayload } from './order-session.service';
import { OrderEventsService } from './order-events.service';
import { OrderChannel, OrderStatus, PaymentMethod, Prisma } from '../generated/prisma/client';

export interface OrderActor {
  name: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  channel?: OrderChannel;
  tableId?: string;
  paid?: boolean;
  from?: Date;
  to?: Date;
}

const ORDER_INCLUDE = {
  items: true,
  table: { select: { code: true, label: true } },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: OrderEventsService,
  ) {}

  async createFromSession(session: OrderSessionPayload, dto: CreateOrderDto) {
    const { items, totalCents } = await this.priceLines(dto.items);

    const order = await this.prisma.order.create({
      data: {
        reference: this.newReference(),
        tableId: session.sub,
        sessionId: session.jti,
        channel: OrderChannel.QR,
        createdBy: 'customer',
        totalCents,
        note: dto.note,
        items: { create: items },
      },
      include: ORDER_INCLUDE,
    });

    this.publish(order);
    return order;
  }

  /** Counter orders: a member of staff keys in what the customer asked for verbally. */
  async createFromStaff(dto: CreateStaffOrderDto, actor: OrderActor) {
    if (!dto.takeaway && !dto.tableId) {
      throw new BadRequestException('Choisissez une table ou marquez la commande à emporter.');
    }
    if (dto.tableId) {
      const table = await this.prisma.restaurantTable.findUnique({ where: { id: dto.tableId } });
      if (!table) throw new BadRequestException('Table introuvable.');
    }

    const { items, totalCents } = await this.priceLines(dto.items);
    const paid = dto.markPaid === true;
    const now = new Date();

    const order = await this.prisma.order.create({
      data: {
        reference: this.newReference(),
        tableId: dto.takeaway ? null : dto.tableId,
        takeaway: dto.takeaway ?? false,
        channel: OrderChannel.COUNTER,
        createdBy: actor.name,
        // Keying an order in is itself an act of validation by that member of staff.
        validatedBy: actor.name,
        validatedAt: now,
        // Paying upfront does not mean it is made yet, so fulfilment still starts at PENDING.
        status: OrderStatus.PENDING,
        paidBy: paid ? actor.name : null,
        paidAt: paid ? now : null,
        paymentMethod: paid ? dto.paymentMethod ?? PaymentMethod.CASH : null,
        totalCents,
        note: dto.note,
        items: { create: items },
      },
      include: ORDER_INCLUDE,
    });

    this.publish(order);
    return order;
  }

  findBySession(session: OrderSessionPayload) {
    return this.prisma.order.findMany({
      where: { sessionId: session.jti },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  findAll(filters: OrderFilters = {}) {
    return this.prisma.order.findMany({
      where: this.toWhere(filters),
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: ORDER_INCLUDE,
    });
  }

  findOne(id: string) {
    return this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  }

  /** Totals for the orders board, computed over the same filter as the list. */
  async summary(filters: OrderFilters = {}) {
    const where = this.toWhere(filters);
    const [grouped, paid] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
        _sum: { totalCents: true },
      }),
      this.prisma.order.aggregate({
        where: { ...where, paidAt: { not: null } },
        _count: { _all: true },
        _sum: { totalCents: true },
      }),
    ]);

    const byStatus = Object.fromEntries(
      grouped.map((row) => [row.status, { count: row._count._all, totalCents: row._sum.totalCents ?? 0 }]),
    );

    return {
      totalOrders: grouped.reduce((sum, row) => sum + row._count._all, 0),
      // Cancelled orders are excluded so the figure reflects real business.
      totalCents: grouped
        .filter((row) => row.status !== OrderStatus.CANCELLED)
        .reduce((sum, row) => sum + (row._sum.totalCents ?? 0), 0),
      paidOrders: paid._count._all,
      paidCents: paid._sum.totalCents ?? 0,
      byStatus,
    };
  }

  async updateStatus(id: string, status: OrderStatus, actor: OrderActor) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Commande introuvable.');

    const data: Prisma.OrderUpdateInput = { status };

    // The first person to move it off PENDING is the one who validated it.
    if (status !== OrderStatus.PENDING && !order.validatedBy) {
      data.validatedBy = actor.name;
      data.validatedAt = new Date();
    }

    return this.prisma.order.update({ where: { id }, data, include: ORDER_INCLUDE });
  }

  /** Payment is recorded independently of fulfilment; an order can be paid before it is served. */
  async markPaid(id: string, paymentMethod: PaymentMethod, actor: OrderActor) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Une commande annulée ne peut pas être encaissée.');
    }
    if (order.paidAt) throw new BadRequestException('Cette commande est déjà encaissée.');

    return this.prisma.order.update({
      where: { id },
      data: { paidAt: new Date(), paidBy: actor.name, paymentMethod },
      include: ORDER_INCLUDE,
    });
  }

  /** Pay all unpaid active orders for a given table at once */
  async markTablePaid(tableId: string, paymentMethod: PaymentMethod, actor: OrderActor) {
    const unpaidOrders = await this.prisma.order.findMany({
      where: {
        tableId,
        paidAt: null,
        status: { not: OrderStatus.CANCELLED },
      },
      include: ORDER_INCLUDE,
    });

    if (unpaidOrders.length === 0) {
      throw new BadRequestException('Aucune commande impayée pour cette table.');
    }

    const now = new Date();
    await this.prisma.order.updateMany({
      where: {
        id: { in: unpaidOrders.map((o) => o.id) },
      },
      data: {
        paidAt: now,
        paidBy: actor.name,
        paymentMethod,
      },
    });

    const updated = await this.prisma.order.findMany({
      where: {
        id: { in: unpaidOrders.map((o) => o.id) },
      },
      include: ORDER_INCLUDE,
    });

    for (const ord of updated) {
      this.publish(ord);
    }

    return updated;
  }

  /** Daily till: what was actually collected each day, split by tender and by who took it. */
  async cashRegister(days: number) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const totals = await this.prisma.$queryRaw<
      Array<{ day: Date; orders: number; total_cents: number; cash_cents: number; card_cents: number }>
    >`
      SELECT date_trunc('day', "paid_at") AS day,
             COUNT(*)::int AS orders,
             COALESCE(SUM("total_cents"), 0)::int AS total_cents,
             COALESCE(SUM(CASE WHEN "payment_method" = 'CASH' THEN "total_cents" ELSE 0 END), 0)::int AS cash_cents,
             COALESCE(SUM(CASE WHEN "payment_method" = 'CARD' THEN "total_cents" ELSE 0 END), 0)::int AS card_cents
      FROM "orders"
      WHERE "paid_at" IS NOT NULL AND "paid_at" >= ${since}
      GROUP BY 1
      ORDER BY 1 DESC
    `;

    const perAgent = await this.prisma.$queryRaw<
      Array<{ day: Date; paid_by: string | null; orders: number; total_cents: number }>
    >`
      SELECT date_trunc('day', "paid_at") AS day,
             "paid_by",
             COUNT(*)::int AS orders,
             COALESCE(SUM("total_cents"), 0)::int AS total_cents
      FROM "orders"
      WHERE "paid_at" IS NOT NULL AND "paid_at" >= ${since}
      GROUP BY 1, 2
      ORDER BY 1 DESC, 4 DESC
    `;

    return totals.map((row) => {
      const day = row.day.toISOString().slice(0, 10);
      return {
        day,
        orders: row.orders,
        totalCents: row.total_cents,
        cashCents: row.cash_cents,
        cardCents: row.card_cents,
        agents: perAgent
          .filter((agent) => agent.day.toISOString().slice(0, 10) === day)
          .map((agent) => ({
            name: agent.paid_by ?? 'inconnu',
            orders: agent.orders,
            totalCents: agent.total_cents,
          })),
      };
    });
  }

  private toWhere(filters: OrderFilters): Prisma.OrderWhereInput {    const createdAt = filters.from || filters.to ? { gte: filters.from, lt: filters.to } : undefined;
    return {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.channel ? { channel: filters.channel } : {}),
      ...(filters.tableId ? { tableId: filters.tableId } : {}),
      ...(createdAt ? { createdAt } : {}),
    };
  }

  private async priceLines(lines: OrderLineDto[]) {
    // Merge duplicate lines so the client cannot inflate the cart with repeated entries.
    const quantities = new Map<string, number>();
    for (const line of lines) {
      quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: [...quantities.keys()] }, status: 'PUBLISHED' },
    });
    if (products.length !== quantities.size) {
      throw new BadRequestException('Certains articles ne sont plus disponibles.');
    }

    // Prices are always recomputed here; callers only supply product ids and quantities.
    const items = products.map((product) => {
      const quantity = quantities.get(product.id)!;
      const isPromotion =
        product.promotion && product.promoPrice != null && product.promoPrice < (product.ogPrice ?? product.priceCents);
      const unitPriceCents = isPromotion ? product.promoPrice! : product.priceCents;
      return {
        productId: product.id,
        nameFr: product.nameFr,
        unitPriceCents,
        quantity,
        lineTotalCents: unitPriceCents * quantity,
      };
    });

    return { items, totalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0) };
  }

  private publish(order: OrderWithRelations) {
    this.events.emitNewOrder({
      id: order.id,
      reference: order.reference,
      totalCents: order.totalCents,
      createdAt: order.createdAt.toISOString(),
      createdBy: order.createdBy,
      channel: order.channel,
      takeaway: order.takeaway,
      table: order.table,
      items: order.items.map(({ nameFr, quantity }) => ({ nameFr, quantity })),
    });
  }

  private newReference(): string {
    return randomBytes(3).toString('hex').toUpperCase();
  }
}
