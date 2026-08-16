import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderSessionPayload } from './order-session.service';
import { OrderEventsService } from './order-events.service';
import { OrderStatus } from '../generated/prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: OrderEventsService,
  ) {}

  async createFromSession(session: OrderSessionPayload, dto: CreateOrderDto) {
    // Merge duplicate lines so the client cannot inflate the cart with repeated entries.
    const quantities = new Map<string, number>();
    for (const line of dto.items) {
      quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: [...quantities.keys()] }, status: 'PUBLISHED' },
    });
    if (products.length !== quantities.size) {
      throw new BadRequestException('Certains articles ne sont plus disponibles.');
    }

    // Prices are always recomputed server-side; the client only sends product ids and quantities.
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

    const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

    const order = await this.prisma.order.create({
      data: {
        reference: this.newReference(),
        tableId: session.sub,
        sessionId: session.jti,
        totalCents,
        note: dto.note,
        items: { create: items },
      },
      include: { items: true, table: { select: { code: true, label: true } } },
    });

    this.events.emitNewOrder({
      id: order.id,
      reference: order.reference,
      totalCents: order.totalCents,
      createdAt: order.createdAt.toISOString(),
      table: order.table,
      items: order.items.map(({ nameFr, quantity }) => ({ nameFr, quantity })),
    });

    return order;
  }
  /** Orders placed during the current scan, so the customer can follow what they ordered. */
  findBySession(session: OrderSessionPayload) {
    return this.prisma.order.findMany({
      where: { sessionId: session.jti },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  findAll(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { items: true, table: { select: { code: true, label: true } } },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true, table: { select: { code: true, label: true } } },
    });
  }

  private newReference(): string {
    return randomBytes(3).toString('hex').toUpperCase();
  }
}
