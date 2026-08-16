import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { API_BASE_URL } from '../../../../core/api/api-base-url';

type OrderStatus = 'PENDING' | 'PREPARING' | 'SERVED' | 'CANCELLED';

type DashboardStats = {
  todayOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  servedOrders: number;
  todayRevenueCents: number;
};

type Order = {
  id: string;
  reference: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  createdBy: string;
  paidAt?: string | null;
  channel: 'QR' | 'COUNTER';
  takeaway: boolean;
  table: { code: string; label: string } | null;
  items: Array<{ id: string; nameFr: string; quantity: number }>;
};

@Component({
  selector: 'app-admin-orders-panel',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-orders-panel.html',
  styleUrl: './admin-orders-panel.scss',
})
export class AdminOrdersPanel implements OnInit {
  protected readonly i18n = inject(TranslationService);
  private readonly http = inject(HttpClient);
  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly orders = signal<Order[]>([]);

  protected readonly tiles = computed(() => {
    const stats = this.stats();
    return [
      { label: 'admin.orders.metric.today', value: stats?.todayOrders ?? '—', tone: 'green' },
      { label: 'admin.orders.metric.pending', value: stats?.pendingOrders ?? '—', tone: 'gold' },
      { label: 'admin.orders.metric.preparing', value: stats?.preparingOrders ?? '—', tone: 'blue' },
      { label: 'admin.orders.metric.served', value: stats?.servedOrders ?? '—', tone: 'cream' },
      { label: 'admin.orders.metric.revenue', value: this.formatPrice(stats?.todayRevenueCents), tone: 'ink' },
    ];
  });

  ngOnInit(): void {
    this.http.get<DashboardStats>(`${API_BASE_URL}/dashboard/stats`).subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.stats.set(null),
    });
    this.http.get<Order[]>(`${API_BASE_URL}/orders`).subscribe({
      next: (orders) => this.orders.set(orders.slice(0, 4)),
      error: () => this.orders.set([]),
    });
  }

  protected statusKey(status: OrderStatus): string {
    return `admin.orders.status.${status.toLowerCase()}`;
  }

  protected summarise(order: Order): string {
    return order.items.map((item) => `${item.quantity} × ${item.nameFr}`).join(', ');
  }

  protected target(order: Order): string {
    if (order.takeaway) return this.i18n.t('admin.orders.takeaway');
    return order.table?.label ?? '—';
  }

  protected shortCode(order: Order): string {
    return order.takeaway ? '↗' : order.table?.code ?? '—';
  }

  protected formatPrice(cents?: number): string {
    if (cents === undefined) return '—';
    return `${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 1)} DT`;
  }
}
