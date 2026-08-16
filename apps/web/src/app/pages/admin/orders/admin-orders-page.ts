import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminSidebar } from '../components/admin-sidebar/admin-sidebar';
import { AdminTopbar } from '../components/admin-topbar/admin-topbar';
import { TranslationService } from '../../../core/i18n/translation.service';
import { API_BASE_URL } from '../../../core/api/api-base-url';
import { ToastService } from '../../../core/notifications/toast.service';

type OrderStatus = 'PENDING' | 'PREPARING' | 'SERVED' | 'CANCELLED';

interface AdminOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  totalCents: number;
  note?: string | null;
  createdAt: string;
  table: { code: string; label: string };
  items: Array<{ id: string; nameFr: string; quantity: number; lineTotalCents: number }>;
}

@Component({
  selector: 'app-admin-orders-page',
  standalone: true,
  imports: [AdminSidebar, AdminTopbar],
  templateUrl: './admin-orders-page.html',
  styleUrl: './admin-orders-page.scss',
})
export class AdminOrdersPage implements OnInit, OnDestroy {
  protected readonly i18n = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);
  private timer?: ReturnType<typeof setInterval>;

  protected readonly orders = signal<AdminOrder[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly statuses: OrderStatus[] = ['PENDING', 'PREPARING', 'SERVED', 'CANCELLED'];

  ngOnInit(): void {
    this.load();
    this.timer = setInterval(() => this.load(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  protected formatPrice(cents: number): string {
    return `${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 1)} DT`;
  }

  protected formatTime(iso: string): string {
    return new Date(iso).toLocaleString(this.i18n.locale());
  }

  protected statusKey(status: OrderStatus): string {
    return `admin.orders.status.${status.toLowerCase()}`;
  }

  protected setStatus(order: AdminOrder, status: string): void {
    this.http.patch<AdminOrder>(`${API_BASE_URL}/orders/${order.id}/status`, { status }).subscribe({
      next: (updated) => this.orders.update((orders) => orders.map((item) => (item.id === updated.id ? updated : item))),
      error: () => this.toast.error(this.i18n.t('order.error.generic')),
    });
  }

  protected load(): void {
    this.http.get<AdminOrder[]>(`${API_BASE_URL}/orders`).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.i18n.t('order.error.generic'));
      },
    });
  }
}
