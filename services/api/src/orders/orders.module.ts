import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrderSessionsController } from './order-sessions.controller';
import { TableOrdersController } from './table-orders.controller';
import { OrdersService } from './orders.service';
import { OrderSessionService } from './order-session.service';
import { OrderEventsService } from './order-events.service';
import { OrderSessionGuard } from './order-session.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OrderSessionsController, TableOrdersController, OrdersController],
  providers: [OrdersService, OrderSessionService, OrderEventsService, OrderSessionGuard],
  exports: [OrdersService],
})
export class OrdersModule {}
