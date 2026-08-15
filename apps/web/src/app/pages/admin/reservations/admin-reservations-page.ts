import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AdminSidebar } from '../components/admin-sidebar/admin-sidebar';
import { AdminTopbar } from '../components/admin-topbar/admin-topbar';
import { TranslationService } from '../../../core/i18n/translation.service';
import { API_BASE_URL } from '../../../core/api/api-base-url';
import { ToastService } from '../../../core/notifications/toast.service';

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
type Reservation = { id: string; customerName: string; contactPhone: string; contactEmail?: string | null; dateTime: string; partySize: number; location: 'INDOOR' | 'OUTDOOR_TERRACE' | 'N/A'; notes?: string | null; status: ReservationStatus; source: string };

@Component({
  selector: 'app-admin-reservations-page',
  standalone: true,
  imports: [AdminSidebar, AdminTopbar, FormsModule, DatePipe],
  templateUrl: './admin-reservations-page.html',
  styleUrl: './admin-reservations-page.scss',
})
export class AdminReservationsPage implements OnInit {
  protected readonly i18n = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);
  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Reservation | null>(null);
  protected readonly statusFilter = signal<'ALL' | ReservationStatus>('ALL');
  protected readonly saving = signal(false);
  protected draft = this.emptyDraft();
  private readonly baseUrl = API_BASE_URL;

  ngOnInit(): void { this.load(); }

  protected visibleReservations(): Reservation[] {
    const filter = this.statusFilter();
    return this.reservations().filter((reservation) => filter === 'ALL' || reservation.status === filter);
  }

  protected load(): void {
    this.loading.set(true);
    this.http.get<Reservation[]>(`${this.baseUrl}/reservations`).subscribe({
      next: (items) => { this.reservations.set(items); this.loading.set(false); },
      error: () => { this.error.set(this.i18n.t('admin.reservations.loadError')); this.loading.set(false); },
    });
  }

  protected beginCreate(): void {
    this.editing.set(null);
    this.draft = this.emptyDraft();
    this.formOpen.set(true);
  }

  protected beginEdit(reservation: Reservation): void {
    this.editing.set(reservation);
    this.draft = { ...reservation, contactPhone: reservation.contactPhone.replace(/^\+216\s?/, ''), dateTime: this.toInputDate(reservation.dateTime) };
    this.formOpen.set(true);
  }

  protected save(): void {
    this.saving.set(true);
    const payload = { ...this.draft, contactPhone: `+216${this.draft.contactPhone}`, dateTime: new Date(this.draft.dateTime).toISOString() };
    const request = this.editing()
      ? this.http.patch(`${this.baseUrl}/reservations/${this.editing()!.id}`, payload)
      : this.http.post(`${this.baseUrl}/reservations`, payload);
    request.subscribe({
      next: () => { this.formOpen.set(false); this.saving.set(false); this.toast.success(this.i18n.t('admin.reservations.saveSuccess')); this.load(); },
      error: () => { this.error.set(this.i18n.t('admin.reservations.saveError')); this.toast.error(this.i18n.t('admin.reservations.saveError')); this.saving.set(false); },
    });
  }

  protected remove(reservation: Reservation): void {
    if (!confirm(`${this.i18n.t('admin.reservations.deleteConfirm')} ${reservation.customerName} ?`)) return;
    this.http.delete(`${this.baseUrl}/reservations/${reservation.id}`).subscribe({
      next: () => { this.toast.success(this.i18n.t('admin.reservations.deleteSuccess')); this.load(); },
      error: () => { this.error.set(this.i18n.t('admin.reservations.deleteError')); this.toast.error(this.i18n.t('admin.reservations.deleteError')); },
    });
  }

  protected closeForm(): void { this.formOpen.set(false); }

  protected statusLabel(status: ReservationStatus): string { return this.i18n.t(`admin.reservation.${status.toLowerCase()}`); }

  private emptyDraft(): Omit<Reservation, 'id'> {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return { customerName: '', contactPhone: '', contactEmail: '', dateTime: date.toISOString().slice(0, 16), partySize: 2, location: 'N/A', notes: '', status: 'PENDING', source: 'admin' };
  }

  private toInputDate(value: string): string {
    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }
}
