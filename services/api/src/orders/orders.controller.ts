import { Body, Controller, Get, Param, Patch, Query, Sse } from '@nestjs/common';
import { interval, map, merge, Observable } from 'rxjs';
import { OrdersService } from './orders.service';
import { OrderEventsService } from './order-events.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Roles } from '../auth/roles.decorator';
import { OrderStatus, UserRole } from '../generated/prisma/client';

@Controller('orders')
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly events: OrderEventsService,
  ) {}

  /** Live feed of incoming QR orders; the heartbeat keeps proxies from dropping idle connections. */
  @Sse('stream')
  stream(): Observable<{ type: string; data: string }> {
    return merge(
      this.events.stream.pipe(map((order) => ({ type: 'new-order', data: JSON.stringify(order) }))),
      interval(25_000).pipe(map(() => ({ type: 'heartbeat', data: '{}' }))),
    );
  }

  @Get()
  findAll(@Query('status') status?: OrderStatus) {
    return this.orders.findAll(status);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto.status);
  }
}
