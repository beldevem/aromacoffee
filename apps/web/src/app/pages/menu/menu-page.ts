import { Component, computed, inject, signal } from '@angular/core';
import { MENU_CATEGORIES } from '../../core/menu/menu-data';
import { categoryImage, productImage } from '../../core/menu/menu-art';
import { TranslationService } from '../../core/i18n/translation.service';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { SiteHeader } from '../../shared/components/site-header/site-header';
import { ProductCard } from '../../shared/components/product-card/product-card';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [ProductCard, SiteFooter, SiteHeader],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.scss',
})
export class MenuPage {
  protected readonly i18n = inject(TranslationService);
  protected readonly categories = MENU_CATEGORIES;
  protected readonly searchTerm = signal('');
  protected readonly activeCategory = signal('all');
  protected readonly categoryKeys = ['all', ...this.categories.map((category) => category.key)];
  protected readonly visibleCategories = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const selectedCategory = this.activeCategory();

    return this.categories
      .filter((category) => selectedCategory === 'all' || category.key === selectedCategory)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (!query) {
            return true;
          }

          return Object.values(item.name).some((name) =>
            name.toLocaleLowerCase().includes(query),
          );
        }),
      }))
      .filter((category) => category.items.length > 0);
  });

  protected categoryImage(categoryKey: string): string {
    return categoryImage(categoryKey);
  }

  protected itemImage(slug: string, categoryKey: string): string {
    return productImage(slug, categoryKey);
  }

  protected badgeKey(slug: string): string | null {
    const badges: Record<string, string> = {
      cappuccino: 'menu.badge.most-ordered',
      'frappuccino-pistachio': 'menu.badge.signature',
      'breakfast-classic': 'menu.badge.favorite',
      'crepe-aroma-special': 'menu.badge.signature',
      'pack-friends': 'menu.badge.popular',
    };

    return badges[slug] ?? null;
  }
}
