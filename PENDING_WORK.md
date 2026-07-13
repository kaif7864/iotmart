# IoTMart — Production Readiness Checklist
> Last Updated: July 13, 2026
> Status: Pre-Production | Estimated Completion: ~60-70% Done

---

## 🔴 CRITICAL — Must Fix Before Launch

### 1. Google Login Bug (72-byte Error) — ACTIVE BUG
- **Issue:** `Error: Invalid Google token: password cannot be longer than 72 bytes` still appearing on Render production despite local fix.
- **Fix Needed:**
  - [ ] Confirm Render redeploy picked up latest `auth.py` with hardcoded bcrypt hash instead of `get_password_hash()`
  - [ ] Verify latest commit is deployed on Render dashboard

### 2. Shiprocket Credentials Missing
- **Issue:** Logistics runs in MOCK mode. Every order gets fake AWB. Live tracking never works.
- **Fix Needed:**
  - [ ] Add real Shiprocket email+password to backend `.env`
  - [ ] Add same to Render environment variables
  - [ ] Test: place order → real AWB → track shipment

### 3. Analytics Dashboard — Hardcoded Mock Data
- **File:** `backend/api/v1/analytics.py`
- **Issue:** `revenue_data` and `top_selling` are 100% fake/hardcoded. Real orders are not reflected.
- **Fix Needed:**
  - [x] Group orders by `created_at` date to build real daily revenue chart
  - [x] Aggregate `items.product_id` counts to find real top-selling products
  - [x] Fix naming mismatch: backend returns `totalRevenue` but AdminDashboard reads `total_revenue`

### 4. WhatsApp Notifications — Mock Only
- **File:** `backend/services/notification_service.py`
- **Issue:** `send_whatsapp_alert()` only does `print()` — no real message is sent.
- **Fix Needed:**
  - [x] Integrate Twilio WhatsApp (credentials in `.env`)
  - [x] Fetch actual user phone from DB instead of hardcoded `+919876543210`

### 5. Order Refund — No Backend Endpoint
- **Issue:** Admin UI has refund button but `PUT /api/orders/{id}/refund` does NOT exist.
- **Fix Needed:**
  - [x] Create refund endpoint in `orders.py`
  - [x] Call Cashfree Refund API
  - [x] Set order status to `"Refunded"` in DB
  - [x] Send refund confirmation email to user

---

## 🟡 HIGH PRIORITY — Good UX

### 6. Cashfree — Still in Sandbox Mode
- **Files:** `backend/services/payment_service.py`, `src/pages/shop/Checkout.jsx`
- **Fix Needed:**
  - [x] Switch payment service URL to `https://api.cashfree.com/pg/orders`
  - [x] Switch SDK mode to `"production"` in Checkout.jsx
  - [x] Replace sandbox App ID/Secret with live Cashfree credentials (User Action required in .env)

### 7. Email Verification — FRONTEND_URL Mismatch
- **Issue:** `.env` has `FRONTEND_URL=https://iotmart-5uop.onrender.com` (backend URL) but Vercel frontend is at `https://iotmart.vercel.app`. Verification email links are broken.
- **Fix Needed:**
  - [ ] Update `FRONTEND_URL` in Render env vars to `https://iotmart.vercel.app`
  - [ ] Test full flow: Signup → Email → Click link → `/verify-email?token=...` → Works

### 8. Mobile OTP — No Phone Format Validation
- **Issue:** Missing `+91` prefix causes Twilio to fail silently on Indian numbers.
- **Fix Needed:**
  - [x] Add `+91` prefix handling in `send-verification` endpoint

### 9. Product Image Upload — URL Only, No Upload
- **File:** `src/pages/admin/AdminProducts.jsx`
- **Issue:** Admin must paste an external image URL. No file upload functionality.
- **Fix Needed:**
  - [x] Add Cloudinary or S3 upload in admin product form

### 10. Stock Not Decremented When Order is Placed
- **File:** `backend/api/v1/orders.py`
- **Issue:** `stockQuantity` is never decremented. Products can be ordered at 0 stock.
- **Fix Needed:**
  - [x] Decrement `stockQuantity` via MongoDB `$inc` for each item on order creation
  - [x] Reject order if `stockQuantity < requested_quantity`
  - [x] Restore stock when order is Cancelled or Refunded

### 11. 404 Page Missing
- **File:** `src/App.jsx` Line 111
- **Issue:** Unknown routes redirect to `/` instead of showing a 404 page.
- **Fix Needed:**
  - [x] Create `src/pages/public/NotFound.jsx`
  - [x] Replace `<Navigate to="/" replace />` with `<NotFound />` for `path="*"`

### 12. Admin Time Filter — Decorative Only
- **File:** `src/pages/admin/AdminDashboard.jsx`
- **Issue:** (24H / 7D / 30D / ALL) buttons exist but don't change chart data.
- **Fix Needed:**
  - [x] Add `?range=7D|30D|ALL` query param to `/api/analytics/dashboard`
  - [x] Backend filters orders by `created_at` and returns grouped real revenue
  - [x] Frontend sends `activeRange` when fetching

---

## 🟠 MEDIUM PRIORITY — Polish

### 13. Invoice PDF — Untested
- **File:** `src/utils/generateInvoice.js`
- **Fix Needed:**
  - [x] Test on Chrome, Firefox, Safari
  - [x] Confirm INR pricing shows correctly (not USD-multiplied) (Used safeSymbol)
  - [x] Add GST number + company address

### 14. ChatSupport — Commented Out
- **File:** `src/App.jsx` Line 115
- **Fix Needed:**
  - [x] Integrate with live chat (Crisp/Tawk.to) OR remove component entirely

### 15. Low Stock Alert Missing in Admin
- **Issue:** Backend calculates `lowStockCount` but Admin UI shows no warning per product.
- **Fix Needed:**
  - [x] Add red badge/warning in AdminProducts.jsx for `stockQuantity < 5`

### 16. Email Provider — Gmail SMTP Unreliable
- **Issue:** `BREVO_API_KEY` is in `.env` but unused. Gmail App Passwords can expire.
- **Fix Needed:**
  - [x] Migrate all transactional emails to Brevo API (Done, also removed legacy `smtplib` imports)

### 17. Recently Viewed — localStorage Only
- **Issue:** Resets on browser data clear. Not synced to backend/account.
- **Fix Needed (Optional):**
  - [x] Sync to MongoDB `users.recently_viewed` field via API

### 18. SEO Meta Tags Missing
- **Issue:** No dynamic `<title>` or `<meta>` tags for products.
- **Fix Needed:**
  - [x] Add `<SEO title="..." description="..." />` to every page
  - [x] ProductDetail: `${product.name} | IoTMart`

### 19. CORS — Add Custom Domain
- **Fix Needed:**
  - [x] Add `iotmart.vercel.app` (or custom domain) to `CORS_ORIGINS` in `backend/main.py`

---

## 🟢 NICE TO HAVE — Future

### 20. Promo Codes — Not Backend-Validated
- Anyone can manipulate discount in React DevTools. Backend never validates codes.
- [ ] Create `POST /api/promos/validate` endpoint

### 21. Comparison List — Resets on Refresh
- [ ] Persist to `localStorage`

### 22. IoT Device Dashboard — Simulated Data
- [ ] Integrate real MQTT broker (HiveMQ / Mosquitto)

### 23. Nexar API — Monitor Free Tier Limits
- [ ] Add error handling when quota is exceeded

### 24. Admin Category Management
- [ ] Add predefined category dropdown in product form

### 25. Dev Cleanup
- [ ] Delete: `PLAN.md`, `PLAN2.md`, `move_and_fix.py`, `theme_replacer.py`, `refactor_profile.js`, `unround.py`

---

## 📋 DEPLOYMENT CHECKLIST

| Step | Status |
|------|--------|
| MongoDB Atlas — Production cluster | ❓ Check free tier limits |
| Redis — Upstash | ✅ Connected |
| Cashfree — Switch to LIVE mode | ❌ Still Sandbox |
| Shiprocket — Real credentials | ❌ Mock Mode |
| Email — Gmail SMTP | ⚠️ Should migrate to Brevo |
| Google OAuth — Production domain in Google Console | ❓ Verify |
| Backend CORS — Custom domain | ❓ Pending domain purchase |
| FRONTEND_URL in Render env | ❌ Wrong URL currently |
| Render env vars match local .env | ⚠️ Verify all keys |
| Custom domain DNS | ❌ Not purchased |
| SSL certificate | ✅ Auto via Vercel/Render |
| Rate limiting | ✅ Done (slowapi) |
| Error logging | ✅ Done (core/logger.py) |

---

## 📊 FEATURE COMPLETION MATRIX

| Feature | Status |
|---------|--------|
| User Auth (Email/Password) | ✅ Done |
| Google OAuth Login | ⚠️ Bug on Render |
| Email Verification | ⚠️ URL mismatch |
| Mobile OTP Verification | ⚠️ Phone format issue |
| Password Reset | ✅ Done |
| Product Listing + Search + Filter | ✅ Done |
| Product Detail + Reviews | ✅ Done |
| Product Comparison | ✅ Done |
| Cart | ✅ Done |
| Promo Codes | ✅ Done (Backend Validated) |
| Checkout Flow | ✅ Done |
| Cashfree Payment | ⚠️ Sandbox Only |
| COD Payment | ✅ Done |
| Order Placement | ✅ Done |
| Order Cancellation | ✅ Done |
| Order Tracking (Shiprocket) | ⚠️ Mock Mode |
| Order History + Invoice PDF | ✅ Done |
| Order Refund | ❌ Missing Backend |
| Stock Decrement on Order | ❌ Not Implemented |
| User Profile Management | ✅ Done |
| Address Book | ✅ Done |
| Wishlist | ✅ Done |
| Admin Dashboard | ⚠️ Charts Hardcoded |
| Admin Products CRUD | ✅ Done |
| Admin Orders Management | ✅ Done (no refund) |
| Admin Users Management | ✅ Done |
| Email Notifications | ✅ Done |
| WhatsApp Notifications | ❌ Mock Only |
| IoT Device Dashboard | ⚠️ Simulated Data |
| IoTLab Circuit Simulator | ✅ Functional |
| AI Chat Assistant | ✅ Done |
| SEO Meta Tags | ❌ Most Pages Missing |
| 404 Page | ❌ Missing |
