import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { BadgesModule } from './badges/badges.module';
import { UsersModule } from './users/users.module';
import { ReservationsModule } from './reservations/reservations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TablesModule } from './tables/tables.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, PrismaModule, ProductsModule, CategoriesModule, BadgesModule, UsersModule, ReservationsModule, DashboardModule, TablesModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useExisting: AuthGuard }],
})
export class AppModule {}
