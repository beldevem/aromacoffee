# 🤖 Aroma Platform: Agent Context & Architectural Guidelines

> **Target Audience**: AI Agents (Antigravity, Cursor, Windsurf, Copilot, Claude) and developers working on this codebase.  
> **Rule of Thumb**: Read this entire document before generating code, refactoring models, adding endpoints, or modifying UI components in the Aroma codebase.

---

## 1. 🎯 High-Level Overview & Business Context

**Aroma** is a full-stack hospitality platform for a specialty coffee shop and restaurant based in Tunisia (currency: **TND** / Tunisian Dinar).

The platform consists of two integrated applications:
1. **`apps/web` (Frontend)**: Customer-facing web portal (trilingual menu, table reservations, self-ordering from tables via QR tokens) and a staff operational portal (live kitchen Kanban board, cashier POS, table floor plan with multi-orders, daily Z-report cash register closing, financial expenses tracking, catalog administration, analytics).
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
│           │   │   ├── network/           # Real-time online/offline connectivity detection
│           │   │   ├── order/             # Table QR order session state service
│           │   │   ├── orders/            # Order notifications (smart chime & deduplicated alerts)
│           │   │   ├── seo/               # Meta tags & page titles
│           │   │   └── utils/             # Excel/CSV UTF-8 export utilities
│           │   ├── pages/
│           │   │   ├── admin/             # Back-office
│           │   │   │   ├── cash/          # Cash register & Daily Z-Report closing
│           │   │   │   ├── expenses/      # Financial expenses module (Admin only)
│           │   │   │   ├── orders/        # POS & Table floor plan (80mm thermal slip print)
│           │   │   │   ├── products/      # Catalog manager & image uploader
│           │   │   │   ├── reservations/  # Guest bookings manager
│           │   │   │   └── tables/        # Floor plan tables & QR tokens
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
│       │   ├── migrations/                # PostgreSQL migration history (12 migrations)
│       │   └── seed.ts                    # Database seeds (categories, products, tables, staff)
│       ├── scripts/                       # Maintenance scripts (image upload, QR link printer)
│       └── src/
│           ├── auth/                      # Staff auth controller, JWT service, guards & decorators
│           ├── products/                  # Product catalog CRUD & Supabase storage uploads
│           ├── categories/                # Menu taxonomy
│           ├── badges/                    # Dietary / promotional flags
│           ├── tables/                    # Table CRUD & QR secret rotation
│           ├── orders/                    # Order fulfillment, POS desk, QR sessions, events
│           ├── expenses/                  # Expenses management CRUD & financial summaries
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
- All monetary amounts in the database, API DTOs, and frontend computations are **integer cents** (e.g. `priceCents`, `amountCents`, `unitPriceCents`, `lineTotalCents`, `totalCents`).
- *Never store currency as floating-point numbers.*
- In Tunisian Dinars (TND), 1 TND = 1000 millimes. The codebase models prices in standard cent increments (e.g. `1200` = `12.000 DT` or `12.00 TND`). Always format prices using the dedicated formatting utilities (`formatPrice()`).

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
   - `ADMIN` role is strictly required for financial modules like **Expenses (`/admin/expenses`)** and User Account provisioning.
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
- **Table-Level Batch Settlement**: `PATCH /orders/table/:tableId/payment` atomically marks all unpaid active orders for a table as paid, generates a combined consolidated 80mm thermal slip, and broadcasts real-time SSE updates.
- **Post-Payment UX**: Cashier is prompted with a clear modal to print the receipt ticket or complete without printing.

### 5. Smart Multi-Device Notification Invariants
- `OrderNotificationsService` is the **single source of truth** for audio chimes and top alert banners.
- Audio and alerts trigger for **Customer QR orders** and **Floor Agent orders**.
- **Self-Mute**: The device that physically submitted a manual order does not play an audio chime to itself, while notifying all other kitchen/bar screens.
- Deduplication cache (`recentOrderIds`) and a 7-second auto-dismiss prevent alert stacking.

### 6. Daily Cash Register Closing ("Rapport Z")
- The cash reconciliation formula is:
  $$\text{Fond Initial} + \text{Recettes Espèces (Ventes)} - \text{Dépenses Espèces Caisse} = \text{Total Espèces Théorique}$$
- Variance is categorized into Perfect ($$0$$ DT), Surplus ($$+$$), or Shortage ($$-$$).
- Output is rendered onto a standard 80mm thermal receipt template.

---

## 4. 🗄️ Database Schema Reference (Prisma)

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
| `Expense` | `expenses` | Shop expenses (`title`, `category`, `amountCents`, `date`, `paymentMethod`, `invoiceNumber`) |
| `Reservation` | `reservations` | Guest bookings (`customerName`, `contactPhone`, `dateTime`, `partySize`, `status`) |
| `OpeningHour` | `opening_hours` | Operating schedule per day of week (0 = Sunday ... 6 = Saturday) |
| `BlockedDate` | `blocked_dates` | Blackout dates for holidays and private bookings |
| `AuditLog` | `audit_logs` | Traceability for back-office mutations |

---

## 5. 🎨 Brand Identity & Style Tokens

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
- **Thermal Slip Printing**: 80mm centered thermal format for client receipts, addition bills, and daily Z-reports.

---

## 6. 🚀 Common Commands & Workflows

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

## 7. ⚠️ Common Traps & Rules for AI Agents

1. ❌ **Do NOT introduce Tailwind CSS** — the project uses custom SCSS design tokens.
2. ❌ **Do NOT hardcode prices in floating numbers** — always work in integer cents.
3. ❌ **Do NOT commit `.env` or expose `SUPABASE_SECRET_KEY`** to the frontend.
4. ❌ **Do NOT delete multi-language fields** (`nameFr`, `nameAr`, `descriptionFr`, `descriptionAr`) when modifying DTOs or schemas.
5. ❌ **Do NOT bypass `OrderSessionGuard`** for table QR endpoints or mix it with staff JWT auth.
6. ❌ **Do NOT mutate past `OrderItem` historical prices** when updating catalog products.
7. ❌ **Do NOT allow non-admin staff into `/admin/expenses`** or expense API routes.
