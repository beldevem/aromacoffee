import { Component, inject } from '@angular/core';
import { TranslationService } from '../../../core/i18n/translation.service';

@Component({
  selector: 'app-promotional-section',
  standalone: true,
  templateUrl: './promotional-section.html',
  styleUrl: './promotional-section.scss',
})
export class PromotionalSection {
  protected readonly i18n = inject(TranslationService);
}
