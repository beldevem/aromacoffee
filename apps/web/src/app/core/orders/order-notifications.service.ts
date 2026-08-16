import { inject, Injectable, signal } from '@angular/core';
import { API_BASE_URL } from '../api/api-base-url';
import { AuthService } from '../auth/auth.service';

export interface NewOrderNotification {
  id: string;
  reference: string;
  totalCents: number;
  createdAt: string;
  createdBy: string;
  channel: 'QR' | 'COUNTER';
  takeaway: boolean;
  table: { code: string; label: string } | null;
  items: Array<{ nameFr: string; quantity: number }>;
}

const MUTE_KEY = 'aroma.ordersMuted';
const MAX_VISIBLE = 3;

/**
 * Subscribes to the order SSE feed with fetch rather than EventSource, because EventSource
 * cannot send the Authorization header and we do not want the admin JWT in a query string.
 */
@Injectable({ providedIn: 'root' })
export class OrderNotificationsService {
  private readonly auth = inject(AuthService);
  private controller?: AbortController;
  private audioContext?: AudioContext;
  private retryDelay = 2000;
  private running = false;

  readonly notifications = signal<NewOrderNotification[]>([]);
  readonly muted = signal(this.readMuted());
  readonly connected = signal(false);

  start(): void {
    // Streaming needs a browser with fetch and a readable token store; skip on SSR and in tests.
    if (this.running || typeof fetch === 'undefined' || typeof localStorage === 'undefined') return;
    this.running = true;
    void this.connect();
  }

  stop(): void {
    this.running = false;
    this.controller?.abort();
    this.connected.set(false);
  }

  dismiss(id: string): void {
    this.notifications.update((items) => items.filter((item) => item.id !== id));
  }

  dismissAll(): void {
    this.notifications.set([]);
  }

  toggleMute(): void {
    const next = !this.muted();
    this.muted.set(next);
    localStorage.setItem(MUTE_KEY, String(next));
    // Unmuting counts as a user gesture, so unlock audio for later notifications.
    if (!next) this.playChime();
  }

  private async connect(): Promise<void> {
    const token = this.auth.token();
    if (!token) {
      this.running = false;
      return;
    }

    this.controller = new AbortController();
    try {
      const response = await fetch(`${API_BASE_URL}/orders/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: this.controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(`Stream failed: ${response.status}`);

      this.connected.set(true);
      this.retryDelay = 2000;
      await this.readStream(response.body.getReader());
    } catch {
      // Swallowed on purpose: any failure falls through to the reconnect below.
    }

    this.connected.set(false);
    if (this.running) {
      setTimeout(() => void this.connect(), this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, 30_000);
    }
  }

  private async readStream(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });

      let split = buffer.indexOf('\n\n');
      while (split !== -1) {
        this.handleFrame(buffer.slice(0, split));
        buffer = buffer.slice(split + 2);
        split = buffer.indexOf('\n\n');
      }
    }
  }

  private handleFrame(frame: string): void {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (event !== 'new-order' || dataLines.length === 0) return;

    try {
      const order = JSON.parse(dataLines.join('\n')) as NewOrderNotification;
      this.notifications.update((items) => [order, ...items].slice(0, MAX_VISIBLE));
      if (!this.muted()) this.playChime();
    } catch {
      // Ignore malformed frames rather than killing the stream.
    }
  }

  /** Synthesised two-tone chime, so no audio asset has to ship or be preloaded. */
  private playChime(): void {
    try {
      this.audioContext ??= new AudioContext();
      const context = this.audioContext;
      if (context.state === 'suspended') void context.resume();

      [880, 1320].forEach((frequency, index) => {
        const startAt = context.currentTime + index * 0.16;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.25, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.3);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.32);
      });
    } catch {
      // Autoplay policy or unsupported browser: the visual toast is still shown.
    }
  }

  private readMuted(): boolean {
    return typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === 'true';
  }
}
