# Clean Product Structure Plan

## Summary
Project ko production-ready banane ke liye clean structure ko 4 layers me organize karo: `frontend`, `backend`, `shared documentation`, aur `deployment/devops`. Roles ke hisaab se app me 3 main areas rahenge: public/customer, authenticated user, aur admin.

## Recommended Root Structure

```txt
iot-ecommerce/
├── README.md
├── PRODUCT_READINESS_PLAN.md
├── PROJECT_ARCHITECTURE.md
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
├── index.html
├── .gitignore
├── .env.example
├── public/
├── src/
├── backend/
└── docs/
```

Remove or archive these root utility files if not actively needed:
`move_and_fix.py`, `theme_replacer.py`, `unround.py`, `refactor_profile.js`.

## Frontend Structure

```txt
src/
├── main.jsx
├── App.jsx
├── index.css
├── assets/
│   ├── images/
│   ├── icons/
│   └── logos/
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── Table.jsx
│   │   ├── Badge.jsx
│   │   ├── Spinner.jsx
│   │   ├── Skeleton.jsx
│   │   ├── EmptyState.jsx
│   │   └── index.js
│   ├── layout/
│   │   ├── PageWrapper.jsx
│   │   ├── Section.jsx
│   │   ├── Grid.jsx
│   │   └── index.js
│   ├── navigation/
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   ├── feedback/
│   │   ├── Toast.jsx
│   │   ├── ChatSupport.jsx
│   │   └── Newsletter.jsx
│   ├── product/
│   │   ├── ProductCard.jsx
│   │   ├── ProductFilters.jsx
│   │   ├── ProductSearch.jsx
│   │   └── ProductReviews.jsx
│   ├── cart/
│   │   ├── CartItem.jsx
│   │   ├── CartSummary.jsx
│   │   └── PromoCode.jsx
│   ├── checkout/
│   │   ├── AddressSelector.jsx
│   │   ├── PaymentSelector.jsx
│   │   └── OrderSummary.jsx
│   ├── profile/
│   ├── admin/
│   ├── dashboard/
│   └── lab/
├── context/
│   ├── AuthContext.jsx
│   ├── CartContext.jsx
│   ├── WishlistContext.jsx
│   └── ComparisonContext.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useCart.js
│   ├── useProducts.js
│   ├── useOrders.js
│   ├── useWishlist.js
│   ├── useDebounce.js
│   └── useApiError.js
├── layouts/
│   ├── PublicLayout.jsx
│   ├── UserLayout.jsx
│   ├── AdminLayout.jsx
│   └── AuthLayout.jsx
├── pages/
│   ├── public/
│   │   ├── Home.jsx
│   │   ├── Shop.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── FAQ.jsx
│   │   └── Legal.jsx
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── VerifyEmail.jsx
│   │   └── ResetPassword.jsx
│   ├── shop/
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── Compare.jsx
│   │   └── TrackOrder.jsx
│   ├── user/
│   │   ├── UserProfile.jsx
│   │   ├── UserOrders.jsx
│   │   ├── UserAddresses.jsx
│   │   ├── UserWishlist.jsx
│   │   └── UserDevices.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminProducts.jsx
│   │   ├── AdminOrders.jsx
│   │   ├── AdminUsers.jsx
│   │   ├── AdminPayments.jsx
│   │   ├── AdminCoupons.jsx
│   │   ├── AdminReviews.jsx
│   │   ├── AdminSettings.jsx
│   │   └── AdminIoT.jsx
│   ├── lab/
│   │   └── IoTLab.jsx
│   └── support/
│       └── Support.jsx
├── routes/
│   ├── AppRoutes.jsx
│   ├── ProtectedRoute.jsx
│   └── AdminRoute.jsx
├── services/
│   ├── api.client.js
│   ├── auth.service.js
│   ├── product.service.js
│   ├── order.service.js
│   ├── payment.service.js
│   ├── user.service.js
│   ├── analytics.service.js
│   ├── device.service.js
│   ├── ai.service.js
│   └── nexar.service.js
├── constants/
│   ├── routes.js
│   ├── roles.js
│   ├── orderStatus.js
│   ├── paymentStatus.js
│   └── config.js
├── utils/
│   ├── formatters.js
│   ├── validators.js
│   ├── errorHandler.js
│   ├── generateInvoice.js
│   ├── arduinoInterpreter.js
│   ├── simulationEngine.js
│   └── circuitComponents.js
└── data/
    └── demoProducts.js
```

## Backend Structure

```txt
backend/
├── main.py
├── requirements.txt
├── .env.example
├── api/
│   ├── router.py
│   ├── deps.py
│   └── v1/
│       ├── auth.py
│       ├── users.py
│       ├── products.py
│       ├── orders.py
│       ├── payments.py
│       ├── transactions.py
│       ├── analytics.py
│       ├── devices.py
│       ├── circuits.py
│       ├── ai.py
│       ├── nexar.py
│       └── websocket.py
├── core/
│   ├── config.py
│   ├── database.py
│   ├── security.py
│   ├── logger.py
│   └── redis_cache.py
├── schemas/
│   ├── auth.py
│   ├── user.py
│   ├── product.py
│   ├── order.py
│   ├── payment.py
│   ├── transaction.py
│   ├── analytics.py
│   ├── device.py
│   └── circuit.py
├── repositories/
│   ├── user_repo.py
│   ├── product_repo.py
│   ├── order_repo.py
│   ├── transaction_repo.py
│   ├── device_repo.py
│   └── circuit_repo.py
├── services/
│   ├── auth_service.py
│   ├── user_service.py
│   ├── product_service.py
│   ├── order_service.py
│   ├── payment_service.py
│   ├── notification_service.py
│   ├── email_service.py
│   ├── sms_service.py
│   ├── logistics_engine.py
│   ├── device_service.py
│   ├── ai_service.py
│   └── nexar_service.py
├── middleware/
│   ├── auth_middleware.py
│   ├── logging_middleware.py
│   └── rate_limit_middleware.py
├── models/
│   └── __init__.py
├── scripts/
│   ├── seed.py
│   ├── migrate.py
│   └── check_db.py
└── tests/
    ├── test_auth.py
    ├── test_users.py
    ├── test_products.py
    ├── test_orders.py
    ├── test_payments.py
    └── test_admin_permissions.py
```

## Role-Based Pages Needed

- **Public role**
  - Home
  - Shop
  - Product detail
  - Compare
  - About
  - Contact
  - FAQ
  - Privacy/Terms
  - Login/Signup/Forgot password

- **User role**
  - Profile
  - Orders
  - Addresses
  - Wishlist
  - Cart
  - Checkout
  - Track order
  - Device dashboard
  - Support tickets

- **Admin role**
  - Dashboard
  - Product management
  - Order management
  - User management
  - Payment/refund management
  - Coupon/promo management
  - Review moderation
  - IoT/device management
  - Settings/audit logs

## Must-Have Docs

```txt
docs/
├── PRODUCT_READINESS_PLAN.md
├── API_CONTRACTS.md
├── DATABASE_SCHEMA.md
├── ENVIRONMENT_VARIABLES.md
├── DEPLOYMENT_GUIDE.md
├── SECURITY_CHECKLIST.md
├── PAYMENT_FLOW.md
├── ORDER_FLOW.md
├── ADMIN_GUIDE.md
└── TESTING_STRATEGY.md
```

## Cleanup Defaults
- Keep `src/data/products.js` only as demo/seed data, not production source.
- Remove hardcoded secrets, demo credentials, mock AWS keys, sandbox-only labels, and localhost-only URLs.
- Keep frontend business logic in `services`, `hooks`, and `context`; keep pages thin.
- Keep backend route files small; move business rules into `services`.
- Use schemas for every request/response that crosses API boundaries.
