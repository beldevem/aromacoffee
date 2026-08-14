title: Aroma Coffee Shop — Context
summary: Context and scope for Aroma Coffee Shop web presence: a mobile-first, SEO-friendly (SSR) Angular 22 site for menu, pricing, and reservations; future admin dashboard and QR ordering.
owners:

DevOps
Purpose

Capture product context, scope, and mobile-first branding recommendations for the Aroma Coffee Shop website MVP.
Provide a single source of truth for building a public site with online menu, prices, and reservations, and a roadmap for admin/QR flows.
Project goals (MVP)

Launch a responsive, mobile-first Angular 22 site (with Angular Universal SSR) showcasing Aroma Coffee Shop brand, menu, prices, contact and reservation options.
Prioritize fast mobile experience, clear call-to-action (call/reserve), and simplified reservation flow.
Prepare architecture and design tokens for an admin dashboard and QR-driven ordering to be added post-MVP.
Scope
Included

Public site: homepage, menu/catalog, product pages, contact/visit page, reservation form, click-to-call functionality, basic SEO (SSR), sitemap.
Customer flows: browse menu, view product details, reserve a table (online form), call the shop (tel:), newsletter signup.
Infrastructure: CI/CD, staging + production, HTTPS, images on CDN, basic monitoring.
Brand assets: color tokens, logo SVGs, web font choices, photography guidelines.
Excluded (out of scope for MVP)

Full admin dashboard (post-MVP).
Online payments and order routing to staff (post-MVP).
POS hardware integrations, loyalty programs, subscriptions.
Audience & personas

Mobile-first Customer: wants quick menu access, easy reservation or call, minimal typing.
Staff/Manager: receives reservation notifications and will use admin dashboard later.
Developer/Designer: implements mobile-first Angular SSR site and backend APIs.
Key success metrics

Mobile performance: Lighthouse Performance >= 85 on mobile for primary flows.
Time-to-first-CTA <= 5s on 3G simulated mobile.
Reservation submission success rate >= 99%.
Accessibility: WCAG AA on primary flows.
Branding & visual identity (mobile-first)

Use supplied PDF color palette. Define tokens: primary, secondary, accent, neutral-foreground, neutral-background.
Web fonts: 1 heading (warm characterful), 1 body (readable). Use variable fonts where possible.
Provide SVG logos: full, icon-only, monochrome.
Photography: hero image, product images, interior shots, consistent warm filter.
Microcopy tone: friendly, local, reassuring (examples: "Freshly roasted, brewed with care", CTAs: "Call to reserve", "Reserve online").
Mobile-first UX & layout

Single-column vertical flow; collapsible category accordions for menu.
Sticky bottom action bar with primary CTAs: Call, Reserve, Menu.
Floating Action Button (FAB) for quick call/reserve; ensure safe-area-inset support.
Product details and reservation flows use bottom-sheet modals for native-like experience.
Minimize typing: use native input types (tel, email), quick presets (party size, "Today in 30m"), and inline validation.
Show prices and availability prominently; display dietary/allergen tags.
Menu & pricing model

Categories: Coffee, Tea, Cold Drinks, Pastries, Extras.
Product fields: id, name, description, base_price_cents, sizes[], tags[], image_url, visible, prep_time_mins.
Prices shown in clear format, include tax info in footer.
Start with limited online menu to ensure fulfillment reliability.
Reservation flow (MVP)

Form fields: name, phone or email (required), date, time, party size, notes, opt-in for SMS/email.
Validate against opening hours; provide instant feedback on likely availability.
On submit: create reservation, return reservation id, send confirmation email and optional SMS, notify staff via email/webhook.
Provide one-tap Add to calendar and Call shop actions on confirmation screen.
Accessibility & inclusivity

WCAG AA for main flows: clear labels, ARIA where needed, keyboard navigation, sufficient color contrast.
Tap targets >= 44x44 CSS pixels and visible focus states.
SEO & discoverability

Angular Universal SSR for rendered meta tags and structured data.
Implement LocalBusiness and Menu structured data where appropriate.
Sitemaps, robots.txt, descriptive URLs: /menu, /product/:slug, /reserve.
Open Graph and Twitter card tags with default and per-product images.
Technical stack & architecture

Frontend: Angular 22 with Angular Universal (SSR). Mobile-first responsive components.
Styling: design-token-driven approach (JSON/SCSS), optional Angular Material theming or custom Tailwind-inspired utility set.
Shared component library: /libs/ui for components (header, bottom bar, FAB, bottom-sheet, product card).
Backend: NestJS exposing REST endpoints for menu and reservations. Use background job queue for email/SMS.
Database: PostgreSQL for persistent data; Redis optional for caching/locking.
Images: responsive srcset, WebP/AVIF where possible; serve via CDN.
CI/CD: GitHub Actions or GitLab CI, with staging and production deployments.
Monitoring: Sentry for errors, RUM for performance metrics, basic logging and health checks.
APIs (MVP)

GET /menu — list categories and items
GET /menu/:id — product details
POST /reservations — create reservation (returns id + status)
GET /reservations/:id — reservation status
POST /contact — contact form submissions
Webhooks: /webhooks/email-delivery, /webhooks/admin-notify
Data model (core fields)

User (for future auth): id, name, email, role, created_at
Product: id, name, description, base_price_cents, sizes[], tags[], image_url, visible, prep_time_mins
Reservation: id, customer_name, contact_phone, contact_email, date_time_utc, party_size, notes, status, created_at
SiteConfig: opening_hours, phone_number, address, social_links, tax_rate
Mobile performance & best practices

SSR + critical CSS inline, defer non-critical CSS.
Code-split routes, lazy-load heavy modules.
Minimize third-party scripts; lazy-load analytics.
Preconnect to fonts/CDN, compress assets, optimize images.
Service Worker: precache shell, cache-first for menu, network-first for reservations.
Aim Lighthouse mobile Performance >= 85.
Project structure (suggested)

/apps/web — Angular 22 SSR app (public site)
/apps/admin — Admin dashboard (future)
/libs/ui — shared UI components and design tokens
/libs/data — shared DTOs/types
/services/api — NestJS backend (menu, reservations)
/infra — IaC, deployment configs
/docs/brand — logo SVGs, color tokens, fonts, photo assets
/tests — E2E and integration tests
Brand assets & deliverables (action items)

Export color token file (JSON/SCSS) from provided PDF (hex/RGB + contrast checks).
Provide SVG logos (full, icon-only, monochrome).
Choose web font pair and license; prepare font loading strategy.
Supply product photography with recommended sizes and aspect ratios.
Write short copy (tagline, CTAs, confirmation messages, reservation policy).
Operational recommendations

Phone-first approach for urgent bookings; reserve online for planned visits.
Start with a small online menu to reduce fulfillment errors.
Train staff on reservation notifications and future admin dashboard workflows.
Monitor reservation no-show rates and optimize slots/confirmation messaging.
Open decisions / TODOs

Confirm final color hex values and web fonts from the PDF.
Decide whether to use Angular Material or custom component library.
Confirm SMS provider for confirmations (Twilio or local equivalent).
Post-MVP: implement admin dashboard, QR-driven ordering, online payments.
Onboarding checklist

Add brand assets to /docs/brand/
Create design-token JSON/SCSS from palette
Scaffold Angular 22 SSR app with mobile-first theme
Scaffold NestJS service with reservations endpoint and email webhook
Setup CI pipeline and staging environment