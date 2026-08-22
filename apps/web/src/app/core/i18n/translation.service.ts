import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import en from './en.json';
import fr from './fr.json';
import ar from './ar.json';

export type Locale = 'en' | 'fr' | 'ar';

type Dictionary = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly dictionaries: Record<Locale, Dictionary> = { en, fr, ar };
  readonly locale = signal<Locale>('fr');
  readonly languages: ReadonlyArray<{ code: Locale; label: string }> = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' },
  ];
  readonly currentLanguage = computed(
    () => this.languages.find((language) => language.code === this.locale()) ?? this.languages[0],
  );
  readonly alternateLanguages = computed(() =>
    this.languages.filter((language) => language.code !== this.locale()),
  );

  constructor() {
    this.updateDocumentLanguage('fr');
  }

  t(key: string): string {
    return this.dictionaries[this.locale()][key] ?? this.dictionaries.en[key] ?? key;
  }

  setLanguage(locale: Locale): void {
    this.locale.set(locale);
    this.updateDocumentLanguage(locale);
  }

  private updateDocumentLanguage(locale: Locale): void {
    if (this.document?.documentElement) {
      this.document.documentElement.lang = locale;
      this.document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }
  }
}
