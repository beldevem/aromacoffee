import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AdminSidebar } from '../components/admin-sidebar/admin-sidebar';
import { AdminTopbar } from '../components/admin-topbar/admin-topbar';
import { TranslationService } from '../../../core/i18n/translation.service';
import { API_BASE_URL } from '../../../core/api/api-base-url';

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

const DATE_LOCALES: Record<string, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-TN' };

@Component({
  selector: 'app-admin-cash-page',
  standalone: true,
  imports: [AdminSidebar, AdminTopbar],
  templateUrl: './admin-cash-page.html',
  styleUrl: './admin-cash-page.scss',
})
export class AdminCashPage implements OnInit {
  protected readonly i18n = inject(TranslationService);
  private readonly http = inject(HttpClient);

  protected readonly days = signal<DayTakings[]>([]);
  protected readonly range = signal(30);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly ranges = [7, 30, 90];

  protected readonly periodTotal = computed(() =>
    this.days().reduce((sum, day) => sum + day.totalCents, 0),
  );
  protected readonly periodCash = computed(() => this.days().reduce((sum, day) => sum + day.cashCents, 0));
  protected readonly periodCard = computed(() => this.days().reduce((sum, day) => sum + day.cardCents, 0));
  protected readonly periodOrders = computed(() => this.days().reduce((sum, day) => sum + day.orders, 0));

  ngOnInit(): void {
    this.load();
  }

  protected setRange(days: number): void {
    this.range.set(days);
    this.load();
  }

  protected formatPrice(cents: number): string {
    return `${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 1)} DT`;
  }

  protected formatDay(day: string): string {
    const locale = DATE_LOCALES[this.i18n.locale()] ?? 'fr-FR';
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(`${day}T00:00:00`),
    );
  }

  /** Width of the cash portion of each day's bar, so the tender split reads at a glance. */
  protected cashShare(day: DayTakings): number {
    return day.totalCents === 0 ? 0 : Math.round((day.cashCents / day.totalCents) * 100);
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
