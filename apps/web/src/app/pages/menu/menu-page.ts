import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, computed, ElementRef, inject, OnDestroy, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { MENU_CATEGORIES } from '../../core/menu/menu-data';
import { categoryImage, productImage } from '../../core/menu/menu-art';
import { LOCAL_PRODUCT_IMAGES } from '../../core/menu/menu-images';
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
export class MenuPage implements AfterViewInit, OnDestroy {
  protected readonly i18n = inject(TranslationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly initialCategoryCount = 3;
  private readonly categoryBatchSize = 3;
  private observer?: IntersectionObserver;

  @ViewChild('loadMoreSentinel')
  private readonly loadMoreSentinel?: ElementRef<HTMLDivElement>;

  protected readonly categories = MENU_CATEGORIES
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.status === 'PUBLISHED'),
    }))
    .filter((category) => category.items.length > 0);
  protected readonly searchTerm = signal('');
  protected readonly activeCategory = signal('all');
  protected readonly renderedCategoryCount = signal(this.initialCategoryCount);
  protected readonly categoryKeys = ['all', ...this.categories.map((category) => category.key)];
  private readonly categorySearchTerms: Record<string, string[]> = {
    chocolates: ['chocolate', 'chocolat', 'dessert', 'desserts'],
    'drinks.fresh-juices': ['drink', 'drinks', 'boisson', 'boissons', 'juice', 'jus'],
    milkshakes: ['drink', 'drinks', 'boisson', 'boissons'],
    smoothies: ['drink', 'drinks', 'boisson', 'boissons'],
    mojitos: ['drink', 'drinks', 'boisson', 'boissons'],
    'signature-cocktails': ['drink', 'drinks', 'boisson', 'boissons', 'cocktail'],
    omelettes: ['salted', 'salé', 'salée', 'savory', 'sale'],
    'sweet-crepes': ['sweet', 'sucré', 'sucrée', 'dessert', 'desserts'],
    'waffles-pancakes': ['sweet', 'sucré', 'sucrée', 'dessert', 'desserts'],
    'savory-desserts': ['salted', 'salé', 'salée', 'savory', 'sale', 'dessert', 'desserts'],
    'jwajem-drinks': ['drink', 'drinks', 'boisson', 'boissons'],
    'evening-packs': ['pack', 'packs', 'evening', 'soir'],
  };
  protected readonly filteredCategories = computed(() => {
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

          const categoryTerms = [
            category.key,
            this.i18n.t(`menu.category.${category.key}`),
            ...(this.categorySearchTerms[category.key] ?? []),
          ];
          const matchesCategory = categoryTerms.some((term) =>
            term.toLocaleLowerCase().includes(query),
          );
          const matchesProduct = Object.values(item.name).some((name) =>
            name.toLocaleLowerCase().includes(query),
          );
          return matchesCategory || matchesProduct;
        }),
      }))
      .filter((category) => category.items.length > 0);
  });
  protected readonly visibleCategories = computed(() =>
    this.filteredCategories().slice(0, this.renderedCategoryCount()),
  );
  protected readonly hasMoreCategories = computed(
    () => this.visibleCategories().length < this.filteredCategories().length,
  );

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.loadMoreSentinel) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.loadMoreCategories();
        }
      },
      { rootMargin: '480px 0px' },
    );
    this.observer.observe(this.loadMoreSentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  protected updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
    this.resetCategoryWindow();
  }

  protected selectCategory(categoryKey: string): void {
    this.activeCategory.set(categoryKey);
    this.resetCategoryWindow();
  }

  protected loadMoreCategories(): void {
    if (this.hasMoreCategories()) {
      this.renderedCategoryCount.update((count) => count + this.categoryBatchSize);
    }
  }

  private resetCategoryWindow(): void {
    this.renderedCategoryCount.set(this.initialCategoryCount);
  }

  protected categoryImage(categoryKey: string): string {
    return categoryImage(categoryKey);
  }

  protected itemImage(slug: string, categoryKey: string): string {
    return LOCAL_PRODUCT_IMAGES[slug] ?? productImage(slug, categoryKey);
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
