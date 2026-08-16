import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../api/api-base-url';

export const ORDER_SESSION_HEADER = 'X-Order-Session';

interface StartSessionResponse {
  sessionToken: string;
  expiresAt: string;
  table: { code: string; label: string };
}

const TOKEN_KEY = 'aroma.orderSession';
const EXPIRY_KEY = 'aroma.orderSessionExpiresAt';
const TABLE_KEY = 'aroma.orderSessionTable';

/**
 * A printed QR code cannot expire, so the QR only carries an unguessable table secret.
 * Scanning exchanges that secret for a 30 minute session; once it lapses the guest must rescan.
 */
@Injectable({ providedIn: 'root' })
export class OrderSessionService {
  private readonly http = inject(HttpClient);
  readonly table = signal<{ code: string; label: string } | null>(null);
  readonly expiresAt = signal<number | null>(null);

  constructor() {
    this.restore();
  }

  start(qrToken: string): Observable<StartSessionResponse> {
    return this.http
      .post<StartSessionResponse>(`${API_BASE_URL}/order-sessions`, { qrToken })
      .pipe(tap((response) => this.persist(response)));
  }

  headers(): HttpHeaders {
    return new HttpHeaders({ [ORDER_SESSION_HEADER]: this.token() ?? '' });
  }

  token(): string | null {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(TOKEN_KEY);
  }

  isActive(): boolean {
    const expiresAt = this.expiresAt();
    return Boolean(this.token()) && expiresAt !== null && expiresAt > Date.now();
  }

  /** Seconds remaining before the guest has to scan the table QR code again. */
  secondsLeft(): number {
    const expiresAt = this.expiresAt();
    if (expiresAt === null) return 0;
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  }

  clear(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(EXPIRY_KEY);
      sessionStorage.removeItem(TABLE_KEY);
    }
    this.table.set(null);
    this.expiresAt.set(null);
  }

  private persist(response: StartSessionResponse): void {
    const expiresAt = new Date(response.expiresAt).getTime();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(TOKEN_KEY, response.sessionToken);
      sessionStorage.setItem(EXPIRY_KEY, String(expiresAt));
      sessionStorage.setItem(TABLE_KEY, JSON.stringify(response.table));
    }
    this.table.set(response.table);
    this.expiresAt.set(expiresAt);
  }

  private restore(): void {
    if (typeof sessionStorage === 'undefined') return;
    const expiresAt = Number(sessionStorage.getItem(EXPIRY_KEY));
    const rawTable = sessionStorage.getItem(TABLE_KEY);
    if (!sessionStorage.getItem(TOKEN_KEY) || !expiresAt || expiresAt <= Date.now()) {
      this.clear();
      return;
    }
    this.expiresAt.set(expiresAt);
    if (rawTable) {
      this.table.set(JSON.parse(rawTable) as { code: string; label: string });
    }
  }
}
