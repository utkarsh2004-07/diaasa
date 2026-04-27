# 🛍️ Luxe Store — Complete Integration & Deployment Guide

---

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Environment Variables](#environment-variables)
3. [Database Setup (MySQL + Docker)](#database-setup)
4. [Razorpay Setup & Webhook](#razorpay)
5. [Shiprocket Setup & Webhook](#shiprocket)
6. [Fast2SMS Setup (OTP)](#fast2sms)
7. [Cloudinary (Image Uploads)](#cloudinary)
8. [Domain & Deployment](#deployment)
9. [Admin Panel](#admin-panel)
10. [Caching System](#caching)
11. [Common Issues](#common-issues)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15+ |
| Language | TypeScript | 5+ |
| Database | MySQL | 8+ |
| ORM | Prisma | 5+ |
| Auth | Mobile OTP via Fast2SMS + JWT | — |
| Payments | Razorpay | — |
| Shipping | Shiprocket | — |
| UI | Tailwind CSS + Framer Motion | — |
| State | Zustand | — |
| Forms | React Hook Form + Zod | — |

---

## Environment Variables

Copy `.env.example` to `.env` and fill all values:

```bash
cp .env.example .env
```

```env
# ── DATABASE ──────────────────────────────
DATABASE_URL="mysql://appuser:apppass@localhost:3306/ecommerce"

# ── NEXT.JS ───────────────────────────────
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_NAME="Luxe Store"

# ── JWT ───────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="generate-a-random-32-char-string-here"
JWT_EXPIRES_IN="30d"

# ── FAST2SMS ──────────────────────────────
FAST2SMS_API_KEY="get-from-fast2sms.com-dashboard"
FAST2SMS_SENDER_ID="LUXEST"

# ── RAZORPAY ──────────────────────────────
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="generate-from-razorpay-dashboard"

# ── SHIPROCKET ────────────────────────────
SHIPROCKET_EMAIL="your-shiprocket-login-email"
SHIPROCKET_PASSWORD="your-shiprocket-password"
SHIPROCKET_PICKUP_LOCATION="Primary"
SHIPROCKET_PICKUP_PINCODE="400001"

# ── OTP SETTINGS ──────────────────────────
OTP_EXPIRY_MINUTES=5
OTP_RESEND_COOLDOWN_SECONDS=30
OTP_MAX_ATTEMPTS=5

# ── SESSION ───────────────────────────────
SESSION_DURATION_DAYS=30
```

---

## Database Setup

### Using Docker (Recommended)

```bash
# Start MySQL with a named volume (data persists after restart/shutdown)
docker run -d \
  --name luxe-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=ecommerce \
  -e MYSQL_USER=appuser \
  -e MYSQL_PASSWORD=apppass \
  -p 3306:3306 \
  -v luxe_mysql_data:/var/lib/mysql \
  mysql:8

# Verify it's running
docker ps
```

> ⚠️ The `-v luxe_mysql_data:/var/lib/mysql` flag is critical.
> Without it, all data is lost when the container is removed.
> With it, data survives `docker stop`, `docker start`, and PC restarts.

### Push Schema & Seed

```bash
# Push all tables to MySQL
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed sample data (categories, products, coupons)
npm run prisma:seed
```

### phpMyAdmin (Optional)

```bash
docker run -d \
  --name phpmyadmin \
  -e PMA_HOST=host.docker.internal \
  -e PMA_PORT=3306 \
  -p 8080:80 \
  phpmyadmin/phpmyadmin

# Access at: http://localhost:8080
# Username: appuser  Password: apppass
```

---

## Razorpay

### 1. Create Account
Go to → https://razorpay.com → Sign up → Complete KYC

### 2. Get API Keys
```
Razorpay Dashboard → Settings → API Keys → Generate Key
```
Copy:
- `Key ID` → `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `Key Secret` → `RAZORPAY_KEY_SECRET`

> Use `rzp_test_` keys for testing, `rzp_live_` for production.

### 3. Setup Webhook

```
Razorpay Dashboard → Settings → Webhooks → Add New Webhook
```

**Webhook URL:**
```
https://yourdomain.com/api/payments/webhook
```

**Secret:** Generate any random string → paste in `RAZORPAY_WEBHOOK_SECRET`

**Events to enable (check these boxes):**
- ✅ `payment.captured`
- ✅ `payment.failed`

**What the webhook does:**
- `payment.captured` → marks order as `CONFIRMED` + `PAID` in DB (backup if user closes browser after payment)
- `payment.failed` → marks order as `FAILED`

### 4. Test Payments

Use these test credentials:
```
Card Number : 4111 1111 1111 1111
Expiry      : Any future date (e.g. 12/26)
CVV         : Any 3 digits (e.g. 123)
OTP         : 1234 (Razorpay test OTP)

UPI         : success@razorpay (always succeeds)
             failure@razorpay (always fails)
```

### 5. Payment Flow in Code

```
User clicks Pay
  → POST /api/orders/create        (creates order in DB + Razorpay order)
  → Razorpay checkout opens
  → User pays
  → Frontend: POST /api/payments/verify  (verifies signature, marks PAID)
  → Razorpay webhook: POST /api/payments/webhook  (backup confirmation)
```

---

## Shiprocket

### 1. Create Account
Go to → https://app.shiprocket.in → Sign up → Complete seller profile

### 2. Add Credentials to .env
```env
SHIPROCKET_EMAIL="email-you-used-to-register@example.com"
SHIPROCKET_PASSWORD="your-shiprocket-password"
```

### 3. Setup Pickup Location

```
Shiprocket Dashboard → Settings → Manage Warehouses → Add Warehouse
```

- Set the warehouse name (default is `Primary`)
- Add your pickup address and pincode

```env
SHIPROCKET_PICKUP_LOCATION="Primary"   # must match warehouse name exactly
SHIPROCKET_PICKUP_PINCODE="400001"     # your warehouse pincode
```

### 4. Setup Webhook (Track shipment status updates)

```
Shiprocket Dashboard → Settings → API → Webhooks
```

**Webhook URL:**
```
https://yourdomain.com/api/shiprocket/webhook
```

> ⚠️ Note: The Shiprocket webhook route (`/api/shiprocket/webhook`) needs to be created if you want automatic status updates. Currently the app uses manual status updates from admin panel.

**Events to enable:**
- ✅ Shipment Picked Up
- ✅ Shipment Out for Delivery
- ✅ Shipment Delivered
- ✅ Shipment RTO (Return to Origin)

### 5. How Shipping Works in Admin

```
Admin Panel → Orders → Click any order → "Ship via Shiprocket" button

This automatically:
  1. Creates order on Shiprocket
  2. Assigns best courier (AWB number)
  3. Generates pickup request
  4. Updates order status to SHIPPED
  5. Sends shipping email to customer (if email set)
```

### 6. Shiprocket API Token

The token auto-refreshes every 9 days (Shiprocket tokens expire in 10 days).
No manual action needed — handled in `lib/shiprocket.ts`.

---

## Fast2SMS

### 1. Create Account
Go to → https://www.fast2sms.com → Sign up → Verify email

### 2. Get API Key
```
Fast2SMS Dashboard → Dev API → API Key → Copy
```

Paste in `.env`:
```env
FAST2SMS_API_KEY="your-api-key-here"
```

### 3. Add Credits
Fast2SMS is prepaid. Add credits:
```
Fast2SMS Dashboard → Add Credits → Minimum ₹100
```
Each OTP SMS costs approximately ₹0.20–0.30.

### 4. Sender ID (Optional)
Default sender ID is `FSTSMS`. To use custom like `LUXEST`:
```
Fast2SMS Dashboard → Sender ID → Apply for DLT registration
```
> DLT registration is required by TRAI for transactional SMS in India.
> Takes 2–7 days. Until then, use default sender ID.

### 5. OTP Flow
```
User enters phone
  → POST /api/auth/send-otp    (generates OTP, sends via Fast2SMS)
  → OTP valid for 5 minutes
  → Max 5 attempts
  → 30 second resend cooldown

User enters OTP
  → POST /api/auth/verify-otp  (verifies OTP, creates session, merges guest cart)
  → JWT stored in httpOnly cookie (30 days)
```

---

## Cloudinary

Used for product image hosting (recommended over local uploads).

### 1. Create Account
Go to → https://cloudinary.com → Sign up (free tier: 25GB storage)

### 2. Upload Images
```
Cloudinary Dashboard → Media Library → Upload
```

Copy the image URL and paste it in:
```
Admin Panel → Products → Add/Edit Product → Product Images → Paste URL
```

### 3. URL Format
```
https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v123456/product.jpg
```

> No `.env` changes needed — you just paste Cloudinary URLs directly into the admin panel.

---

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Using PM2 (Keep app running after SSH disconnect)

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start npm --name "luxe-store" -- start

# Auto-start on server reboot
pm2 startup
pm2 save

# View logs
pm2 logs luxe-store

# Restart
pm2 restart luxe-store
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL with Certbot (Free HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Environment Variables on Server

```bash
# On your KVM server, set production values
nano /path/to/project/.env

# Change these for production:
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
RAZORPAY_KEY_ID="rzp_live_xxxxxxx"        # live key, not test
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxxxx"
```

---

## Admin Panel

**URL:** `https://yourdomain.com/admin`

### First Time Setup

1. Login with your phone number at `/login`
2. Run this SQL in phpMyAdmin to make yourself admin:
```sql
UPDATE users SET role = 'ADMIN' WHERE phone = 'YOUR_PHONE_NUMBER';
```
3. Logout and login again (new JWT with ADMIN role)
4. Visit `/admin`

### Admin Features

| Section | URL | What you can do |
|---------|-----|----------------|
| Dashboard | `/admin` | Revenue, orders, chart |
| Products | `/admin/products` | Add, edit, delete products |
| Categories | `/admin/categories` | Manage categories |
| Orders | `/admin/orders` | View, update status, ship |
| Users | `/admin/users` | View all customers |
| Reviews | `/admin/reviews` | Approve / reject reviews |
| Coupons | `/admin/coupons` | Create discount codes |
| Banners | `/admin/banners` | Homepage hero banners |
| Social Posts | `/admin/social` | Instagram grid images/videos |
| Pages | `/admin/pages` | Edit static pages (About, Terms etc.) |
| Analytics | `/admin/analytics` | 6-month revenue charts |
| Inventory | `/admin/inventory` | Stock levels |
| Settings | `/admin/settings` | Store name, GST, shipping |

---

## Caching System

The app uses Next.js tag-based caching. Cache is busted automatically when admin makes changes.

| Data | Cache Duration | Auto-busted when |
|------|---------------|-----------------|
| Homepage | 24 hours | Banner / Product / Category / Social post changes |
| Banners API | 24 hours | Admin creates/edits/deletes banner |
| Products API | 24 hours | Admin creates/edits/deletes product |
| Categories | 24 hours | Admin creates/edits/deletes category |
| Social Posts | 24 hours | Admin adds/removes social post |
| Product detail pages | 24 hours | Admin edits that product |
| Admin Dashboard | 60 seconds | Auto-refreshes |

> No manual cache clearing needed. When you save a product in admin, the product listing and homepage update instantly for all users.

---

## Common Issues

### OTP not sending
- Check `FAST2SMS_API_KEY` is correct
- Check Fast2SMS account has credits
- Check phone number format: must be 10 digits starting with 6-9

### Razorpay payment failing
- Make sure you're using test keys (`rzp_test_`) in development
- Switch to live keys (`rzp_live_`) in production after KYC approval
- Webhook secret must match exactly between Razorpay dashboard and `.env`

### Shiprocket "Auth failed"
- Check email and password in `.env` are correct
- Make sure pickup location name matches exactly (case-sensitive)
- Shiprocket token auto-refreshes — if it fails, restart the server

### Database connection error
- Check Docker container is running: `docker ps`
- Check `DATABASE_URL` in `.env` matches Docker credentials
- If container was removed (not just stopped), data may be lost if no volume was used

### Admin page shows "Unauthorized"
- Your JWT still has old `CUSTOMER` role
- Run SQL: `UPDATE users SET role = 'ADMIN' WHERE phone = 'YOUR_PHONE';`
- Logout and login again to get new JWT

### Images not loading
- Make sure image URLs are valid Cloudinary or HTTPS URLs
- Local file uploads go to `public/uploads/` — create this folder if missing:
  ```bash
  mkdir -p public/uploads
  ```

---

## Webhook URLs Summary

When you have a domain, add these webhook URLs to each platform:

| Platform | Where to add | Webhook URL |
|----------|-------------|-------------|
| Razorpay | Dashboard → Settings → Webhooks | `https://yourdomain.com/api/payments/webhook` |
| Shiprocket | Dashboard → Settings → API → Webhooks | `https://yourdomain.com/api/shiprocket/webhook` |

---

## Test Coupons (after seeding)

| Code | Discount | Minimum Order |
|------|----------|--------------|
| `LUXE10` | 10% off | ₹500 |
| `FLAT100` | ₹100 off | ₹999 |

---

## Quick Start Checklist

- [ ] Copy `.env.example` to `.env` and fill all values
- [ ] Start MySQL Docker container with volume
- [ ] Run `npx prisma db push`
- [ ] Run `npx prisma generate`
- [ ] Run `npm run prisma:seed`
- [ ] Run `npm run dev`
- [ ] Set your phone as ADMIN in DB
- [ ] Add Razorpay webhook URL
- [ ] Add Shiprocket pickup location
- [ ] Add Fast2SMS credits
- [ ] Upload product images to Cloudinary
- [ ] Add products from admin panel
- [ ] Switch to Razorpay live keys before going live
- [ ] Setup Nginx + SSL on production server
- [ ] Start app with PM2 on production
