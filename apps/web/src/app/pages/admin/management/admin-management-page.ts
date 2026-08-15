import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminSidebar } from '../components/admin-sidebar/admin-sidebar';
import { AdminTopbar } from '../components/admin-topbar/admin-topbar';
import { TranslationService } from '../../../core/i18n/translation.service';
import { API_BASE_URL } from '../../../core/api/api-base-url';
import { ToastService } from '../../../core/notifications/toast.service';

type Resource = 'categories' | 'badges' | 'users';
type Row = Record<string, any>;

@Component({
  selector: 'app-admin-management-page',
  standalone: true,
  imports: [AdminSidebar, AdminTopbar, FormsModule],
  templateUrl: './admin-management-page.html',
  styleUrl: './admin-management-page.scss',
})
export class AdminManagementPage implements OnInit {
  protected readonly i18n = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  protected readonly rows = signal<Row[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Row | null>(null);
  protected readonly saving = signal(false);
  protected readonly resource = signal<Resource>('categories');
  protected draft: Row = {};
  private readonly baseUrl = API_BASE_URL;

  ngOnInit(): void {
    this.resource.set((this.route.snapshot.data['resource'] as Resource) ?? 'categories');
    this.load();
  }

  protected titleKey(): string { return `admin.management.${this.resource()}`; }
  protected isUsers(): boolean { return this.resource() === 'users'; }
  protected isBadges(): boolean { return this.resource() === 'badges'; }

  protected load(): void {
    this.loading.set(true);
    this.http.get<Row[]>(`${this.baseUrl}/${this.resource()}`).subscribe({
      next: (rows) => { this.rows.set(rows); this.loading.set(false); },
      error: () => { this.error.set(this.i18n.t('admin.management.loadError')); this.loading.set(false); },
    });
  }

  protected beginCreate(): void {
    this.editing.set(null);
    this.draft = this.isUsers()
      ? { name: '', email: '', password: '', role: 'STAFF', active: true }
      : this.isBadges()
        ? { slug: '', label: '', labelFr: '', labelAr: '' }
        : { slug: '', name: '', nameFr: '', nameAr: '', sortOrder: 0, visible: true };
    this.formOpen.set(true);
  }

  protected beginEdit(row: Row): void {
    this.editing.set(row);
    this.draft = this.isUsers()
      ? { name: row['name'], email: row['email'], role: row['role'], active: row['active'], password: '' }
      : { ...row };
    this.formOpen.set(true);
  }

  protected save(): void {
    this.saving.set(true);
    const payload = { ...this.draft };
    if (this.isUsers() && !payload['password']) delete payload['password'];
    const request = this.editing()
      ? this.http.patch(`${this.baseUrl}/${this.resource()}/${this.editing()!['id']}`, payload)
      : this.http.post(`${this.baseUrl}/${this.resource()}`, payload);
    request.subscribe({
      next: () => { this.formOpen.set(false); this.saving.set(false); this.toast.success(this.i18n.t('admin.management.saveSuccess')); this.load(); },
      error: () => { this.error.set(this.i18n.t('admin.management.saveError')); this.toast.error(this.i18n.t('admin.management.saveError')); this.saving.set(false); },
    });
  }

  protected remove(row: Row): void {
    if (!confirm(`${this.i18n.t('admin.management.deleteConfirm')} ${row['name'] ?? row['labelFr'] ?? row['slug']} ?`)) return;
    this.http.delete(`${this.baseUrl}/${this.resource()}/${row['id']}`).subscribe({ next: () => { this.toast.success(this.i18n.t('admin.management.deleteSuccess')); this.load(); }, error: () => { this.error.set(this.i18n.t('admin.management.deleteError')); this.toast.error(this.i18n.t('admin.management.deleteError')); } });
  }

  protected closeForm(): void { this.formOpen.set(false); }
}
