import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { MENU_ITEMS } from '../menu/menu-data';

interface SeoDefinition {
  title: string;
  description: string;
  type?: 'website' | 'article' | 'restaurant.menu';
  keywords?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_URL = 'https://myaromacoffee.com';
const DEFAULT_IMAGE = `${SITE_URL}/brand/aroma-logo.svg`;
const PHONE = '+21655264235';
const ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: 'Route de Douz',
  postalCode: '4242',
  addressLocality: 'Janoura',
  addressRegion: 'Kébili',
  addressCountry: 'TN',
};
const GEO = {
  '@type': 'GeoCoordinates',
  latitude: 33.7044,
  longitude: 8.9692,
};
const SAME_AS = [
  'https://www.facebook.com/people/Aroma-Coffee-Shop/61592663897483/',
  'https://www.instagram.com/aromaacoffeeshopp/',
];

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly router = inject(Router);

  private readonly definitions: Record<string, SeoDefinition> = {
    '/': {
      title: 'Aroma Coffee Shop | Specialty Coffee, Breakfasts & Fresh Drinks in Kébili',
      description:
        'Discover Aroma Coffee Shop in Janoura, Kébili, Tunisia. Specialty coffee, fresh crêpes, waffles, gourmet breakfasts, milkshakes, artisan desserts, and cozy tables.',
      keywords:
        'Aroma Coffee Shop, Café Kébili, Coffee Janoura, Specialty Coffee Tunisia, Petit déjeuner Kébili, Brunch Kébili, Crepes, Waffles, Fresh Juices, Salon de thé Kébili',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CafeOrCoffeeShop',
        name: 'Aroma Coffee Shop',
        url: SITE_URL,
        image: DEFAULT_IMAGE,
        telephone: PHONE,
        priceRange: '$$',
        currenciesAccepted: 'TND',
        paymentAccepted: 'Cash, Credit Card',
        servesCuisine: ['Specialty Coffee', 'Breakfast', 'Pastries', 'Fresh Drinks', 'Desserts'],
        acceptsReservations: 'True',
        address: ADDRESS,
        geo: GEO,
        sameAs: SAME_AS,
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '07:00',
            closes: '23:00',
          },
        ],
      },
    },
    '/menu': {
      title: 'Menu & Prices | Aroma Coffee Shop Janoura, Kébili',
      description:
        'Explore our complete menu: hot & iced espresso coffees, frappuccinos, smoothies, mojitos, waffles, savory & sweet crepes, and evening packs.',
      keywords: 'Menu Aroma, Prix Aroma Coffee, Café Kébili Menu, Smoothies Kébili, Crepes Kébili, Frappuccino Kébili',
      type: 'restaurant.menu',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Menu',
        name: 'Aroma Coffee Shop Menu',
        url: `${SITE_URL}/menu`,
        inLanguage: ['fr', 'ar', 'en'],
        hasMenuSection: [
          {
            '@type': 'MenuSection',
            name: 'Hot & Cold Specialty Coffees',
            description: 'Espresso, Americano, Cappuccino, Iced Vanilla & Caramel Coffee',
          },
          {
            '@type': 'MenuSection',
            name: 'Breakfasts & Pastries',
            description: 'Classic & Signature Breakfasts, Omelettes, Sweet & Savory Crêpes, Waffles, Pancakes',
          },
          {
            '@type': 'MenuSection',
            name: 'Fresh Drinks & Desserts',
            description: 'Fresh Juices, Smoothies, Mojitos, Fondants, Cheesecakes, Jwajem',
          },
        ],
      },
    },
    '/visit': {
      title: 'Visit Aroma Coffee Shop | Location & Hours in Janoura, Kébili',
      description:
        'Find Aroma Coffee Shop located on Route de Douz in Janoura, Kébili, Tunisia. Open daily with warm ambiance, indoor seating, and outdoor terrace.',
      keywords: 'Localisation Aroma Coffee, Adresse Aroma Kébili, Route de Douz Janoura, Horaires Aroma Coffee',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Aroma Coffee Shop - Janoura',
        image: DEFAULT_IMAGE,
        url: `${SITE_URL}/visit`,
        telephone: PHONE,
        address: ADDRESS,
        geo: GEO,
      },
    },
    '/events': {
      title: 'Private Events & Birthdays | Aroma Coffee Shop Kébili',
      description:
        'Host your birthdays, work meetings, celebrations, and workshops in a welcoming atmosphere at Aroma Coffee Shop Janoura, Kébili.',
      keywords: 'Events Aroma Kébili, Anniversaire Café Kébili, Réunions Kébili, Événements Aroma',
    },
    '/gallery': {
      title: 'Photo Gallery & Atmosphere | Aroma Coffee Shop',
      description:
        'Browse our photography gallery showcasing freshly brewed coffee, artisan desserts, signature packs, and moments at Aroma Coffee Shop.',
      keywords: 'Photos Aroma Coffee, Galerie Café Kébili, Ambiance Aroma Janoura',
    },
    '/reserve': {
      title: 'Book a Table | Aroma Coffee Shop Janoura, Kébili',
      description:
        'Reserve your table at Aroma Coffee Shop online or by phone. Perfect for quiet coffee breaks, group meetings, and celebrations.',
      keywords: 'Réservation table Kébili, Reserve Aroma Coffee, Réserver café Janoura',
    },
    '/order': {
      title: 'Order at Table | Aroma Coffee Shop',
      description: 'Scan your table QR code to browse our menu and order directly from your smartphone.',
      keywords: 'Commande à table Aroma, QR Code Aroma, Table ordering',
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

    // Title
    this.titleService.setTitle(definition.title);

    // Standard Meta
    this.metaService.updateTag({ name: 'description', content: definition.description });
    if (definition.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: definition.keywords });
    }

    // Robots
    const isPrivate = cleanUrl.startsWith('/admin') || cleanUrl.startsWith('/order') || cleanUrl === '/login';
    this.metaService.updateTag({
      name: 'robots',
      content: isPrivate
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    });

    // OpenGraph
    this.metaService.updateTag({ property: 'og:title', content: definition.title });
    this.metaService.updateTag({ property: 'og:description', content: definition.description });
    this.metaService.updateTag({ property: 'og:type', content: definition.type ?? 'website' });
    this.metaService.updateTag({ property: 'og:url', content: canonicalUrl });
    this.metaService.updateTag({ property: 'og:image', content: DEFAULT_IMAGE });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Aroma Coffee Shop' });
    this.metaService.updateTag({ property: 'og:locale', content: 'fr_TN' });
    this.metaService.updateTag({ property: 'og:locale:alternate', content: 'ar_TN' });
    this.metaService.updateTag({ property: 'og:locale:alternate', content: 'en_US' });

    // Twitter Card
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: definition.title });
    this.metaService.updateTag({ name: 'twitter:description', content: definition.description });
    this.metaService.updateTag({ name: 'twitter:image', content: DEFAULT_IMAGE });

    // Canonical & JSON-LD
    this.setCanonical(canonicalUrl);
    if (definition.jsonLd) {
      this.setJsonLd(definition.jsonLd);
    }
  }

  private productDefinition(url: string): SeoDefinition {
    const slug = url.startsWith('/product/') ? url.slice('/product/'.length) : '';
    const item = MENU_ITEMS.find((p) => p.slug === slug);
    const name = item ? `${item.name.fr} (${item.name.en})` : this.titleCase(slug.replaceAll('-', ' '));
    const priceText = item ? ` - ${item.price}` : '';
    const description =
      item?.description.fr || `Enjoy delicious ${name} prepared fresh at Aroma Coffee Shop in Janoura, Kébili.`;

    const productSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: item?.name.fr || name,
      image: item?.imageUrl ? `${SITE_URL}${item.imageUrl}` : DEFAULT_IMAGE,
      description,
      brand: {
        '@type': 'Brand',
        name: 'Aroma Coffee Shop',
      },
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/product/${slug}`,
        priceCurrency: 'TND',
        price: item?.price ? item.price.replace(/[^\d.]/g, '') : '0',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'CafeOrCoffeeShop',
          name: 'Aroma Coffee Shop',
        },
      },
    };

    const breadcrumbSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Menu',
          item: `${SITE_URL}/menu`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: item?.name.fr || name,
          item: `${SITE_URL}/product/${slug}`,
        },
      ],
    };

    return {
      title: `${name}${priceText} | Aroma Coffee Shop Menu`,
      description: `${description} Available at Aroma Coffee Shop in Janoura, Kébili, Tunisia.`,
      keywords: `${name}, Aroma Coffee, Menu Kébili, Café Janoura, ${slug}`,
      type: 'article',
      jsonLd: [productSchema, breadcrumbSchema],
    };
  }

  private titleCase(value: string): string {
    return value.replace(/\b\w/g, (character) => character.toUpperCase());
  }

  private setCanonical(url: string): void {
    if (!this.document || !this.document.head) return;
    try {
      let link: HTMLLinkElement | null = null;
      const links = this.document.head.getElementsByTagName('link');
      for (let i = 0; i < links.length; i++) {
        if (links[i].getAttribute('rel') === 'canonical') {
          link = links[i] as HTMLLinkElement;
          break;
        }
      }
      if (!link) {
        link = this.document.createElement('link');
        link.setAttribute('rel', 'canonical');
        this.document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    } catch {
      // Safe fallback
    }
  }

  private setJsonLd(data: Record<string, unknown> | Record<string, unknown>[]): void {
    if (!this.document || !this.document.head) return;
    try {
      const scripts = this.document.head.getElementsByTagName('script');
      for (let i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].getAttribute('id') === 'dynamic-seo-jsonld') {
          scripts[i].parentNode?.removeChild(scripts[i]);
        }
      }
      const script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'dynamic-seo-jsonld');
      script.textContent = JSON.stringify(data);
      this.document.head.appendChild(script);
    } catch {
      // Safe fallback
    }
  }
}
