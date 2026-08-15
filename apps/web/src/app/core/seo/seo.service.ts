import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

interface SeoDefinition {
  title: string;
  description: string;
  type?: 'website' | 'article';
}

const SITE_URL = 'https://myaromacoffee.com';
const DEFAULT_IMAGE = `${SITE_URL}/brand/aroma-logo.svg`;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly definitions: Record<string, SeoDefinition> = {
    '/': {
      title: 'Aroma Coffee Shop | Coffee, Breakfasts & Fresh Drinks',
      description: 'Discover Aroma Coffee Shop in Janoura, Kébili: freshly roasted coffee, breakfasts, fresh drinks, desserts, events, and warm tables.',
    },
    '/menu': {
      title: 'Menu | Aroma Coffee Shop',
      description: 'Explore the Aroma Coffee Shop menu: coffees, frappuccinos, fresh juices, smoothies, breakfasts, crepes, waffles, desserts, and evening packs.',
    },
    '/events': {
      title: 'Events at Aroma | Birthdays, Work Dinners & Seminars',
      description: 'Plan birthdays, work dinners, seminars, and special occasions at Aroma Coffee Shop in Janoura, Kébili.',
    },
    '/gallery': {
      title: 'Gallery | Aroma Coffee Shop',
      description: 'See the atmosphere, drinks, food, packs, and moments at Aroma Coffee Shop.',
    },
    '/visit': {
      title: 'Visit Aroma Coffee Shop | Janoura, Kébili',
      description: 'Find Aroma Coffee Shop on Route de Douz in Janoura, Kébili, Tunisia, and plan your visit.',
    },
    '/reserve': {
      title: 'Reserve a Table | Aroma Coffee Shop',
      description: 'Reserve a table at Aroma Coffee Shop by phone or online when reservations are available.',
    },
  };

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.update(event.urlAfterRedirects));
  }

  update(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0] || '/';
    const definition = this.definitions[cleanUrl] ?? this.productDefinition(cleanUrl);
    const canonicalUrl = `${SITE_URL}${cleanUrl === '/' ? '' : cleanUrl}`;

    this.document.title = definition.title;
    this.setMeta('description', definition.description);
    this.setMeta('robots', cleanUrl.startsWith('/admin') ? 'noindex,nofollow' : 'index,follow');
    this.setMetaProperty('og:title', definition.title);
    this.setMetaProperty('og:description', definition.description);
    this.setMetaProperty('og:type', definition.type ?? 'website');
    this.setMetaProperty('og:url', canonicalUrl);
    this.setMetaProperty('og:image', DEFAULT_IMAGE);
    this.setMeta('twitter:card', 'summary_large_image');
    this.setMeta('twitter:title', definition.title);
    this.setMeta('twitter:description', definition.description);
    this.setMeta('twitter:image', DEFAULT_IMAGE);
    this.setCanonical(canonicalUrl);
  }

  private productDefinition(url: string): SeoDefinition {
    const slug = url.startsWith('/product/') ? url.slice('/product/'.length) : '';
    const name = slug ? slug.replaceAll('-', ' ') : 'Product';
    return {
      title: `${this.titleCase(name)} | Aroma Coffee Shop`,
      description: `Discover ${name} at Aroma Coffee Shop in Janoura, Kébili.`,
    };
  }

  private titleCase(value: string): string {
    return value.replace(/\b\w/g, (character) => character.toUpperCase());
  }

  private setMeta(name: string, content: string): void {
    let element = this.document.head.querySelector(`meta[name="${name}"]`);
    if (!element) {
      element = this.document.createElement('meta');
      element.setAttribute('name', name);
      this.document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  }

  private setMetaProperty(property: string, content: string): void {
    let element = this.document.head.querySelector(`meta[property="${property}"]`);
    if (!element) {
      element = this.document.createElement('meta');
      element.setAttribute('property', property);
      this.document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
