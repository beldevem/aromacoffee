import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../../core/i18n/translation.service';

type Reservation = {
  id: string;
  customerName: string;
  contactPhone: string;
  dateTime: string;
  partySize: number;
  location: 'INDOOR' | 'OUTDOOR_TERRACE' | 'N/A';
  createdBy: string;
  lastUpdatedBy?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
};

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-reservations.html',
  styleUrl: './admin-reservations.scss',
})
export class AdminReservations implements OnInit {
  protected readonly i18n = inject(TranslationService);
  private readonly http = inject(HttpClient);
  protected readonly reservations = signal<Reservation[]>([]);

  ngOnInit(): void {
    this.http.get<Reservation[]>('http://localhost:3000/reservations').subscribe({
      next: (items) => {
        const now = Date.now();
        this.reservations.set(items
          .filter((item) => !['CANCELLED', 'NO_SHOW'].includes(item.status) && new Date(item.dateTime).getTime() >= now)
          .sort((left, right) => new Date(left.dateTime).getTime() - new Date(right.dateTime).getTime())
          .slice(0, 4));
      },
      error: () => this.reservations.set([]),
    });
  }

  protected statusKey(status: Reservation['status']): string { return `admin.reservation.${status.toLowerCase()}`; }

  protected locationLabel(location: Reservation['location']): string {
    const key = location === 'INDOOR' ? 'reserve.location.indoor' : location === 'OUTDOOR_TERRACE' ? 'reserve.location.terrace' : 'reserve.location.na';
    return this.i18n.t(key);
  }
}
