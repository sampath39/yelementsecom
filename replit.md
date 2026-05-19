# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Project: Yelements E-Commerce

Full-stack institutional supply e-commerce platform (similar to DMart) for B2B/B2C institutional procurement.

### Demo Accounts
- **Admin**: admin@yelements.com / admin123
- **Vendor**: vendor@yelements.com / vendor123
- **User**: user@yelements.com / user123

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── yelements/          # React + Vite e-commerce frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Features Implemented

1. **Authentication**: Register/Login with role-based access (admin/user/vendor). Token stored in localStorage, passed as Bearer header.
2. **Categories**: 7 categories (Stationery, Medical, Laboratory, Surgical, Canteen, Housekeeping, Miscellaneous) with subcategories.
3. **Products**: Full product listing with search, filters (category, subcategory, price range), pagination, featured products.
4. **Cart**: Add/update/remove items with persistent storage.
5. **Orders**: Create orders from cart, track order status.
6. **Wishlist**: Add/remove products from wishlist.
7. **Reviews**: Product ratings and reviews.
8. **Admin Dashboard**: Stats, user management, product management, all orders.
9. **Vendor Panel**: Vendor's own products and orders.
10. **User Dashboard**: Profile, order history.

## Database Schema

- `users` — with role enum (admin/user/vendor)
- `categories` — with subcategories array
- `products` — with pricing, images, stock, vendor association
- `orders` — with JSON items array, status enum
- `carts` — per-user cart with JSON items
- `wishlist` — user-product many-to-many
- `reviews` — product ratings with user association

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/yelements` (`@workspace/yelements`)

React + Vite e-commerce frontend. Routes via Wouter. Uses TanStack React Query + generated hooks from `@workspace/api-client-react`.

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes: auth, categories, products, cart, orders, wishlist, reviews, users, admin, vendors.

- Auth: Custom token-based auth (sha256 hashing, base64 tokens)
- Entry: `src/index.ts` — reads `PORT`, starts Express
- Routes: All mounted in `src/routes/index.ts`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec (`openapi.yaml`) with full Yelements API contract.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`
