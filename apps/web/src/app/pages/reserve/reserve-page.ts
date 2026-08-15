import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../core/i18n/translation.service';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { ToastService } from '../../core/notifications/toast.service';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { SiteHeader } from '../../shared/components/site-header/site-header';

@Component({
  selector: 'app-reserve-page',
  standalone: true,
  imports: [SiteFooter, SiteHeader, FormsModule, RouterLink],
  templateUrl: './reserve-page.html',
  styleUrl: './reserve-page.scss',
})
export class ReservePage {
  protected readonly i18n = inject(TranslationService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  protected readonly submitting = signal(false);
  protected readonly confirmation = signal<ReturnType<ReservePage['emptyDraft']> | null>(null);
  protected readonly error = signal('');
  protected draft = this.emptyDraft();
  private readonly apiUrl = API_BASE_URL;

  protected submit(reservationForm: NgForm): void {
    this.submitting.set(true);
    this.error.set('');
    const payload = {
      ...this.draft,
      contactPhone: `+216${this.draft.contactPhone.replace(/^\+216\s?/, '').replace(/\s+/g, '')}`,
      contactEmail: this.draft.contactEmail.trim() || undefined,
      notes: this.draft.notes.trim() || undefined,
      dateTime: new Date(this.draft.dateTime).toISOString(),
      source: 'website',
      status: 'PENDING',
    };
    this.http.post(`${this.apiUrl}/reservations`, payload).subscribe({
      next: () => {
        this.confirmation.set({ ...this.draft });
        this.submitting.set(false);
        this.draft = this.emptyDraft();
        reservationForm.resetForm(this.draft);
        this.toast.success(this.i18n.t('reserve.form.success'));
      },
      error: () => { this.error.set(this.i18n.t('reserve.form.error')); this.toast.error(this.i18n.t('reserve.form.error')); this.submitting.set(false); },
    });
  }

  protected closeConfirmation(): void {
    this.confirmation.set(null);
  }

  protected confirmationDate(value: string): string {
    return new Intl.DateTimeFormat(this.i18n.locale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }

  protected locationLabel(value: string): string {
    return this.i18n.t(`reserve.location.${value === 'OUTDOOR_TERRACE' ? 'terrace' : value === 'INDOOR' ? 'indoor' : 'na'}`);
  }

  protected minDateTime(): string {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }

  private emptyDraft() {
    const date = new Date(Date.now() + 60 * 60 * 1000);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return { customerName: '', contactPhone: '', contactEmail: '', dateTime: date.toISOString().slice(0, 16), partySize: 2, location: 'N/A', notes: '' };
  }
}
