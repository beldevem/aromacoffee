import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PublicCatalogService } from './public-catalog.service';

@Module({ controllers: [CategoriesController], providers: [CategoriesService, PublicCatalogService], exports: [CategoriesService, PublicCatalogService] })
export class CategoriesModule {}
