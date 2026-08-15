import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../core/i18n/translation.service';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { SiteHeader } from '../../shared/components/site-header/site-header';

@Component({
  selector: 'app-reserve-page',
  standalone: true,
  imports: [SiteFooter, SiteHeader, FormsModule],
  templateUrl: './reserve-page.html',
  styleUrl: './reserve-page.scss',
})
export class ReservePage {
  protected readonly i18n = inject(TranslationService);
  private readonly http = inject(HttpClient);
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal('');
  protected draft = this.emptyDraft();
  private readonly apiUrl = 'http://localhost:3000';

  protected submit(): void {
    this.submitting.set(true);
    this.submitted.set(false);
    this.error.set('');
    const payload = { ...this.draft, contactPhone: `+216${this.draft.contactPhone.replace(/^\+216\s?/, '')}`, dateTime: new Date(this.draft.dateTime).toISOString(), source: 'website', status: 'PENDING' };
    this.http.post(`${this.apiUrl}/reservations`, payload).subscribe({
      next: () => { this.submitted.set(true); this.submitting.set(false); this.draft = this.emptyDraft(); },
      error: () => { this.error.set(this.i18n.t('reserve.form.error')); this.submitting.set(false); },
    });
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
