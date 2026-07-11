# IoTMart Backend — Structure Analysis & Refinement Guide

> **Purpose:** Complete backend analysis for future restructuring and refinement.  
> **Note:** This is a reference document only — no code changes included.  
> **Generated:** July 2026  
> **Stack:** FastAPI + MongoDB (Motor) + Redis + External APIs

---

## 1. Executive Summary

IoTMart backend is a **monolithic FastAPI application** serving an IoT e-commerce platform with circuit designer, AI assistant, component search (Nexar), payments (Cashfree), logistics (Shiprocket), and real-time telemetry (WebSocket).

**Current state:** Functional prototype with working features, but architecture is **flat and route-heavy**. Business logic, DB queries, and external API calls live mostly inside route handlers. Several inconsistencies and broken references exist that should be fixed during refinement.

| Aspect | Current State | Maturity |
|--------|---------------|----------|
| API Layer | 13 route modules | ✅ Working |
| Service Layer | Partial (email, SMS, AI, logistics) | ⚠️ Incomplete |
| Data Layer | Direct `db.collection` in routes | ⚠️ No abstraction |
| Auth | Dual implementations | ❌ Inconsistent |
| Config | Plain `os.getenv` class | ⚠️ Basic |
| Tests | `tests/` folder exists (empty stubs) | ❌ Not implemented |
| File Splitting | 6 files need splitting, 1 critical (`auth.py`) | ⚠️ Needed |
| Docs | Auto-generated via FastAPI | ✅ Basic |

---

## 2. Current Directory Structure

```
backend/
├── main.py                    # App entry, middleware, startup/shutdown
├── requirements.txt           # Python dependencies
├── fix_db.py                  # One-off DB migration script (standalone)
│
├── api/
│   ├── router.py              # Central router — mounts all v1 routes
│   └── v1/
│       ├── auth.py            # Signup, login, OAuth, verification, password reset
│       ├── users.py           # User CRUD, profile, wishlist, addresses
│       ├── products.py        # Product CRUD, reviews, Redis cache
│       ├── orders.py          # Order creation, status, tracking
│       ├── transactions.py    # Payment transaction records
│       ├── payments.py        # Cashfree payment gateway
│       ├── analytics.py       # Admin dashboard stats
│       ├── ai.py              # AI chat endpoint
│       ├── parts.py           # AI part generation (Groq)
│       ├── circuits.py        # Circuit designer save/load
│       ├── nexar.py           # Nexar/Octopart component search proxy
│       └── websocket.py       # IoT telemetry WebSocket
│
├── core/
│   ├── config.py              # Environment variables & settings
│   ├── database.py            # MongoDB client singleton
│   ├── security.py            # Password hashing, JWT, get_current_user
│   ├── dependencies.py        # Alternate get_current_user (DB lookup)
│   └── redis_cache.py         # Redis init, get/set/delete cache
│
├── middleware/
│   ├── logging_middleware.py  # Request logging (active)
│   └── auth_middleware.py     # Auth stub (NOT registered in main.py)
│
├── schemas/
│   ├── user.py
│   ├── product.py
│   ├── order.py
│   ├── transaction.py
│   └── analytics.py
│
├── services/
│   ├── email_service.py       # Gmail SMTP (sync)
│   ├── sms_service.py         # Twilio OTP (sync)
│   ├── ai_service.py          # Groq chat completions
│   └── logistics_engine.py    # Shiprocket integration
│   # ❌ notification_engine.py — DELETED but still imported in orders.py
│
├── models/                    # Empty package (only __init__.py)
├── tests/                     # Empty test stubs (test_auth, test_orders, test_products)
│
└── scripts/
    ├── seed.py                # Seed products
    ├── seed_demo_users.py     # Seed demo users
    ├── check_db.py            # DB health check
    ├── debug_prices.py        # Price debugging
    └── scrape_quartz.py       # External scraping utility
```

> **Audit Status:** All **36 Python files** analyzed (excluding `__pycache__`). Line counts verified via full codebase scan.

---

## 3. Architecture Flow (Current)

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client    │────▶│  FastAPI (main)  │────▶│   api/router    │
│  (React)    │     │  CORS, RateLimit │     │  /api prefix    │
└─────────────┘     │  Logging MW      │     └────────┬────────┘
                    └──────────────────┘              │
                                                      ▼
                    ┌──────────────────────────────────────────────┐
                    │           api/v1/* (Route Handlers)          │
                    │  • Direct MongoDB queries (db.users, etc.)   │
                    │  • Inline business logic                   │
                    │  • Lazy imports of services                │
                    └──────────┬───────────────────┬─────────────┘
                               │                   │
              ┌────────────────▼───┐    ┌───────────▼────────────┐
              │  MongoDB (Motor)   │    │  Services / External   │
              │  iot_mart DB       │    │  Groq, Nexar, Cashfree │
              └────────────────────┘    │  Shiprocket, Gmail,    │
              ┌────────────────────┐    │  Twilio, Redis         │
              │  Redis Cache     │    └────────────────────────┘
              └────────────────────┘
```

**Pattern:** Thin `main.py` → flat routers → fat handlers. No repository or domain layer.

---

## 4. Tech Stack & Dependencies

| Package | Purpose | Used In |
|---------|---------|---------|
| `fastapi` | Web framework | All routes |
| `uvicorn` | ASGI server | Runtime |
| `motor` | Async MongoDB | `core/database.py` |
| `pydantic` | Request/response models | `schemas/` |
| `pydantic-settings` | ⚠️ Listed but NOT used | — |
| `python-dotenv` | `.env` loading | `config.py`, `main.py` |
| `redis` | Caching | `products.py` |
| `httpx` | Async HTTP client | AI, Nexar, payments, Google OAuth |
| `passlib` + `bcrypt` | Password hashing | `security.py` |
| `PyJWT` | JWT tokens | `security.py`, `dependencies.py` |
| `slowapi` | Rate limiting | `main.py` (100 req/min) |
| `google-auth` | Google OAuth (partial) | `auth.py` |
| `twilio` | SMS OTP | `sms_service.py` |
| `requests` | Sync HTTP | Listed, minimal use |

---

## 5. API Endpoints Inventory

**Base URL:** `/api`  
**Auth:** Router-level `Depends(get_current_user)` on most routes. Exceptions noted below.

### 5.1 Auth — `/api/auth` (Public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | Email/password login → JWT |
| POST | `/google` | Google OAuth login |
| POST | `/send-verification` | Email or mobile OTP |
| POST | `/verify-mobile` | Verify mobile OTP |
| POST | `/verify-email` | Verify email token |
| POST | `/forgot-password` | Send reset link |
| POST | `/reset-password` | Reset password with token |
| PUT | `/update-identity` | Update email/phone |

### 5.2 Users — `/api/users` (Protected)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all users (⚠️ no role check) |
| GET | `/{id}` | Get user by ID |
| PUT | `/{id}/role` | Update role (⚠️ no admin check) |
| PUT | `/{id}/status` | Update status |
| PUT | `/{id}/profile` | Update profile |
| POST | `/{id}/wishlist` | Toggle wishlist item |
| POST | `/{id}/addresses` | Add address |
| DELETE | `/{id}/addresses/{address_id}` | Remove address |
| PUT | `/{id}/password` | Change password |
| PUT | `/{id}/deactivate` | Deactivate account |

### 5.3 Products — `/api/products` (⚠️ Public — no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Paginated list (Redis cached) |
| POST | `/` | Create product |
| GET | `/{id}` | Get product |
| PUT | `/{id}` | Update product |
| DELETE | `/{id}` | Delete product |
| POST | `/{id}/reviews` | Add review |

### 5.4 Orders — `/api/orders` (Protected)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create order + transaction + logistics |
| GET | `/user/{user_id}` | User's orders |
| GET | `/` | All orders |
| PUT | `/{id}/status` | Update status |
| PUT | `/{id}/tracking` | Update tracking ID |
| GET | `/tracking/{tracking_id}` | Live tracking |

### 5.5 Transactions — `/api/transactions` (Protected)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create transaction |
| GET | `/user/{user_id}` | User transactions |
| GET | `/` | All transactions |
| GET | `/{id}` | Single transaction |

### 5.6 Payments — `/api/payments` (Protected, webhook public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/cashfree/create-session` | Create Cashfree payment session |
| POST | `/cashfree/webhook` | Webhook (⚠️ no auth, signature verified) |

### 5.7 Analytics — `/api/analytics` (Protected)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Dashboard stats (partial mock data) |

### 5.8 AI — `/api/ai` (Protected)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | Groq-powered chat |

### 5.9 Part Generation — `/api/ai/generate-part` (Protected)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/generate-part` | AI component definition (Groq) |

### 5.10 Circuits — `/api/circuits` (Protected)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Save/upsert circuit |
| GET | `/{user_id}` | User's circuits |
| DELETE | `/{circuit_name}/{user_id}` | Delete circuit |

### 5.11 Nexar — `/api/nexar/search` (Protected)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/nexar/search` | Component search (Nexar GraphQL + mock fallback) |

### 5.12 WebSocket — `/api/ws/telemetry/{device_id}` (No auth)

| Type | Path | Description |
|------|------|-------------|
| WS | `/ws/telemetry/{device_id}` | Simulated IoT telemetry stream |

### 5.13 Root & Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Welcome message |
| GET | `/api/health` | Health check |

---

## 6. MongoDB Collections

**Database name (config):** `iot_mart` (from `DATABASE_NAME` env)

| Collection | Used In | Key Fields | Indexes (startup) |
|------------|---------|------------|-------------------|
| `users` | auth, users | email, password, role, status, wishlist, addresses, tokens | `email` (unique) |
| `products` | products, analytics | name, price, category, reviews, stock | `category`, `name` (text) |
| `orders` | orders, analytics | user_id, items, total, status, tracking_id | `user_id` |
| `transactions` | orders, transactions | user_id, order_id, amount, status | — |
| `circuits` | circuits | userId, name, components, wires | — |

### User Document Fields (implicit schema)

```
email, password, first_name, last_name, phone, role, status,
wishlist[], addresses[], profile_picture,
email_verified, mobile_verified, has_custom_password,
email_verify_token, mobile_otp, reset_password_token
```

### ⚠️ DB Name Inconsistency

- `core/config.py` → default `iot_mart`
- `fix_db.py` → hardcoded `iot_ecommerce`

---

## 7. Environment Variables

| Variable | Used In | Required |
|----------|---------|----------|
| `MONGODB_URL` | database.py | Yes |
| `DATABASE_NAME` | database.py | Yes (default: iot_mart) |
| `SECRET_KEY` | security.py | Yes (⚠️ has insecure default) |
| `GROQ_API_KEY` | ai_service, parts | For AI features |
| `NEXAR_CLIENT_ID` | nexar.py | For component search |
| `NEXAR_CLIENT_SECRET` | nexar.py | For component search |
| `REDIS_URL` | redis_cache.py | Optional (graceful fail) |
| `GMAIL_USER` | email_service.py | For emails |
| `GMAIL_PASSWORD` | email_service.py | For emails |
| `GOOGLE_CLIENT_ID` | auth.py | For Google OAuth |
| `TWILIO_ACCOUNT_SID` | sms_service.py | For SMS |
| `TWILIO_AUTH_TOKEN` | sms_service.py | For SMS |
| `TWILIO_PHONE_NUMBER` | sms_service.py | For SMS |
| `CASHFREE_APP_ID` | payments.py | For payments |
| `CASHFREE_SECRET_KEY` | payments.py | For payments |
| `CASHFREE_WEBHOOK_SECRET` | payments.py | For webhook verification |
| `SHIPROCKET_EMAIL` | logistics_engine.py | For shipping |
| `SHIPROCKET_PASSWORD` | logistics_engine.py | For shipping |

**⚠️ Missing from `config.py`:** Twilio, Cashfree, Shiprocket, Google Client ID — read directly via `os.getenv` in route/service files.

---

## 8. Authentication & Authorization Analysis

### 8.1 Two Conflicting `get_current_user` Implementations

| File | Returns | DB Lookup | Used By |
|------|---------|-----------|---------|
| `core/security.py` | JWT payload (`sub`, `role`) | ❌ No | `router.py` (global), `payments.py` |
| `core/dependencies.py` | Full user document from MongoDB | ✅ Yes | ❌ Not used anywhere |

**Impact:** Protected routes receive JWT payload, not full user. Routes that need `user["_id"]` must do extra DB lookups. `dependencies.py` is dead code.

### 8.2 Auth Middleware

`middleware/auth_middleware.py` exists but is a **no-op stub** and is **not registered** in `main.py`. Auth is handled only via FastAPI `Depends`.

### 8.3 Authorization Gaps

- No role-based access control (RBAC) — any authenticated user can:
  - List all users
  - Change any user's role/status
  - Create/update/delete products
  - View all orders and transactions
- Products CRUD is completely public (no auth on router)
- WebSocket has no authentication
- `update-identity` in auth.py has no ownership verification

### 8.4 Token Config

- Algorithm: HS256
- Expiry: 30 days (very long for production)
- Default `SECRET_KEY` in config is a security risk

---

## 9. Services Layer Analysis

| Service | Type | Async | Status |
|---------|------|-------|--------|
| `email_service.py` | SMTP (Gmail) | ❌ Sync | ✅ Working |
| `sms_service.py` | Twilio | ❌ Sync | ✅ Working |
| `ai_service.py` | Groq API | ✅ Async | ✅ Working |
| `logistics_engine.py` | Shiprocket | ✅ Async | ✅ Mock mode default |
| `notification_engine.py` | Order emails + WhatsApp | — | ❌ **DELETED** — broken import in `orders.py` |

### Service Gaps

- No unified notification service (email + SMS + WhatsApp)
- No payment service abstraction (Cashfree logic in route)
- No user service (user_helper duplicated in auth.py and users.py)
- No product/order repository

---

## 10. Identified Issues & Technical Debt

### 🔴 Critical

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | `notification_engine` deleted but imported | `orders.py:41,76` | Order emails/WhatsApp will fail at runtime |
| 2 | Dual `get_current_user` — wrong one used globally | `security.py` vs `dependencies.py` | Inconsistent auth context |
| 3 | No RBAC / authorization | All protected routes | Security vulnerability |
| 4 | Products CRUD publicly accessible | `router.py` | Anyone can modify catalog |
| 5 | Hardcoded `SECRET_KEY` default | `config.py` | Security risk |

### 🟡 Medium

| # | Issue | Location |
|---|-------|----------|
| 6 | CORS `allow_origins=["*"]` + `allow_credentials=True` | `main.py` — invalid combo |
| 7 | `@app.on_event` deprecated | `main.py` — use lifespan |
| 8 | `pydantic-settings` in requirements but unused | `requirements.txt` |
| 9 | Schemas defined inline in routes | `circuits.py`, `payments.py`, `parts.py` |
| 10 | `user_helper` duplicated | `auth.py`, `users.py` |
| 11 | Hardcoded `localhost:5173` URLs | `email_service.py` |
| 12 | Sync email/SMS in async routes | Blocks event loop |
| 13 | `fix_db.py` uses wrong DB name | `iot_ecommerce` vs `iot_mart` |
| 14 | Cashfree webhook handler is empty (`pass`) | `payments.py` |
| 15 | Analytics has mock chart data | `analytics.py` |
| 16 | `address.dict()` deprecated (Pydantic v2) | `users.py` — use `model_dump()` |
| 17 | `circuit.dict()` deprecated | `circuits.py` |
| 18 | `verify=False` on httpx in AI service | SSL security concern |

### 🟢 Low / Cleanup

| # | Issue | Location |
|---|-------|----------|
| 19 | Unused imports | `circuits.py` (motor, os), `auth.py` (google id_token) |
| 20 | `AuthMiddleware` dead code | Not registered |
| 21 | `dependencies.py` dead code | Not imported |
| 22 | Duplicate `get_password_hash` import | `auth.py:228` |
| 23 | `__pycache__` files in repo | Should be gitignored |
| 24 | No tests directory | — |
| 25 | No `.env.example` | Onboarding difficulty |
| 26 | Inconsistent route prefixes | `nexar`, `parts`, `websocket` have no prefix in router |

---

## 11. Recommended Target Structure

Refinement ke liye yeh layered architecture follow karein:

```
backend/
├── main.py                          # App factory + lifespan
├── requirements.txt
├── .env.example
│
├── app/                             # (Optional: rename root package)
│   ├── api/
│   │   ├── deps.py                  # Single get_current_user + RBAC deps
│   │   ├── router.py
│   │   └── v1/
│   │       ├── auth.py              # Thin — delegate to services
│   │       ├── users.py
│   │       ├── products.py
│   │       ├── orders.py
│   │       ├── payments.py
│   │       └── ...
│   │
│   ├── core/
│   │   ├── config.py                # pydantic-settings BaseSettings
│   │   ├── security.py              # JWT + password only
│   │   ├── database.py
│   │   └── redis.py
│   │
│   ├── models/                      # Domain models (optional)
│   │   └── ...
│   │
│   ├── schemas/                     # All Pydantic schemas (move inline ones here)
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── order.py
│   │   ├── circuit.py               # NEW — from circuits.py
│   │   ├── payment.py               # NEW — from payments.py
│   │   └── ...
│   │
│   ├── repositories/                # NEW — DB access layer
│   │   ├── user_repo.py
│   │   ├── product_repo.py
│   │   ├── order_repo.py
│   │   └── circuit_repo.py
│   │
│   ├── services/                    # Business logic
│   │   ├── auth_service.py          # NEW — login, signup, verify logic
│   │   ├── user_service.py          # NEW — user_helper, profile logic
│   │   ├── product_service.py
│   │   ├── order_service.py
│   │   ├── payment_service.py       # NEW — Cashfree logic
│   │   ├── notification_service.py  # NEW — unified email + SMS + WhatsApp
│   │   ├── email_service.py
│   │   ├── sms_service.py
│   │   ├── ai_service.py
│   │   ├── logistics_service.py     # Rename from logistics_engine
│   │   └── nexar_service.py         # NEW — extract from nexar.py
│   │
│   ├── middleware/
│   │   └── logging_middleware.py
│   │
│   └── utils/
│       ├── serializers.py           # ObjectId → str helpers
│       └── exceptions.py            # Custom HTTP exceptions
│
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_products.py
│   └── ...
│
└── scripts/
    ├── seed.py
    └── migrate.py                   # Replace fix_db.py
```

---

## 12. Refinement Roadmap (Priority Order)

### Phase 1 — Fix Broken & Critical (1–2 days)

- [ ] Restore or replace `notification_engine` → unified `notification_service.py`
- [ ] Merge `get_current_user` into single implementation in `api/deps.py`
- [ ] Add RBAC: `require_admin`, `require_owner` dependencies
- [ ] Protect product write endpoints (POST/PUT/DELETE → admin only)
- [ ] Move all env vars to `config.py` with `pydantic-settings`
- [ ] Create `.env.example`
- [ ] Fix `fix_db.py` DB name or move to `scripts/migrate.py`

### Phase 2 — Structure & Separation (3–5 days)

- [ ] Extract repositories for each collection
- [ ] Move business logic from routes to services
- [ ] Move inline schemas to `schemas/` folder
- [ ] Create `user_service` with shared `serialize_user()` helper
- [ ] Create `payment_service` for Cashfree
- [ ] Implement Cashfree webhook order update logic
- [ ] Replace `@app.on_event` with lifespan context manager
- [ ] Fix CORS configuration for production

### Phase 3 — Quality & Production Readiness (5–7 days)

- [ ] Add pytest + test fixtures (MongoDB mock / test DB)
- [ ] Make email/SMS async (or use background tasks / Celery)
- [ ] Add structured logging (replace `print()`)
- [ ] Add API versioning strategy (`/api/v1/`)
- [ ] Add request ID tracing in middleware
- [ ] Replace hardcoded frontend URLs with `FRONTEND_URL` env
- [ ] Add rate limiting per-endpoint (not just global)
- [ ] WebSocket authentication
- [ ] Proper error response format across all endpoints
- [ ] OpenAPI tags and descriptions cleanup

### Phase 4 — Advanced (Optional)

- [ ] Background job queue (Celery/ARQ) for emails, notifications
- [ ] Event-driven order flow (order created → payment → ship → notify)
- [ ] Caching strategy beyond products (user sessions, Nexar tokens)
- [ ] Database migrations tool (migrate-mongo or custom)
- [ ] Docker + docker-compose for local dev
- [ ] CI/CD pipeline with linting (ruff), type checking (mypy)

---

## 13. Per-Module Refinement Notes

### `main.py`
- Move index creation to a dedicated `init_db()` function
- Use lifespan instead of on_event
- Register exception handlers in a separate module
- Consider app factory pattern: `create_app() -> FastAPI`

### `api/router.py`
- Group public vs protected routers clearly
- Apply auth per-router, not globally with exceptions
- Add consistent prefixes (`/nexar`, `/parts` currently inconsistent)
- Remove unused imports after auth consolidation

### `api/v1/auth.py` (303 lines — too fat)
- Split into: signup, login, oauth, verification, password reset handlers
- Extract `serialize_user()` to `user_service`
- Move token generation logic to `auth_service`
- `update-identity` needs auth + ownership check

### `api/v1/users.py`
- Add admin-only guards on list/role/status endpoints
- Add ownership check: user can only modify own profile (unless admin)
- Replace `address.dict()` with `address.model_dump()`

### `api/v1/products.py`
- GET → public, POST/PUT/DELETE → admin only
- Extract cache logic to `product_service` or decorator
- Review schema: seed data uses `reviews` as int, schema expects list

### `api/v1/orders.py`
- Fix `notification_engine` import immediately
- Extract order creation flow to `order_service`
- Fix `ObjectId(order.user_id)` — user_id is likely string, not ObjectId
- Pass real user data to logistics, not mock

### `api/v1/payments.py`
- Complete webhook handler — update order/transaction on payment success
- Move Cashfree config to `core/config.py`
- Extract to `payment_service.py`

### `api/v1/analytics.py`
- Replace mock `revenueData` and `topSelling` with real aggregations
- Use MongoDB aggregation pipeline instead of loading all docs

### `api/v1/circuits.py`
- Move `CircuitSchema`, `CircuitComponent`, `Wire` to `schemas/circuit.py`
- Use repository pattern for `circuits` collection
- Remove unused imports

### `api/v1/nexar.py`
- Extract token cache + API calls to `nexar_service.py`
- Move `MOCK_DB` to `fixtures/` or `data/`
- Route should only handle HTTP concerns

### `api/v1/parts.py` & `api/v1/ai.py`
- Consider merging AI endpoints under `/api/ai/` with sub-routes
- Share Groq client configuration

### `api/v1/websocket.py`
- Add JWT validation on connect
- Replace simulated data with Redis Pub/Sub or MQTT bridge
- Move `ConnectionManager` to `services/` or `core/`

### `core/config.py`
- Migrate to `pydantic_settings.BaseSettings`
- Add all env vars in one place
- Remove insecure defaults for production

### `core/security.py`
- Keep only: hash, verify, create_token, decode_token
- Remove `get_current_user` — move to `api/deps.py`

### `core/dependencies.py`
- Delete after merging into `api/deps.py`

### `services/email_service.py`
- Add `FRONTEND_URL` from config for links
- Consider `fastapi.BackgroundTasks` or async SMTP library
- Template HTML could move to `templates/email/`

### `services/logistics_engine.py`
- Rename to `logistics_service.py` for consistency
- Fix field mapping: `order_data.get("shippingAddress")` vs schema `address`

---

## 14. Data Flow Examples

### Order Creation Flow (Current)

```
POST /api/orders
  → Validate OrderCreate schema
  → logistics.create_shipment() [Shiprocket/mock]
  → db.orders.insert_one()
  → db.transactions.insert_one()
  → notification_engine.notify() [❌ BROKEN]
  → Return order
```

### Login Flow (Current)

```
POST /api/auth/login
  → db.users.find_one({email})
  → verify_password()
  → create_access_token({sub: email, role})
  → Return {access_token, user}
```

### Product List Flow (Current)

```
GET /api/products?page=1&limit=100
  → Check Redis cache
  → db.products.find().skip().limit()
  → db.products.count_documents()
  → Set Redis cache (5 min TTL)
  → Return {products, total, page, pages}
```

---

## 15. Conventions to Establish During Refinement

| Area | Current | Recommended |
|------|---------|-------------|
| Response format | Mixed (`message`, `success`, `detail`) | Unified: `{success, data, error}` |
| ID fields | `_id` as string in responses | Consistent `id` in API, `_id` internal |
| Timestamps | Only on transactions | Add `created_at`, `updated_at` everywhere |
| Error codes | Generic 400/404/500 | Specific codes per domain |
| Imports | Lazy imports in handlers | Top-level imports in services |
| Config access | `os.getenv` scattered | Single `settings` object |
| Naming | `logistics_engine`, `ai_service` | Consistent `_service` suffix |
| Async | Mixed sync/async | All I/O async or background tasks |

---

## 16. Quick Reference — File Responsibilities (Verified Line Counts)

| File | Lines | Endpoints/Units | Split Needed? | Priority |
|------|-------|-----------------|---------------|----------|
| `api/v1/auth.py` | **287** | 9 endpoints | ✅ **YES — Critical** | 🔴 |
| `api/v1/nexar.py` | 136 | 1 endpoint + token + mock + GraphQL | ✅ YES | 🟡 |
| `services/email_service.py` | 133 | 3 templates + sender | ✅ YES | 🟡 |
| `api/v1/users.py` | 126 | 10 endpoints + helper | ✅ YES | 🟡 |
| `services/logistics_engine.py` | 121 | 1 class, 3 methods | ⚠️ Optional | 🟢 |
| `api/v1/payments.py` | 100 | 2 endpoints + schema | ✅ YES | 🟡 |
| `api/v1/products.py` | 98 | 6 endpoints + cache | ✅ YES | 🟡 |
| `api/v1/orders.py` | 96 | 6 endpoints + side effects | ✅ YES | 🔴 |
| `main.py` | 65 | startup + middleware + handlers | ✅ YES | 🟡 |
| `api/v1/websocket.py` | 63 | 1 WS + ConnectionManager class | ⚠️ Optional | 🟢 |
| `api/v1/circuits.py` | 59 | 3 endpoints + 3 inline schemas | ⚠️ Schemas only | 🟢 |
| `api/v1/parts.py` | 58 | 1 endpoint + Groq prompt | ⚠️ Merge with ai | 🟢 |
| `api/v1/analytics.py` | 57 | 1 endpoint + mock data | ⚠️ Optional | 🟢 |
| `core/redis_cache.py` | 54 | 5 functions | ❌ Keep as is | — |
| `services/ai_service.py` | 46 | 1 function | ❌ Keep (or merge) | — |
| `api/v1/transactions.py` | 37 | 4 simple CRUD | ❌ Keep as is | — |
| `core/security.py` | 32 | 4 functions | ❌ Keep as is | — |
| `api/router.py` | 28 | route mounting | ❌ Keep as is | — |
| `services/sms_service.py` | 27 | 1 function | ❌ Keep as is | — |
| All schemas (5 files) | 11–26 each | Pydantic models | ❌ Keep as is | — |
| `api/v1/ai.py` | 14 | 1 endpoint | ❌ Keep (merge target) | — |
| `core/config.py` | 16 | settings class | ❌ Keep as is | — |
| `core/database.py` | 6 | DB singleton | ❌ Keep as is | — |
| `core/dependencies.py` | 21 | dead code | ❌ Delete later | — |
| `middleware/*` | 14 each | 1 class each | ❌ Keep as is | — |
| `scripts/*` | 12–119 | utility scripts | ❌ Not production | — |
| `tests/*` | 0 each | empty stubs | ➕ Fill later | — |
| `fix_db.py` | 12 | one-off migration | ❌ Move to scripts | — |

---

## 17. Complete File Audit — Sab Files Analyze Hui Hain

Yeh section confirm karta hai ki **har Python file** individually check hui hai — sirf badi files nahi.

### 17.1 Production Code (26 files)

| # | File | Lines | Kya karta hai | Complexity Reason |
|---|------|-------|---------------|-------------------|
| 1 | `api/v1/auth.py` | 287 | 9 alag auth flows ek file mein | Multiple domains, duplicate user serialization, lazy imports |
| 2 | `api/v1/nexar.py` | 136 | OAuth + GraphQL + mock DB + normalize | 4 alag responsibilities |
| 3 | `services/email_service.py` | 133 | 3 HTML email templates + SMTP | Har template ~40 lines HTML |
| 4 | `api/v1/users.py` | 126 | Admin + profile + wishlist + addresses + password | 5 alag user domains |
| 5 | `services/logistics_engine.py` | 121 | Shiprocket class (auth, ship, track) | Single class — acceptable, rename only |
| 6 | `api/v1/payments.py` | 100 | Cashfree session + webhook verify | 2 alag flows + inline config |
| 7 | `api/v1/products.py` | 98 | CRUD + Redis cache + reviews | 3 alag concerns |
| 8 | `api/v1/orders.py` | 96 | Create + notify + track + list | create_order() bahut heavy hai |
| 9 | `main.py` | 65 | App factory + lifespan + CORS + errors | 4 setup concerns |
| 10 | `api/v1/websocket.py` | 63 | WS endpoint + ConnectionManager | Class alag file mein ho sakti hai |
| 11 | `api/v1/circuits.py` | 59 | 3 endpoints + 3 Pydantic models inline | Schemas alag honi chahiye |
| 12 | `api/v1/parts.py` | 58 | Groq part generation + 30-line prompt | Prompt string alag file |
| 13 | `api/v1/analytics.py` | 57 | Dashboard + mock chart data | Mock data alag ho sakta hai |
| 14 | `core/redis_cache.py` | 54 | Redis init + cache ops | ✅ OK size |
| 15 | `services/ai_service.py` | 46 | Groq chat | ✅ OK — merge with parts later |
| 16 | `api/v1/transactions.py` | 37 | Simple CRUD | ✅ OK — split mat karo |
| 17 | `core/security.py` | 32 | Hash + JWT + get_current_user | ✅ OK after deps cleanup |
| 18 | `api/router.py` | 28 | Mount all routers | ✅ OK |
| 19 | `services/sms_service.py` | 27 | Twilio OTP | ✅ OK |
| 20 | `schemas/product.py` | 26 | Product models | ✅ OK |
| 21 | `schemas/order.py` | 24 | Order models | ✅ OK |
| 22 | `schemas/user.py` | 21 | User models | ✅ OK |
| 23 | `core/dependencies.py` | 21 | Unused get_current_user | ❌ Dead code |
| 24 | `schemas/transaction.py` | 18 | Transaction models | ✅ OK |
| 25 | `core/config.py` | 16 | Env settings | ✅ OK — extend only |
| 26 | `api/v1/ai.py` | 14 | 1 chat endpoint | ✅ OK — thin router |

### 17.2 Non-Production / Utility (10 files)

| File | Lines | Action |
|------|-------|--------|
| `scripts/seed.py` | 119 | Keep in scripts — no split |
| `scripts/scrape_quartz.py` | 106 | Keep in scripts |
| `scripts/seed_demo_users.py` | 27 | Keep |
| `scripts/check_db.py` | 14 | Keep |
| `scripts/debug_prices.py` | 13 | Keep |
| `fix_db.py` | 12 | Move to `scripts/migrate.py` |
| `middleware/logging_middleware.py` | 14 | Keep |
| `middleware/auth_middleware.py` | 14 | Delete (unused stub) |
| `core/database.py` | 6 | Keep |
| `schemas/analytics.py` | 11 | Keep |

### 17.3 Empty Stubs (5 files — abhi kuch nahi)

| File | Status |
|------|--------|
| `tests/test_auth.py` | Empty — tests likhne hain |
| `tests/test_orders.py` | Empty |
| `tests/test_products.py` | Empty |
| `models/__init__.py` | Empty package |
| Various `__init__.py` | Empty — normal |

---

## 18. File Splitting Guide — Complex Files ko Choti Files Mein Divide Karna

> **Yeh section tumhare main goal ke liye hai.**  
> Rule: Ek file mein **ek responsibility** — routes sirf HTTP handle karein, logic services mein, DB access repositories mein.

### 18.1 Kab Split Karna Chahiye?

| Signal | Example | Action |
|--------|---------|--------|
| File > 150 lines | `auth.py` (287) | **Must split** |
| 5+ endpoints alag domains mein | `auth.py` (9 endpoints, 5 domains) | **Must split** |
| Inline schemas + routes + logic | `circuits.py`, `payments.py` | Schemas/services alag karo |
| Duplicate helper code | `user_helper` in auth + users | Shared service banao |
| Large string/data blocks | `MOCK_DB`, email HTML, Groq prompts | Alag data/template files |
| File 50–100 lines lekin 3+ concerns | `products.py`, `orders.py` | **Should split** |
| File < 50 lines, 1 concern | `ai.py`, `transactions.py` | **Mat split karo** |

### 18.2 Split Priority Matrix

```
MUST SPLIT (Pehle ye karo):
  1. auth.py        → 287 lines, 9 endpoints, 5 domains
  2. orders.py      → broken notification + heavy create_order
  3. users.py       → 10 endpoints, no RBAC, duplicated helper

SHOULD SPLIT (Phase 2):
  4. nexar.py       → API + mock + token + normalize
  5. email_service  → 3 templates bloated
  6. products.py    → CRUD + cache + reviews
  7. payments.py    → session + webhook
  8. main.py        → lifespan + exceptions + health

OPTIONAL (Jab time ho):
  9. websocket.py   → ConnectionManager alag
  10. circuits.py   → sirf schemas bahar nikalo
  11. parts.py + ai.py → merge under ai/ module
  12. analytics.py  → mock data alag
```

---

### 18.3 DETAILED SPLIT PLAN — `auth.py` (287 lines → 7 files) 🔴

**Current problem:** Ek file mein signup, login, Google OAuth, email/mobile verification, password reset, identity update — sab mixed.

**Target structure:**

```
api/v1/auth/
├── __init__.py          # Sub-routers combine → single auth router
├── signup.py            # POST /signup                    (~30 lines)
├── login.py             # POST /login                     (~35 lines)
├── oauth.py             # POST /google                    (~80 lines)
├── verification.py      # send-verification, verify-mobile,
│                        # verify-email                    (~65 lines)
├── password.py          # forgot-password, reset-password (~35 lines)
└── identity.py          # PUT /update-identity            (~40 lines)

services/
└── auth_service.py      # Shared logic:
                         #   - serialize_user_response()
                         #   - find_or_create_google_user()
                         #   - reactivate_if_inactive()
                         #   - generate_tokens()

schemas/
└── auth.py              # Request bodies (currently Body(...) inline)
                         #   - LoginRequest, VerifyRequest,
                         #     ResetPasswordRequest, etc.
```

**Har nayi file ka scope:**

| New File | Endpoints | Service calls |
|----------|-----------|---------------|
| `signup.py` | `POST /signup` | `auth_service.register_user()` |
| `login.py` | `POST /login` | `auth_service.authenticate()` |
| `oauth.py` | `POST /google` | `auth_service.google_auth()` |
| `verification.py` | 3 verification endpoints | `auth_service.send_verify()`, `verify_otp()`, `verify_email()` |
| `password.py` | 2 password endpoints | `auth_service.forgot_password()`, `reset_password()` |
| `identity.py` | `PUT /update-identity` | `auth_service.update_identity()` |

**`__init__.py` pattern:**
```python
# api/v1/auth/__init__.py
from fastapi import APIRouter
from .signup import router as signup_router
from .login import router as login_router
# ... include all sub-routers
router = APIRouter()
router.include_router(signup_router)
router.include_router(login_router)
# ...
```

---

### 18.4 DETAILED SPLIT PLAN — `users.py` (126 lines → 5 files) 🟡

**Current problem:** Admin operations (list all, role, status) aur user operations (profile, wishlist, addresses) ek saath.

**Target structure:**

```
api/v1/users/
├── __init__.py          # Combine sub-routers
├── admin.py             # GET /, PUT /{id}/role, PUT /{id}/status  (~25 lines)
├── profile.py           # GET /{id}, PUT /{id}/profile,
│                        # PUT /{id}/password, PUT /{id}/deactivate (~55 lines)
├── wishlist.py          # POST /{id}/wishlist                  (~20 lines)
└── addresses.py         # POST + DELETE addresses              (~25 lines)

services/
└── user_service.py      # serialize_user() — single source of truth
                         # (replaces user_helper + auth.py duplicate)

schemas/user.py          # Add ProfileUpdate (currently inline in users.py)
```

**RBAC guard (refinement ke saath):**
- `admin.py` → `Depends(require_admin)`
- `profile.py`, `wishlist.py`, `addresses.py` → `Depends(require_owner_or_admin)`

---

### 18.5 DETAILED SPLIT PLAN — `orders.py` (96 lines → 4 files) 🔴

**Current problem:** `create_order()` mein logistics + transaction + notification + email — 40+ lines ek function mein. `notification_engine` broken hai.

**Target structure:**

```
api/v1/orders/
├── __init__.py
├── create.py            # POST /                           (~15 lines — thin)
├── query.py             # GET /, GET /user/{user_id}       (~25 lines)
└── tracking.py          # PUT status, PUT tracking,
                         # GET /tracking/{id}               (~30 lines)

services/
├── order_service.py     # create_order() orchestration:
│                        #   1. validate items
│                        #   2. call logistics_service
│                        #   3. save to DB
│                        #   4. create transaction
│                        #   5. trigger notification
└── notification_service.py  # FIX broken import — unified:
                             #   send_order_email()
                             #   send_status_whatsapp()

repositories/
└── order_repo.py        # db.orders CRUD
```

---

### 18.6 DETAILED SPLIT PLAN — `products.py` (98 lines → 4 files) 🟡

**Target structure:**

```
api/v1/products/
├── __init__.py
├── crud.py              # GET list, POST, GET /{id}, PUT, DELETE  (~55 lines)
└── reviews.py           # POST /{id}/reviews                      (~30 lines)

services/
└── product_service.py   # Cache logic (get_cache, set_cache, delete_cache)
                         # Rating calculation
                         # verified_buyer check

repositories/
└── product_repo.py      # db.products queries
```

---

### 18.7 DETAILED SPLIT PLAN — `nexar.py` (136 lines → 5 files) 🟡

**Current problem:** OAuth token cache, GraphQL query string, 8-item mock database, response normalizer — sab ek route file mein.

**Target structure:**

```
api/v1/nexar.py          # Thin: POST /nexar/search only     (~15 lines)

services/nexar/
├── __init__.py
├── client.py            # get_nexar_token(), API call       (~45 lines)
├── normalizer.py        # Raw Nexar → frontend format       (~40 lines)
└── mock_data.py         # MOCK_DB + _mock_search()          (~30 lines)

schemas/nexar.py         # SearchRequest
constants/nexar_queries.py  # SEARCH_QUERY GraphQL string   (~25 lines)
```

---

### 18.8 DETAILED SPLIT PLAN — `email_service.py` (133 lines → 4 files) 🟡

**Current problem:** Har email function mein 30-40 lines ka inline HTML template.

**Target structure:**

```
services/email/
├── __init__.py          # Re-export public functions
├── sender.py            # _send_email() SMTP logic          (~35 lines)
├── verification.py      # send_verification_email()         (~15 lines)
├── password_reset.py    # send_password_reset_email()       (~15 lines)
└── welcome.py           # send_welcome_email()              (~15 lines)

templates/email/         # (Alternative: HTML files)
├── verification.html
├── password_reset.html
└── welcome.html
```

> **Recommendation:** HTML templates ko `templates/email/` folder mein rakho — Python files chhoti rahengi, designers bhi edit kar sakenge.

---

### 18.9 DETAILED SPLIT PLAN — `payments.py` (100 lines → 3 files) 🟡

**Target structure:**

```
api/v1/payments/
├── __init__.py
├── session.py           # POST /cashfree/create-session     (~40 lines)
└── webhook.py           # POST /cashfree/webhook            (~45 lines)

services/
└── payment_service.py   # Cashfree API calls, signature verify,
                         # webhook event handling (currently empty pass)

schemas/payment.py       # PaymentSessionRequest (currently inline)
```

---

### 18.10 DETAILED SPLIT PLAN — `main.py` (65 lines → 4 files) 🟡

**Target structure:**

```
main.py                  # create_app() only — ~15 lines
core/lifespan.py         # startup indexes + redis init/shutdown (~25 lines)
core/exceptions.py       # validation_exception_handler        (~15 lines)
api/health.py            # GET / and GET /api/health            (~10 lines)
```

---

### 18.11 OPTIONAL SPLITS — Choti Files (Abhi zaroori nahi)

| File | Action | Reason |
|------|--------|--------|
| `circuits.py` (59) | Sirf `schemas/circuit.py` banao | Routes OK size mein hain |
| `websocket.py` (63) | `ConnectionManager` → `services/ws_manager.py` | Class alag ho to testable |
| `parts.py` (58) | Merge into `api/v1/ai/parts.py` | Dono Groq use karte hain |
| `ai.py` (14) | Merge into `api/v1/ai/chat.py` | Already thin |
| `analytics.py` (57) | Mock data → `fixtures/analytics_mock.py` | Optional cleanup |
| `logistics_engine.py` (121) | Rename to `logistics_service.py` only | Single class — split overkill |
| `transactions.py` (37) | **Mat split karo** | Bahut simple CRUD |

---

### 18.12 Final Target Directory (After All Splits)

```
backend/
├── main.py                              # ~15 lines
├── requirements.txt
│
├── api/
│   ├── deps.py                          # Single auth + RBAC dependencies
│   ├── health.py                        # Root + health endpoints
│   ├── router.py                        # Mount all v1 routers
│   └── v1/
│       ├── auth/                        # 6 files (was 1 × 287 lines)
│       │   ├── __init__.py
│       │   ├── signup.py
│       │   ├── login.py
│       │   ├── oauth.py
│       │   ├── verification.py
│       │   ├── password.py
│       │   └── identity.py
│       ├── users/                       # 4 files (was 1 × 126 lines)
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── profile.py
│       │   ├── wishlist.py
│       │   └── addresses.py
│       ├── products/                    # 2 files (was 1 × 98 lines)
│       │   ├── __init__.py
│       │   ├── crud.py
│       │   └── reviews.py
│       ├── orders/                      # 3 files (was 1 × 96 lines)
│       │   ├── __init__.py
│       │   ├── create.py
│       │   ├── query.py
│       │   └── tracking.py
│       ├── payments/                    # 2 files (was 1 × 100 lines)
│       │   ├── __init__.py
│       │   ├── session.py
│       │   └── webhook.py
│       ├── ai/                          # 2 files (merge ai.py + parts.py)
│       │   ├── __init__.py
│       │   ├── chat.py
│       │   └── parts.py
│       ├── transactions.py              # Keep as is (37 lines)
│       ├── analytics.py                 # Keep as is
│       ├── circuits.py                  # Keep (schemas moved out)
│       ├── nexar.py                     # Thin router only (15 lines)
│       └── websocket.py                 # Thin endpoint only
│
├── core/
│   ├── config.py
│   ├── database.py
│   ├── security.py                      # JWT + hash only
│   ├── lifespan.py                      # NEW
│   ├── exceptions.py                    # NEW
│   └── redis_cache.py
│
├── constants/
│   └── nexar_queries.py                 # NEW — GraphQL strings
│
├── schemas/
│   ├── user.py, product.py, order.py, transaction.py, analytics.py
│   ├── auth.py                          # NEW
│   ├── circuit.py                         # NEW
│   ├── nexar.py                           # NEW
│   └── payment.py                         # NEW
│
├── repositories/                          # NEW layer
│   ├── user_repo.py
│   ├── product_repo.py
│   ├── order_repo.py
│   └── circuit_repo.py
│
├── services/
│   ├── auth_service.py                    # NEW
│   ├── user_service.py                    # NEW
│   ├── order_service.py                   # NEW
│   ├── product_service.py                 # NEW
│   ├── payment_service.py                 # NEW
│   ├── notification_service.py            # NEW (fix broken import)
│   ├── ai_service.py
│   ├── sms_service.py
│   ├── logistics_service.py               # Renamed
│   ├── ws_manager.py                      # Optional
│   ├── email/                             # 4 files (was 1 × 133 lines)
│   │   ├── sender.py
│   │   ├── verification.py
│   │   ├── password_reset.py
│   │   └── welcome.py
│   └── nexar/                             # 3 files (was part of nexar.py)
│       ├── client.py
│       ├── normalizer.py
│       └── mock_data.py
│
├── templates/email/                       # HTML email templates
├── fixtures/                              # Mock/static data
├── middleware/
├── tests/
└── scripts/
```

**Before:** 26 production files, 6 files overloaded  
**After:** ~55 focused files, har file 15–45 lines (readable, testable)

---

### 18.13 Split Implementation Order (Recommended)

| Step | Files to Split | New Files Created | Est. Effort |
|------|----------------|-------------------|-------------|
| 1 | `auth.py` | 7 routes + 1 service + 1 schema | 3–4 hrs |
| 2 | `orders.py` + fix notification | 3 routes + 2 services + 1 repo | 2–3 hrs |
| 3 | `users.py` | 4 routes + 1 service | 2 hrs |
| 4 | `email_service.py` | 4 email files + templates | 1–2 hrs |
| 5 | `products.py` | 2 routes + 1 service + 1 repo | 2 hrs |
| 6 | `nexar.py` | 1 thin route + 3 service files | 1–2 hrs |
| 7 | `payments.py` | 2 routes + 1 service + 1 schema | 1–2 hrs |
| 8 | `main.py` | 3 core files + 1 health | 1 hr |
| 9 | Merge `ai.py` + `parts.py` | 2 route files | 30 min |
| 10 | Move `circuits.py` schemas | 1 schema file | 15 min |

**Total:** ~15–18 hours refactoring (bina API contract break kiye)

---

### 18.14 Split Karte Waqt Rules (Important)

1. **API URLs mat badlo** — frontend break na ho. `/api/auth/login` same rahe.
2. **Pehle tests likho** (ya manual test checklist) — split se pehle endpoints verify karo.
3. **Ek baar mein ek file split karo** — auth.py pehle, phir orders, phir users.
4. **Har nayi route file mein sirf HTTP layer** — `db.` direct call mat karo, service use karo.
5. **`__init__.py` se routers combine karo** — `router.py` ko minimal changes.
6. **Commit after each split** — rollback easy rahe.

---

## 19. Summary

**Strengths:**
- FastAPI with clear route organization
- Working integrations (Groq, Nexar, Cashfree, Shiprocket, Gmail, Twilio)
- Redis caching on products
- Rate limiting and logging middleware
- Pydantic schemas for core entities

**Weaknesses:**
- No layered architecture (fat routes)
- Broken notification import
- Duplicate/inconsistent auth
- No authorization (RBAC)
- Scattered configuration
- No tests
- Production security gaps

**File Splitting Verdict:**
- ✅ Analysis **sab 36 Python files** cover karti hai — sirf guess nahi
- ✅ **8 files MUST/SHOULD split** honi chahiye (`auth.py` sabse critical — 287 lines, 9 endpoints)
- ✅ **10 files OK hain** — split mat karo (`transactions.py`, `ai.py`, schemas, etc.)
- ✅ **Section 18** mein har complex file ka exact target structure diya gaya hai
- ⚠️ Pehle wala guide (Sections 11–13) architecture level tha — **Section 18 file-level splitting ke liye primary reference hai**

**Next Step (Recommended Order):**
1. `auth.py` split karo (Section 18.3) — sabse zyada complex
2. `notification_service.py` banao + `orders.py` split (Section 18.5)
3. `users.py` split + `user_service.py` (Section 18.4)
4. Baaki files Section 18.13 ke order mein

---

*Last updated: July 2026 — Added complete file audit (Section 17) and detailed file splitting guide (Section 18).*
