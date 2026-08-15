import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../generated/prisma/client';
import { Public } from '../auth/public.decorator';
import { PublicCatalogService } from './public-catalog.service';

@Controller('categories')
@Roles(UserRole.ADMIN)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService, private readonly catalog: PublicCatalogService) {}

  @Public()
  @Get('public/catalog')
  findPublicCatalog() { return this.catalog.findCatalog(); }

  @Get()
  findAll() { return this.categories.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.categories.findOne(id); }

  @Post()
  create(@Body() dto: CreateCategoryDto) { return this.categories.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) { return this.categories.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.categories.remove(id); }
}
