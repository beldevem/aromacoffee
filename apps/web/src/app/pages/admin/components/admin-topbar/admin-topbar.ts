import { Component, inject } from '@angular/core';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  templateUrl: './admin-topbar.html',
  styleUrl: './admin-topbar.scss',
})
export class AdminTopbar {
  protected readonly i18n = inject(TranslationService);
  protected readonly auth = inject(AuthService);
}
