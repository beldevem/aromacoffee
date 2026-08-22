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
import { CsvExportService } from '../../../core/utils/csv-export.service';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'SERVED' | 'CANCELLED';
type OrderChannel = 'QR' | 'COUNTER';
export type PaymentMethod = 'CASH' | 'CARD';
export type PrintTemplate = 'receipt' | 'addition' | 'barTicket';

export interface OrderItem {
  id: string;
  nameFr: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface AdminOrder {
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

export interface RestaurantTable {
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

interface CatalogCategory {
  id: string;
  nameFr: string;
  slug: string;
  products: CatalogProduct[];
}

interface DraftLine {
  productId: string;
  nameFr: string;
  unitPriceCents: number;
  quantity: number;
}

export interface TableOccupancy {
  table: RestaurantTable;
  status: 'free' | 'busy' | 'served' | 'seated';
  activeOrders: AdminOrder[];
  totalCents: number;
  itemCount: number;
  latestCreatedAt?: string;
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
  private readonly csv = inject(CsvExportService);
  private timer?: ReturnType<typeof setInterval>;
  private sse?: EventSource;

  protected readonly orders = signal<AdminOrder[]>([]);
  protected readonly summary = signal<OrderSummary | null>(null);
  protected readonly tables = signal<RestaurantTable[]>([]);
  protected readonly products = signal<CatalogProduct[]>([]);
  protected readonly categories = signal<CatalogCategory[]>([]);
  protected readonly selectedCategoryId = signal<string>('ALL');
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  // View state
  protected readonly viewMode = signal<'feed' | 'tables'>('feed');
  protected readonly selectedOrder = signal<AdminOrder | null>(null);
  protected readonly printTemplate = signal<PrintTemplate | null>(null);

  // Filters
  protected readonly statusFilter = signal<OrderStatus | ''>('');
  protected readonly channelFilter = signal<OrderChannel | ''>('');
  protected readonly tableFilter = signal<string>('');
  protected readonly paidFilter = signal<'' | 'true' | 'false'>('');
  protected readonly todayOnly = signal(true);

  // POS manual new order draft
  protected readonly formOpen = signal(false);
  protected readonly productSearch = signal('');
  protected readonly draft = signal<DraftLine[]>([]);
  protected readonly saving = signal(false);
  protected draftTableId = '';
  protected draftTakeaway = false;
  protected draftNote = '';
  protected draftMarkPaid = false;
  protected draftPaymentMethod: PaymentMethod = 'CASH';

  // Checkout Change Calculator
  protected readonly tenderedCash = signal<number | null>(null);
  protected readonly printPromptOrder = signal<AdminOrder | null>(null);

  // Thermal Printing
  protected readonly receipt = signal<AdminOrder | null>(null);
  protected readonly receiptQr = signal<string>('');
  protected readonly phone = '+216 55 264 235';

  protected readonly statuses: OrderStatus[] = ['PENDING', 'PREPARING', 'SERVED', 'CANCELLED'];
  protected readonly channels: OrderChannel[] = ['QR', 'COUNTER'];
  protected readonly paymentMethods: PaymentMethod[] = ['CASH', 'CARD'];

  protected readonly isAdmin = computed(() => this.auth.user()?.role === 'ADMIN');

  protected readonly filteredProducts = computed(() => {
    const q = this.productSearch().trim().toLowerCase();
    const catId = this.selectedCategoryId();
    let list = this.products();
    if (catId !== 'ALL') {
      const cat = this.categories().find((c) => c.id === catId);
      list = cat ? cat.products : [];
    }
    if (!q) return list;
    return list.filter((p) => p.nameFr.toLowerCase().includes(q));
  });

  getDraftQuantity(productId: string): number {
    const line = this.draft().find((l) => l.productId === productId);
    return line ? line.quantity : 0;
  }

  setSelectedCategory(catId: string): void {
    this.selectedCategoryId.set(catId);
  }

  protected readonly draftTotal = computed(() =>
    this.draft().reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0),
  );

  protected readonly receiptDomain = computed(() => {
    if (typeof window === 'undefined') return 'https://myaromacoffee.com';
    return window.location.origin;
  });

  /**
   * Real-time table floor map computation
   */
  protected readonly tableOccupancies = computed<TableOccupancy[]>(() => {
    const allTables = this.tables();
    const activeUnpaidOrders = this.orders().filter(
      (o) => o.status !== 'CANCELLED' && !o.paidAt && o.table?.code,
    );

    return allTables.map((table) => {
      const tableOrders = activeUnpaidOrders.filter((o) => o.table?.code === table.code);
      const totalCents = tableOrders.reduce((sum, o) => sum + o.totalCents, 0);
      const itemCount = tableOrders.reduce(
        (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
        0,
      );

      let status: 'free' | 'busy' | 'served' | 'seated' = 'free';
      if (tableOrders.length > 0) {
        const hasPendingOrPreparing = tableOrders.some(
          (o) => o.status === 'PENDING' || o.status === 'PREPARING',
        );
        if (hasPendingOrPreparing) {
          status = 'busy';
        } else {
          status = 'served';
        }
      }

      const latestCreatedAt = tableOrders[0]?.createdAt;

      return {
        table,
        status,
        activeOrders: tableOrders,
        totalCents,
        itemCount,
        latestCreatedAt,
      };
    });
  });

  protected readonly changeDue = computed(() => {
    const order = this.selectedOrder();
    const tendered = this.tenderedCash();
    if (!order || tendered == null || tendered <= 0) return 0;
    const totalDt = order.totalCents / 100;
    return Math.max(0, tendered - totalDt);
  });

  ngOnInit(): void {
    this.load();
    this.loadTables();
    this.loadCatalog();
    this.timer = setInterval(() => this.load(), 30_000);
    this.initSse();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.sse) this.sse.close();
  }

  /* ------------------- View Mode & Modal ------------------- */

  setViewMode(mode: 'feed' | 'tables'): void {
    this.viewMode.set(mode);
  }

  openOrderModal(order: AdminOrder): void {
    this.selectedOrder.set(order);
    this.tenderedCash.set(null);
  }

  closeOrderModal(): void {
    this.selectedOrder.set(null);
    this.tenderedCash.set(null);
    this.printPromptOrder.set(null);
  }

  selectOrderForTable(occupancy: TableOccupancy): void {
    if (occupancy.activeOrders.length === 1) {
      this.openOrderModal(occupancy.activeOrders[0]);
    } else if (occupancy.activeOrders.length > 1) {
      this.setTableFilter(occupancy.table.id);
      this.setViewMode('feed');
    } else {
      this.openFormForTable(occupancy.table.id);
    }
  }

  /* ------------------- Printing System ------------------- */

  printPreCheck(order: AdminOrder): void {
    this.printTemplate.set('addition');
    this.receipt.set(order);
    this.ensureReceiptQr(order.reference);
    setTimeout(() => window.print(), 150);
  }

  printBarTicket(order: AdminOrder): void {
    this.printTemplate.set('barTicket');
    this.receipt.set(order);
    setTimeout(() => window.print(), 150);
  }

  printReceipt(order: AdminOrder): void {
    this.printTemplate.set('receipt');
    this.receipt.set(order);
    this.ensureReceiptQr(order.reference);
    setTimeout(() => window.print(), 150);
  }

  /* ------------------- Actions & Status ------------------- */

  setStatus(order: AdminOrder, status: OrderStatus): void {
    this.http.patch<AdminOrder>(`${API_BASE_URL}/orders/${order.id}/status`, { status }).subscribe({
      next: (updated) => {
        this.orders.update((list) => list.map((o) => (o.id === order.id ? updated : o)));
        if (this.selectedOrder()?.id === order.id) {
          this.selectedOrder.set(updated);
        }
        this.toast.success(`Statut mis à jour : ${this.i18n.t(this.statusKey(status))}`);
        if (this.isAdmin()) this.loadSummary();
      },
      error: () => this.toast.error(this.i18n.t('order.error.generic')),
    });
  }

  advanceStatus(order: AdminOrder): void {
    if (order.status === 'PENDING') {
      this.setStatus(order, 'PREPARING');
    } else if (order.status === 'PREPARING') {
      this.setStatus(order, 'SERVED');
    }
  }

  markPaid(order: AdminOrder, paymentMethod: PaymentMethod): void {
    this.http.patch<AdminOrder>(`${API_BASE_URL}/orders/${order.id}/payment`, { paymentMethod }).subscribe({
      next: (updated) => {
        this.orders.update((list) => list.map((o) => (o.id === order.id ? updated : o)));
        if (this.selectedOrder()?.id === order.id) {
          this.selectedOrder.set(updated);
        }
        this.printPromptOrder.set(updated);
        this.toast.success(`Paiement enregistré (${this.i18n.t(this.paymentKey(paymentMethod))})`);
        if (this.isAdmin()) this.loadSummary();
      },
      error: () => this.toast.error(this.i18n.t('order.error.generic')),
    });
  }

  confirmPrintAndDismiss(print: boolean): void {
    const order = this.printPromptOrder();
    this.printPromptOrder.set(null);
    if (print && order) {
      this.printReceipt(order);
    }
  }

  setTenderedSuggestion(amount: number): void {
    this.tenderedCash.set(amount);
  }

  /* ------------------- Filters ------------------- */

  setStatusFilter(status: OrderStatus | ''): void {
    this.statusFilter.set(status);
    this.load();
  }

  setChannelFilter(channel: OrderChannel | ''): void {
    this.channelFilter.set(channel);
    this.load();
  }

  setTableFilter(tableId: string): void {
    this.tableFilter.set(tableId);
    this.load();
  }

  setPaidFilter(paid: '' | 'true' | 'false'): void {
    this.paidFilter.set(paid);
    this.load();
  }

  toggleToday(): void {
    this.todayOnly.update((v) => !v);
    this.load();
  }

  /* ------------------- Manual Order Form ------------------- */

  openForm(): void {
    this.resetDraft();
    this.formOpen.set(true);
  }

  openFormForTable(tableId: string): void {
    this.resetDraft();
    this.draftTableId = tableId;
    this.draftTakeaway = false;
    this.formOpen.set(true);
  }

  getTableIdForOrder(order: AdminOrder): string | undefined {
    if (!order.table?.code) return undefined;
    return this.tables().find((t) => t.code === order.table?.code)?.id;
  }

  openFormForOrderTable(order: AdminOrder): void {
    const tableId = this.getTableIdForOrder(order);
    if (tableId) {
      this.openFormForTable(tableId);
      this.closeOrderModal();
    }
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  addLine(product: CatalogProduct): void {
    const isPromo = product.promotion && product.promoPrice != null;
    const priceCents = isPromo ? product.promoPrice! : product.priceCents;
    this.draft.update((lines) => {
      const existing = lines.find((l) => l.productId === product.id);
      if (existing) {
        return lines.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...lines, { productId: product.id, nameFr: product.nameFr, unitPriceCents: priceCents, quantity: 1 }];
    });
  }

  setLineQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.draft.update((lines) => lines.filter((l) => l.productId !== productId));
    } else {
      this.draft.update((lines) =>
        lines.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
      );
    }
  }

  submitOrder(): void {
    if (this.draft().length === 0 || this.saving()) return;
    if (!this.draftTakeaway && !this.draftTableId) {
      this.toast.error(this.i18n.t('admin.orders.tableRequired'));
      return;
    }

    this.saving.set(true);
    const payload = {
      tableId: this.draftTakeaway ? undefined : this.draftTableId,
      takeaway: this.draftTakeaway,
      items: this.draft().map((l) => ({ productId: l.productId, quantity: l.quantity })),
      note: this.draftNote.trim() || undefined,
      markPaid: this.draftMarkPaid,
      paymentMethod: this.draftMarkPaid ? this.draftPaymentMethod : undefined,
    };

    this.http.post<AdminOrder>(`${API_BASE_URL}/orders`, payload).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.closeForm();
        this.toast.success(`Commande ${created.reference} enregistrée !`);
        this.load();
        if (this.isAdmin()) this.loadSummary();
        this.openOrderModal(created);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(this.i18n.t('order.error.generic'));
      },
    });
  }

  private resetDraft(): void {
    this.draft.set([]);
    this.draftTableId = '';
    this.draftTakeaway = false;
    this.draftNote = '';
    this.draftMarkPaid = false;
    this.draftPaymentMethod = 'CASH';
    this.productSearch.set('');
  }

  /* ------------------- Data Fetching ------------------- */

  load(): void {
    this.loading.set(true);
    this.error.set('');

    let params = new HttpParams();
    if (this.statusFilter()) params = params.set('status', this.statusFilter());
    if (this.channelFilter()) params = params.set('channel', this.channelFilter());
    if (this.tableFilter()) params = params.set('tableId', this.tableFilter());
    if (this.paidFilter()) params = params.set('paid', this.paidFilter());
    if (this.todayOnly()) params = params.set('period', 'today');

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

    if (this.isAdmin()) this.loadSummary();
  }

  private loadSummary(): void {
    let params = new HttpParams();
    if (this.statusFilter()) params = params.set('status', this.statusFilter());
    if (this.channelFilter()) params = params.set('channel', this.channelFilter());
    if (this.tableFilter()) params = params.set('tableId', this.tableFilter());
    if (this.paidFilter()) params = params.set('paid', this.paidFilter());
    if (this.todayOnly()) params = params.set('period', 'today');

    this.http.get<OrderSummary>(`${API_BASE_URL}/orders/summary`, { params }).subscribe({
      next: (summary) => this.summary.set(summary),
      error: () => {},
    });
  }

  private loadTables(): void {
    this.http.get<RestaurantTable[]>(`${API_BASE_URL}/tables`).subscribe({
      next: (tables) => this.tables.set(tables),
      error: () => {},
    });
  }

  private loadCatalog(): void {
    this.http.get<CatalogCategory[]>(`${API_BASE_URL}/categories/public/catalog`).subscribe({
      next: (catalog) => {
        this.categories.set(catalog);
        this.products.set(catalog.flatMap((c) => c.products));
      },
      error: () => {},
    });
  }

  private initSse(): void {
    if (typeof EventSource === 'undefined') return;
    try {
      this.sse = new EventSource(`${API_BASE_URL}/orders/stream`);
      this.sse.addEventListener('new-order', (event: MessageEvent) => {
        try {
          const newOrder = JSON.parse(event.data) as AdminOrder;
          this.orders.update((list) => [newOrder, ...list.filter((o) => o.id !== newOrder.id)]);
          if (this.isAdmin()) this.loadSummary();
        } catch {
          this.load();
        }
      });
    } catch {
      // Graceful fallback to periodic polling
    }
  }

  private ensureReceiptQr(ref: string): void {
    const url = `${this.receiptDomain()}/menu?ref=${encodeURIComponent(ref)}`;
    toDataURL(url, { width: 140, margin: 1, color: { dark: '#1e211c', light: '#ffffff' } })
      .then((data) => this.receiptQr.set(data))
      .catch(() => this.receiptQr.set(''));
  }

  /* ------------------- Formatting & Helpers ------------------- */

  formatPrice(cents?: number | null): string {
    if (cents == null) return '—';
    return `${(cents / 100).toFixed(2)} DT`;
  }

  isPaid(order: AdminOrder): boolean {
    return Boolean(order.paidAt);
  }

  orderTarget(order: AdminOrder): string {
    if (order.takeaway) return this.i18n.t('admin.orders.takeaway');
    return order.table ? order.table.label : this.i18n.t('admin.orders.channel.counter');
  }

  origin(order: AdminOrder): string {
    return order.channel === 'QR' ? this.i18n.t('admin.orders.origin.qr') : order.createdBy;
  }

  statusKey(status: OrderStatus): string {
    return `admin.orders.status.${status.toLowerCase()}`;
  }

  channelKey(channel: OrderChannel): string {
    return `admin.orders.channel.${channel.toLowerCase()}`;
  }

  paymentKey(method: PaymentMethod): string {
    return `admin.orders.payment.${method.toLowerCase()}`;
  }

  protected exportOrders(): void {
    const list = this.orders();
    if (list.length === 0) {
      this.toast.error('Aucune commande à exporter.');
      return;
    }

    this.csv.exportToCsv<AdminOrder>(
      list,
      [
        { header: 'Référence', key: 'reference' },
        { header: 'Date & Heure', transform: (r) => new Date(r.createdAt).toLocaleString('fr-TN') },
        { header: 'Table / Emplacement', transform: (r) => this.orderTarget(r) },
        { header: 'Canal', transform: (r) => this.i18n.t(this.channelKey(r.channel)) },
        { header: 'Articles', transform: (r) => r.items.map((it) => `${it.quantity}x ${it.nameFr}`).join(', ') },
        { header: 'Total (DT)', transform: (r) => (r.totalCents / 100).toFixed(2) },
        { header: 'Statut', transform: (r) => this.i18n.t(this.statusKey(r.status)) },
        { header: 'Paiement', transform: (r) => this.isPaid(r) ? `Payé (${this.i18n.t(this.paymentKey(r.paymentMethod!))})` : 'En attente' },
        { header: 'Créée par', key: 'createdBy' },
        { header: 'Encaissée par', transform: (r) => r.paidBy || '' },
      ],
      `commandes_aroma_${this.todayOnly() ? 'aujourdhui' : 'toutes'}`,
    );
    this.toast.success(`${list.length} commande(s) exportée(s) en CSV !`);
  }

  statusCount(status: OrderStatus): number {
    return this.summary()?.byStatus[status]?.count ?? 0;
  }

  timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return '< 1 min';
    if (diff < 60) return `${diff} min`;
    const hours = Math.floor(diff / 60);
    return `${hours}h ${diff % 60}m`;
  }
}
