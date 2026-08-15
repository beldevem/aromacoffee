import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuItem } from '../../../core/menu/menu-data';
import { TranslationService } from '../../../core/i18n/translation.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  readonly item = input.required<MenuItem>();
  readonly imageUrl = input.required<string>();
  readonly badgeKey = input<string | null>(null);
  protected readonly i18n = inject(TranslationService);

  protected productName(): string {
    return this.item().name[this.i18n.locale()];
  }

  protected displayPrice(price: string): string {
    return price.replaceAll(' DT', '');
  }
}
