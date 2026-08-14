import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../core/i18n/translation.service';

@Component({
  selector: 'app-mobile-actions',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mobile-actions.html',
  styleUrl: './mobile-actions.scss',
})
export class MobileActions {
  protected readonly i18n = inject(TranslationService);
}
