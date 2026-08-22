# ☕ Aroma Coffee & Dining Platform

> A full-stack restaurant, specialty coffee, and dining management platform featuring modern guest experiences (trilingual menu, table QR ordering, reservations) and an operations management suite (live order fulfillment, POS/cashier register, table management, catalog administration, and analytics).

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture & Monorepo Structure](#-architecture--monorepo-structure)
- [Key Features](#-key-features)
  - [Guest & Customer Experience](#guest--customer-experience)
  - [Staff & Administration Suite](#staff--administration-suite)
- [Tech Stack](#-tech-stack)
- [Brand Identity & Design System](#-brand-identity--design-system)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (`services/api`)](#backend-setup-servicesapi)
  - [Frontend Setup (`apps/web`)](#frontend-setup-appsweb)
- [Available Scripts](#-available-scripts)
- [Environment Configuration](#-environment-configuration)
- [Documentation & Resources](#-documentation--resources)

---

## 🌟 Overview

**Aroma** is an end-to-end digital ecosystem built for a specialty coffee shop and restaurant in Tunisia (operating in TND - Tunisian Dinars). It bridges the gap between customer-facing hospitality and internal operations by providing:

1. **Guest-Facing Web App**: High-performance, mobile-first trilingual experience (Arabic, French, English) for exploring menus, booking tables, discovering events, and self-ordering directly from tables using QR codes.
2. **Back-Office & Operations API**: Secure, role-gated backend for kitchen order management, POS cashier validation, reservation approvals, catalog publishing with cloud image hosting, and QR token lifecycle management.

---

## 🏛 Architecture & Monorepo Structure

The repository is organized as a clean modular monorepo:

```
aroma/
├── apps/
│   └── web/                     # Frontend Single Page Application (Angular 22+ Standalone)
│       ├── public/              # Static assets, images, icons
│       └── src/
│           ├── app/
│           │   ├── core/        # Singleton services: auth, api, i18n, orders, menu
│           │   ├── pages/       # Route-level components (home, menu, order, reserve, admin, etc.)
│           │   └── shared/      # Reusable UI components (header, footer, cards, toasts)
│           └── styles.scss      # Global styles & design token bindings
├── services/
│   └── api/                     # Backend REST API (NestJS 11+ & Prisma ORM)
│       ├── prisma/              # PostgreSQL schema, migrations, seed script
│       ├── scripts/             # Admin & maintenance CLI utilities
│       └── src/
│           ├── auth/            # JWT authentication, password hashing, role guards
│           ├── products/        # Product catalog & Supabase image uploads
│           ├── orders/          # Table order sessions, POS orders, live events
│           ├── reservations/    # Booking management & availability calculation
│           ├── tables/          # Table management & QR token rotation
│           ├── categories/      # Category taxonomy
│           ├── badges/          # Dietary / promotional badges & flags
│           ├── users/           # Team accounts & role management
│           ├── dashboard/       # Sales and operations analytics
│           └── prisma/          # Prisma database service module
├── docs/
│   └── brand/                   # Official design tokens (JSON & SCSS tokens)
├── CONTEXT.md                   # AI Agent & Developer mental model & rules
└── README.md                    # Project overview & documentation
```

---

## ✨ Key Features

### Guest & Customer Experience
- **Interactive Trilingual Menu (`/menu`)**:
  - Full catalog filtering by categories (Hot Coffee, Cold Brew, Pastries, Brunch) and dietary tags/badges (Vegan, Gluten-Free, Chef's Special).
  - Trilingual data models: Seamlessly switch between French (`FR`), Arabic (`AR` with RTL layout), and English (`EN`).
  - Item detail pages (`/product/:slug`) with allergens, preparation time, and origin notes.
- **On-Table QR Ordering (`/order?token=...`)**:
  - Customers scan unique, non-guessable QR codes affixed to physical restaurant tables.
  - Automatically establishes a secure, time-limited ordering session (`x-order-session`).
  - Real-time cart calculation and direct order transmission to the kitchen.
  - Live status tracking (`PENDING` ➔ `PREPARING` ➔ `SERVED`).
- **Table Reservation System (`/reserve`)**:
  - Live slot availability based on operating hours and blackout dates.
  - Party size, location preferences, and special dietary requests.
- **Brand Showcases**:
  - Landing page (`/`), Visit & Location guide (`/visit`), Gallery (`/gallery`), and Events (`/events`).

### Staff & Administration Suite
- **Role-Based Access Control**: `ADMIN`, `MANAGER`, and `STAFF` permissions protecting sensitive business actions.
- **Live Orders Kitchen Kanban (`/admin/orders`)**:
  - Real-time order stream with audio/visual alerts for new incoming orders.
  - Quick action controls to transition order status from pending to preparation and served.
- **Cashier & POS Desk (`/admin/cash`)**:
  - Fast counter-order creation for walk-in takeaway and dine-in customers.
  - Split payment processing (`CASH`, `CARD`) and instant paid receipt marking.
- **Reservation Management (`/admin/reservations`)**:
  - Confirm, cancel, complete, or flag no-shows.
  - Blackout dates configuration for holidays and private events.
- **Menu & Catalog Admin (`/admin/products`, `/admin/categories`, `/admin/badges`)**:
  - Create and edit products with multi-language titles and descriptions.
  - Direct image uploads to Supabase Storage with automatic CDN linking.
- **Table & QR Code Manager (`/admin/tables`)**:
  - Add tables and configure seat counts.
  - One-click QR code generation, token rotation, and printable sticker link exports.
- **Executive Analytics Dashboard (`/admin`)**:
  - Revenue summaries, order counts, popular items, and reservation volume.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Angular](https://angular.dev/) (v22+) | Standalone components, reactive Signals, modern control flow (`@if`, `@for`) |
| **Frontend Styling** | Vanilla SCSS + Design Tokens | Custom brand typography, CSS custom properties, responsive layout, no bloated frameworks |
| **i18n & Localization** | Custom Signal-based Translation | Trilingual support (`fr`, `ar`, `en`) with instant switching and RTL support |
| **Backend Framework** | [NestJS](https://nestjs.com/) (v11+) | Modular TypeScript REST API architecture, Validation pipes, Dependency Injection |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/) (v7+) | Type-safe schema definition, automated migrations, relational modeling |
| **Authentication** | NestJS JWT + Bcrypt | Bearer tokens for staff, cryptographic JWT sessions for QR table ordering |
| **Media & Storage** | [Supabase Storage](https://supabase.com/storage) | Cloud storage for high-resolution product media |
| **Testing** | [Vitest](https://vitest.dev/) & [Jest](https://jestjs.io/) | Frontend and backend unit & integration test runners |

---

## 🎨 Brand Identity & Design System

Aroma is crafted with a curated, earthy editorial aesthetic inspired by specialty coffee and matcha:

- **Primary Colors**:
  - Forest Green: `#50684E`
  - Deep Green: `#354A36`
  - Warm Cream: `#E8D7AB`
  - Antique Gold: `#C9AA70`
- **Neutrals**:
  - Ink: `#1E211C`
  - Ivory Background: `#F7F5EF`
  - Clean Paper Surface: `#FFFEFA`
- **Typography**:
  - Display / Headings: `Cormorant Garamond` (Classic editorial serif)
  - Body & UI: `Source Sans 3` (Crisp legible sans-serif)

Design tokens are codified in `docs/brand/design-tokens.json` and compiled to SCSS variables in `docs/brand/_design-tokens.scss`.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10+ or v11+
- **PostgreSQL**: Local instance or hosted database (e.g. Supabase, Neon)

---

### Backend Setup (`services/api`)

1. **Navigate to API directory**:
   ```bash
   cd services/api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   *Fill in your PostgreSQL `DATABASE_URL`, `JWT_SECRET`, and optional `SUPABASE_*` credentials.*

4. **Initialize the database & run seeds**:
   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

5. **Start API development server**:
   ```bash
   npm run start:dev
   ```
   *API will run at `http://localhost:3000`.*

---

### Frontend Setup (`apps/web`)

1. **Navigate to Web directory**:
   ```bash
   cd apps/web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Angular development server**:
   ```bash
   npm start
   ```
   *Web application will run at `http://localhost:4200`.*

---

## 📜 Available Scripts

### Root / Global
- Start frontend: `cd apps/web && npm start`
- Start backend: `cd services/api && npm run start:dev`

### Backend (`services/api`)
- `npm run start:dev`: Launch NestJS in watch mode.
- `npm run build`: Compile TypeScript into `dist/`.
- `npm run db:seed`: Seed categories, products, tables, and staff accounts.
- `npm run db:upload-images`: Sync local catalog images to Supabase Storage.
- `npm run db:qr-links`: Print ready-to-use testing table QR URLs to the console.
- `npm run test`: Run backend unit tests.

### Frontend (`apps/web`)
- `npm start`: Launch Angular dev server at `localhost:4200`.
- `npm run build`: Produce optimized production build in `dist/`.
- `npm run test`: Run unit tests using Vitest.

---

## 🔐 Environment Configuration

Key configuration parameters used across the platform:

| Variable | Target | Description | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | API | HTTP server listening port | `3000` |
| `CORS_ORIGIN` | API | Allowed frontend origin | `http://localhost:4200` |
| `DATABASE_URL` | API | PostgreSQL connection string | `postgresql://user:pass@host:5432/aroma` |
| `JWT_SECRET` | API | Signing secret for staff & QR tokens | Long random string |
| `SUPABASE_URL` | API | Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_SECRET_KEY` | API | Server-only Supabase service key | Service role key |
| `SUPABASE_STORAGE_BUCKET` | API | Bucket for product assets | `product-images` |

---

## 📚 Documentation & Resources

- [CONTEXT.md](file:///c:/Users/abelgacem_ext/aroma/CONTEXT.md) - Deep architectural invariant rules, domain schemas, and instructions for AI agents and developers.
- [Brand Design Tokens](file:///c:/Users/abelgacem_ext/aroma/docs/brand/design-tokens.json) - Colors, typography, spacing, shadows, and animation parameters.
