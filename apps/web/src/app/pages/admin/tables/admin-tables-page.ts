import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { toDataURL } from 'qrcode';
import { AdminSidebar } from '../components/admin-sidebar/admin-sidebar';
import { AdminTopbar } from '../components/admin-topbar/admin-topbar';
import { TranslationService } from '../../../core/i18n/translation.service';
import { API_BASE_URL } from '../../../core/api/api-base-url';
import { ToastService } from '../../../core/notifications/toast.service';

interface RestaurantTable {
  id: string;
  label: string;
  code: string;
  seats: number;
  active: boolean;
  qrUrl: string;
}

@Component({
  selector: 'app-admin-tables-page',
  standalone: true,
  imports: [AdminSidebar, AdminTopbar, FormsModule],
  templateUrl: './admin-tables-page.html',
  styleUrl: './admin-tables-page.scss',
})
export class AdminTablesPage implements OnInit {
  protected readonly i18n = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);

  protected readonly tables = signal<RestaurantTable[]>([]);
  protected readonly qrImages = signal<Record<string, string>>({});
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly editing = signal<RestaurantTable | null>(null);
  protected draft: { label: string; code: string; seats: number; active: boolean } = this.emptyDraft();

  ngOnInit(): void {
    this.load();
  }

  protected beginCreate(): void {
    this.editing.set(null);
    this.draft = this.emptyDraft();
    this.formOpen.set(true);
  }

  protected beginEdit(table: RestaurantTable): void {
    this.editing.set(table);
    this.draft = { label: table.label, code: table.code, seats: table.seats, active: table.active };
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    const editing = this.editing();
    const request = editing
      ? this.http.patch<RestaurantTable>(`${API_BASE_URL}/tables/${editing.id}`, this.draft)
      : this.http.post<RestaurantTable>(`${API_BASE_URL}/tables`, this.draft);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(this.i18n.t('order.error.generic'));
      },
    });
  }

  protected rotate(table: RestaurantTable): void {
    if (!confirm(this.i18n.t('admin.tables.rotateConfirm'))) return;
    this.http.post<RestaurantTable>(`${API_BASE_URL}/tables/${table.id}/rotate-token`, {}).subscribe({
      next: () => this.load(),
      error: () => this.toast.error(this.i18n.t('order.error.generic')),
    });
  }

  protected remove(table: RestaurantTable): void {
    if (!confirm(this.i18n.t('admin.tables.deleteConfirm'))) return;
    this.http.delete(`${API_BASE_URL}/tables/${table.id}`).subscribe({
      next: () => this.load(),
      error: () => this.toast.error(this.i18n.t('order.error.generic')),
    });
  }

  protected print(): void {
    window.print();
  }

  private load(): void {
    this.loading.set(true);
    this.http.get<RestaurantTable[]>(`${API_BASE_URL}/tables`).subscribe({
      next: (tables) => {
        this.tables.set(tables);
        this.loading.set(false);
        void this.renderQrCodes(tables);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.i18n.t('order.error.generic'));
      },
    });
  }

  private async renderQrCodes(tables: RestaurantTable[]): Promise<void> {
    const entries = await Promise.all(
      tables.map(async (table) => [
        table.id,
        await toDataURL(table.qrUrl, { width: 320, margin: 1, color: { dark: '#2c3a2b', light: '#fffefa' } }),
      ] as const),
    );
    this.qrImages.set(Object.fromEntries(entries));
  }

  private emptyDraft() {
    return { label: '', code: '', seats: 4, active: true };
  }
}
