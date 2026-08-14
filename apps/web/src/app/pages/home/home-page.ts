import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../core/i18n/translation.service';
import { MobileActions } from '../../shared/components/mobile-actions/mobile-actions';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { SiteHeader } from '../../shared/components/site-header/site-header';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [MobileActions, RouterLink, SiteFooter, SiteHeader],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly i18n = inject(TranslationService);
}
