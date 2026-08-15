import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { AdminSidebar } from '../components/admin-sidebar/admin-sidebar';
import { AdminTopbar } from '../components/admin-topbar/admin-topbar';
import { AdminProductsApiService, ApiFlag, ApiProduct, ProductPayload } from './admin-products-api.service';
import { TranslationService } from '../../../core/i18n/translation.service';
import { ToastService } from '../../../core/notifications/toast.service';

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [AdminSidebar, AdminTopbar, FormsModule],
  templateUrl: './admin-products-page.html',
  styleUrl: './admin-products-page.scss',
})
export class AdminProductsPage implements OnInit {
  protected readonly i18n = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly api = inject(AdminProductsApiService);
  protected readonly products = signal<ApiProduct[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly search = signal('');
  protected readonly categoryFilter = signal('all');
  protected readonly statusFilter = signal<'all' | ApiProduct['status']>('all');
  protected readonly sortBy = signal<'name' | 'category' | 'status'>('name');
  protected readonly editing = signal<ApiProduct | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly selectedImageName = signal('');
  private selectedImage: File | null = null;
  protected draft: ProductPayload = this.emptyDraft();
  protected categories: ApiProduct['category'][] = [];
  protected flags: ApiFlag[] = [];
  protected readonly visibleProducts = computed(() => {
    const category = this.categoryFilter();
    const status = this.statusFilter();
    const products = this.products().filter((product) =>
      (category === 'all' || product.categoryId === category) &&
      (status === 'all' || product.status === status),
    );

    return [...products].sort((left, right) => {
      if (this.sortBy() === 'category') return left.category.nameFr.localeCompare(right.category.nameFr);
      if (this.sortBy() === 'status') return left.status.localeCompare(right.status);
      return left.nameFr.localeCompare(right.nameFr);
    });
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.list(this.search()).subscribe({
      next: (response) => {
        this.products.set(response.items);
        this.categories = response.items.map((item) => item.category).filter((category, index, all) => all.findIndex((entry) => entry.id === category.id) === index);
        this.flags = response.items.map((item) => item.flag).filter((flag): flag is ApiFlag => Boolean(flag)).filter((flag, index, all) => all.findIndex((entry) => entry.id === flag.id) === index);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('admin.products.loadError'));
        this.loading.set(false);
      },
    });
  }

  protected beginCreate(): void {
    this.editing.set(null);
    this.draft = this.emptyDraft();
    this.draft.categoryId = this.categories[0]?.id ?? '';
    this.clearSelectedImage();
    this.formOpen.set(true);
  }

  protected beginEdit(product: ApiProduct): void {
    this.editing.set(product);
    this.draft = {
      slug: product.slug,
      name: product.name,
      nameFr: product.nameFr,
      nameAr: product.nameAr,
      description: product.description ?? '',
      descriptionFr: product.descriptionFr ?? '',
      descriptionAr: product.descriptionAr ?? '',
      priceCents: product.priceCents,
      promotion: product.promotion,
      ogPrice: this.priceInDt(product.ogPrice ?? product.priceCents),
      promoPrice: product.promoPrice === null || product.promoPrice === undefined ? null : this.priceInDt(product.promoPrice),
      flagId: product.flagId ?? undefined,
      imageUrl: product.imageUrl ?? undefined,
      status: product.status,
      categoryId: product.categoryId,
    };
    this.clearSelectedImage();
    this.formOpen.set(true);
  }

  protected selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedImage = file;
    this.selectedImageName.set(file?.name ?? '');
  }

  protected save(): void {
    this.saving.set(true);
    const originalPrice = this.parsePriceCents(String(this.draft.ogPrice ?? 0));
    const promoPrice = this.draft.promotion ? this.parsePriceCents(String(this.draft.promoPrice ?? 0)) : null;
    const payload = { ...this.draft };
    if (payload.imageUrl?.startsWith('/')) delete payload.imageUrl;
    Object.assign(payload, { ogPrice: originalPrice, promoPrice, priceCents: promoPrice ?? originalPrice });
    const request = this.editing()
      ? this.api.update(this.editing()!.id, payload)
      : this.api.create(payload);
    request.subscribe({
      next: (product) => {
        const imageRequest = this.selectedImage ? this.api.uploadImage(product.id, this.selectedImage) : of(product);
        imageRequest.subscribe({
          next: () => {
            this.formOpen.set(false);
            this.saving.set(false);
            this.toast.success(this.i18n.t('admin.products.saveSuccess'));
            this.loadProducts();
          },
          error: () => {
            this.error.set(this.i18n.t('admin.products.saveError'));
            this.toast.error(this.i18n.t('admin.products.saveError'));
            this.saving.set(false);
          },
        });
      },
      error: () => {
        this.error.set(this.i18n.t('admin.products.saveError'));
        this.toast.error(this.i18n.t('admin.products.saveError'));
        this.saving.set(false);
      },
    });
  }

  protected remove(product: ApiProduct): void {
    if (!confirm(`${this.i18n.t('admin.products.deleteConfirm')} ${product.name}?`)) return;
    this.api.delete(product.id).subscribe({
      next: () => { this.toast.success(this.i18n.t('admin.products.deleteSuccess')); this.loadProducts(); },
      error: () => { this.error.set(this.i18n.t('admin.products.deleteError')); this.toast.error(this.i18n.t('admin.products.deleteError')); },
    });
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.clearSelectedImage();
  }

  private clearSelectedImage(): void {
    this.selectedImage = null;
    this.selectedImageName.set('');
  }

  private emptyDraft(): ProductPayload {
    return {
      slug: '', name: '', nameFr: '', nameAr: '', description: '', descriptionFr: '', descriptionAr: '',
      priceCents: 0, status: 'DRAFT', categoryId: '', tags: [], allergens: [],
      promotion: false, ogPrice: 0, promoPrice: null, flagId: undefined,
    };
  }

  private parsePriceCents(label: string): number {
    const value = /\d+(?:[.,]\d+)?/.exec(label)?.[0] ?? '0';
    return Math.round(Number(value.replace(',', '.')) * 100);
  }

  private priceInDt(priceCents: number): number {
    return priceCents / 100;
  }
}
