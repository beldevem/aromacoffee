import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, Sse } from '@nestjs/common';
import { interval, map, merge, Observable } from 'rxjs';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { OrderEventsService } from './order-events.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PayOrderDto } from './dto/pay-order.dto';
import { CreateStaffOrderDto } from './dto/create-staff-order.dto';
import { Roles } from '../auth/roles.decorator';
import { OrderChannel, OrderStatus, UserRole } from '../generated/prisma/client';

type StaffRequest = Request & { user: { name: string } };

@Controller('orders')
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly events: OrderEventsService,
  ) {}

  /** Live feed of incoming orders; the heartbeat keeps proxies from dropping idle connections. */
  @Sse('stream')
  stream(): Observable<{ type: string; data: string }> {
    return merge(
      this.events.stream.pipe(map((order) => ({ type: 'new-order', data: JSON.stringify(order) }))),
      interval(25_000).pipe(map(() => ({ type: 'heartbeat', data: '{}' }))),
    );
  }

  @Get()
  findAll(
    @Query('status') status?: OrderStatus,
    @Query('channel') channel?: OrderChannel,
    @Query('tableId') tableId?: string,
    @Query('paid') paid?: string,
    @Query('period') period?: string,
  ) {
    return this.orders.findAll({ status, channel, tableId, ...this.paidFlag(paid), ...this.periodRange(period) });
  }

  // Takings are management information, so this stays admin-only even though the list is shared.
  @Get('summary')
  @Roles(UserRole.ADMIN)
  summary(
    @Query('status') status?: OrderStatus,
    @Query('channel') channel?: OrderChannel,
    @Query('tableId') tableId?: string,
    @Query('paid') paid?: string,
    @Query('period') period?: string,
  ) {
    return this.orders.summary({ status, channel, tableId, ...this.paidFlag(paid), ...this.periodRange(period) });
  }

  @Get('cash-register')
  @Roles(UserRole.ADMIN)
  cashRegister(@Query('days') days?: string) {
    const parsed = Number(days);
    return this.orders.cashRegister(Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 90) : 30);
  }

  // Declared after every literal path above, and constrained so those can never fall through here.
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.orders.findOne(id);
    if (!order) throw new NotFoundException('Commande introuvable.');
    return order;
  }

  @Post()
  create(@Body() dto: CreateStaffOrderDto, @Req() request: StaffRequest) {
    return this.orders.createFromStaff(dto, { name: request.user.name });
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderStatusDto, @Req() request: StaffRequest) {
    return this.orders.updateStatus(id, dto.status, { name: request.user.name });
  }

  @Patch(':id/payment')
  pay(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PayOrderDto, @Req() request: StaffRequest) {
    return this.orders.markPaid(id, dto.paymentMethod, { name: request.user.name });
  }

  private paidFlag(paid?: string): { paid?: boolean } {
    if (paid === 'true') return { paid: true };
    if (paid === 'false') return { paid: false };
    return {};
  }

  private periodRange(period?: string): { from?: Date; to?: Date } {
    if (period !== 'today') return {};
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    return { from, to };
  }
}
