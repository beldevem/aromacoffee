import { Component, inject } from '@angular/core';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { OrderNotificationsService } from '../../../../core/orders/order-notifications.service';
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
}
