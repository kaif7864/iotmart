# IoTMart Product Readiness Analysis Plan

## Summary
Current project frontend + backend structure is mostly in place, but it is not product-ready yet. Biggest blockers are security/access control, live secrets, payment/order correctness, empty tests, demo/mock IoT behavior, and production operations.

No code changes should be made in this phase. Create/update a doc such as `PRODUCT_READINESS_PLAN.md` with these findings and priorities.

## Critical Missing Work

- **Secrets and environment hardening**
  - Rotate all credentials found in local `.env` immediately.
  - Keep `.env` ignored, add safe `.env.example`, and document required env vars.
  - Remove visible credential-like text from UI, especially admin sidebar.
  - Move frontend Google client ID and API URLs to env config.

- **Auth and authorization**
  - Add strict role checks for admin APIs.
  - Normal users must not access all users, all orders, role updates, status updates, or arbitrary user profile mutations.
  - Enforce resource ownership: user can only read/update own profile, addresses, wishlist, orders.
  - Add token refresh/expiry handling and safer session behavior.

- **Payments and orders**
  - Cashfree is still sandbox-oriented; add environment-based sandbox/live mode.
  - Webhook must verify payment and update internal order/payment state.
  - Do not create paid orders only from frontend modal success; backend should verify with Cashfree.
  - Add inventory decrement, stock validation, order cancellation/refund rules, and transaction reconciliation.
  - Fix UI copy mismatch: payment says Razorpay but code uses Cashfree.

- **Backend data correctness**
  - Validate Mongo ObjectIds before repository calls.
  - Replace raw `dict` request bodies with Pydantic schemas for user profile, password, wishlist, status, role, reviews.
  - Add audit fields: `created_at`, `updated_at`, `created_by`, `updated_by`.
  - Standardize status enums for users, orders, payments, shipments.

- **Testing and quality gates**
  - Backend test files exist but are empty.
  - `pytest` is not installed/configured.
  - `npm run lint` currently fails with 215 errors and 4 warnings.
  - Add CI checks for lint, tests, backend import/compile, and production build.

## High Priority Product Features

- **Ecommerce**
  - Product filtering, sorting, pagination, search, category pages.
  - Product images/media upload flow instead of only image URLs.
  - Product reviews should require login and verified purchase checks server-side.
  - Wishlist, cart, checkout, coupon, invoice, refund flows need backend-backed persistence and validation.

- **Admin**
  - Add dashboard based on real aggregation, not mock chart data.
  - Add order lifecycle controls with permissions and audit logs.
  - Add inventory alerts, bulk product import/export, and media management.
  - Add admin activity logs and irreversible action confirmations.

- **IoT and Lab**
  - Current device dashboard uses static devices and local WebSocket URL.
  - WebSocket endpoint needs auth, device ownership checks, and production URL config.
  - Replace simulated telemetry with MQTT/device ingestion pipeline.
  - Do not store API keys in browser localStorage for lab integrations; use backend-secured storage or server-side proxy.
  - Nexar mock fallback should be clearly marked or disabled in production.

- **Operations**
  - Add deployment docs for frontend/backend, MongoDB, Redis, Cashfree webhooks, CORS, env vars.
  - Add logging/monitoring/error tracking.
  - Add backup and restore plan for MongoDB.
  - Add rate limits per sensitive endpoint, not only global limit.
  - Add health checks for DB, Redis, payment provider, email/SMS provider.

## Public Interfaces To Add Or Tighten
- Add admin-only dependencies for `/users`, `/orders`, `/analytics`, role/status mutation APIs.
- Add ownership-aware user endpoints such as `/users/me`, `/users/me/orders`, `/users/me/addresses`.
- Add payment lifecycle APIs: create payment intent/session, verify payment, webhook reconciliation, refund initiation/status.
- Add explicit schemas/enums for order status, payment status, user role/status, shipment status.
- Add device APIs for registering devices, ownership, telemetry ingestion, command dispatch, and history.

## Test Plan
- Backend unit tests: auth, role guards, ownership checks, products, orders, payments, users.
- Backend integration tests: order creation, Cashfree webhook verification, inventory decrement, refund/cancel flow.
- Frontend tests: auth routing, checkout flow, cart/wishlist persistence, admin guard behavior.
- E2E tests: signup/login, shop to checkout, admin product CRUD, admin order update.
- Security tests: normal user cannot mutate other users, see all orders, update roles, or access admin endpoints.

## Verification Baseline Found
- `npm run lint` fails with many unused imports, undefined symbols, hook rule errors, and Fast Refresh issues.
- `python -m pytest backend\tests` cannot run because `pytest` is missing.
- `python -m compileall -q backend` passes.
- Backend test files are empty.
- Existing architecture docs are partly outdated because several previously missing folders/services now exist.

## Assumptions
- Target product is a real IoT ecommerce platform, not only a demo/prototype.
- First production market is India, based on INR, Cashfree, Indian address/PIN logic, and COD references.
- Product-ready means secure public deployment with real payments, protected admin, reliable orders, basic monitoring, and passing automated checks.
