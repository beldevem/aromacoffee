import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

export type SessionUser = { id: string; name: string; email: string; role: 'ADMIN' | 'STAFF' | 'MANAGER'; active: boolean };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly user = signal<SessionUser | null>(this.readUser());
  private readonly baseUrl = 'http://localhost:3000';

  login(email: string, password: string) {
    return this.http.post<{ accessToken: string; user: SessionUser }>(`${this.baseUrl}/auth/login`, { email, password });
  }

  startSession(response: { accessToken: string; user: SessionUser }): void {
    localStorage.setItem('aroma.accessToken', response.accessToken);
    localStorage.setItem('aroma.user', JSON.stringify(response.user));
    this.user.set(response.user);
  }

  logout(): void {
    localStorage.removeItem('aroma.accessToken');
    localStorage.removeItem('aroma.user');
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  token(): string | null { return localStorage.getItem('aroma.accessToken'); }
  isLoggedIn(): boolean { return Boolean(this.token()); }

  private readUser(): SessionUser | null {
    try { return JSON.parse(localStorage.getItem('aroma.user') ?? 'null'); } catch { return null; }
  }
}
