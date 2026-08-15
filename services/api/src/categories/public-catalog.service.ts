import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  findCatalog() {
    return this.prisma.category.findMany({
      where: { visible: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        products: {
          where: { status: 'PUBLISHED' },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: { flag: true },
        },
      },
    });
  }
}
