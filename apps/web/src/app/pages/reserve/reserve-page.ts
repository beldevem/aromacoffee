import { Component, inject } from '@angular/core';
import { TranslationService } from '../../core/i18n/translation.service';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { SiteHeader } from '../../shared/components/site-header/site-header';

@Component({
  selector: 'app-reserve-page',
  standalone: true,
  imports: [SiteFooter, SiteHeader],
  templateUrl: './reserve-page.html',
  styleUrl: './reserve-page.scss',
})
export class ReservePage {
  protected readonly i18n = inject(TranslationService);
}
