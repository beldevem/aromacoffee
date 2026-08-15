import { Component, inject } from '@angular/core';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.scss',
})
export class AdminProducts {
  protected readonly i18n = inject(TranslationService);
  protected readonly auth = inject(AuthService);
  protected readonly products = [
    { name: 'Cappuccino', category: 'Cafés chauds', price: '5.5 DT', state: 'admin.product.visible' },
    { name: 'Frappuccino Pistache', category: 'Frappuccinos', price: '12 DT', state: 'admin.product.visible' },
    { name: 'Breakfast Classic', category: 'Petits déjeuners', price: '25 DT', state: 'admin.product.visible' },
    { name: 'Pack Friends', category: 'Packs soir', price: '55 DT', state: 'admin.product.draft' },
  ];

  protected canManageProducts(): boolean {
    return this.auth.user()?.role === 'ADMIN';
  }
}
