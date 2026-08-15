import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '../generated/prisma/client';

type AuthRequest = Request & { user?: { sub: string; email: string; role: UserRole; name: string } };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Authentification requise.');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; role: UserRole; name: string }>(token);
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Session invalide ou expirée.');
    }
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (roles?.length && !roles.includes(request.user!.role)) throw new UnauthorizedException('Droits insuffisants.');
    return true;
  }
}
