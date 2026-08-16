import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { TranslationService } from '../../core/i18n/translation.service';
import { LOCAL_PRODUCT_IMAGES } from '../../core/menu/menu-images';
import { productImage } from '../../core/menu/menu-art';
import { OrderSessionService } from '../../core/order/order-session.service';

type PageState = 'loading' | 'invalid' | 'expired' | 'ready' | 'sent';

interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  nameFr: string;
  nameAr: string;
  description?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  priceCents: number;
  promotion: boolean;
  ogPrice?: number | null;
  promoPrice?: number | null;
  imageUrl?: string | null;
}

interface CatalogCategory {
  slug: string;
  name: string;
  nameFr: string;
  nameAr: string;
  products: CatalogProduct[];
}

interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

@Component({
  selector: 'app-order-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './order-page.html',
  styleUrl: './order-page.scss',
})
export class OrderPage implements OnInit, OnDestroy {
  protected readonly i18n = inject(TranslationService);
  protected readonly session = inject(OrderSessionService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private timer?: ReturnType<typeof setInterval>;

  protected readonly state = signal<PageState>('loading');
  protected readonly categories = signal<CatalogCategory[]>([]);
  protected readonly activeCategory = signal('all');
  protected readonly searchTerm = signal('');
  protected readonly cart = signal<OrderItem[]>([]);
  protected readonly cartOpen = signal(false);
  protected readonly note = signal('');
  protected readonly sending = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly reference = signal('');
  protected readonly secondsLeft = signal(0);

  protected readonly cartCount = computed(() => this.cart().reduce((sum, item) => sum + item.quantity, 0));
  protected readonly cartTotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
  );
  protected readonly countdown = computed(() => {
    const seconds = this.secondsLeft();
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });
  protected readonly lowTime = computed(() => this.secondsLeft() > 0 && this.secondsLeft() <= 300);

  protected readonly filteredCategories = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const active = this.activeCategory();
    return this.categories()
      .filter((category) => active === 'all' || category.slug === active)
      .map((category) => ({
        ...category,
        products: category.products.filter(
          (product) =>
            !query ||
            [product.name, product.nameFr, product.nameAr].some((name) =>
              name.toLocaleLowerCase().includes(query),
            ),
        ),
      }))
      .filter((category) => category.products.length > 0);
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const qrToken = this.route.snapshot.queryParamMap.get('table') ?? '';
    if (!/^[a-f0-9]{64}$/.test(qrToken)) {
      this.state.set('invalid');
      return;
    }

    this.session.start(qrToken).subscribe({
      next: () => {
        this.loadCatalog();
        this.startCountdown();
        this.state.set('ready');
      },
      error: () => this.state.set('invalid'),
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  protected updateSearch(value: string): void {
    this.searchTerm.set(value);
  }

  protected selectCategory(key: string): void {
    this.activeCategory.set(key);
  }

  protected openCart(): void {
    this.cartOpen.set(true);
  }

  protected closeCart(): void {
    this.cartOpen.set(false);
  }

  protected updateNote(value: string): void {
    this.note.set(value);
  }

  protected productName(product: CatalogProduct): string {
    const locale = this.i18n.locale();
    return locale === 'fr' ? product.nameFr : locale === 'ar' ? product.nameAr : product.name;
  }

  protected productDescription(product: CatalogProduct): string {
    const locale = this.i18n.locale();
    const value = locale === 'fr' ? product.descriptionFr : locale === 'ar' ? product.descriptionAr : product.description;
    // Several products use their own name as a placeholder description; showing it twice adds no value.
    return !value || value === this.productName(product) ? '' : value;
  }

  protected categoryName(category: CatalogCategory): string {
    const locale = this.i18n.locale();
    return locale === 'fr' ? category.nameFr : locale === 'ar' ? category.nameAr : category.name;
  }

  protected productImageUrl(product: CatalogProduct, categoryKey: string): string {
    return product.imageUrl ?? LOCAL_PRODUCT_IMAGES[product.slug] ?? productImage(product.slug, categoryKey);
  }

  protected unitPrice(product: CatalogProduct): number {
    const isPromotion =
      product.promotion && product.promoPrice != null && product.promoPrice < (product.ogPrice ?? product.priceCents);
    return isPromotion ? product.promoPrice! : product.priceCents;
  }

  protected isPromotion(product: CatalogProduct): boolean {
    return product.promotion && product.promoPrice != null && product.promoPrice < (product.ogPrice ?? product.priceCents);
  }

  protected formatPrice(cents: number): string {
    return `${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 1)} DT`;
  }

  protected quantityOf(productId: string): number {
    return this.cart().find((item) => item.productId === productId)?.quantity ?? 0;
  }

  protected add(product: CatalogProduct): void {
    this.errorMessage.set('');
    const existing = this.cart().find((item) => item.productId === product.id);
    if (existing) {
      this.setQuantity(product.id, existing.quantity + 1);
      return;
    }
    this.cart.update((items) => [
      ...items,
      {
        productId: product.id,
        slug: product.slug,
        name: this.productName(product),
        unitPriceCents: this.unitPrice(product),
        quantity: 1,
      },
    ]);
  }

  protected setQuantity(productId: string, quantity: number): void {
    const next = Math.min(20, Math.max(0, quantity));
    this.cart.update((items) =>
      next === 0
        ? items.filter((item) => item.productId !== productId)
        : items.map((item) => (item.productId === productId ? { ...item, quantity: next } : item)),
    );
  }

  protected submit(): void {
    if (this.cart().length === 0 || this.sending()) return;
    if (!this.session.isActive()) {
      this.state.set('expired');
      return;
    }

    this.sending.set(true);
    this.errorMessage.set('');
    this.http
      .post<{ reference: string }>(
        `${API_BASE_URL}/table-orders`,
        {
          items: this.cart().map((item) => ({ productId: item.productId, quantity: item.quantity })),
          note: this.note().trim() || undefined,
        },
        { headers: this.session.headers() },
      )
      .subscribe({
        next: (order) => {
          this.sending.set(false);
          this.reference.set(order.reference);
          this.cart.set([]);
          this.note.set('');
          this.cartOpen.set(false);
          this.state.set('sent');
        },
        error: (error: { status?: number }) => {
          this.sending.set(false);
          if (error.status === 401) {
            this.state.set('expired');
            return;
          }
          this.errorMessage.set(this.i18n.t('order.error.generic'));
        },
      });
  }

  protected orderAgain(): void {
    this.state.set(this.session.isActive() ? 'ready' : 'expired');
  }

  private loadCatalog(): void {
    this.http.get<CatalogCategory[]>(`${API_BASE_URL}/categories/public/catalog`).subscribe({
      next: (catalog) => this.categories.set(catalog.filter((category) => category.products.length > 0)),
      error: () => this.errorMessage.set(this.i18n.t('order.error.generic')),
    });
  }

  private startCountdown(): void {
    this.secondsLeft.set(this.session.secondsLeft());
    this.timer = setInterval(() => {
      const left = this.session.secondsLeft();
      this.secondsLeft.set(left);
      if (left <= 0) {
        this.session.clear();
        this.state.set('expired');
        if (this.timer) clearInterval(this.timer);
      }
    }, 1000);
  }
}
