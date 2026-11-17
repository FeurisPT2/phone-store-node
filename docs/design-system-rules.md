# GearHub Design System Rules & Architecture

This document provides a comprehensive analysis of the GearHub (`phone-store-node`) design system architecture to guide Figma design synchronization, component mapping, and Model Context Protocol (MCP) integrations.

---

## 1. Token Definitions

Design tokens are defined centrally in CSS custom properties within [`src/public/css/style.css`](file:///c:/Users/epicg/Downloads/phone-node/phone-store-node/src/public/css/style.css#L8-L70).

### Color Tokens
Supports dual-mode theming (`light` via `:root` and `dark` via `[data-theme="dark"]`):

```css
:root {
    /* Surfaces & Backgrounds */
    --bg: #f3f2ee;
    --bg-elevated: #ffffff;
    --surface: #ffffff;
    --surface-raised: #f7f6f2;
    --surface-hover: #ebe8e1;

    /* Borders */
    --border: #e6e2d8;
    --border-strong: #d6d1c7;
    --border-accent: #1d4ed8;

    /* Typography & Ink */
    --ink: #0f172a;
    --muted: #475569;

    /* Brand Accents */
    --accent: #1d4ed8;        /* Brand Blue */
    --accent-hover: #1e40af;
    --accent-pine: #059669;   /* Technical Accent */
    --gold: #92400e;
    --danger-ink: #991b1b;
    --success-ink: #166534;
}
```

### Typography Scale
Typeface: **Be Vietnam Pro** (variable weights 300 to 800) with fluid clamps:
- `--fs-display`: `clamp(2.1rem, 3.2vw, 3.1rem)`
- `--fs-h2`: `clamp(1.55rem, 2.3vw, 2.2rem)`
- `--fs-h3`: `1.1875rem`
- `--fs-body`: `1rem`
- `--fs-sm`: `0.875rem`
- `--fs-xs`: `0.78rem`

### Geometry & Elevation
- `--radius-sm`: `8px` (Standard for Buttons, Inputs, Pills)
- `--radius-md`: `14px` (Cards, Dialogs)
- `--radius-lg`: `20px` (Showcases, Bento Grids)
- `--radius-pill`: `999px` (Status Badges)
- `--shadow-card`: `0 4px 20px -4px rgba(0, 0, 0, 0.04)`

---

## 2. Component Library

UI components are written as reusable, semantic HTML5 snippets with designated class names, wired to Figma via **Figma Code Connect**:

- **Button (`src/figma/Button.figma.ts`):**
  - Classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`
  - Dimensions: Height ~38px, Padding `10px 20px`, Radius `8px`.
- **Badge (`src/figma/Badge.figma.ts`):**
  - Classes: `.badge-hot`, `.badge-rescue`, `.badge-zero-deposit`
  - Style: Rounded micro-pill (`radius: 999px`), padding `4px 10px`, font size `11px`.
- **Product Card (`src/figma/ProductCard.figma.ts`):**
  - Class: `.product-card` (contains `.product-thumb`, `.product-body`, `.product-title`, `.product-price`)
- **KPI Card (`src/figma/KpiCard.figma.ts`):**
  - Class: `.kpi-cell` / `.kpi-card` (contains `.kpi-label`, `.kpi-value`, `.kpi-trend`)

---

## 3. Frameworks & Libraries

- **Backend:** Node.js (v20+) with Express.js for routing, session management, and JSON/Postgres dual-storage adapter.
- **Frontend:** Vanilla modern JavaScript (ES6+ modularized into `main.js`, `cart.js`, `aiChat.js`, `catalogFilter.js`, `admin.js`, `qrPayment.js`).
- **Styling:** Pure CSS3 with Custom Properties. Zero heavy bundler runtime dependency; instant zero-compile page loading.
- **Test Engine:** Native Node.js Test Runner (`node --test`).

---

## 4. Asset Management

- **Photography:** High-resolution product images hosted via Unsplash CDN with parameters `w=800&auto=format&fit=crop&q=80`.
- **Local Media:** Static assets located under `src/public/` (`css/`, `js/`).
- **Data Persistence:** Products and categories managed in `src/data/products.json`.

---

## 5. Icon System

- **Format:** Pure inline SVG with stroke-based architecture.
- **Attributes:** `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
- **Rule:** Strict ban on emojis in UI controls; all iconography must use structured SVGs for crisp HiDPI rendering.

---

## 6. Styling Approach

- **Methodology:** Component-scoped semantic BEM-like CSS with shared global utility variables.
- **Responsive Layout:**
  - Fluid clamp typography.
  - CSS Grid with `repeat(auto-fill, minmax(...))` and adaptive breakpoints (`max-width: 900px`, `max-width: 640px`).
  - Mobile bottom-sheet drawers and horizontal touch filters.

---

## 7. Project Structure

```
phone-store-node/
├── src/
│   ├── config/          # DB & session configuration
│   ├── controllers/     # Express route handlers (auth, cart, product, chat, admin)
│   ├── data/            # Local JSON DB (products, orders, customers, admins)
│   ├── figma/           # Figma Code Connect templates (*.figma.ts)
│   ├── middlewares/     # Auth, session, compression
│   ├── models/          # Domain models & storage adapters (JSON / Postgres)
│   ├── public/          # Client-facing web pages & assets
│   │   ├── css/         # style.css, about.css, product.css, admin.css
│   │   ├── js/          # Client scripts (main, cart, aiChat, admin, etc.)
│   │   ├── index.html   # Landing / Story page
│   │   ├── shop.html    # Unified catalog & filters
│   │   ├── product.html # Product detail page (PDP)
│   │   ├── cart.html    # Tri-tier cart & booking
│   │   ├── login.html   # Unified login portal
│   │   ├── admin.html   # Admin CRM panel
│   │   └── settings.html# Customer settings
│   ├── routes/          # Express route definitions
│   └── services/        # AI consultant & crawler services
├── figma.config.json    # Code Connect configuration
└── docs/                # Architecture Decision Records & design documentation
```
