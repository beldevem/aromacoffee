import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { OrderSessionService } from './order-session.service';
import { OrderSessionGuard } from './order-session.guard';
import type { OrderSessionRequest } from './order-session.guard';
import { StartOrderSessionDto } from './dto/start-order-session.dto';

@Controller('order-sessions')
export class OrderSessionsController {
  constructor(private readonly sessions: OrderSessionService) {}

  /** Exchanges the secret printed in the table QR code for a short-lived ordering session. */
  @Public()
  @Post()
  start(@Body() dto: StartOrderSessionDto) {
    return this.sessions.start(dto.qrToken);
  }

  @Public()
  @UseGuards(OrderSessionGuard)
  @Get('me')
  me(@Req() request: OrderSessionRequest) {
    const session = request.orderSession!;
    return {
      table: { code: session.code, label: session.label },
      expiresAt: new Date((session.exp ?? 0) * 1000).toISOString(),
    };
  }
}
