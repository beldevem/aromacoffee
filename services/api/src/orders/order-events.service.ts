import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { OrderChannel } from '../generated/prisma/client';

export interface NewOrderEvent {
  id: string;
  reference: string;
  totalCents: number;
  createdAt: string;
  createdBy: string;
  channel: OrderChannel;
  takeaway: boolean;
  table: { code: string; label: string } | null;
  items: Array<{ nameFr: string; quantity: number }>;
}

@Injectable()
export class OrderEventsService {
  private readonly newOrders = new Subject<NewOrderEvent>();
  readonly stream = this.newOrders.asObservable();

  emitNewOrder(event: NewOrderEvent): void {
    this.newOrders.next(event);
  }
}
