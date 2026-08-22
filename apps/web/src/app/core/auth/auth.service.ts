import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../api/api-base-url';

export type SessionUser = { id: string; name: string; email: string; role: 'ADMIN' | 'STAFF' | 'MANAGER'; active: boolean };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  readonly user = signal<SessionUser | null>(this.readUser());
  private readonly baseUrl = API_BASE_URL;

  login(email: string, password: string) {
    return this.http.post<{ accessToken: string; user: SessionUser }>(`${this.baseUrl}/auth/login`, { email, password });
  }

  startSession(response: { accessToken: string; user: SessionUser }): void {
    if (isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined') {
      localStorage.setItem('aroma.accessToken', response.accessToken);
      localStorage.setItem('aroma.user', JSON.stringify(response.user));
    }
    this.user.set(response.user);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined') {
      localStorage.removeItem('aroma.accessToken');
      localStorage.removeItem('aroma.user');
    }
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  token(): string | null {
    if (!isPlatformBrowser(this.platformId) || typeof localStorage === 'undefined') return null;
    return localStorage.getItem('aroma.accessToken');
  }

  isLoggedIn(): boolean {
    return Boolean(this.token());
  }

  private readUser(): SessionUser | null {
    if (!isPlatformBrowser(this.platformId) || typeof localStorage === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('aroma.user') ?? 'null');
    } catch {
      return null;
    }
  }
}
