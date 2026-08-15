import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { SupabaseStorageService } from './supabase-storage.service';

@Module({
	controllers: [ProductsController],
	providers: [ProductsService, SupabaseStorageService],
	exports: [ProductsService],
})
export class ProductsModule {}
