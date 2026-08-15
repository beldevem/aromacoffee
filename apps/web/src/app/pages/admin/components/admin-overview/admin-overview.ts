import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { API_BASE_URL } from '../../../../core/api/api-base-url';

type DashboardStats = { todayReservations: number; pendingReservations: number; categories: number; publishedProducts: number };

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  templateUrl: './admin-overview.html',
  styleUrl: './admin-overview.scss',
})
export class AdminOverview implements OnInit {
  protected readonly i18n = inject(TranslationService);
  private readonly http = inject(HttpClient);
  protected readonly stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.http.get<DashboardStats>(`${API_BASE_URL}/dashboard/stats`).subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.stats.set(null),
    });
  }

  protected metricCards() {
    const stats = this.stats();
    return [
      { label: 'admin.metric.today', value: stats?.todayReservations ?? '—', note: 'admin.metric.todayNote', tone: 'green' },
      { label: 'admin.metric.pending', value: stats?.pendingReservations ?? '—', note: 'admin.metric.pendingNote', tone: 'gold' },
      { label: 'admin.metric.categories', value: stats?.categories ?? '—', note: 'admin.metric.categoriesNote', tone: 'cream' },
      { label: 'admin.metric.products', value: stats?.publishedProducts ?? '—', note: 'admin.metric.productsNote', tone: 'ink' },
    ];
  }
}
