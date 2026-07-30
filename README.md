# 🏠 RentHub — Peer-to-Peer Rental Marketplace

<div align="center">

![RentHub](https://img.shields.io/badge/RentHub-v1.0.0-blue)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)

**Rent Anything, Anytime** — An Airbnb-style marketplace where users can rent everyday gadgets, tools, electronics, cameras, sports equipment, musical instruments, and event accessories from other users.

</div>

---

## 📋 Project Overview

RentHub is a full-stack peer-to-peer rental marketplace built with modern web technologies. It connects item owners with renters, allowing users to:

- **List items** for rent with photos, descriptions, and pricing
- **Browse and search** available rental items by category, location, and price
- **Book items** with date range selection and real-time pricing
- **Manage bookings** — approve/reject for owners, track rentals for renters
- **Manage activity** via a real-time dashboard with live stats

### Features

| Feature | Status |
|---------|--------|
| ✅ Project Setup & UI | Complete |
| ✅ React Frontend with Routing | Complete |
| ✅ Express Backend API | Complete |
| ✅ PostgreSQL + Prisma Configuration | Complete |
| ✅ **User Authentication (JWT)** | **Complete** |
| ✅ **User Roles (Owner / Renter)** | **Complete** |
| ✅ **Profile Management** | **Complete** |
| ✅ **Listing Management** | **Complete** |
| ✅ **Search, Filter, Sort** | **Complete** |
| ✅ **Booking System** | **Complete** |
| ✅ **Stripe Payment Processing** | **Complete** |
| 🔄 Image Uploads (Cloudinary) | Coming Soon |
| ✅ **Reviews & Ratings** | **Complete** |
| ✅ **Notification System (In-App, Email, SMS)** | **Complete** |
| 🔄 Wishlist Functionality | Coming Soon |

---

## 🛠 Tech Stack

### Frontend
- **React 18** — UI library
- **Vite 5** — Build tool and dev server
- **React Router DOM 6** — Client-side routing
- **Tailwind CSS 3** — Utility-first styling
- **Axios** — HTTP client for API calls
- **React Icons** — Icon library
- **React Hot Toast** — Toast notifications

### Backend
- **Node.js** — JavaScript runtime
- **Express 4** — Web framework
- **CORS** — Cross-origin resource sharing
- **dotenv** — Environment variable management
- **bcryptjs** — Password hashing with 12 salt rounds
- **jsonwebtoken** — JWT token generation and verification
- **Multer** — File upload handling (future use)
- **Nodemailer** — Email service (future use)

### Database
- **PostgreSQL** — Relational database
- **Prisma ORM 5** — Database access and migrations

### Authentication System
- **JWT (JSON Web Tokens)** — Stateless auth with configurable expiry
- **bcrypt** — Password hashing with 12 salt rounds
- **Protected Routes** — Frontend route guards redirect to /login
- **Role-Based Access Control** — Owner/Renter roles with different permissions
- **Auto-Login Persistence** — Token stored in localStorage, restored on refresh
- **Auto-Logout** — 401 responses automatically clear session

### Future Integrations
- **Cloudinary** — Image cloud storage
- **Stripe** — Payment processing
- **Twilio** — SMS notifications

---

## 📁 Folder Structure

```
RentHub/
│
├── client/                          # React Frontend
│   ├── public/                      # Static assets
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/                  # Images, fonts, etc.
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Navbar.jsx           # Responsive navigation bar
│   │   │   └── Footer.jsx           # Professional footer
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication state
│   │   ├── hooks/
│   │   │   └── useAuth.js           # Auth hook
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx       # Layout with Navbar + Footer
│   │   ├── pages/                   # Route pages
│   │   │   ├── Home.jsx             # Landing page
│   │   │   ├── Login.jsx            # Login form
│   │   │   ├── Signup.jsx           # Registration form
│   │   │   ├── BrowseListings.jsx   # Browse with filters
│   │   │   ├── ListingDetails.jsx   # Single listing view
│   │   │   ├── CreateListing.jsx    # Create listing form
│   │   │   ├── MyListings.jsx       # User's listings
│   │   │   ├── Wishlist.jsx         # Saved items
│   │   │   ├── Bookings.jsx         # Renter bookings page
│   │   │   ├── BookingDetails.jsx   # Single booking detail view
│   │   │   ├── OwnerBookings.jsx    # Owner booking management
│   │   │   ├── Dashboard.jsx        # User dashboard
│   │   │   ├── Profile.jsx          # User profile
│   │   │   └── NotFound.jsx         # 404 page
│   │   ├── services/                # API service layer
│   │   │   ├── api.js               # Axios instance
│   │   │   ├── authService.js       # Auth API calls
│   │   │   ├── listingService.js    # Listing API calls
│   │   │   └── bookingService.js    # Booking API calls
│   │   ├── utils/
│   │   │   ├── constants.js         # App configuration
│   │   │   └── helpers.js           # Utility functions
│   │   ├── App.jsx                  # Root component with routes
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Tailwind + custom styles
│   ├── index.html                   # HTML entry
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind configuration
│   ├── postcss.config.js            # PostCSS configuration
│   └── package.json                 # Frontend dependencies
│
├── server/                          # Express Backend
│   ├── controllers/
│   │   ├── apiController.js         # Health & info endpoints
│   │   ├── authController.js        # Auth logic (register, login, profile)
│   │   ├── listingController.js     # Listing CRUD with search/filter/sort
│   │   └── bookingController.js     # Booking CRUD with date validation
│   ├── routes/
│   │   ├── api.js                   # Health & info routes
│   │   ├── authRoutes.js            # Auth routes (register, login, etc.)
│   │   ├── listingRoutes.js         # Listing routes
│   │   └── bookingRoutes.js         # Booking routes
│   ├── middleware/
│   │   ├── errorMiddleware.js       # Error handling
│   │   └── authMiddleware.js        # JWT verify + role-based authorize
│   ├── prisma/
│   │   └── schema.prisma            # Database schema
│   ├── config/
│   │   └── index.js                 # Environment config
│   ├── services/                    # Business logic (future)
│   ├── utils/                       # Helper utilities
│   ├── uploads/                     # File uploads (future)
│   ├── server.js                    # Express entry point
│   └── package.json                 # Backend dependencies
│
├── .env.example                     # Environment variables template
├── package.json                     # Root package.json
└── README.md                        # Project documentation
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher
- **PostgreSQL** 14 or higher

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/renthub.git
cd renthub
```

### 2. Install Dependencies

```bash
# Install root dependencies (concurrently)
npm install

# Install all project dependencies
npm run install:all
```

This will install dependencies for both `client/` and `server/` directories.

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example server/.env

# Edit the .env file with your configuration
# Minimum required: DATABASE_URL
```

### 4. Initialize the Database

```bash
cd server

# Initialize Prisma
npx prisma init

# Run migration (when models are defined)
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

---

## 🖥 Running the Application

### Development Mode (both frontend & backend)

```bash
# From the root directory — runs both servers concurrently
npm run dev
```

### Run Frontend Only

```bash
cd client
npm run dev
```

Frontend runs on **http://localhost:3000**

### Run Backend Only

```bash
cd server
npm run dev
```

Backend runs on **http://localhost:5000**

### Verify Backend

```bash
curl http://localhost:5000/
# Response: { "success": true, "message": "RentHub API Running Successfully" }
```

---

## 🔧 Available Scripts

### Frontend (`client/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

### Backend (`server/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon |
| `npm start` | Start production server |
| `npm run prisma:studio` | Open Prisma Studio (DB GUI) |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:generate` | Generate Prisma client |

---

## 🌐 API Routes

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/` | API health check | ✅ |
| GET | `/api` | API status | ✅ |
| GET | `/api/info` | API information | ✅ |

### Authentication Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user (Owner or Renter) | Public |
| POST | `/api/auth/login` | Login with email & password | Public |
| GET | `/api/auth/me` | Get current user profile | Protected |
| PUT | `/api/auth/profile` | Update profile (name, phone, bio, location, image) | Protected |
| POST | `/api/auth/logout` | Logout | Protected |

### Listing Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/listings` | List all with search, filter, sort, pagination | Public |
| GET | `/api/listings/my` | Get current owner's listings | Owner |
| GET | `/api/listings/:id` | Get single listing details | Public |
| POST | `/api/listings` | Create a new listing | Owner |
| PUT | `/api/listings/:id` | Update own listing | Owner |
| DELETE | `/api/listings/:id` | Delete own listing | Owner |

#### Search & Filter Parameters

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search title, description, location |
| `category` | string | Filter by category slug |
| `condition` | string | Filter by condition (NEW, LIKE_NEW, GOOD, FAIR) |
| `minPrice` | number | Minimum daily rate |
| `maxPrice` | number | Maximum daily rate |
| `available` | boolean | Show available only (`true`) |
| `sort` | string | `newest`, `oldest`, `price-low`, `price-high`, `title` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 12, max: 50) |

### Booking Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/bookings` | Create a new booking request | Protected |
| GET | `/api/bookings/my` | Get renter's bookings | Protected |
| GET | `/api/bookings/owner` | Get owner's incoming bookings | Protected (Owner) |
| GET | `/api/bookings/booked-dates/:listingId` | Get booked dates for a listing | Public |
| GET | `/api/bookings/:id` | Get booking details | Protected (owner or renter) |
| PATCH | `/api/bookings/:id/status` | Update booking status | Protected |
| DELETE | `/api/bookings/:id` | Delete a booking | Protected |

#### Booking Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting owner approval |
| `CONFIRMED` | Approved by owner |
| `ACTIVE` | Rental period started |
| `COMPLETED` | Rental period ended, item returned |
| `REJECTED` | Denied by owner |
| `CANCELLED` | Cancelled by renter or owner |

#### Booking Flow

1. **Renter** selects dates on listing page → sees real-time price breakdown
2. Submits booking request → status becomes `PENDING`
3. **Owner** receives request → approves (`CONFIRMED`) or rejects (`REJECTED`)
4. Owner marks as `ACTIVE` when renter picks up item
5. Owner marks as `COMPLETED` when item is returned

#### Price Calculation

| Component | Formula |
|-----------|---------|
| **Subtotal** | Daily Rate × Number of Days |
| **Platform Fee** | 10% of subtotal |
| **Service Fee** | Fixed $5.00 |
| **Security Deposit** | Full deposit from listing |
| **Total** | Subtotal + Platform Fee + Service Fee + Deposit |

#### Date Conflict Detection

The backend prevents double bookings by checking for overlapping dates against all bookings with `PENDING`, `CONFIRMED`, or `ACTIVE` status. Uses PostgreSQL date range overlap: `startDate < :end AND endDate > :start`.

### Payment Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments/create-intent` | Create Stripe PaymentIntent (authorize only) | Protected |
| POST | `/api/payments/confirm` | Confirm payment authorization → booking CONFIRMED | Protected |
| POST | `/api/payments/capture` | Capture authorized payment (owner only) | Protected (Owner) |
| POST | `/api/payments/refund` | Refund a captured payment | Protected |
| GET | `/api/payments/my` | Get current user's payment history | Protected |
| GET | `/api/payments/:id` | Get payment details | Protected |
| POST | `/api/payments/webhook` | Stripe webhook (raw body) | Public (signed) |

### Wishlist Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/wishlist` | Add a listing to wishlist | Protected |
| GET | `/api/wishlist` | Get user's wishlist (supports search, filter, sort) | Protected |
| GET | `/api/wishlist/count` | Get wishlist item count | Protected |
| GET | `/api/wishlist/check/:listingId` | Check if a listing is wishlisted | Protected |
| DELETE | `/api/wishlist/:listingId` | Remove a listing from wishlist | Protected |

#### Wishlist Search & Filter Parameters

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by listing title or location |
| `category` | string | Filter by category slug |
| `available` | boolean | Show available only (`true`) |
| `sort` | string | `newest` (default), `oldest`, `price-low`, `price-high`, `title` |

#### Availability Alerts

When a listing transitions from **unavailable → available** (either via owner update or admin toggle), the system automatically:

1. Queries all users who have wishlisted the listing
2. Sends **in-app notifications** via the existing NotificationService
3. Sends **email notifications** according to user preferences
4. Sends **SMS notifications** if enabled by the user

The availability alert is fired from:
- `listingController.updateListing` — when `isAvailable` changes from `false` to `true`
- `adminController.toggleListingStatus` — when admin enables a disabled listing

```javascript
// Availability Alert Flow
sendAvailabilityAlerts(listingId, listingTitle)
  → find users who have this listing in their wishlist
  → createBulkNotifications([...]) via NotificationService
  → each user gets in-app + email alert: "Item Now Available: {title}"
```

### Identity Verification Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/identity/create-session` | Create a Stripe Identity verification session | Protected |
| GET | `/api/identity/status` | Get current user's verification status | Protected |
| GET | `/api/identity/check-listing/:listingId` | Check if a listing requires identity verification | Protected |
| POST | `/api/identity/webhook` | Stripe Identity webhook (raw body, signature verified) | Public (signed) |

#### High-Value Rules

Identity verification becomes **mandatory** when:
- **Security Deposit** ≥ $500
- **Daily Rate** ≥ $200

Otherwise, identity verification is **optional**.

#### Verification Flow

1. User clicks "Verify Identity" on their Profile page
2. Backend creates a Stripe Identity Verification Session (`document` + `selfie` required)
3. User is redirected to Stripe's hosted verification flow (or opens in new tab)
4. Stripe verifies the user's government-issued ID and selfie
5. Stripe sends a webhook to `/api/identity/webhook`
6. Webhook updates the `IdentityVerification` record status:
   - `identity.verification_session.verified` → Status: `VERIFIED`
   - `identity.verification_session.requires_input` → Status: `FAILED`
   - `identity.verification_session.processing` → Status: `PROCESSING`
7. Booking flow checks verification for high-value items before allowing booking

#### Booking Integration

When a renter attempts to book a high-value listing, the backend (`bookingController.createBooking`) checks:

1. Is the listing high-value (deposit ≥ $500 OR rate ≥ $200)?
2. Does the renter have a `VERIFIED` `IdentityVerification` record?
3. If not, return **403** with a descriptive message: "Identity verification required. Please verify your identity before booking this high-value item."

#### Data Privacy

- **Never stores government documents** — only stores Stripe session/report IDs
- Document type and issuing country are stored as metadata only
- Actual verification happens entirely on Stripe's infrastructure

#### Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_your_key  # Already required for payments
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret  # Same webhook secret used for signature verification
FRONTEND_URL=http://localhost:5173  # Return URL after verification (default)
```

### Notification Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | Get paginated notifications | Protected |
| GET | `/api/notifications/unread` | Get unread count + recent notifications | Protected |
| PATCH | `/api/notifications/:id/read` | Mark notification as read | Protected |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read | Protected |
| DELETE | `/api/notifications/:id` | Delete a notification | Protected |
| GET | `/api/notifications/preferences` | Get notification preferences | Protected |
| PUT | `/api/notifications/preferences` | Update notification preferences | Protected |

#### Notification Types

| Type | Trigger | Channels |
|------|---------|----------|
| `BOOKING_REQUEST` | New booking created → notify owner | In-App, Email, SMS |
| `BOOKING_CONFIRMED` | Owner confirms booking → notify renter | In-App, Email, SMS |
| `BOOKING_REJECTED` | Owner rejects booking → notify renter | In-App, Email, SMS |
| `BOOKING_CANCELLED` | Booking cancelled → notify both parties | In-App, Email, SMS |
| `BOOKING_COMPLETED` | Rental completed → notify renter | In-App, Email |
| `PAYMENT_AUTHORIZED` | Payment authorized → notify renter | In-App, Email |
| `PAYMENT_CAPTURED` | Owner captures payment → notify owner | In-App, Email |
| `PAYMENT_REFUNDED` | Refund issued → notify renter | In-App, Email |
| `REVIEW_RECEIVED` | New review submitted → notify reviewee | In-App, Email |
| `DISPUTE_CREATED` | Dispute raised → notify other party | In-App, Email |
| `DISPUTE_UPDATED` | Dispute status changed → notify creator | In-App, Email |
| `LISTING_DISABLED` | Admin disables listing → notify owner | In-App, Email |
| `SYSTEM` | Admin broadcast or account verified | In-App, Email |

#### Architecture

- **Centralized NotificationService** — All modules (booking, payment, review, dispute, admin) use the same service
- **User Preference Checked** — Before sending, checks per-user channel (in-app/email/SMS) and category (booking/payment/review) preferences
- **Non-Blocking** — Notification failures never crash the calling flow (all wrapped in `.catch(() => {})`)
- **Email** — Nodemailer with Ethereal fallback (no real SMTP needed for development)
- **SMS** — Twilio (falls back gracefully if not configured)
- **Polling** — Frontend NotificationBell polls every 30 seconds for unread count
- **Admin Broadcast** — Admins can send system-wide notifications to all users, owners only, renters only, or verified users only

#### Notification Preferences (Profile Page)

| Preference | Default | Description |
|------------|---------|-------------|
| In-App Notifications | ✅ On | Receive notifications within the app |
| Email Notifications | ✅ On | Receive notifications via email |
| SMS Notifications | ❌ Off | Receive notifications via text message |
| Booking Updates | ✅ On | Booking requests, confirmations, cancellations |
| Payment Updates | ✅ On | Payment authorizations, captures, refunds |
| Review Updates | ✅ On | New reviews and ratings |
| Marketing Emails | ❌ Off | Promotions, tips, and platform updates |

### Insurance / Damage Protection Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/insurance/plans` | List available insurance plans | Public |
| `GET` | `/api/insurance/policy/:bookingId` | Get policy for a booking | Protected |
| `GET` | `/api/insurance/my` | Get current user's insurance history | Protected |

#### How It Works

1. During checkout, renter selects **Standard** ($12, coverage up to $1,000) or **Premium** ($25, coverage up to $3,000) Damage Protection
2. Insurance policy is created when booking is made; premium added to `totalAmount`
3. Policy remains **ACTIVE** throughout the rental period
4. After booking is **COMPLETED**, admin can approve an insurance claim via the admin panel
5. If approved, policy status changes to `CLAIM_APPROVED` and both parties are notified

#### Pluggable Architecture

Insurance logic is centralized in `server/services/insuranceService.js` with a clean interface:
- `getPlans()` — returns available plans
- `purchasePolicy({ bookingId, planId, userId })` — creates policy (non-blocking during booking creation)
- `submitClaim({ policyId, damageAmount, description })` — submits claim
- `getPolicyForBooking(bookingId)` — retrieves policy for a booking

To integrate a real provider (e.g., Cover Genius, Allianz), simply implement the same interface.

#### Admin Insurance Claims

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/insurance-policies` | List all policies (paginated, searchable) |
| `PATCH` | `/api/admin/insurance-policies/:id/approve-claim` | Approve an insurance claim |

#### UI Indicators

| Location | Badge |
|----------|-------|
| Booking Details | **Protected** with coverage amount |
| Owner Bookings | **Protected Booking** badge |
| Renter Bookings | **Protected** badge |
| Dispute Details | **Covered** badge when policy exists |
| Profile | **Insurance History** section listing all policies |
| Payment Checkout | Shows insurance badge when policy is selected |
| Listing Details | Insurance radio buttons (Standard/Premium) during booking |

---

### Review Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/reviews` | Create a review (only for COMPLETED bookings) | Protected |
| GET | `/api/reviews/listing/:listingId` | Get reviews for a listing | Public |
| GET | `/api/reviews/user/:userId` | Get reviews received by a user | Public |
| GET | `/api/reviews/my` | Get current user's reviews (written + received) | Protected |
| GET | `/api/reviews/:id` | Get single review details | Protected |
| PUT | `/api/reviews/:id` | Update own review | Protected (author) |
| DELETE | `/api/reviews/:id` | Delete own review | Protected (author) |

#### Review Business Rules

| Rule | Description |
|------|-------------|
| **Booking must be COMPLETED** | Reviews can only be submitted for completed rentals |
| **Participant only** | Reviewer must be either the renter or the owner of the booking |
| **One review per booking** | Each user can submit at most one review per booking |
| **No self-review** | Users cannot review themselves |
| **Rating 1-5** | Rating must be an integer between 1 and 5 |
| **Title 5-100 chars** | Review title must be 5-100 characters |
| **Comment 20-1000 chars** | Review comment must be 20-1000 characters |

#### Rating Calculation

| Metric | Formula |
|--------|---------|
| **Average Rating** | Sum of all ratings ÷ Total number of reviews (rounded to 1 decimal) |
| **Rating Distribution** | Count of reviews at each star level (1-5) |
| **Reputation Score** | Average rating of received reviews |

#### Payment Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | PaymentIntent created, awaiting card entry |
| `AUTHORIZED` | Payment authorized, awaiting capture |
| `CAPTURED` | Payment captured (funds transferred) |
| `REFUNDED` | Payment refunded to renter |
| `FAILED` | Card declined or payment failed |
| `CANCELLED` | Payment cancelled |

#### Payment Flow

1. **Booking Created** → Booking status: `PENDING`
2. **Create Payment Intent** → Stripe authorizes the amount (`capture_method: 'manual'`)
3. **Renter enters card** via Stripe Elements on `/checkout/:bookingId`
4. **Payment Authorized** → Booking becomes `CONFIRMED`, Payment becomes `AUTHORIZED`
5. **Rental Period** → Owner marks booking as `ACTIVE` → `COMPLETED`
6. **Owner Captures Payment** → Payment becomes `CAPTURED` (funds transferred)
7. **Refund** → If needed, owner/renter can trigger refund → Payment becomes `REFUNDED`

#### Webhook Events Handled

| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Update payment to AUTHORIZED, booking to CONFIRMED |
| `payment_intent.payment_failed` | Update payment to FAILED |
| `charge.refunded` | Update payment to REFUNDED |

#### Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Protected Routes (Frontend)

| Route | Access |
|-------|--------|
| `/dashboard` | Authenticated users only |
| `/profile` | Authenticated users only |
| `/bookings` | Authenticated users only |
| `/bookings/:id` | Authenticated users only |
| `/wishlist` | Authenticated users only |
| `/my-listings` | Authenticated users only |
| `/create-listing` | **Owner** role only (Renter gets 403) |
| `/owner/bookings` | **Owner** role only (incoming booking management) |

---

## 🎨 Design System

### Colors

| Token | Color | Hex |
|-------|-------|-----|
| Primary | Blue | `#3b82f6` |
| Secondary | White | `#ffffff` |
| Accent | Orange | `#f97316` |

### Typography
- **Font Family**: Inter (system-ui, sans-serif)
- **Scale**: Tailwind CSS default type scale

### Components
- Rounded cards (rounded-xl, rounded-2xl)
- Soft shadows (shadow-md, shadow-lg)
- Smooth hover animations (transition-all, duration-300)
- Gradient backgrounds for hero sections
- Responsive design (mobile-first approach)

---

## 🔮 Future Enhancements

- [x] **User Authentication** — JWT-based login/registration ✅
- [x] **Listing CRUD** — Full create, read, update, delete for listings ✅
- [x] **Booking System** — Date picker, availability calendar, booking management ✅
- [x] **Stripe Payment Processing** — Payment Intents with manual capture, refunds, webhooks ✅
- [ ] **Image Uploads** — Cloudinary integration for listing photos
- [x] **Reviews & Ratings** — Post-rental review system with average rating, breakdown, and reputation ✅
- [x] **Dispute Resolution** — Full dispute system: create, evidence, admin review workflow ✅
- [ ] **Wishlist Backend** — Save favorite items
- [ ] **Messaging** — In-app chat between renters and owners
- [ ] **Email Notifications** — Nodemailer for booking confirmations
- [ ] **SMS Notifications** — Twilio integration
- [x] **Admin Dashboard** — Complete admin panel: platform analytics, user/listing/booking/payment/review management, search/filter/sort, pagination, CSV export, role+verification gating ✅

### 🔒 Admin Authorization

The admin dashboard requires **both** `role === 'OWNER'` **and** `isVerified === true`.
- Frontend: `<RoleBasedRoute roles={['OWNER']} requireVerified={true} />` redirects unverified users to `/unauthorized` (403 page)
- Backend: `adminOnly` middleware checks both conditions on every API call

### 📄 Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Platform statistics, charts, top owners/rentals |
| GET | `/api/admin/users` | User list with search, filter by role/verification, sort |
| PATCH | `/api/admin/users/:id/verify` | Verify a user |
| PATCH | `/api/admin/users/:id/suspend` | Suspend a user |
| PATCH | `/api/admin/users/:id/reactivate` | Reactivate a user |
| DELETE | `/api/admin/users/:id` | Delete a user |
| GET | `/api/admin/listings` | Listing list with search, filter by availability, sort |
| PATCH | `/api/admin/listings/:id/status` | Toggle listing availability |
| DELETE | `/api/admin/listings/:id` | Delete a listing |
| GET | `/api/admin/bookings` | Booking list with search, filter by status, sort |
| PATCH | `/api/admin/bookings/:id` | Update booking status (force complete/cancel) |
| GET | `/api/admin/payments` | Payment list with search, filter, sort |
| GET | `/api/admin/reviews` | Review list with search, filter by rating, sort |
| DELETE | `/api/admin/reviews/:id` | Delete a review (moderation) |
| GET | `/api/admin/disputes` | Dispute list with filter by status/reason, sort |
| PATCH | `/api/admin/disputes/:id/status` | Update dispute status (approve/reject/resolve) |
| GET | `/api/admin/export/:type` | CSV export for users, bookings, payments, disputes |

All admin endpoints support **pagination** via `?page=1&pageSize=20` query params (max pageSize: 100).
Responses include:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

Search (`?search=`), filter (`?status=`, `?role=`, `?isAvailable=`, `?rating=`) and sort (`?sort=`) work together with pagination.

### 🎛️ Admin Dashboard Tabs

| Tab | Features |
|-----|----------|
| **Overview** | 8 stat cards, revenue chart, bookings chart, category distribution, top owners, top rentals |
| **Users** | Table with verify/suspend/reactivate/delete actions, search, role filter, sort |
| **Listings** | Table with toggle availability/view/delete actions, search, availability filter, sort |
| **Bookings** | Table with confirm/cancel/complete actions, search, status filter, sort |
| **Payments** | Table with view booking link, search, status filter, sort |
| **Reviews** | Table with delete action, search, rating filter, sort |
| **Disputes** | Link to dedicated dispute management page |

### 📊 CSV Export

Export data from Users, Listings, Bookings, Payments, and Reviews tabs using the Export CSV button.
Supported export types: users, bookings, payments, disputes.
- [ ] **Search & Filters** — Advanced search with full-text search
- [ ] **Mobile App** — React Native mobile application

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  Made with ❤️ by the RentHub Team
</div>

---

---

## 🏗 Architecture Overview

### Frontend Architecture

```
client/src/
├── components/     Reusable UI (Navbar, Footer, NotificationBell, StarRating, ProtectedRoute)
├── pages/          Route-level page components (25 pages)
├── context/        AuthContext — global auth state via React Context
├── hooks/          useAuth — custom hook for auth context access
├── services/       API client layer (Axios) — one file per resource
├── utils/          Constants, helpers, debounce/throttle, validators
├── layouts/        MainLayout — wraps all routes with Navbar + Footer
├── App.jsx         Route definitions with code splitting
└── main.jsx        Entry point (BrowserRouter + Toaster)
```

**State Management:** React Context (auth) + local component state. No Redux needed for current complexity.

**Code Splitting:** 20 of 25 pages are lazy-loaded via `React.lazy()`. Critical pages (Home, Login, Signup, Browse, ListingDetails) load eagerly for fast first paint.

### Backend Architecture

```
server/
├── controllers/    Request handlers — one per resource (auth, listing, booking, payment, etc.)
├── routes/         Express routers — maps HTTP methods to controllers
├── middleware/      Auth (JWT verify, role check, admin check), error handling, security (Helmet + rate limiting)
├── services/       Business logic — notification, email, SMS, insurance, availability alerts
├── prisma/         Database schema + migrations
├── config/         Environment configuration
└── utils/          Prisma client singleton, Stripe client
```

**Request Flow:** `HTTP Request → Security Middleware → Route → Auth Middleware → Controller → Prisma → Response`

**Notification Flow:** `Action (booking, payment, etc.) → NotificationService.createNotification() → User preference check → In-App/Email/SMS delivery`

### Design Patterns

| Pattern | Usage |
|---------|-------|
| **Service Layer** | Business logic extracted to `services/` — controllers stay thin |
| **Repository** | Prisma ORM acts as repository layer — no raw SQL |
| **Middleware Chain** | Express middleware for auth, role verification, error handling |
| **Observer** | NotificationService observes domain events (booking, payment, review, dispute) |
| **Strategy** | InsuranceService uses pluggable provider interface for easy swap |
| **Context** | React Context for auth state — avoids prop drilling |

## ⚡ Performance Optimizations

### Frontend

| Optimization | Implementation | Impact |
|-------------|----------------|--------|
| **Code Splitting** | `React.lazy()` + `Suspense` on 20/25 pages | Smaller initial bundle (342KB → ~200KB first paint) |
| **Debounce** | `utils/debounce.js` — debounce() + throttle() utilities | Prevents excessive API calls on search/input |
| **Lazy Admin Dashboard** | Admin pages split separately (33KB) | Owners don't pay cost of admin UI |
| **Eager Critical Pages** | Home, Login, Signup, Browse, ListingDetails loaded eagerly | Instant navigation to core pages |

### Backend

| Optimization | Implementation | Impact |
|-------------|----------------|--------|
| **Promise.all()** | Parallel count + findMany queries in all paginated endpoints | ~2x faster paginated responses |
| **Database Indexes** | Composite index on Booking(startDate, endDate), createdAt on Payment/Dispute/Notification | Faster date overlap queries, sort operations |
| **Selective Includes** | `select` on every Prisma query — never fetches unused fields | Lower memory, faster queries |
| **Body Size Limits** | `express.json({ limit: '10mb' })` | Prevents memory exhaustion |

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| **Helmet** | HTTP security headers (CSP, XSS, HSTS, etc.) via `securityMiddleware.js` |
| **Rate Limiting** | Auth endpoints: 10 req/15min. API: 100 req/min. Prevents brute-force |
| **CORS Whitelist** | Only configured origins allowed. Read from `CORS_ORIGINS` env var |
| **JWT with Expiry** | Configurable expiry (default 7d). No fallback secret — must be set in env |
| **Password Hashing** | bcrypt with 12 salt rounds |
| **Input Validation** | Every controller validates required fields, lengths, types before processing |
| **Stripe Webhooks** | Signature verification via `stripe.webhooks.constructEvent()` |
| **Error Handling** | Stack traces only in development. Standardized JSON responses |
| **No Password Exposure** | Prisma queries always exclude password field via `select` |
| **Auth Middleware** | `protect` (JWT verify), `authorize` (role check), `adminOnly` (role + verification) |

## ⚠️ Known Limitations

| Limitation | Description | Future Improvement |
|-----------|-------------|-------------------|
| **File Uploads** | Uses image URLs instead of direct uploads | Integrate Cloudinary or S3 upload |
| **Real-Time Updates** | Notification polling every 30s instead of WebSockets | Add Socket.IO or Server-Sent Events |
| **Timezone Handling** | Dates stored in UTC but no user timezone conversion | Add user timezone preference |
| **Payment Idempotency** | No Stripe idempotency keys | Add `Idempotency-Key` header support |
| **Admin Role** | Uses `isVerified` as admin flag (same field as user verification) | Add separate `isAdmin` field on User model |
| **Test Coverage** | No automated test suite | Add Jest + Supertest for API tests, Vitest + Testing Library for UI tests |
| **CI/CD** | No automated build/deploy pipeline | Add GitHub Actions for lint, test, build, deploy |
| **Search** | Simple `contains` query (no full-text search) | Add PostgreSQL full-text search or Elasticsearch |
| **Rate Limiting** | In-memory store, resets on server restart | Use Redis store for persistent rate limiting |
| **Image Optimization** | Full-size images served without compression | Add image CDN (Cloudinary, Imgix) for automatic optimization |

## 🚀 Deployment Checklist

### Prerequisites

| Requirement | Version/Link |
|-------------|-------------|
| Node.js | v18+ |
| PostgreSQL | 14+ |
| npm | 9+ |
| Stripe Account | [stripe.com](https://stripe.com) |

### Environment Variables

```bash
# Server
DATABASE_URL=postgresql://user:password@localhost:5432/renthub
JWT_SECRET=<generate-a-strong-random-secret>
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Frontend (client/.env)
VITE_API_URL=https://api.yourdomain.com/api
```

### Deployment Steps

1. **Database Setup**
   ```bash
   cd server
   npx prisma migrate deploy  # Apply all migrations
   npx prisma generate         # Generate Prisma client
   ```

2. **Build Frontend**
   ```bash
   cd client
   npm install
   npm run build
   # Output in client/dist/
   ```

3. **Configure Webhooks**
   - Stripe Dashboard → Webhooks → Add endpoint
   - URL: `https://api.yourdomain.com/api/payments/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
   - Identity webhook: `https://api.yourdomain.com/api/identity/webhook`
   - Events: `identity.verification_session.verified`, `identity.verification_session.requires_input`

4. **Production Considerations**
   - Set `NODE_ENV=production` — hides stack traces in API errors
   - Use a process manager: `pm2 start server/server.js --name renthub-api`
   - Configure SSL/TLS via reverse proxy (Nginx, Caddy)
   - Enable database connection pooling (PgBouncer for high traffic)
   - Set up database backups (cron + pg_dump)

---

## 🧪 QA Checklist

### Authentication

| Test | Expected Result |
|------|----------------|
| Register with valid data | Success toast, redirected to home |
| Register with existing email | Error message: "Email already in use" |
| Login with valid credentials | Success toast, user session restored |
| Login with invalid email | Error message displayed |
| Login with wrong password | Error message displayed |
| Access protected route while logged out | Redirected to /login |
| Access owner-only route as renter | 403 Unauthorized page |
| Access admin route as non-verified owner | Redirected to /unauthorized |
| Refresh page while logged in | Session restored (no flash of login page) |
| Logout | Token cleared, redirected to home |

### Listings

| Test | Expected Result |
|------|----------------|
| Create listing with valid data | Listing created, visible in Browse |
| Create listing without title | Validation error |
| Create listing as RENTER | 403 error or Create Listing link hidden |
| Edit own listing | Changes saved and reflected |
| Edit another's listing | 403 error |
| Delete own listing | Listing removed |
| Browse listings with search | Results filtered by query |
| Browse with category filter | Results filtered by category |
| Browse with price range | Results within price bounds |
| Browse with sorting | Results ordered correctly |
| View listing details | All fields display correctly |

### Bookings

| Test | Expected Result |
|------|----------------|
| Create booking with valid dates | Booking created, PENDING status |
| Create booking with overlapping dates | Error: "already booked for selected dates" |
| Create booking on own listing | Error: "cannot book your own listing" |
| Owner approves booking | Status changes to CONFIRMED |
| Owner rejects booking | Status changes to REJECTED |
| Owner marks ACTIVE | Status changes to ACTIVE |
| Owner marks COMPLETED | Status changes to COMPLETED |
| Renter cancels PENDING booking | Status changes to CANCELLED |
| View booking details | All info displays correctly |

### Payments

| Test | Expected Result |
|------|----------------|
| Create PaymentIntent | Client secret returned |
| Confirm payment with test card (4242...)| Payment authorized, booking CONFIRMED |
| Confirm payment with declined card (4000...)| Payment FAILED, error displayed |
| Owner captures payment (COMPLETED booking) | Payment CAPTURED |
| Refund captured payment | Payment REFUNDED, booking CANCELLED |
| View payment history | All payments listed |
| View payment details | Amount, status, dates display |

### Reviews

| Test | Expected Result |
|------|----------------|
| Submit review on COMPLETED booking | Review created, average updated |
| Submit review on PENDING booking | Error: "booking must be COMPLETED" |
| Submit multiple reviews on same booking | Error: "already reviewed" |
| Edit own review | Changes saved |
| Delete own review | Review removed |
| Sort reviews by rating | Correct order |

### Admin Dashboard

| Test | Expected Result |
|------|----------------|
| Access as non-verified OWNER | Redirected to /unauthorized |
| Access as RENTER | Redirected to /unauthorized |
| Dashboard loads with statistics | All stat cards populated |
| User management: search, filter, sort | Results update correctly |
| User management: verify/suspend/reactivate | Status changes reflected |
| Listing management: toggle availability | Status toggles correctly |
| Listing management: delete | Listing removed |
| Booking management: force complete | Booking updated |
| Payment management: view all | Payments listed |
| Review moderation: delete | Review removed |
| Dispute management: approve/reject | Status updated, notifications sent |
| CSV export | File downloads with correct data |
| Pagination: next/prev/jump | Pages load correctly |
| Page size change | Results per page update |

### Error Handling & Edge Cases

| Test | Expected Result |
|------|----------------|
| Invalid route | 404 response, NotFound page |
| Invalid UUID in URL params | Graceful error handling |
| Expired JWT token | 401, auto-logout |
| Missing token | 401, redirect to login |
| Rate limit exceeded | 429, clear error message |
| Network failure | Graceful error toast |
| Empty search results | "No results found" empty state |
| Empty wishlist | Empty state with guidance |
| No bookings yet | Empty state with CTA |
| Very long text input | Truncated or scroll, no layout break |
| Rapid form submission | Debounce prevents duplicates |
| Concurrent booking on same listing | Conflict detection works |
