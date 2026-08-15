import { randomBytes, scryptSync } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } }).then((users) => users.map((user) => this.safe(user))); }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    return this.safe(user);
  }

  async create(dto: CreateUserDto) {
    const { password, ...data } = dto;
    const user = await this.prisma.user.create({ data: { ...data, passwordHash: this.hash(password) } });
    return this.safe(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const { password, ...data } = dto;
    const user = await this.prisma.user.update({ where: { id }, data: password ? { ...data, passwordHash: this.hash(password) } : data });
    return this.safe(user);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { id, deleted: true };
  }

  private hash(password: string): string {
    const salt = randomBytes(16).toString('hex');
    return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  }

  private safe(user: { id: string; name: string; email: string; role: string; active: boolean; createdAt: Date; updatedAt: Date }) {
    return user;
  }
}
