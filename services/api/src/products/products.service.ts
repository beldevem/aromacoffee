import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SupabaseStorageService } from './supabase-storage.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
  ) {}

  async findAll(query: ListProductsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 50, 100);
    const where = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { nameFr: { contains: query.search, mode: 'insensitive' as const } },
              { nameAr: { contains: query.search, mode: 'insensitive' as const } },
              { slug: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, flag: true },
        orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: items.map((item) => this.toResponse(item)), total, page, limit };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: { category: true, flag: true } });
    if (!product) throw new NotFoundException('Product not found.');
    return this.toResponse(product);
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({ data: dto, include: { category: true, flag: true } });
    return this.toResponse(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    const product = await this.prisma.product.update({ where: { id }, data: dto, include: { category: true, flag: true } });
    return this.toResponse(product);
  }

  async uploadImage(id: string, file?: { buffer: Buffer; mimetype: string }) {
    if (!file) throw new NotFoundException('An image file is required.');
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found.');
    const imageUrl = await this.storage.upload(product.slug, file);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { imageUrl },
      include: { category: true, flag: true },
    });
    return this.toResponse(updated);
  }

  async deleteImage(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found.');
    await this.storage.remove(product.slug);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { imageUrl: null },
      include: { category: true, flag: true },
    });
    return this.toResponse(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { id, deleted: true };
  }

  private toResponse(product: any) {
    return {
      ...product,
      price: `${(product.promoPrice ?? product.priceCents) / 100} DT`,
    };
  }
}
