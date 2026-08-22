# 🤖 Aroma Platform: Agent Context & Architectural Guidelines

> **Target Audience**: AI Agents (Antigravity, Cursor, Windsurf, Copilot, Claude) and developers working on this codebase.  
> **Rule of Thumb**: Read this entire document before generating code, refactoring models, adding endpoints, or modifying UI components in the Aroma codebase.

---

## 1. 🎯 High-Level Overview & Business Context

**Aroma** is a full-stack hospitality platform for a specialty coffee shop and restaurant based in Tunisia (currency: **TND** / Tunisian Dinar).

The platform consists of two integrated applications:
1. **`apps/web` (Frontend)**: Customer-facing web portal (trilingual menu, table reservations, self-ordering from tables via QR tokens) and a staff operational portal (live kitchen Kanban board, cashier POS, table management, catalog administration, analytics).
2. **`services/api` (Backend)**: NestJS REST API with PostgreSQL database managed via Prisma ORM, Supabase Storage integration for assets, and a dual-token authentication architecture.

---

## 2. 🗂 Codebase Topology

```
aroma/
├── apps/
│   └── web/                               # Angular 22+ Application (Standalone & Signals)
│       └── src/
│           ├── app/
│           │   ├── core/
│           │   │   ├── api/               # API base URL configuration
│           │   │   ├── auth/              # Staff session state, JWT storage, guards
│           │   │   ├── i18n/              # Translation service & fr/ar/en dictionary files
│           │   │   ├── menu/              # Menu art, catalog caches, fallback data
│           │   │   ├── order/             # Table QR order session state service
│           │   │   ├── orders/            # Kitchen notifications (audio/toast events)
│           │   │   └── seo/               # Meta tags & page titles
│           │   ├── pages/
│           │   │   ├── admin/             # Back-office (orders, cash, products, tables, etc.)
│           │   │   ├── home/              # Landing page
│           │   │   ├── menu/              # Public catalog with dietary filters
│           │   │   ├── order/             # Table QR self-ordering page
│           │   │   ├── reserve/           # Table reservation booking page
│           │   │   └── visit|events|gallery/
│           │   └── shared/                # Shared layout & reusable components
│           └── styles.scss                # Global styles & design token variables
├── services/
│   └── api/                               # NestJS 11+ REST API
│       ├── prisma/
│       │   ├── schema.prisma              # Database schema definitions & Prisma client
│       │   ├── migrations/                # PostgreSQL migration history
│       │   └── seed.ts                    # Database seeds (categories, products, tables, staff)
│       ├── scripts/                       # Maintenance scripts (image upload, QR link printer)
│       └── src/
│           ├── auth/                      # Staff auth controller, JWT service, guards & decorators
│           ├── products/                  # Product catalog CRUD & Supabase storage uploads
│           ├── categories/                # Menu taxonomy
│           ├── badges/                    # Dietary / promotional flags
│           ├── tables/                    # Table CRUD & QR secret rotation
│           ├── orders/                    # Order fulfillment, POS desk, QR sessions, events
│           ├── reservations/              # Bookings, opening hours, blackout dates
│           ├── dashboard/                 # Sales and operational KPIs
│           ├── users/                     # Staff accounts & roles (ADMIN, MANAGER, STAFF)
│           └── generated/prisma/          # Generated Prisma Client output directory
└── docs/
    └── brand/                             # Source design tokens (design-tokens.json, SCSS)
```

---

## 3. 🛡️ Critical Architectural Invariants

### 1. Money and Prices Are Stored in CENTS (Integers)
- All monetary amounts in the database, API DTOs, and frontend computations are **integer cents** (e.g. `priceCents`, `promoPrice`, `unitPriceCents`, `lineTotalCents`, `totalCents`).
- *Never store currency as floating-point numbers.*
- In Tunisian Dinars (TND), 1 TND = 1000 millimes. The codebase models prices in standard cent increments (e.g. `1200` = `12.000 DT` or `12.00 TND`). Always format prices using the dedicated formatting utilities.

### 2. Trilingual Localization Is Mandatory (FR, AR, EN)
- Every product, category, and flag in the database includes localized columns:
  - English: `name`, `description`
  - French: `nameFr`, `descriptionFr` (or `labelFr`)
  - Arabic: `nameAr`, `descriptionAr` (or `labelAr`)
- **Do not remove or bypass multi-language fields** when adding or updating entities.
- The frontend supports dynamic RTL switching for Arabic (`ar`).

### 3. Dual-Layer Authentication Architecture
The API has two completely distinct authorization mechanisms:

1. **Staff / Admin Auth**:
   - Standard JWT Bearer token passed in the `Authorization: Bearer <token>` header.
   - Roles: `ADMIN`, `MANAGER`, `STAFF`.
   - Regulated by `@Roles('ADMIN')`, `@Roles('STAFF')`, and the global `AuthGuard`.
   - Public endpoints must be explicitly decorated with `@Public()`.
2. **Customer Table QR Ordering Sessions**:
   - Customer scans a physical table QR code containing a non-guessable `qrToken`.
   - Customer client exchanges `qrToken` via `POST /orders/session` to obtain a short-lived session token (TTL: 30 minutes).
   - Subsequent ordering requests transmit this token via the custom header:  
     `x-order-session: <session-token>`.
   - Regulated by `OrderSessionGuard` (`services/api/src/orders/order-session.guard.ts`).
   - Rate-limited to prevent table token scraping.
   - ⚠️ **CRITICAL**: Never accept an admin JWT as an order session, and never accept an order session token on admin/staff routes.

### 4. Order Lifecycle: Decoupling Fulfillment from Payment
- **Fulfilment Status (`OrderStatus`)**: `PENDING` ➔ `PREPARING` ➔ `SERVED` (or `CANCELLED`).
- **Payment Status**: Tracked independently by `paidAt` (timestamp), `paidBy` (staff user ID), and `paymentMethod` (`CASH` | `CARD`).
- **Why?** A counter/takeaway order (`channel: COUNTER`) is paid *before* preparation, while a dine-in table order (`channel: QR`) is typically paid *after* dining.

### 5. Snapshot Integrity on `OrderItem`
- When an order is created, `OrderItem` **snapshots** the product's `nameFr`, `unitPriceCents`, and `lineTotalCents`.
- Past orders must never change if a manager edits product names or updates menu prices later.

### 6. Product Image Storage via Supabase
- Uploaded product photos are stored in Supabase Storage (`product-images` bucket).
- The secret service key `SUPABASE_SECRET_KEY` is **strictly server-side** in `services/api`.
- Client applications only receive the public CDN URL (`imageUrl`).

---

## 4. 💻 Technology Stack Best Practices

### Frontend (`apps/web`)
- **Angular 22+ Standalone Components**: Do not use legacy NgModules.
- **Signals**: Use reactive signals (`signal()`, `computed()`, `input()`, `output()`) for component state rather than legacy `BehaviorSubject` where possible.
- **Modern Control Flow**: Use `@if`, `@else`, `@for`, `@switch` syntax instead of `*ngIf` and `*ngFor`.
- **Styling**: Vanilla SCSS using CSS variables defined from `docs/brand/_design-tokens.scss`. Do not introduce Tailwind CSS or utility-first frameworks.

### Backend (`services/api`)
- **NestJS 11+ Modules**: Maintain clean separation across `controller`, `service`, and `dto`.
- **Validation**: Every incoming body must have a DTO decorated with `class-validator` and `class-transformer`.
- **Prisma ORM**: The generated Prisma client outputs to `src/generated/prisma`. Run `npx prisma generate` after modifying `prisma/schema.prisma`.
- **Audit Logging**: Sensitive changes (staff creations, table modifications, cancellations) record entries in the `AuditLog` table.

---

## 5. 🗄️ Database Schema Reference (Prisma)

Key entities and their roles:

| Model | Table | Purpose |
| :--- | :--- | :--- |
| `User` | `users` | Staff, managers, and administrators (`passwordHash`, `role`, `active`) |
| `Category` | `categories` | Menu sections (`slug`, `name`, `nameFr`, `nameAr`, `sortOrder`, `visible`) |
| `Flag` | `flags` | Dietary/promo badges (`slug`, `label`, `labelFr`, `labelAr`) |
| `Product` | `products` | Menu items (`priceCents`, `promoPrice`, `imageUrl`, `status`, `allergens`) |
| `RestaurantTable` | `restaurant_tables` | Physical tables (`label`, `code`, `qrToken`, `seats`, `active`) |
| `Order` | `orders` | Orders (`reference`, `channel`, `status`, `tableId`, `paidAt`, `paymentMethod`) |
| `OrderItem` | `order_items` | Snapshotted line items (`unitPriceCents`, `quantity`, `lineTotalCents`) |
| `Reservation` | `reservations` | Guest bookings (`customerName`, `contactPhone`, `dateTime`, `partySize`, `status`) |
| `OpeningHour` | `opening_hours` | Operating schedule per day of week (0 = Sunday ... 6 = Saturday) |
| `BlockedDate` | `blocked_dates` | Blackout dates for holidays and private bookings |
| `AuditLog` | `audit_logs` | Traceability for back-office mutations |

---

## 6. 🎨 Brand Identity & Style Tokens

When adding UI features, always adhere to the brand tokens:

- **Colors**:
  - `brand.green`: `#50684E`
  - `brand.greenDeep`: `#354A36`
  - `brand.cream`: `#E8D7AB`
  - `brand.gold`: `#C9AA70`
  - `neutral.ink`: `#1E211C`
  - `neutral.ivory`: `#F7F5EF`
  - `neutral.paper`: `#FFFEFA`
- **Typography**:
  - Display: `Cormorant Garamond, Georgia, serif`
  - Body: `Source Sans 3, system-ui, sans-serif`
- **Aesthetic**: Warm, artisanal, premium, editorial coffeehouse atmosphere.

---

## 7. 🚀 Common Commands & Workflows

```bash
# Backend (services/api)
cd services/api
npm run start:dev          # Run API on port 3000
npm run db:seed            # Seed initial categories, menu items, and admin users
npm run db:qr-links        # Print table testing QR links to terminal
npx prisma migrate dev     # Apply Prisma migrations
npx prisma studio          # Open visual DB GUI

# Frontend (apps/web)
cd apps/web
npm start                  # Run web app on port 4200
npm run build              # Production build
npm test                   # Run Vitest test suite
```

---

## 8. ⚠️ Common Traps & Rules for AI Agents

1. ❌ **Do NOT introduce Tailwind CSS** — the project uses custom SCSS design tokens.
2. ❌ **Do NOT hardcode prices in floating numbers** — always work in integer cents.
3. ❌ **Do NOT commit `.env` or expose `SUPABASE_SECRET_KEY`** to the frontend.
4. ❌ **Do NOT delete multi-language fields** (`nameFr`, `nameAr`, `descriptionFr`, `descriptionAr`) when modifying DTOs or schemas.
5. ❌ **Do NOT bypass `OrderSessionGuard`** for table QR endpoints or mix it with staff JWT auth.
6. ❌ **Do NOT mutate past `OrderItem` historical prices** when updating catalog products.
