import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../core/i18n/translation.service';

@Component({
  selector: 'app-promotional-section',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './promotional-section.html',
  styleUrl: './promotional-section.scss',
})
export class PromotionalSection {
  protected readonly i18n = inject(TranslationService);
}
