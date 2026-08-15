import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';

@Injectable()
export class BadgesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.flag.findMany({ orderBy: { slug: 'asc' }, include: { _count: { select: { products: true } } } }); }

  async findOne(id: string) {
    const badge = await this.prisma.flag.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
    if (!badge) throw new NotFoundException('Badge not found.');
    return badge;
  }

  create(dto: CreateBadgeDto) { return this.prisma.flag.create({ data: dto, include: { _count: { select: { products: true } } } }); }

  async update(id: string, dto: UpdateBadgeDto) {
    await this.findOne(id);
    return this.prisma.flag.update({ where: { id }, data: dto, include: { _count: { select: { products: true } } } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.flag.delete({ where: { id } });
    return { id, deleted: true };
  }
}
