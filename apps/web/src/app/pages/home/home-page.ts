import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../core/i18n/translation.service';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { SiteHeader } from '../../shared/components/site-header/site-header';
import { PromotionalSection } from '../../shared/components/promotional-section/promotional-section';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [PromotionalSection, RouterLink, SiteFooter, SiteHeader],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly i18n = inject(TranslationService);
}
