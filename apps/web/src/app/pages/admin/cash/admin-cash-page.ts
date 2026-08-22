import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminSidebar } from '../components/admin-sidebar/admin-sidebar';
import { AdminTopbar } from '../components/admin-topbar/admin-topbar';
import { TranslationService } from '../../../core/i18n/translation.service';
import { API_BASE_URL } from '../../../core/api/api-base-url';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/notifications/toast.service';
import { CsvExportService } from '../../../core/utils/csv-export.service';

interface AgentTakings {
  name: string;
  orders: number;
  totalCents: number;
}

interface DayTakings {
  day: string;
  orders: number;
  totalCents: number;
  cashCents: number;
  cardCents: number;
  agents: AgentTakings[];
}

interface ExpenseListItem {
  amountCents: number;
  paymentMethod: string | null;
  date: string;
}

const DATE_LOCALES: Record<string, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-TN' };

@Component({
  selector: 'app-admin-cash-page',
  standalone: true,
  imports: [AdminSidebar, AdminTopbar, FormsModule],
  templateUrl: './admin-cash-page.html',
  styleUrl: './admin-cash-page.scss',
})
export class AdminCashPage implements OnInit {
  protected readonly i18n = inject(TranslationService);
  protected readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly csv = inject(CsvExportService);

  protected readonly days = signal<DayTakings[]>([]);
  protected readonly range = signal(30);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly ranges = [7, 30, 90];

  // Z-Report Closing Modal State
  protected readonly showZReportModal = signal(false);
  protected initialFloatDt = '100.00';
  protected countedCashDt = '';
  protected readonly todayExpensesCashCents = signal(0);
  protected readonly closingTimestamp = signal<string>('');

  protected readonly periodTotal = computed(() =>
    this.days().reduce((sum, day) => sum + day.totalCents, 0),
  );
  protected readonly periodCash = computed(() => this.days().reduce((sum, day) => sum + day.cashCents, 0));
  protected readonly periodCard = computed(() => this.days().reduce((sum, day) => sum + day.cardCents, 0));
  protected readonly periodOrders = computed(() => this.days().reduce((sum, day) => sum + day.orders, 0));

  /** Today's sales data from the top of the history */
  protected readonly todayTakings = computed<DayTakings | null>(() => {
    const list = this.days();
    if (list.length === 0) return null;
    const todayIso = new Date().toISOString().slice(0, 10);
    return list.find((d) => d.day === todayIso) ?? list[0] ?? null;
  });

  protected readonly initialFloatCents = computed(() => {
    const parsed = parseFloat(this.initialFloatDt);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  });

  protected readonly countedCashCents = computed(() => {
    const parsed = parseFloat(this.countedCashDt);
    return isNaN(parsed) ? null : Math.round(parsed * 100);
  });

  protected readonly expectedCashCents = computed(() => {
    const today = this.todayTakings();
    const cashSales = today?.cashCents ?? 0;
    const cashExpenses = this.todayExpensesCashCents();
    return this.initialFloatCents() + cashSales - cashExpenses;
  });

  protected readonly cashVarianceCents = computed(() => {
    const counted = this.countedCashCents();
    if (counted == null) return null;
    return counted - this.expectedCashCents();
  });

  ngOnInit(): void {
    this.load();
  }

  protected setRange(days: number): void {
    this.range.set(days);
    this.load();
  }

  protected openZReport(): void {
    this.closingTimestamp.set(new Date().toLocaleString('fr-TN'));
    this.countedCashDt = '';
    this.loadTodayExpenses();
    this.showZReportModal.set(true);
  }

  protected closeZReport(): void {
    this.showZReportModal.set(false);
  }

  protected printZReport(): void {
    setTimeout(() => window.print(), 100);
  }

  protected exportCsv(): void {
    const list = this.days();
    if (list.length === 0) {
      this.toast.error('Aucune donnée de caisse à exporter.');
      return;
    }

    this.csv.exportToCsv<DayTakings>(
      list,
      [
        { header: 'Date', transform: (r) => r.day },
        { header: 'Nombre de Commandes', key: 'orders' },
        { header: 'Recettes Espèces (DT)', transform: (r) => (r.cashCents / 100).toFixed(2) },
        { header: 'Recettes Carte (DT)', transform: (r) => (r.cardCents / 100).toFixed(2) },
        { header: 'Total Journée (DT)', transform: (r) => (r.totalCents / 100).toFixed(2) },
        { header: 'Détail Équipe', transform: (r) => r.agents.map((a) => `${a.name}: ${(a.totalCents / 100).toFixed(2)} DT`).join(' | ') },
      ],
      `registre_caisse_aroma_${this.range()}j`,
    );
    this.toast.success(`${list.length} jour(s) de caisse exporté(s) !`);
  }

  protected formatPrice(cents?: number | null): string {
    if (cents == null) return '—';
    return `${(cents / 100).toFixed(2)} DT`;
  }

  protected formatDay(day: string): string {
    const locale = DATE_LOCALES[this.i18n.locale()] ?? 'fr-FR';
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(`${day}T00:00:00`),
    );
  }

  protected cashShare(day: DayTakings): number {
    return day.totalCents === 0 ? 0 : Math.round((day.cashCents / day.totalCents) * 100);
  }

  private loadTodayExpenses(): void {
    const params = new HttpParams().set('period', 'today');
    this.http.get<ExpenseListItem[]>(`${API_BASE_URL}/expenses`, { params }).subscribe({
      next: (items) => {
        const cashExpenses = items
          .filter((e) => e.paymentMethod === 'CASH' || !e.paymentMethod)
          .reduce((sum, e) => sum + e.amountCents, 0);
        this.todayExpensesCashCents.set(cashExpenses);
      },
      error: () => this.todayExpensesCashCents.set(0),
    });
  }

  private load(): void {
    this.loading.set(true);
    const params = new HttpParams().set('days', this.range());
    this.http.get<DayTakings[]>(`${API_BASE_URL}/orders/cash-register`, { params }).subscribe({
      next: (days) => {
        this.days.set(days);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.i18n.t('order.error.generic'));
      },
    });
  }
}
