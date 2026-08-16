import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { toDataURL } from 'qrcode';
import { AdminSidebar } from '../components/admin-sidebar/admin-sidebar';
import { AdminTopbar } from '../components/admin-topbar/admin-topbar';
import { TranslationService } from '../../../core/i18n/translation.service';
import { API_BASE_URL } from '../../../core/api/api-base-url';
import { ToastService } from '../../../core/notifications/toast.service';
import { AuthService } from '../../../core/auth/auth.service';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'SERVED' | 'CANCELLED';
type OrderChannel = 'QR' | 'COUNTER';
type PaymentMethod = 'CASH' | 'CARD';

interface OrderItem {
  id: string;
  nameFr: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

interface AdminOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  channel: OrderChannel;
  takeaway: boolean;
  totalCents: number;
  note?: string | null;
  createdAt: string;
  createdBy: string;
  validatedBy?: string | null;
  paidBy?: string | null;
  paidAt?: string | null;
  paymentMethod?: PaymentMethod | null;
  table: { code: string; label: string } | null;
  items: OrderItem[];
}

interface OrderSummary {
  totalOrders: number;
  totalCents: number;
  paidOrders: number;
  paidCents: number;
  byStatus: Record<string, { count: number; totalCents: number }>;
}

interface RestaurantTable {
  id: string;
  label: string;
  code: string;
  active: boolean;
}

interface CatalogProduct {
  id: string;
  nameFr: string;
  priceCents: number;
  promotion: boolean;
  ogPrice?: number | null;
  promoPrice?: number | null;
}

interface DraftLine {
  productId: string;
  nameFr: string;
  unitPriceCents: number;
  quantity: number;
}

@Component({
  selector: 'app-admin-orders-page',
  standalone: true,
  imports: [AdminSidebar, AdminTopbar, DatePipe, FormsModule],
  templateUrl: './admin-orders-page.html',
  styleUrl: './admin-orders-page.scss',
})
export class AdminOrdersPage implements OnInit, OnDestroy {
  protected readonly i18n = inject(TranslationService);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);
  private timer?: ReturnType<typeof setInterval>;

  protected readonly orders = signal<AdminOrder[]>([]);
  protected readonly summary = signal<OrderSummary | null>(null);
  protected readonly tables = signal<RestaurantTable[]>([]);
  protected readonly products = signal<CatalogProduct[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly statusFilter = signal<OrderStatus | ''>('');
  protected readonly channelFilter = signal<OrderChannel | ''>('');
  protected readonly tableFilter = signal<string>('');
  protected readonly paidFilter = signal<'' | 'true' | 'false'>('');
  protected readonly todayOnly = signal(true);

  protected readonly isAdmin = computed(() => this.auth.user()?.role === 'ADMIN');

  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly productSearch = signal('');
  protected readonly draft = signal<DraftLine[]>([]);
  protected draftTableId = '';
  protected draftTakeaway = false;
  protected draftNote = '';
  protected draftMarkPaid = false;
  protected draftPaymentMethod: PaymentMethod = 'CASH';

  protected readonly receipt = signal<AdminOrder | null>(null);
  protected readonly receiptQr = signal('');
  protected readonly phone = '+216 55 264 235';
  protected readonly siteUrl = typeof window === 'undefined' ? '' : window.location.origin;

  protected readonly statuses: OrderStatus[] = ['PENDING', 'PREPARING', 'SERVED', 'CANCELLED'];
  protected readonly channels: OrderChannel[] = ['QR', 'COUNTER'];
  protected readonly paymentMethods: PaymentMethod[] = ['CASH', 'CARD'];

  protected readonly draftTotal = computed(() =>
    this.draft().reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0),
  );

  protected readonly filteredProducts = computed(() => {
    const query = this.productSearch().trim().toLocaleLowerCase();
    const products = this.products();
    if (!query) return products.slice(0, 12);
    return products.filter((product) => product.nameFr.toLocaleLowerCase().includes(query)).slice(0, 20);
  });

  ngOnInit(): void {
    this.load();
    this.loadReferenceData();
    this.timer = setInterval(() => this.load(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  protected load(): void {
    const params = this.buildParams();
    this.http.get<AdminOrder[]>(`${API_BASE_URL}/orders`, { params }).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.i18n.t('order.error.generic'));
      },
    });
    // Only admins may read takings, so agents never request them.
    if (!this.isAdmin()) return;
    this.http.get<OrderSummary>(`${API_BASE_URL}/orders/summary`, { params }).subscribe({
      next: (summary) => this.summary.set(summary),
      error: () => this.summary.set(null),
    });
  }

  protected setTableFilter(value: string): void {
    this.tableFilter.set(value);
    this.load();
  }

  protected setPaidFilter(value: string): void {
    this.paidFilter.set(value as '' | 'true' | 'false');
    this.load();
  }

  protected isPaid(order: AdminOrder): boolean {
    return Boolean(order.paidAt);
  }

  protected setStatusFilter(value: string): void {
    this.statusFilter.set(value as OrderStatus | '');
    this.load();
  }

  protected setChannelFilter(value: string): void {
    this.channelFilter.set(value as OrderChannel | '');
    this.load();
  }

  protected toggleToday(): void {
    this.todayOnly.set(!this.todayOnly());
    this.load();
  }

  protected statusCount(status: OrderStatus): number {
    return this.summary()?.byStatus[status]?.count ?? 0;
  }

  protected setStatus(order: AdminOrder, status: string): void {
    this.http.patch<AdminOrder>(`${API_BASE_URL}/orders/${order.id}/status`, { status }).subscribe({
      next: () => this.load(),
      error: () => this.toast.error(this.i18n.t('order.error.generic')),
    });
  }

  protected markPaid(order: AdminOrder, method: PaymentMethod): void {
    this.http
      .patch<AdminOrder>(`${API_BASE_URL}/orders/${order.id}/payment`, { paymentMethod: method })
      .subscribe({
        next: () => this.load(),
        error: () => this.toast.error(this.i18n.t('order.error.generic')),
      });
  }

  protected openForm(): void {
    this.draft.set([]);
    this.draftTableId = '';
    this.draftTakeaway = false;
    this.draftNote = '';
    this.draftMarkPaid = false;
    this.draftPaymentMethod = 'CASH';
    this.productSearch.set('');
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected addLine(product: CatalogProduct): void {
    const existing = this.draft().find((line) => line.productId === product.id);
    if (existing) {
      this.setLineQuantity(product.id, existing.quantity + 1);
      return;
    }
    this.draft.update((lines) => [
      ...lines,
      {
        productId: product.id,
        nameFr: product.nameFr,
        unitPriceCents: this.unitPrice(product),
        quantity: 1,
      },
    ]);
  }

  protected setLineQuantity(productId: string, quantity: number): void {
    const next = Math.min(20, Math.max(0, quantity));
    this.draft.update((lines) =>
      next === 0
        ? lines.filter((line) => line.productId !== productId)
        : lines.map((line) => (line.productId === productId ? { ...line, quantity: next } : line)),
    );
  }

  protected submitOrder(): void {
    if (this.draft().length === 0 || this.saving()) return;
    if (!this.draftTakeaway && !this.draftTableId) {
      this.toast.error(this.i18n.t('admin.orders.tableRequired'));
      return;
    }

    this.saving.set(true);
    this.http
      .post<AdminOrder>(`${API_BASE_URL}/orders`, {
        items: this.draft().map((line) => ({ productId: line.productId, quantity: line.quantity })),
        tableId: this.draftTakeaway ? undefined : this.draftTableId,
        takeaway: this.draftTakeaway,
        note: this.draftNote.trim() || undefined,
        markPaid: this.draftMarkPaid,
        paymentMethod: this.draftMarkPaid ? this.draftPaymentMethod : undefined,
      })
      .subscribe({
        next: (order) => {
          this.saving.set(false);
          this.formOpen.set(false);
          this.load();
          if (order.paidAt) void this.printReceipt(order);
        },
        error: () => {
          this.saving.set(false);
          this.toast.error(this.i18n.t('order.error.generic'));
        },
      });
  }

  protected async printReceipt(order: AdminOrder): Promise<void> {
    if (!this.receiptQr()) {
      this.receiptQr.set(
        await toDataURL(`${this.siteUrl}/menu`, { width: 240, margin: 0, color: { dark: '#000000', light: '#ffffff' } }),
      );
    }
    this.receipt.set(order);
    // Let the receipt render before handing control to the print dialog.
    setTimeout(() => {
      window.print();
      this.receipt.set(null);
    });
  }

  protected receiptDomain(): string {
    return this.siteUrl.replace(/^https?:\/\//, '');
  }

  protected orderTarget(order: AdminOrder): string {
    if (order.takeaway) return this.i18n.t('admin.orders.takeaway');
    return order.table?.label ?? '—';
  }

  protected origin(order: AdminOrder): string {
    return order.channel === 'QR' ? this.i18n.t('admin.orders.origin.qr') : order.createdBy;
  }

  protected statusKey(status: OrderStatus): string {
    return `admin.orders.status.${status.toLowerCase()}`;
  }

  protected channelKey(channel: OrderChannel): string {
    return channel === 'QR' ? 'admin.orders.channel.qr' : 'admin.orders.channel.counter';
  }

  protected paymentKey(method: PaymentMethod): string {
    return method === 'CASH' ? 'admin.orders.payment.cash' : 'admin.orders.payment.card';
  }

  protected formatPrice(cents?: number | null): string {
    if (cents === undefined || cents === null) return '—';
    return `${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 1)} DT`;
  }

  private unitPrice(product: CatalogProduct): number {
    const isPromotion =
      product.promotion && product.promoPrice != null && product.promoPrice < (product.ogPrice ?? product.priceCents);
    return isPromotion ? product.promoPrice! : product.priceCents;
  }

  private buildParams(): HttpParams {
    let params = new HttpParams();
    if (this.statusFilter()) params = params.set('status', this.statusFilter());
    if (this.channelFilter()) params = params.set('channel', this.channelFilter());
    if (this.tableFilter()) params = params.set('tableId', this.tableFilter());
    if (this.paidFilter()) params = params.set('paid', this.paidFilter());
    if (this.todayOnly()) params = params.set('period', 'today');
    return params;
  }

  private loadReferenceData(): void {
    this.http.get<RestaurantTable[]>(`${API_BASE_URL}/tables`).subscribe({
      next: (tables) => this.tables.set(tables.filter((table) => table.active)),
      error: () => this.tables.set([]),
    });
    this.http
      .get<Array<{ products: CatalogProduct[] }>>(`${API_BASE_URL}/categories/public/catalog`)
      .subscribe({
        next: (catalog) => this.products.set(catalog.flatMap((category) => category.products)),
        error: () => this.products.set([]),
      });
  }
}
