import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { TranslationService } from '../../core/i18n/translation.service';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { SiteHeader } from '../../shared/components/site-header/site-header';

@Component({
  selector: 'app-gallery-page',
  standalone: true,
  imports: [SiteFooter, SiteHeader],
  templateUrl: './gallery-page.html',
  styleUrl: './gallery-page.scss',
})
export class GalleryPage implements AfterViewInit, OnDestroy {
  protected readonly i18n = inject(TranslationService);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly gallerySlides = Array.from({ length: 15 }, (_, index) => ({
    src: `/images/galerie/galerie${index + 1}.JPG`,
    label: `Aroma gallery moment ${index + 1}`,
  }));
  protected readonly activeIndex = signal(0);
  private autoAdvance?: ReturnType<typeof setInterval>;

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.autoAdvance = setInterval(() => this.next(), 3000);
    }
  }

  ngOnDestroy(): void {
    if (this.autoAdvance) {
      clearInterval(this.autoAdvance);
    }
  }

  protected previous(): void {
    this.activeIndex.update((index) =>
      index === 0 ? this.gallerySlides.length - 1 : index - 1,
    );
  }

  protected next(): void {
    this.activeIndex.update((index) => (index + 1) % this.gallerySlides.length);
  }
}
