import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { NewOrderNotification, OrderNotificationsService } from '../../../../core/orders/order-notifications.service';

@Component({
  selector: 'app-admin-order-alerts',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-order-alerts.html',
  styleUrl: './admin-order-alerts.scss',
})
export class AdminOrderAlerts implements OnInit, OnDestroy {
  protected readonly i18n = inject(TranslationService);
  protected readonly alerts = inject(OrderNotificationsService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.alerts.start();
  }

  ngOnDestroy(): void {
    this.alerts.stop();
  }

  protected summarise(order: NewOrderNotification): string {
    return order.items.map((item) => `${item.quantity} × ${item.nameFr}`).join(', ');
  }

  protected formatPrice(cents: number): string {
    return `${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 1)} DT`;
  }
}
