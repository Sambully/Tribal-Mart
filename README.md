# 🪔 Tribal Mart

> A modern, full-stack marketplace connecting India's tribal cooperatives with conscious buyers — built end-to-end with Node + React, complete with a unique **Agent-assisted listing** workflow and a Hindi/English language switcher for tribal artisans.

<p align="center">
  <img src="https://img.shields.io/badge/Node-18%2B-43853d?style=flat-square&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Framer%20Motion-12-0055ff?style=flat-square"/>
  <img src="https://img.shields.io/badge/License-MIT-c0552c?style=flat-square"/>
</p>

---

## 🌟 What makes Tribal Mart different

Most marketplaces have **two** sides (buyer + seller). Tribal Mart introduces a **third**: an **Agent** who can list and manage products on behalf of artisans who can't run the digital storefront themselves. This bridges the gap for older tribal craftspeople — their craft reaches the world while the digital work is handled with their consent.

Plus a **Hindi/English instant-switch** across the entire Agency portal — because the tribal cooperatives who actually sell here speak Hindi, not English.

**On top of that:**
- 🤖 **Saathi** — an AI chatbot (powered by Gemini Flash 2.5) on every page that can track orders by ID, recommend gifts by **semantic** understanding of the shopper's intent (not keywords), and answer any platform question in EN or HI
- 💬 **WhatsApp click-to-chat** floating button on every page, routing straight to the admin's WhatsApp with a contextual prefilled message
- ☁️ **Cloudinary-backed media** — all uploads (product images, KYC docs, avatars) go directly to a CDN, so files work across machines, regions, and deployments out of the box
- 💳 **Live Razorpay** integration with HMAC-verified payment confirmation, multi-item carts, and saved-address checkout
- 📦 **Public order tracking** — anyone with an order ID can check status without logging in

---

## 🎭 Four portals, one platform

| Portal | Who it's for | Core jobs |
|---|---|---|
| 🛍️ **Customer** | Anyone buying craft | Browse, search, cart, checkout, track orders, reviews, returns, watchlist, compare, profile |
| 🪔 **Agency** | Tribal cooperatives & studios | Upload products, fulfil orders (ship + tracking), payouts, analytics, request agent help, manage returns, EN/हिं toggle |
| 🤝 **Agent** | Digital helpers for artisans | Browse incoming agency requests, approve to manage them, list products on their behalf, drill into per-agency stats, earn 5% commission |
| 🛡️ **Admin** | Platform stewards | Approve listings (single + bulk), verify KYC docs, manage users + categories, financial dashboard, settle payouts, mark featured products |

---

## 🚀 Quick start

### Prerequisites

- **Node.js** 18 or newer
- **npm** (bundled with Node)
- **MongoDB Atlas** account *(or local MongoDB instance)*

### 1. Clone & install

```bash
git clone <YOUR-REPO-URL>.git tribal-mart
cd tribal-mart

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

#### `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/tribalmart
JWT_SECRET=replace-this-with-a-strong-secret-min-32-chars
FRONTEND_URL=http://localhost:3000

# Razorpay (test mode is fine for demo)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

#### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000

# Cloudinary — direct browser uploads (free account at cloudinary.com)
# Create an UNSIGNED upload preset under Settings → Upload
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_PRESET=your_unsigned_preset_name

# Gemini Flash 2.5 — powers the Saathi chatbot
# Free key at https://aistudio.google.com/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> See `backend/.env.example` and `frontend/.env.example` for templates.

> **Cloudinary preset notes:** the unsigned preset must allow your file types. If you want PDF document uploads to actually deliver back, enable "Allow delivery of PDF and ZIP files" under Settings → Security in the Cloudinary console.

### 3. Seed demo data

```bash
cd backend
node scripts/seedAdmin.js     # Creates admin@setu.com / admin123
node scripts/seedDemo.js      # Creates agency, agent, customer + 6 products + reviews
```

### 4. Run

```bash
# Terminal 1 — backend (port 5000)
cd backend
npm start

# Terminal 2 — frontend (port 3000)
cd frontend
npm run dev
```

Open **http://localhost:3000**.

### 5. Demo accounts (post-seed)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@setu.com` | `admin123` |
| Agency (with managing agent) | `agency@demo.com` | `demo123` |
| Agency (no agent) | `santhal@demo.com` | `demo123` |
| Agent | `agent@demo.com` | `demo123` |
| Customer | `customer@demo.com` | `demo123` |
| Customer 2 | `rohan@demo.com` | `demo123` |

---

## 🛠️ Tech stack

### Frontend
- **React 19** + **Vite 8** (no CRA)
- **React Router v6** for routing
- **Framer Motion 12** for animations (hover-shuffle card stack, scroll-into-view reveals, magnetic buttons, count-up stats, layout transitions)
- **Axios** with auth interceptor for API calls
- **Custom design system** in `src/index.css` (tribal palette, SVG pattern data-URIs, typography tokens)
- **i18n** built from scratch (`useT()` hook + JSON dictionaries)
- **Cloudinary** SDK-less direct upload from the browser (unsigned preset)
- **Gemini Flash 2.5** via REST for the Saathi chatbot — semantic gift matching + free-form Q&A

### Backend
- **Node.js** + **Express 5**
- **MongoDB Atlas** with **Mongoose**
- **JWT** authentication with role middleware
- **bcryptjs** for password hashing
- **Multer** for legacy multipart fallback (active uploads now go through Cloudinary)
- **Razorpay SDK** for online payments
- File-backed category store under `backend/data/` so admin-managed categories persist across restarts
- Custom DNS resolver override (uses Google/Cloudflare DNS) for Atlas SRV lookups on networks that block them

### Design language
- **Typography**: Figtree (display), DM Sans (body), Playfair Display (serif accents)
- **Palette**: terracotta `#c0552c`, ochre `#d99441`, deep indigo `#2e3a59`, forest `#4a6a3a`, cream `#faf6f0`
- **Patterns**: SVG data-URIs for diamonds, chevrons, dots, weave — used across the platform as subtle textures

---

## 📁 Project structure

```
tribal-mart/
├── backend/
│   ├── controllers/      # Business logic per resource
│   │   ├── adminController.js
│   │   ├── agentController.js
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── documentController.js
│   │   ├── messageController.js
│   │   ├── orderController.js     # incl. public trackOrder()
│   │   ├── productController.js
│   │   ├── profileController.js
│   │   └── returnController.js
│   ├── lib/              # Internal libs (categoryStore — file-backed persistence)
│   ├── middleware/       # Auth + upload middleware
│   ├── models/           # Mongoose schemas (User, Product, Order, Cart, Wishlist, Document, Message, Sale, Review, Return, AgentRequest)
│   ├── routes/           # Express routers (includes public categoryRoutes)
│   ├── scripts/          # seedAdmin, seedDemo, test-razorpay
│   ├── uploads/          # Legacy local upload fallback (gitignored)
│   ├── data/             # Runtime state — categories.json (gitignored)
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Shared: sidebars, NotificationBell, LanguageToggle,
│   │   │                 #         Toast, ReviewSection, MobileMenuToggle,
│   │   │                 #         ChatBot (Saathi), WhatsAppButton
│   │   ├── i18n/         # EN + HI translation dictionaries + provider
│   │   ├── services/     # api.js (axios + getImageUrl smart-routing),
│   │   │                 # cloudinary.js (direct upload helper),
│   │   │                 # gemini.js (Saathi LLM client)
│   │   │
│   │   ├── LandingPage/      # Public marketing site
│   │   ├── AuthForm/         # Unified login/signup with slide animation
│   │   ├── AuthSelection/    # 4-portal picker
│   │   │
│   │   ├── Dashboard/        # CustomerDashboard, AgencyDashboard, AgentDashboard, AdminDashboard
│   │   ├── BrowseProducts/
│   │   ├── ProductDetail/
│   │   ├── Cart/
│   │   ├── Checkout/
│   │   ├── Orders/
│   │   ├── Watchlist/
│   │   ├── Returns/
│   │   ├── Profile/          # Customer addresses + payment methods + avatar
│   │   ├── Compare/          # Up to 4 products side-by-side
│   │   │
│   │   ├── MyProducts/       # Agency
│   │   ├── AddProduct/       # Agency + Agent (with ?agencyId pre-select)
│   │   ├── EditProduct/
│   │   ├── AgencyOrders/
│   │   ├── Analytics/
│   │   ├── Payouts/          # Agency commission breakdown + settlement schedule
│   │   ├── UploadDocuments/
│   │   │
│   │   ├── AgentEarnings/    # Agent 5% commission dashboard
│   │   ├── AgencyDrilldown/  # Agent's per-agency view
│   │   │
│   │   ├── AdminProducts/    # Pending (bulk approve/reject) + All Products (featured toggle)
│   │   ├── AdminUsers/
│   │   ├── AdminUserDetail/  # Drill into one user
│   │   ├── AdminAnalytics/
│   │   ├── AdminFinance/     # GMV, commission, settlements
│   │   ├── AdminCategories/
│   │   ├── DocumentApproval/
│   │   │
│   │   ├── Store/            # Public agency storefront /store/:agencyId
│   │   ├── Messages/
│   │   ├── Support/
│   │   ├── ContactUs/
│   │   ├── Settings/
│   │   ├── StaticPages/
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css         # Design tokens
│   │   └── App.css
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── README.md
├── package.json
└── render.yaml               # Render.com deploy config
```

---

## 🔌 API surface (high-level)

### Public (no auth)
- `POST /api/auth/register` · `POST /api/auth/login`
- `GET /api/products/all` (with `?search=` `?category=` `?minPrice=` `?maxPrice=`)
- `GET /api/products/:id`
- `GET /api/products/store/:agencyId` — public agency storefront
- `GET /api/products/featured/list` — featured curation
- `GET /api/reviews/:productId`
- `GET /api/orders/track/:id` — guest order tracking (used by the chatbot)
- `GET /api/categories` — live category list

### Customer
- `GET /api/customer/cart` · `POST /api/customer/cart` · `PUT /:productId` · `DELETE /:productId`
- `GET /api/customer/wishlist` · `POST` · `DELETE /:productId`
- `GET /api/profile/me` · `PUT /api/profile/me` · `POST /api/profile/avatar`
- `GET/POST/PUT/DELETE /api/profile/addresses` · `/api/profile/payment-methods`
- `GET /api/orders/my-orders` · `POST /api/orders` · `POST /:id/cancel`
- `POST /api/returns` · `GET /api/returns/mine`
- `POST /api/reviews`

### Agency
- `POST /api/products` · `GET /api/products/my-products` · `PUT /:id` · `DELETE /:id`
- `POST /api/products/:id/duplicate`
- `GET /api/products/agent-uploads-pending` · `PUT /:id/agency-approve` · `PUT /:id/agency-reject`
- `GET /api/orders/agency-orders` · `PUT /:id/status` · `POST /:id/tracking`
- `GET /api/returns/agency` · `PUT /:id/decide` · `PUT /:id/refund`
- `GET /api/products/analytics`
- `POST /api/agents/requests` · `GET /api/agents/requests/mine` · `DELETE /api/agents/assignment`

### Agent
- `GET /api/agents/requests/incoming` · `PUT /:id/approve` · `PUT /:id/reject`
- `GET /api/agents/managed-agencies` · `GET /:agencyId` · `DELETE /:agencyId`
- `GET /api/agents/earnings`
- `POST /api/products` (with `agencyId` in body — goes to `pending_agency_approval`)
- `PUT/DELETE /api/products/:id` (only if `uploadedByAgent` matches)
- `GET /api/products/agent-uploads`

### Admin
- `GET /api/admin/dashboard-stats` · `/admin/analytics` · `/admin/financial-summary`
- `GET /api/admin/pending-products` · `/all-products` · `PUT /products/:id/status` · `PUT /:id/featured`
- `GET /api/admin/users` · `GET /:id` · `PUT /:id/status` · `DELETE /:id`
- `GET/POST/DELETE /api/admin/categories`
- `GET /api/documents/pending` · `POST /api/documents/update-status`

---

## 🔄 Cross-portal workflow: how the 4 panels interact

```
   ┌─────────────┐                        ┌──────────────┐
   │  AGENCY     │  ① request agent help  │   AGENT      │
   │             │ ────────────────────► │              │
   │             │                        │              │
   │             │ ◄──── ② approves ───── │              │
   │             │                        │              │
   │             │ ③ agent lists product  │              │
   │             │     (pending_agency_   │              │
   │             │      approval)         │              │
   │             │ ◄──────────────────── │              │
   │             │                        │              │
   │             │ ④ agency approves      │              │
   │             │       ↓                │              │
   └──────┬──────┘ ┌─────▼──────┐         └──────────────┘
          │        │   ADMIN    │
          │        │            │
          │   ⑤    │ admin      │
          │  ──►   │ approves   │
          │        │ (pending → │
          │        │  approved) │
          │        └─────┬──────┘
          │              │
          │              │  ⑥ product live
          │              │
          │        ┌─────▼──────┐
          │        │  CUSTOMER  │
          │   ⑦    │            │
          │  ◄──── │ buys →     │
          │        │ delivery   │
          │        │   ↓        │
          │        │ ⑧ review   │
          │        │ ⑨ return?  │
          │        └────────────┘
          │
          ▼ ⑩ admin settles payouts
```

**Detailed flow:**
1. An **agency** that wants help requests an **agent** through "Browse Agents"
2. The **agent** sees the request in their inbox and approves it
3. The **agent** now lists products for that agency — status starts as `pending_agency_approval`
4. The **agency** reviews the agent's listing in their dashboard and approves it
5. Status moves to `pending` → **admin** sees it in the approval queue
6. **Admin** approves → product is `approved` and live on the marketplace
7. **Customer** browses, adds to cart, checks out — `order` created with `agency` reference
8. After delivery, customer can leave a **review** (stored against the product)
9. Within 7 days, customer can open a **return** → goes back to agency to approve/refund
10. Admin sees all GMV + per-agency settlement amounts on the Finance page and marks them paid

---

## ✨ Notable features

- 🤖 **Saathi chatbot** (Gemini Flash 2.5) — semantic gift matching with per-card "why this fits" reasoning, public order tracking, EN/HI conversational support, role-aware welcome
- 💬 **WhatsApp click-to-chat** — floating bottom-left button on every page with role-contextual prefilled messages, routes to admin
- ☁️ **Cloudinary CDN media** — every product image, KYC document, and avatar uploads directly browser → CDN with `getImageUrl()` smart-routing on the frontend
- 🎨 **Tribal-themed design system** — single source of truth for colors, typography, patterns
- 🇮🇳 **Hindi/English instant switch** across the Agency portal (sidebar, dashboard, actions, stats — full translation)
- 🃏 **Hover-driven card-shuffle animation** on the landing page (8 cards cycle through)
- 🔔 **Role-aware notification bell** with live data
- 🛒 **Multi-item cart** with saved-address auto-select at checkout
- 💳 **Razorpay live integration** — UPI / cards / netbanking, HMAC-verified payment confirmation, COD fallback
- 📦 **Order timeline** — confirmed → processing → shipped → delivered with tracking updates
- 🔍 **Public order tracking** — guests can paste an order ID and see status, no login needed
- 🧾 **Printable invoice + packing slip** generated from order data
- ↩️ **Returns flow** — customer initiates, agency approves, agency marks refunded
- ⭐ **Reviews & ratings** after delivery
- ⚖️ **Compare up to 4 products** side-by-side
- 🤝 **Agent system** with 5% commission tracking per managed agency
- 💸 **Financial dashboard** for admin — GMV, commission, GST, payouts
- 🏷️ **Live category management** — admin adds → file-backed store → instantly available in Add/Edit Product dropdowns across agency + agent portals
- 📱 **Mobile responsive** with hamburger sidebar
- 🎯 **Bulk approve/reject** in admin pending queue with checkboxes
- 📨 **Toast notifications** replacing alert() everywhere
- 🛡️ **Smart fallbacks** — HEAD-probe document viewer renders "file unavailable" gracefully if a Cloudinary asset is gated

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Push to GitHub, connect repo on Vercel, set VITE_API_URL = your backend URL
```

### Backend → Render

`render.yaml` is included for one-click setup:

```yaml
services:
  - type: web
    name: tribal-mart-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: MONGO_URI
      - key: JWT_SECRET
      - key: RAZORPAY_KEY_ID
      - key: RAZORPAY_KEY_SECRET
      - key: FRONTEND_URL
```

### Before going live (production checklist)

- [ ] Replace `JWT_SECRET` with a real 32+ char secret
- [ ] Switch Razorpay test keys → live keys (in `backend/.env`)
- [ ] Whitelist your production server IPs in MongoDB Atlas Network Access
- [ ] Move the Gemini key behind a backend proxy (it's currently shipped in the Vite bundle for demo simplicity)
- [ ] Wire an email provider (SendGrid / SES) for order confirmations + password reset
- [x] ~~Move `backend/uploads/` to S3 / Cloudinary~~ — **done**, Cloudinary integrated
- [ ] Add rate limiting on `/api/auth/*` (currently open)
- [ ] Enable HTTPS (Render gives this for free)
- [ ] Rotate the admin password (`admin@setu.com / admin123`)
- [ ] Replace the file-backed category store with a Mongoose `Setting` document if you scale across multiple backend instances

---

## 🐛 Troubleshooting

**Mongo DNS resolution fails (`querySrv ECONNREFUSED`)**
Server already overrides DNS to `8.8.8.8` + `1.1.1.1` via [`server.js:9`](backend/server.js#L9). If it still fails, your network may block outbound DNS — try a hotspot.

**Port 5000 already in use**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /F /PID <pid>
# Unix
lsof -ti :5000 | xargs kill -9
```

**Razorpay 401 "Authentication failed"**
The committed test keys may be invalid. Get fresh keys from https://dashboard.razorpay.com → Settings → API Keys.

**Frontend can't reach backend**
Check `frontend/.env` has `VITE_API_URL=http://localhost:5000`. Restart Vite (`Ctrl+C` then `npm run dev`).

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

## 🙏 Credits

Built with care for India's tribal artisan communities — Bhil, Santhal, Munda, Toda, Gond, and many others — whose craft deserves a marketplace that respects their pace, language, and dignity.

Made with ❤️ in India.
