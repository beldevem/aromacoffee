import { Component, inject } from '@angular/core';
import { TranslationService } from '../../core/i18n/translation.service';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { SiteHeader } from '../../shared/components/site-header/site-header';

@Component({
  selector: 'app-visit-page',
  standalone: true,
  imports: [SiteFooter, SiteHeader],
  templateUrl: './visit-page.html',
  styleUrl: './visit-page.scss',
})
export class VisitPage {
  protected readonly i18n = inject(TranslationService);
}
