# IoTMart — Product-Level Architecture Blueprint

> **Current State Analysis + Recommended Structure**

---

## 🔴 Current Problems (Jo abhi galat hai)

| Problem | Location | Impact |
|---|---|---|
| Cart state `App.jsx` mein hai (prop drilling) | `App.jsx` L50-83 | Har page ko props pass karne padte hain |
| `CartContext` nahi hai | `src/context/` | Cart sirf App level tak limited |
| `src/pages/` mein flat files aur folders dono | `pages/` | Inconsistency — kuch pages subfolder mein, kuch direct |
| `common/` aur `layout/` components empty hain | `components/common/`, `components/layout/` | Dead folders, purpose nahi |
| `hooks/` bilkul empty hai | `src/hooks/` | Custom hooks nahi — logic components mein ghusaa hua |
| Single `api.js` mein saari API calls | `services/api.js` | 148 lines, scalable nahi |
| Backend mein sab kuch root level pe | `backend/` | `routes_*.py` files flat hain, proper packaging nahi |
| `src/data/products.js` static mock data | `src/data/` | Production mein mock data nahi hona chahiye |
| No `constants/` | anywhere | Magic strings throughout codebase |
| No `types/` or `schemas/` | anywhere | No data contracts |
| `src/assets/` mein sirf 3 files | `assets/` | No organized media structure |
| `.env` backend mein hai, frontend mein nahi | `backend/.env` | Frontend config hardcoded hai |
| `auth/` aur `shop/` pages empty folders | `pages/auth/`, `pages/shop/` | Incomplete page routing intent |

---

## ✅ Recommended Product-Level Structure

### 📁 Frontend (`src/`)

```
src/
│
├── 📁 assets/                        # Static files
│   ├── images/
│   │   ├── products/
│   │   ├── banners/
│   │   └── icons/
│   ├── fonts/
│   └── videos/
│
├── 📁 components/                    # Reusable UI components
│   ├── 📁 common/                    # ← ABHI EMPTY HAI — bharna zaroori
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   │   └── Input.jsx
│   │   ├── Modal/
│   │   │   └── Modal.jsx
│   │   ├── Spinner/
│   │   │   └── Spinner.jsx
│   │   ├── Badge/
│   │   │   └── Badge.jsx
│   │   ├── Table/
│   │   │   └── Table.jsx
│   │   └── EmptyState/
│   │       └── EmptyState.jsx
│   │
│   ├── 📁 layout/                    # ← ABHI EMPTY HAI
│   │   ├── PageWrapper.jsx           # Consistent page padding/max-width
│   │   ├── Section.jsx               # Section containers
│   │   └── Grid.jsx                  # Responsive grid system
│   │
│   ├── 📁 ui/                        # Feature-specific UI components
│   │   ├── ProductCard/
│   │   │   ├── ProductCard.jsx       # Abhi root mein hai → move here
│   │   │   └── ProductCardSkeleton.jsx
│   │   ├── CartDrawer/               # ← Cart ko Drawer bana dena
│   │   │   └── CartDrawer.jsx
│   │   ├── OrderTimeline/
│   │   │   └── OrderTimeline.jsx     # Abhi root mein hai → move here
│   │   └── ReviewCard/
│   │       └── ReviewCard.jsx
│   │
│   ├── 📁 navigation/
│   │   ├── Navbar.jsx                # Abhi root mein hai → move here
│   │   └── Footer.jsx                # Abhi root mein hai → move here
│   │
│   ├── 📁 admin/
│   │   └── AdminSidebar.jsx          # Already here ✅
│   │
│   ├── 📁 lab/
│   │   ├── IoTLabCanvas.jsx          # Already here ✅
│   │   ├── CodeEditorPanel.jsx       # Already here ✅
│   │   ├── CustomComponentModal.jsx  # Already here ✅
│   │   ├── LabSettingsModal.jsx      # Already here ✅
│   │   └── NexarSearch.jsx           # Already here ✅
│   │
│   └── 📁 feedback/                  # Toast, alerts, notifications
│       ├── Toast.jsx                 # Abhi root mein hai → move here
│       ├── ChatSupport.jsx           # Abhi root mein hai → move here
│       └── Newsletter.jsx            # Abhi root mein hai → move here
│
├── 📁 context/                       # Global state (React Context)
│   ├── AuthContext.jsx               # Already here ✅
│   ├── CartContext.jsx               # ← MISSING — SABSE ZAROORI
│   ├── ComparisonContext.jsx         # Already here ✅
│   ├── WishlistContext.jsx           # ← MISSING
│   └── ThemeContext.jsx              # ← OPTIONAL but good to have
│
├── 📁 hooks/                         # ← ABHI EMPTY — custom hooks zaroori
│   ├── useCart.js                    # Cart operations
│   ├── useAuth.js                    # Auth state helper
│   ├── useProducts.js                # Product fetching with loading/error
│   ├── useOrders.js                  # Order management
│   ├── useWishlist.js                # Wishlist operations
│   ├── usePagination.js              # Generic pagination logic
│   ├── useDebounce.js                # Search debouncing
│   ├── useLocalStorage.js            # LocalStorage wrapper
│   └── useWebSocket.js               # WS connection management
│
├── 📁 services/                      # API layer — SPLIT KRO
│   ├── api.client.js                 # Axios instance + interceptors only
│   ├── auth.service.js               # login, signup, refresh token
│   ├── product.service.js            # CRUD products, reviews
│   ├── order.service.js              # place, track, update orders
│   ├── user.service.js               # profile, wishlist, addresses
│   ├── analytics.service.js          # dashboard stats
│   ├── ai.service.js                 # chat, part generation
│   └── nexar.service.js              # Nexar component search
│
├── 📁 pages/                         # Route-level page components
│   ├── 📁 public/                    # No auth required
│   │   ├── Home.jsx
│   │   ├── Shop.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── FAQ.jsx
│   │   └── Legal.jsx
│   │
│   ├── 📁 auth/                      # ← ABHI EMPTY
│   │   ├── Login.jsx                 # Abhi pages/ mein hai → move here
│   │   ├── Register.jsx              # Banana hai
│   │   └── ForgotPassword.jsx        # Banana hai
│   │
│   ├── 📁 shop/                      # ← ABHI EMPTY
│   │   ├── Cart.jsx                  # Abhi pages/ mein hai → move here
│   │   ├── Checkout.jsx              # Abhi pages/ mein hai → move here
│   │   ├── Compare.jsx               # Abhi pages/ mein hai → move here
│   │   └── TrackOrder.jsx            # Abhi pages/ mein hai → move here
│   │
│   ├── 📁 user/                      # Auth required (user role)
│   │   ├── UserProfile.jsx           # Already here ✅
│   │   ├── UserOrders.jsx            # Banana hai
│   │   ├── UserWishlist.jsx          # Banana hai
│   │   └── UserAddresses.jsx         # Banana hai
│   │
│   ├── 📁 admin/                     # Auth required (admin role)
│   │   ├── AdminDashboard.jsx        # Already here ✅
│   │   ├── AdminProducts.jsx         # Already here ✅
│   │   ├── AdminOrders.jsx           # Already here ✅
│   │   ├── AdminUsers.jsx            # Already here ✅
│   │   └── AdminIoT.jsx              # Already here ✅
│   │
│   ├── 📁 lab/                       # IoT Lab
│   │   └── IoTLab.jsx                # Abhi pages/ mein hai → move here
│   │
│   ├── 📁 support/
│   │   └── Support.jsx               # Abhi pages/ mein hai → move here
│   │
│   └── DeviceDashboard.jsx           # User device monitoring
│
├── 📁 layouts/                       # Route layout wrappers
│   ├── UserLayout.jsx                # Already here ✅
│   ├── AdminLayout.jsx               # Already here ✅
│   └── AuthLayout.jsx                # ← MISSING (Login page ke liye)
│
├── 📁 routes/                        # ← NEW — routing logic separate kro
│   ├── index.jsx                     # All routes defined here
│   ├── ProtectedRoute.jsx            # Auth guard component
│   └── AdminRoute.jsx                # Admin-only guard component
│
├── 📁 store/                         # ← OPTIONAL: Zustand/Redux (future)
│   └── README.md                     # Placeholder for state management
│
├── 📁 constants/                     # ← MISSING — magic strings yahan
│   ├── routes.js                     # Route path constants
│   ├── api.js                        # API endpoint constants
│   ├── config.js                     # App configuration
│   └── roles.js                      # USER, ADMIN role constants
│
├── 📁 utils/                         # Helper functions
│   ├── arduinoInterpreter.js         # Already here ✅
│   ├── circuitComponents.js          # Already here ✅
│   ├── generateInvoice.js            # Already here ✅
│   ├── simulationEngine.js           # Already here ✅
│   ├── formatters.js                 # ← MISSING: currency, date, number
│   ├── validators.js                 # ← MISSING: form validation
│   └── errorHandler.js              # ← MISSING: consistent error handling
│
├── 📁 data/                          # Static/seed data
│   └── products.js                   # Already here (mock — remove in prod)
│
├── 📁 styles/                        # ← NEW — global styles organize kro
│   ├── globals.css                   # index.css yahan move karo
│   ├── variables.css                 # CSS custom properties
│   ├── animations.css                # Reusable keyframes
│   └── components.css                # Shared component styles
│
├── App.jsx                           # Only routes — cart logic context mein
├── main.jsx                          # React root
└── vite.config.js                    # Already in root ✅
```

---

### 📁 Backend (`backend/`)

```
backend/
│
├── 📁 api/                           # ← ALL ROUTES YAHAN MOVE KRO
│   ├── __init__.py
│   ├── 📁 v1/                        # API versioning
│   │   ├── __init__.py
│   │   ├── auth.py                   # routes_auth.py → yahan
│   │   ├── products.py               # routes_products.py → yahan
│   │   ├── orders.py                 # routes_orders.py → yahan
│   │   ├── users.py                  # routes_users.py → yahan
│   │   ├── analytics.py              # routes_analytics.py → yahan
│   │   ├── ai.py                     # routes_ai.py → yahan
│   │   ├── circuits.py               # routes_circuits.py → yahan
│   │   ├── nexar.py                  # routes_nexar.py → yahan
│   │   ├── parts.py                  # routes_part_gen.py → yahan
│   │   └── websocket.py              # routes_ws.py → yahan
│   └── router.py                     # All routers include karo yahan
│
├── 📁 core/                          # Core configuration
│   ├── __init__.py
│   ├── config.py                     # .env variables load karo
│   ├── security.py                   # JWT, password hashing
│   ├── database.py                   # database.py → yahan move karo
│   └── dependencies.py               # Common FastAPI dependencies
│
├── 📁 models/                        # Database models
│   ├── __init__.py
│   └── models.py                     # models.py → yahan move karo
│
├── 📁 schemas/                       # ← MISSING — Pydantic schemas
│   ├── __init__.py
│   ├── auth.py                       # LoginRequest, SignupRequest
│   ├── product.py                    # ProductCreate, ProductResponse
│   ├── order.py                      # OrderCreate, OrderResponse
│   └── user.py                       # UserCreate, UserResponse
│
├── 📁 services/                      # Business logic layer
│   ├── __init__.py
│   ├── logistics_engine.py           # Already here ✅
│   ├── notification_engine.py        # Already here ✅
│   ├── ai_service.py                 # AI logic separate karo
│   └── email_service.py              # ← MISSING: email notifications
│
├── 📁 middleware/                    # ← MISSING
│   ├── __init__.py
│   ├── auth_middleware.py            # JWT validation
│   └── logging_middleware.py         # Request/response logging
│
├── 📁 scripts/                       # One-off scripts
│   ├── seed.py                       # seed.py → yahan
│   ├── seed_demo_users.py            # → yahan
│   ├── check_db.py                   # → yahan
│   ├── debug_prices.py               # → yahan
│   └── scrape_quartz.py              # → yahan
│
├── 📁 tests/                         # ← MISSING — unit tests
│   ├── test_auth.py
│   ├── test_products.py
│   └── test_orders.py
│
├── main.py                           # FastAPI app entry point ✅
├── requirements.txt                  # Already here ✅
└── .env                              # Already here ✅
```

---

## 🎯 Priority Fix List (Kya Pehle Karna Chahiye)

### 🔥 P0 — Critical (Ye nahi kiya toh project scale nahi hoga)

1. **`CartContext.jsx` banao** — Cart logic `App.jsx` se context mein le jao
   - `src/context/CartContext.jsx`
   - `useCart.js` hook banao
   - `App.jsx` se `cartItems`, `handleAddToCart`, etc. hato

2. **API Services split karo** — ek file mein sab kuch nahi hona chahiye
   - `api.client.js` → only axios instance
   - `product.service.js`, `order.service.js`, etc.

3. **`ProtectedRoute.jsx` aur `AdminRoute.jsx` banao**
   - Abhi `AdminLayout` mein hard auth check nahi hai (verify karo)
   - `src/routes/ProtectedRoute.jsx`

4. **`constants/routes.js` banao**
   - Route paths magic strings hain `/shop`, `/cart`, etc.

### ⚡ P1 — High Priority

5. **`hooks/` bhar do** — Logic components se nikalo
   - `useProducts.js`, `useOrders.js`, `useDebounce.js`

6. **Pages reorganize karo** — Flat files ko proper subfolders mein dalo
   - `Login.jsx` → `pages/auth/Login.jsx`
   - `Cart.jsx`, `Checkout.jsx` → `pages/shop/`

7. **`common/` components banao** — Button, Input, Modal, Spinner
   - Har page apna button banata hai — wasteful

8. **Backend: `schemas/` folder banao** — Pydantic models routes mein inline hain

### 📦 P2 — Medium Priority

9. **`utils/formatters.js`** — Currency, date formatting everywhere alag hai
10. **`AuthLayout.jsx`** — Login page ke liye dedicated layout
11. **Backend API versioning** — `/api/v1/` prefix (future-proof)
12. **`WishlistContext.jsx`** — Wishlist bhi context mein chahiye

### 🎨 P3 — Nice to Have

13. **`styles/` folder** — CSS files organize karo
14. **`tests/`** — Backend unit tests
15. **`email_service.py`** — Order confirmation emails

---

## 📊 Current vs Recommended — Quick Comparison

| Area | Current | Recommended |
|---|---|---|
| Cart State | `App.jsx` (prop drilling) | `CartContext` + `useCart` hook |
| API Layer | 1 file (148 lines) | 7 service files (domain-split) |
| Routes | Inline in `App.jsx` | `src/routes/index.jsx` |
| Auth Guard | Basic | `ProtectedRoute` + `AdminRoute` |
| Common UI | None | `Button`, `Input`, `Modal`, `Spinner` |
| Custom Hooks | 0 hooks | 8+ domain hooks |
| Backend Routes | Flat `routes_*.py` | `api/v1/` organized |
| Schemas | Inline in routes | Separate `schemas/` folder |
| Constants | Magic strings | `constants/` folder |
| Error Handling | Per-component try/catch | `errorHandler.js` utility |

---

## 🗺️ Migration Order (Refactor Plan)

```
Week 1: Foundation
  └── CartContext → hooks → api split → constants

Week 2: Components
  └── common/ components → pages reorganize → ProtectedRoute

Week 3: Backend
  └── schemas/ → api/v1/ → middleware

Week 4: Polish
  └── tests → styles → email service
```

---

> 💡 **Tip**: Pehle `CartContext` aur API split karo — ye do cheezein baaki saari cheezon ko unblock karti hain.
