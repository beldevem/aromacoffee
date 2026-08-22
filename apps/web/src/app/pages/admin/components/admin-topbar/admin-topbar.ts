import { Component, computed, inject } from '@angular/core';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { OrderNotificationsService } from '../../../../core/orders/order-notifications.service';
import { NetworkStatusService } from '../../../../core/network/network-status.service';
import { AdminOrderAlerts } from '../admin-order-alerts/admin-order-alerts';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [AdminOrderAlerts],
  templateUrl: './admin-topbar.html',
  styleUrl: './admin-topbar.scss',
})
export class AdminTopbar {
  protected readonly i18n = inject(TranslationService);
  protected readonly auth = inject(AuthService);
  protected readonly alerts = inject(OrderNotificationsService);
  protected readonly network = inject(NetworkStatusService);

  protected readonly greeting = computed(() => {
    const name = this.auth.user()?.name;
    const locale = this.i18n.locale();
    if (!name) {
      return this.i18n.t('admin.title');
    }
    if (locale === 'ar') return `مرحباً، ${name}`;
    if (locale === 'en') return `Hello, ${name}`;
    return `Bonjour, ${name}`;
  });
}
