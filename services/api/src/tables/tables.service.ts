import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findAll() {
    const tables = await this.prisma.restaurantTable.findMany({ orderBy: { code: 'asc' } });
    return tables.map((table) => this.withQrUrl(table));
  }

  async findOne(id: string) {
    const table = await this.prisma.restaurantTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Table not found.');
    return this.withQrUrl(table);
  }

  async create(dto: CreateTableDto) {
    const table = await this.prisma.restaurantTable.create({ data: { ...dto, qrToken: this.newToken() } });
    return this.withQrUrl(table);
  }

  async update(id: string, dto: UpdateTableDto) {
    await this.findOne(id);
    const table = await this.prisma.restaurantTable.update({ where: { id }, data: dto });
    return this.withQrUrl(table);
  }

  /** Invalidates every printed sticker for this table. */
  async rotateToken(id: string) {
    await this.findOne(id);
    const table = await this.prisma.restaurantTable.update({ where: { id }, data: { qrToken: this.newToken() } });
    return this.withQrUrl(table);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.restaurantTable.delete({ where: { id } });
    return { id, deleted: true };
  }

  private newToken(): string {
    return randomBytes(32).toString('hex');
  }

  private withQrUrl(table: { qrToken: string } & Record<string, unknown>) {
    const siteUrl = this.config.get<string>('PUBLIC_SITE_URL') ?? 'http://localhost:4200';
    return { ...table, qrUrl: `${siteUrl.replace(/\/$/, '')}/order?table=${table.qrToken}` };
  }
}
