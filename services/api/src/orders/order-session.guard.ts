import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ORDER_SESSION_HEADER, OrderSessionPayload, OrderSessionService } from './order-session.service';

export type OrderSessionRequest = Request & { orderSession?: OrderSessionPayload };

@Injectable()
export class OrderSessionGuard implements CanActivate {
  constructor(private readonly sessions: OrderSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OrderSessionRequest>();
    const raw = request.headers[ORDER_SESSION_HEADER];
    const token = Array.isArray(raw) ? raw[0] : raw;
    if (!token) {
      throw new UnauthorizedException('Session de table manquante. Merci de scanner le QR code de votre table.');
    }
    request.orderSession = await this.sessions.verify(token);
    return true;
  }
}
