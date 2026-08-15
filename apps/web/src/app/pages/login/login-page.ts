import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TranslationService } from '../../core/i18n/translation.service';
import { ToastService } from '../../core/notifications/toast.service';

@Component({ selector: 'app-login-page', standalone: true, imports: [FormsModule], templateUrl: './login-page.html', styleUrl: './login-page.scss' })
export class LoginPage {
  protected readonly i18n = inject(TranslationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected email = '';
  protected password = '';
  protected readonly error = signal('');
  protected readonly loading = signal(false);

  protected submit(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: (response) => { this.auth.startSession(response); this.loading.set(false); this.toast.success(this.i18n.t('auth.loginSuccess')); this.router.navigate(['/admin']); },
      error: () => { this.error.set(this.i18n.t('auth.loginError')); this.toast.error(this.i18n.t('auth.loginError')); this.loading.set(false); },
    });
  }
}
