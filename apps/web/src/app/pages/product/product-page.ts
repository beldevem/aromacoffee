import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MENU_ITEMS, MenuItem } from '../../core/menu/menu-data';
import { TranslationService } from '../../core/i18n/translation.service';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { SiteHeader } from '../../shared/components/site-header/site-header';
import { LOCAL_PRODUCT_IMAGES } from '../../core/menu/menu-images';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [RouterLink, SiteFooter, SiteHeader],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss',
})
export class ProductPage {
  protected readonly i18n = inject(TranslationService);
  protected readonly slug = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';
  protected readonly product: MenuItem | undefined = MENU_ITEMS.find((item) => item.slug === this.slug);
  protected readonly localImage = LOCAL_PRODUCT_IMAGES[this.slug];

  protected productName(): string {
    return this.product?.name[this.i18n.locale()] ?? this.i18n.t('product.page.unknown');
  }

  protected productDescription(): string {
    return this.product?.description[this.i18n.locale()] ?? this.i18n.t('product.page.unknown-copy');
  }
}
