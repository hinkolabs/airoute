# Airoute 🌍  
**AI Tool Navigation Platform for Global Beginners**  
*Too many AI tools? Don’t worry — Airoute finds the best route for you.*

Airoute is a global AI tool navigation platform designed for beginners and casual users.  
Instead of overwhelming filters and technical jargon, Airoute helps users **discover the right AI tool in seconds**, based purely on their purpose.

Current version: **v0.5 Beta (Simple Mode MVP)**  
Commercial product roadmap toward **v1.0 Launch (2026)** is in progress.

---

## 🚀 Mission

AI tools are growing exponentially, yet the majority of everyday users have **no idea which tool fits their needs**.

Airoute’s mission is simple:

- Provide a **clear, beginner-friendly map** of the AI tool ecosystem  
- Offer **instant recommendations** with zero complexity  
- Deliver **verified, safe, and official links only**  
- Focus on **mobile-first, fast-loading UX** suitable for global casual users

Airoute aims to become the **“Google Maps for AI tools.”**

---

## 🎯 Core Product Features

### **1. Simple Mode (v0.5 – Core MVP Flow)**
A frictionless recommendation interface:
- Users select a task (e.g., Resume, Image, Video, Writing)
- Airoute returns a curated list of AI tools
- Data is ranked by category, tool quality, and global usage
- Clean card-based UI optimized for mobile

### **2. Verified Link Layer**
Every tool links to:
- **Official websites only**
- Or verified affiliate links (when applicable)

This ensures **zero risk of phishing or fake AI sites**, a critical global issue today.

### **3. Multilingual Content Architecture**
Airoute is designed for global expansion with content fields supporting:
- `desc_en` (English)
- `desc_ko` (Korean)
- `desc_simple_en` (Beginner-friendly English)
- `desc_senior` (Senior-friendly Korean for “Hyodo Mode”)

### **4. Data-Driven Tool Rankings**
Each AI tool includes:
- Manual ranking score  
- Task-level ranking  
- Tags for fast search  
- “Best for” badges  
- Why-pick recommendations

This allows Airoute to scale toward **AI-powered recommendation engines**.

---

## 🗃 Database Overview (Supabase)

Airoute uses **5 core tables** in Supabase:

| Table | Purpose |
|-------|---------|
| `users` | User profiles, subscription plan, credits |
| `tools` | Master data of AI tools (content, tags, badges, ranking) |
| `routes` | Workflow/task sequences (e.g., "Turn long videos into Shorts") |
| `route_tools` | Route → Tool mapping (Best3 steps per route) |
| `saved_tools` | User bookmarks ("My Toolbox") |
| `credit_logs` | Credit usage & history for premium features |
| `prompts` | Premium prompt library connected to each tool |

All schemas are stored and maintained through Supabase SQL.

### Row Level Security (RLS) Policy

**IMPORTANT**: The following tables are **publicly readable** (anonymous users can SELECT):
- `tools`
- `routes`
- `route_tools`

This is **intentional for Airoute MVP** to allow:
- Fast public browsing without authentication
- Server-side rendering (SSR) with anon key
- No 404 errors for unauthenticated users

⚠️ **Do NOT remove `tools_public_read`, `routes_public_read`, or `route_tools_public_read` policies** or the entire site will break (all tools/routes will return 404).

Write operations (INSERT/UPDATE/DELETE) are restricted to authenticated users or service role.

---

## 🛠 Tech Stack

**Frontend**  
- Next.js 14 (App Router)  
- TypeScript  
- Tailwind CSS  
- Responsive mobile-first UI

**Backend / Infra**  
- Supabase (DB + Auth)  
- Serverless API routes  
- Vercel (production + preview deployments)

**AI-Assisted Development**  
- Cursor IDE  
- Custom project rules stored in `.cursor/rules/airoute-core-rules.mdc`

---

## 📁 Project Structure

```bash
airoute/
├── .cursor/
│   └── rules/
│       └── airoute-core-rules.mdc      # Master development rules for Cursor
├── docs/
│   ├── ga4-custom-dimensions-setup.md  # GA4 Custom Dimensions 등록 가이드
│   ├── ga4-explorations-setup-guide.md # GA4 Explorations 리포트 설정 (상세)
│   ├── ga4-explorations-quick-checklist.md # GA4 빠른 설정 체크리스트
│   ├── routes-db-migration-guide.md    # Routes 테이블 마이그레이션 가이드
│   └── routes-migration-api-usage.md   # Routes API 사용법
├── lib/
│   └── supabase.ts                     # Supabase client
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── simple/page.tsx             # Simple Mode UI
│   │   ├── routes/
│   │   │   └── [slug]/                 # Route detail pages
│   │   ├── guides/
│   │   │   └── [slug]/                 # Guide detail pages
│   │   └── api/
│   │       ├── tools/route.ts          # Fetch AI tools
│   │       ├── routes/                 # Routes API endpoints
│   │       └── guides/                 # Guides API endpoints
│   ├── components/
│   │   ├── AffiliateLinkButton.tsx     # GA4 tracking for affiliate clicks
│   │   ├── tool-card.tsx               # Card UI for each AI tool
│   │   └── layout/                     # Layout components
│   └── types/                          # DB types
├── supabase/
│   └── migrations/                     # Database migration files
└── README.md
```

---

## 📊 Analytics & Tracking

Airoute uses **GA4 (Google Analytics 4)** for tracking user behavior and affiliate click signals.

### Key Events

| Event Name | Purpose | Parameters |
|---|---|---|
| `affiliate_click` | Track external tool link clicks | `partner_name`, `tool_slug`, `placement`, `route_slug`, `guide_slug`, `is_internal_traffic` |
| `page_view` | Standard GA4 page views | Auto-tracked |

### Internal Traffic Filtering

All affiliate clicks include `is_internal_traffic` parameter to separate:
- **Production traffic** (`false`) - Real user clicks
- **Development/test traffic** (`true`) - Localhost, Vercel preview, staging

This ensures clean revenue signal data for decision-making.

### GA4 Setup Documentation

For complete GA4 setup and reporting, see:
- **Quick Start**: `docs/ga4-custom-dimensions-setup.md`
- **Explorations Setup**: `docs/ga4-explorations-setup-guide.md`
- **Quick Reference**: `docs/ga4-explorations-quick-checklist.md`

---

## ## ⚙️ Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Add environment variables
Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id
```

### 3. Run locally
```bash
npm run dev
```

**Note**: Localhost traffic is automatically tagged as `is_internal_traffic: true` in GA4 events.

---

## ## 🚀 Deployment (Vercel)

1. Connect GitHub repository to Vercel
2. Add Supabase and GA4 environment variables
3. Deploy using default Next.js build settings

**Branch Strategy:**
- `main` → Production
- `dev` → Development, preview deployments

**Note**: Vercel preview deployments are automatically tagged as `is_internal_traffic: true`.

---

## ## 🧭 Roadmap

### v0.6
- Tool detail pages
- Category-based navigation
- Related hardware recommendations
- **GA4 Explorations setup for revenue signal tracking**

### v0.8
- Multilingual UI (EN/KR/JP)
- Senior-friendly "Hyodo Mode"
- Basic analytics dashboard

### v1.0 Launch
- Smart recommendation engine
- Premium prompt library
- Subscription model integration
- Global marketing rollout

---

## 📄 License
Commercial, all rights reserved.
(Custom license will be added prior to v1.0 launch.)

🤝 Contact & Collaboration
Airoute is developed by HinkoLabs.
For partnership or collaboration inquiries, please contact:
ramumkii@hinkolabs.com