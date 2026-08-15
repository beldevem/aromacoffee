import { Component, inject } from '@angular/core';
import { TranslationService } from '../../../../core/i18n/translation.service';

@Component({
  selector: 'app-admin-availability',
  standalone: true,
  templateUrl: './admin-availability.html',
  styleUrl: './admin-availability.scss',
})
export class AdminAvailability {
  protected readonly i18n = inject(TranslationService);
  protected readonly slots = [
    { time: '10:00', capacity: 8, booked: 4 },
    { time: '12:00', capacity: 12, booked: 10 },
    { time: '18:30', capacity: 16, booked: 7 },
    { time: '20:00', capacity: 16, booked: 14 },
  ];
}
