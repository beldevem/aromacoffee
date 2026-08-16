import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { API_BASE_URL } from '../../../../core/api/api-base-url';

type DashboardStats = {
  todayReservations: number;
  pendingReservations: number;
  todayOrders: number;
  pendingOrders: number;
};

const DATE_LOCALES: Record<string, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-TN' };

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-overview.html',
  styleUrl: './admin-overview.scss',
})
export class AdminOverview implements OnInit {
  protected readonly i18n = inject(TranslationService);
  private readonly http = inject(HttpClient);
  protected readonly stats = signal<DashboardStats | null>(null);

  protected readonly today = computed(() => {
    const locale = this.i18n.locale();
    return new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? 'fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
  });

  ngOnInit(): void {
    this.http.get<DashboardStats>(`${API_BASE_URL}/dashboard/stats`).subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.stats.set(null),
    });
  }

  protected metricCards() {
    const stats = this.stats();
    return [
      { label: 'admin.metric.todayOrders', value: stats?.todayOrders ?? '—', note: 'admin.metric.todayOrdersNote', tone: 'green', link: '/admin/orders' },
      { label: 'admin.metric.pendingOrders', value: stats?.pendingOrders ?? '—', note: 'admin.metric.pendingOrdersNote', tone: 'gold', link: '/admin/orders' },
      { label: 'admin.metric.today', value: stats?.todayReservations ?? '—', note: 'admin.metric.todayNote', tone: 'cream', link: '/admin/reservations' },
      { label: 'admin.metric.pending', value: stats?.pendingReservations ?? '—', note: 'admin.metric.pendingNote', tone: 'ink', link: '/admin/reservations' },
    ];
  }
}
