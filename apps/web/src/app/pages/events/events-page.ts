import { Component, inject } from '@angular/core';
import { TranslationService } from '../../core/i18n/translation.service';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { SiteHeader } from '../../shared/components/site-header/site-header';

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [SiteFooter, SiteHeader],
  templateUrl: './events-page.html',
  styleUrl: './events-page.scss',
})
export class EventsPage {
  protected readonly i18n = inject(TranslationService);
}
