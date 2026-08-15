import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual, scryptSync } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.active || !this.verify(password, user.passwordHash)) throw new UnauthorizedException('Identifiants invalides.');
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role, name: user.name });
    return { accessToken, user: this.safe(user) };
  }

  async findUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.safe(user) : null;
  }

  private verify(password: string, stored: string): boolean {
    const [salt, expectedHex] = stored.split(':');
    if (!salt || !expectedHex) return false;
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  }

  private safe(user: { id: string; name: string; email: string; role: string; active: boolean }) {
    return { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active };
  }
}
