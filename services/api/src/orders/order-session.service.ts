import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

export const ORDER_SESSION_TTL_MINUTES = 30;
export const ORDER_SESSION_HEADER = 'x-order-session';

export interface OrderSessionPayload {
  /** Table id. */
  sub: string;
  /** Unique id of this scan, stored on every order it produces. */
  jti: string;
  code: string;
  label: string;
  type: 'order-session';
  exp?: number;
}

/** Sliding window of session creations per table, used to blunt QR token scraping. */
const MAX_SESSIONS_PER_TABLE_PER_MINUTE = 10;

@Injectable()
export class OrderSessionService {
  private readonly recentStarts = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async start(qrToken: string) {
    const table = await this.prisma.restaurantTable.findUnique({ where: { qrToken } });
    if (!table || !table.active) {
      throw new UnauthorizedException('QR code invalide ou table indisponible.');
    }
    this.assertNotThrottled(table.id);

    const payload: OrderSessionPayload = {
      sub: table.id,
      jti: randomUUID(),
      code: table.code,
      label: table.label,
      type: 'order-session',
    };
    const token = await this.jwt.signAsync(payload, { expiresIn: `${ORDER_SESSION_TTL_MINUTES}m` });

    return {
      sessionToken: token,
      expiresAt: new Date(Date.now() + ORDER_SESSION_TTL_MINUTES * 60_000).toISOString(),
      table: { code: table.code, label: table.label },
    };
  }

  async verify(token: string): Promise<OrderSessionPayload> {
    let payload: OrderSessionPayload;
    try {
      payload = await this.jwt.verifyAsync<OrderSessionPayload>(token);
    } catch {
      throw new UnauthorizedException('Session expirée. Merci de rescanner le QR code de votre table.');
    }
    // Prevents an admin access token from being replayed as an ordering session.
    if (payload.type !== 'order-session') {
      throw new UnauthorizedException('Session invalide.');
    }
    const table = await this.prisma.restaurantTable.findUnique({ where: { id: payload.sub } });
    if (!table || !table.active) {
      throw new ForbiddenException('Cette table n’accepte plus de commandes.');
    }
    return payload;
  }

  private assertNotThrottled(tableId: string) {
    const now = Date.now();
    const window = (this.recentStarts.get(tableId) ?? []).filter((at) => now - at < 60_000);
    if (window.length >= MAX_SESSIONS_PER_TABLE_PER_MINUTE) {
      throw new ForbiddenException('Trop de tentatives. Merci de patienter une minute.');
    }
    window.push(now);
    this.recentStarts.set(tableId, window);
  }
}
