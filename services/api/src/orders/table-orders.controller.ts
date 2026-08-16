import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { OrderSessionGuard } from './order-session.guard';
import type { OrderSessionRequest } from './order-session.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

/** Customer-facing endpoints, reachable only with a valid table session token. */
@Controller('table-orders')
@Public()
@UseGuards(OrderSessionGuard)
export class TableOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Req() request: OrderSessionRequest, @Body() dto: CreateOrderDto) {
    return this.orders.createFromSession(request.orderSession!, dto);
  }

  @Get('mine')
  mine(@Req() request: OrderSessionRequest) {
    return this.orders.findBySession(request.orderSession!);
  }
}
