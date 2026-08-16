import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface NewOrderEvent {
  id: string;
  reference: string;
  totalCents: number;
  createdAt: string;
  table: { code: string; label: string };
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
