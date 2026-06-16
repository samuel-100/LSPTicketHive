# LSPTicketHive — Billion Dollar Product Strategy

---

## 1. VISION

**One-liner:** The AI-powered event economy platform that makes every event unforgettable and every organizer profitable.

**Mission:** Democratize event success by giving organizers, attendees, and promoters the most intelligent, beautiful, and profitable event platform ever built.

**Why now:**
- $1.5T global events industry recovering post-pandemic
- Eventbrite charges 6-9% fees and has stagnant UX (2012-era design)
- No platform combines ticketing + discovery + networking + promotion
- AI is ready to automate 80% of event management work
- Gen Z demands social-first, mobile-first event experiences
- Creator economy needs event monetization tools

**North Star Metric:** Gross Ticket Volume (GTV) processed per month

**5-Year Target:** $10B GTV, $500M ARR, 50M monthly active users

---

## 2. PRODUCT REQUIREMENTS DOCUMENT (PRD)

### 2.1 Problem Statements

| User | Pain Point | Our Solution |
|------|-----------|--------------|
| Organizer | High fees (6-9%), complex tools, no AI help | 2% fee, AI assistant, one-click everything |
| Attendee | Discovery is broken, no social layer, boring UX | TikTok-style discovery, friend activity, rewards |
| Promoter | No dedicated tools, manual tracking, delayed payouts | Full promoter dashboard, real-time earnings, instant payouts |

### 2.2 Core Product Principles

1. **Zero friction** — Every action completes in < 3 taps
2. **AI-first** — Every screen has intelligent assistance
3. **Social by default** — Events are social objects, not static pages
4. **Instant money** — Organizers and promoters get paid same-day
5. **Trust engineered** — Every transaction feels safe and premium
6. **Beautiful always** — Every pixel is intentional

### 2.3 Feature Matrix

#### ORGANIZER FEATURES

| Feature | Priority | Complexity | Differentiator |
|---------|----------|------------|----------------|
| AI Event Creator | P0 | High | Generates event page from 1 sentence |
| Smart Pricing Engine | P0 | High | Dynamic pricing based on demand signals |
| Revenue Dashboard | P0 | Medium | Real-time revenue with forecasting |
| Multi-tier Tickets | P0 | Low | Free, Early Bird, GA, VIP, Platinum |
| QR Scanner App | P0 | Medium | Works offline, instant check-in |
| Staff Management | P1 | Medium | Invite staff, assign roles, track tasks |
| Sponsorship Marketplace | P1 | High | Connect organizers with sponsors |
| AI Marketing Assistant | P1 | High | Auto-generates ads, emails, captions |
| Event Website Builder | P1 | Medium | Beautiful auto-generated microsites |
| Vendor Booking | P2 | Medium | Book catering, AV, photographers |
| Multi-Org Collaboration | P2 | Medium | Shared editing, split revenue |
| Waitlist + Urgency Engine | P1 | Low | Converts waitlisters when tickets release |
| Fraud Detection | P0 | High | ML-based suspicious activity blocking |
| Real-time Attendance | P0 | Low | Live headcount, capacity alerts |
| Email/SMS Automation | P1 | Medium | Drip campaigns, reminders, follow-ups |

#### ATTENDEE FEATURES

| Feature | Priority | Complexity | Differentiator |
|---------|----------|------------|----------------|
| For You Feed | P0 | High | ML-personalized event discovery |
| Map Discovery | P0 | Medium | Events on a live map, filter by vibe |
| Group Booking | P0 | Low | Book for friends, split payments |
| Digital Wallet | P0 | Medium | All tickets in one place, Apple Wallet |
| Friend Activity | P1 | Medium | See what friends are attending |
| Event Chat | P1 | Medium | Pre/post event messaging |
| Safe Resale | P1 | High | Verified resale, price-capped |
| Loyalty Rewards | P1 | Medium | Points per event, redeem for perks |
| VIP Membership | P2 | Medium | Priority access, exclusive events |
| Event Memories | P2 | High | AI photo/video compilation |
| Networking Mode | P2 | High | LinkedIn-style connect at events |
| Multi-language | P1 | Low | Auto-detect, 20+ languages |

#### PROMOTER FEATURES

| Feature | Priority | Complexity | Differentiator |
|---------|----------|------------|----------------|
| Promoter Dashboard | P0 | Medium | Earnings, clicks, conversions |
| Unique Referral Links | P0 | Low | Track every sale to promoter |
| Commission Tiers | P0 | Low | Higher volume = higher % |
| Real-time Earnings | P0 | Low | See money come in live |
| Instant Payouts | P1 | Medium | Cash out anytime via Stripe Connect |
| Leaderboard | P1 | Low | Gamified competition |
| Territory Management | P2 | Medium | Claim areas, become local rep |
| AI Promo Suggestions | P1 | Medium | Best events to promote, best times |
| Influencer Toolkit | P2 | Medium | Branded links, embed widgets |
| Affiliate Network | P2 | High | Recruit sub-promoters |

---

## 3. APP ARCHITECTURE

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├──────────────┬──────────────┬──────────────┬───────────────────── │
│  Mobile App  │  Web App     │  Scanner App │  Admin Dashboard   │
│  (React Native)│ (Next.js)  │ (React Native)│ (Next.js)        │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬────────────┘
       │              │              │              │
┌──────▼──────────────▼──────────────▼──────────────▼────────────┐
│                     API GATEWAY (Kong)                          │
│              Rate limiting, Auth, Routing                       │
└──────────────────────────┬─────────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│                    SERVICE MESH                                  │
├────────┬────────┬────────┬────────┬────────┬────────┬──────────┤
│ Auth   │ Event  │Ticket  │Payment │Search  │Social  │ AI       │
│Service │Service │Service │Service │Service │Service │Service   │
├────────┴────────┴────────┴────────┴────────┴────────┴──────────┤
│                    MESSAGE BUS (Kafka)                           │
├────────┬────────┬────────┬────────┬────────────────────────────┤
│Postgres│ Redis  │Elastic │ S3     │ ML Models (SageMaker)      │
│ (RDS)  │(Cache) │Search  │(Media) │                            │
└────────┴────────┴────────┴────────┴────────────────────────────┘
```

### 3.2 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Mobile | React Native + Expo | Cross-platform, 95% code share |
| Web | Next.js 14 + TypeScript | SSR, SEO, App Router |
| API | Node.js + Fastify | Speed, TypeScript ecosystem |
| Database | PostgreSQL (RDS) | ACID, JSON support, proven |
| Cache | Redis Cluster | Sessions, rate limiting, real-time |
| Search | OpenSearch | Full-text event search, geo queries |
| Queue | Kafka (MSK) | Event sourcing, real-time streams |
| Storage | S3 + CloudFront | Media, static assets, global CDN |
| AI/ML | SageMaker + Bedrock | Recommendations, pricing, content |
| Payments | Stripe Connect | Split payments, instant payouts |
| Auth | Cognito + custom JWT | Social login, MFA, passwordless |
| Infra | AWS CDK | Infrastructure as code |
| CI/CD | GitHub Actions | Auto deploy on merge |
| Monitoring | DataDog | APM, logs, metrics, alerts |

---

## 4. USER FLOWS

### 4.1 Organizer: Create Event Flow

```
Open App → Tap "+" (Create)
  → Option A: "Describe your event" (AI)
     → Type: "Jazz night at Dublin pub, 50 people, €15, next Friday"
     → AI generates: title, description, image, pricing, category
     → Review → Edit if needed → Publish
  → Option B: Manual
     → Event Type (Physical/Virtual/Hybrid)
     → Title + Description
     → Date/Time + Timezone
     → Venue (search or enter address)
     → Ticket Tiers (name, price, quantity)
     → Cover Image (upload or AI-generate)
     → Settings (refund policy, age restriction)
     → Preview → Publish
  → Post-publish: Share sheet (link, QR, social)
```

### 4.2 Attendee: Discover & Book Flow

```
Open App → For You Feed loads (personalized)
  → Scroll vertically (card-based, like Instagram Explore)
  → Tap event card
     → Event Detail Screen (hero image, details, map)
     → Tap "Get Tickets"
        → Select tier + quantity
        → Add friends (group booking)
        → Apple Pay / Google Pay / Card
        → Confirmation + Add to Calendar + Wallet
  → OR: Tap Map icon → see nearby events on map
  → OR: Search by keyword/date/category
```

### 4.3 Promoter: Promote & Earn Flow

```
Open App → Promoter Dashboard
  → Browse "Hot Events" (high commission, trending)
  → Tap event → See commission % and terms
  → Tap "Promote This"
     → Get unique link + QR code
     → Share to Instagram/TikTok/WhatsApp/Twitter
  → Track clicks + conversions in real-time
  → Earnings accumulate → Tap "Cash Out"
     → Instant transfer to bank via Stripe Connect
```

---

## 5. MOBILE UI/UX DESIGN

### 5.1 Design System

**Typography:**
- Display: SF Pro Display (iOS) / Google Sans (Android)
- Body: Inter
- Mono: JetBrains Mono (for prices/codes)

**Color Palette:**

```
Primary:     #FF6B35 (Warm Orange — energy, excitement)
Secondary:   #1A1A2E (Deep Navy — trust, premium)
Accent:      #6C63FF (Electric Purple — discovery, AI)
Success:     #00C48C (Mint Green)
Warning:     #FFB800 (Gold)
Error:       #FF4757 (Coral Red)
Surface:     #FAFBFC (Light) / #0D0D14 (Dark)
Card:        #FFFFFF (Light) / #1A1A2E (Dark)
```

**Spacing:** 4px grid system (4, 8, 12, 16, 24, 32, 48, 64)

**Border Radius:**
- Cards: 20px
- Buttons: 14px (standard) / 999px (pill)
- Inputs: 12px
- Avatars: 50% (circle)

**Shadows:**
- Card: 0 4px 24px rgba(0,0,0,0.06)
- Elevated: 0 12px 48px rgba(0,0,0,0.12)
- Button hover: 0 8px 32px rgba(255,107,53,0.3)

**Motion:**
- Duration: 200ms (micro), 400ms (page), 600ms (celebration)
- Easing: cubic-bezier(0.25, 0.1, 0.25, 1)
- Haptic feedback on key actions (book, pay, scan)

### 5.2 Screen-by-Screen Design

#### SCREEN 1: Splash / Onboarding

```
┌─────────────────────────────────┐
│                                 │
│      [Animated Logo]            │
│      LSPTicketHive              │
│                                 │
│   ─── Swipeable Cards ───       │
│                                 │
│   Card 1: "Discover events      │
│   you'll actually love"         │
│   [Illustration: people at      │
│    concert with AI sparkles]    │
│                                 │
│   Card 2: "Book in 3 taps"     │
│   [Phone mockup with ticket]    │
│                                 │
│   Card 3: "Earn by promoting"   │
│   [Dashboard with earnings]     │
│                                 │
│   ● ○ ○  (page dots)           │
│                                 │
│   [━━━━ Get Started ━━━━]       │
│   [Already have account? Login] │
│                                 │
└─────────────────────────────────┘
```

#### SCREEN 2: Home / For You Feed (Attendee)

```
┌─────────────────────────────────┐
│ ☰  [Search bar ...]    🔔  👤  │
│─────────────────────────────────│
│ [For You] [This Week] [Nearby]  │
│─────────────────────────────────│
│ ┌─────────────────────────────┐ │
│ │ ┌───────────────────────┐   │ │
│ │ │                       │   │ │
│ │ │   [Event Hero Image]  │   │ │
│ │ │                       │   │ │
│ │ │   🟢 LIVE  250 going  │   │ │
│ │ └───────────────────────┘   │ │
│ │ Sunset Jazz Festival        │ │
│ │ 📅 Fri, Jun 20 · 7:00 PM   │ │
│ │ 📍 The Grand Dublin         │ │
│ │ From €25 · ❤️ 2 friends     │ │
│ │                    [Book →] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [Next event card...]        │ │
│ └─────────────────────────────┘ │
│                                 │
│─────────────────────────────────│
│ 🏠   🗺️   ➕   💬   👤       │
│ Home  Map Create Chat Profile   │
└─────────────────────────────────┘
```

#### SCREEN 3: Event Detail

```
┌─────────────────────────────────┐
│ [← Back]              [⋯] [♡]  │
│                                 │
│ ┌───────────────────────────┐   │
│ │                           │   │
│ │     [Hero Image/Video]    │   │
│ │     (parallax scroll)     │   │
│ │                           │   │
│ └───────────────────────────┘   │
│                                 │
│ Sunset Jazz Festival            │
│ ⭐ 4.8 (124 reviews)           │
│                                 │
│ ┌─────┐ ┌─────┐ ┌─────┐       │
│ │ 📅  │ │ 🕖  │ │ 📍  │       │
│ │Jun20│ │7 PM │ │1.2km│       │
│ └─────┘ └─────┘ └─────┘       │
│                                 │
│ ── About ──                     │
│ An evening of world-class jazz  │
│ under the stars. Featuring...   │
│ [Read more]                     │
│                                 │
│ ── Who's Going (47) ──          │
│ [👤][👤][👤][👤] +43 others    │
│ 🟢 Sarah & Mike are going      │
│                                 │
│ ── Location ──                  │
│ ┌───────────────────────────┐   │
│ │ [Interactive Map Preview] │   │
│ └───────────────────────────┘   │
│                                 │
│ ── Organizer ──                 │
│ [Avatar] Dublin Events Co.      │
│ ⭐ 4.9 · 89 events hosted      │
│                                 │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ From €25    [━━ Get Tickets ━━] │
└─────────────────────────────────┘
```

#### SCREEN 4: Ticket Selection & Checkout

```
┌─────────────────────────────────┐
│ [← Back]    Select Tickets      │
│─────────────────────────────────│
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎫 Early Bird        €25   │ │
│ │ Limited · 12 left           │ │
│ │ [−] 2 [+]                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎫 General Admission  €35  │ │
│ │ Includes 1 drink           │ │
│ │ [−] 0 [+]                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⭐ VIP Experience     €75  │ │
│ │ Front row + backstage      │ │
│ │ [−] 0 [+]                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ── Add Friends ──               │
│ [+] Invite friends to join      │
│                                 │
│ ── Promo Code ──                │
│ [Enter code...]                 │
│                                 │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ 2 tickets · €50                 │
│ + €1.00 service fee             │
│ ─────────────────               │
│ Total: €51.00                   │
│                                 │
│ [━━━━ Pay with Apple Pay ━━━━]  │
│ or pay with card                │
└─────────────────────────────────┘
```

#### SCREEN 5: Organizer Dashboard

```
┌─────────────────────────────────┐
│ ☰  Dashboard            🔔 ⚙️  │
│─────────────────────────────────│
│                                 │
│ Good morning, Samuel 👋         │
│                                 │
│ ┌──────────┐ ┌──────────┐      │
│ │ €12,450  │ │ 847      │      │
│ │ Revenue  │ │ Tickets   │      │
│ │ ↑ 23%    │ │ Sold      │      │
│ └──────────┘ └──────────┘      │
│ ┌──────────┐ ┌──────────┐      │
│ │ 12       │ │ 4.9⭐    │      │
│ │ Events   │ │ Rating    │      │
│ │ Active   │ │           │      │
│ └──────────┘ └──────────┘      │
│                                 │
│ ── Revenue Chart ──             │
│ ┌───────────────────────────┐   │
│ │ 📈 [Line chart - 30 days]│   │
│ └───────────────────────────┘   │
│                                 │
│ ── Upcoming Events ──           │
│ ┌─────────────────────────────┐ │
│ │ [img] Jazz Festival         │ │
│ │       Jun 20 · 45/50 sold  │ │
│ │       ███████████░ 90%      │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ [img] Tech Meetup           │ │
│ │       Jun 25 · 28/100 sold │ │
│ │       ███░░░░░░░░ 28%      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ── AI Insights ──               │
│ 💡 "Your Jazz event is 90%     │
│    sold. Consider adding 10     │
│    VIP tickets at €85."         │
│    [Apply Suggestion]           │
│                                 │
│─────────────────────────────────│
│ 📊  📅  ➕  💰  👤            │
│Dash Events Create Revenue Me    │
└─────────────────────────────────┘
```

#### SCREEN 6: Promoter Dashboard

```
┌─────────────────────────────────┐
│ ☰  Promoter Hub          🔔 ⚙️ │
│─────────────────────────────────│
│                                 │
│ ── This Month ──                │
│ ┌───────────────────────────┐   │
│ │ €2,340                    │   │
│ │ Total Earnings            │   │
│ │ ↑ 45% vs last month      │   │
│ │                           │   │
│ │ [━━━ Cash Out Now ━━━]    │   │
│ └───────────────────────────┘   │
│                                 │
│ ┌────────┐┌────────┐┌────────┐ │
│ │ 1,245  ││ 89     ││ 7.1%   │ │
│ │ Clicks ││ Sales  ││ Conv.  │ │
│ └────────┘└────────┘└────────┘ │
│                                 │
│ ── Hot Events to Promote ──     │
│ ┌─────────────────────────────┐ │
│ │ 🔥 Dublin NYE Party        │ │
│ │ Commission: 15% (€7.50/tkt)│ │
│ │ Avg. promoter earns: €890  │ │
│ │ [Get My Link]              │ │
│ └─────────────────────────────┘ │
│                                 │
│ ── Leaderboard ──               │
│ 🥇 @PromoKing    €8,450       │
│ 🥈 @EventQueen   €6,230       │
│ 🥉 @You          €2,340 ← You │
│                                 │
│ ── AI Suggestions ──            │
│ 🤖 "Post about Dublin NYE at   │
│    6PM today — your audience    │
│    engages most then"           │
│                                 │
│─────────────────────────────────│
│ 🏠  🔗  📊  💰  👤            │
│Home Links Stats Earnings Me     │
└─────────────────────────────────┘
```

#### SCREEN 7: AI Event Creator

```
┌─────────────────────────────────┐
│ [← Back]    AI Event Creator    │
│─────────────────────────────────│
│                                 │
│ ┌───────────────────────────┐   │
│ │ ✨ Describe your event... │   │
│ │                           │   │
│ │ "Saturday night rooftop   │   │
│ │  DJ party, Dublin, 200    │   │
│ │  people, €20 tickets"     │   │
│ │                           │   │
│ └───────────────────────────┘   │
│                                 │
│ [━━━ Generate Event ━━━]        │
│                                 │
│ ── AI Generated Preview ──      │
│ ┌───────────────────────────┐   │
│ │ [AI-generated cover image]│   │
│ │                           │   │
│ │ Rooftop Beats Dublin 🎧   │   │
│ │                           │   │
│ │ 📅 Sat, Jun 21 · 9 PM    │   │
│ │ 📍 Sky Bar, Dublin 2      │   │
│ │                           │   │
│ │ Description:              │   │
│ │ "Join us for an           │   │
│ │ unforgettable night..."   │   │
│ │                           │   │
│ │ Tickets:                  │   │
│ │ • Early Bird: €15 (50)    │   │
│ │ • General: €20 (120)      │   │
│ │ • VIP Table: €50 (30)     │   │
│ │                           │   │
│ │ Tags: #nightlife #dj      │   │
│ │       #rooftop #dublin    │   │
│ └───────────────────────────┘   │
│                                 │
│ [Edit Details]  [━ Publish ━]   │
│                                 │
└─────────────────────────────────┘
```

---

## 6. DATABASE SCHEMA

```sql
-- Core Tables

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255),
    full_name       VARCHAR(255) NOT NULL,
    avatar_url      TEXT,
    role            VARCHAR(20) DEFAULT 'attendee', -- attendee, organizer, promoter, admin
    stripe_account_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    email_verified  BOOLEAN DEFAULT FALSE,
    phone_verified  BOOLEAN DEFAULT FALSE,
    preferences     JSONB DEFAULT '{}',
    location        GEOGRAPHY(POINT, 4326),
    locale          VARCHAR(10) DEFAULT 'en',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    logo_url        TEXT,
    description     TEXT,
    website         VARCHAR(255),
    verified        BOOLEAN DEFAULT FALSE,
    rating          DECIMAL(3,2) DEFAULT 0,
    total_events    INTEGER DEFAULT 0,
    owner_id        UUID REFERENCES users(id),
    stripe_account_id VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE org_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) DEFAULT 'member', -- owner, admin, member, scanner
    invited_at      TIMESTAMPTZ DEFAULT NOW(),
    accepted_at     TIMESTAMPTZ,
    UNIQUE(org_id, user_id)
);

CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID REFERENCES organizations(id),
    title           VARCHAR(500) NOT NULL,
    slug            VARCHAR(500) UNIQUE NOT NULL,
    description     TEXT,
    short_desc      VARCHAR(300),
    cover_image_url TEXT,
    gallery         JSONB DEFAULT '[]',
    event_type      VARCHAR(20) DEFAULT 'physical', -- physical, virtual, hybrid
    category        VARCHAR(50),
    tags            TEXT[],
    status          VARCHAR(20) DEFAULT 'draft', -- draft, published, cancelled, completed
    
    -- Date/Time
    starts_at       TIMESTAMPTZ NOT NULL,
    ends_at         TIMESTAMPTZ,
    timezone        VARCHAR(50) DEFAULT 'UTC',
    
    -- Location
    venue_name      VARCHAR(255),
    address         TEXT,
    city            VARCHAR(100),
    country         VARCHAR(100),
    location        GEOGRAPHY(POINT, 4326),
    
    -- Virtual
    stream_url      TEXT,
    stream_platform VARCHAR(50),
    
    -- Settings
    capacity        INTEGER,
    age_restriction INTEGER,
    refund_policy   VARCHAR(20) DEFAULT 'flexible', -- flexible, strict, none
    is_private      BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,
    
    -- Metrics (denormalized for speed)
    tickets_sold    INTEGER DEFAULT 0,
    revenue_cents   BIGINT DEFAULT 0,
    views           INTEGER DEFAULT 0,
    saves           INTEGER DEFAULT 0,
    
    -- AI
    ai_generated    BOOLEAN DEFAULT FALSE,
    ai_score        DECIMAL(3,2), -- predicted success score
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    published_at    TIMESTAMPTZ
);

CREATE TABLE ticket_tiers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    price_cents     INTEGER NOT NULL, -- 0 for free
    currency        VARCHAR(3) DEFAULT 'EUR',
    quantity        INTEGER NOT NULL,
    sold            INTEGER DEFAULT 0,
    max_per_order   INTEGER DEFAULT 10,
    sale_starts     TIMESTAMPTZ,
    sale_ends       TIMESTAMPTZ,
    tier_type       VARCHAR(20) DEFAULT 'general', -- free, early_bird, general, vip, platinum
    perks           JSONB DEFAULT '[]',
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    event_id        UUID REFERENCES events(id),
    status          VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, refunded, cancelled
    subtotal_cents  INTEGER NOT NULL,
    fee_cents       INTEGER NOT NULL, -- platform fee
    total_cents     INTEGER NOT NULL,
    currency        VARCHAR(3) DEFAULT 'EUR',
    payment_intent_id VARCHAR(255),
    payment_method  VARCHAR(50),
    promo_code_id   UUID REFERENCES promo_codes(id),
    promoter_id     UUID REFERENCES users(id),
    refunded_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tickets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id),
    event_id        UUID REFERENCES events(id),
    tier_id         UUID REFERENCES ticket_tiers(id),
    user_id         UUID REFERENCES users(id),
    attendee_name   VARCHAR(255),
    attendee_email  VARCHAR(255),
    qr_code         VARCHAR(255) UNIQUE NOT NULL,
    status          VARCHAR(20) DEFAULT 'valid', -- valid, used, cancelled, transferred
    checked_in_at   TIMESTAMPTZ,
    checked_in_by   UUID REFERENCES users(id),
    transferred_from UUID REFERENCES users(id),
    resale_listing_id UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE promo_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID REFERENCES events(id),
    code            VARCHAR(50) NOT NULL,
    discount_type   VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed
    discount_value  INTEGER NOT NULL,
    max_uses        INTEGER,
    used_count      INTEGER DEFAULT 0,
    valid_from      TIMESTAMPTZ,
    valid_until     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, code)
);

-- Promoter System

CREATE TABLE promoter_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id     UUID REFERENCES users(id),
    event_id        UUID REFERENCES events(id),
    link_code       VARCHAR(20) UNIQUE NOT NULL,
    commission_pct  DECIMAL(5,2) NOT NULL, -- e.g., 10.00 = 10%
    clicks          INTEGER DEFAULT 0,
    conversions     INTEGER DEFAULT 0,
    earnings_cents  BIGINT DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(promoter_id, event_id)
);

CREATE TABLE promoter_payouts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id     UUID REFERENCES users(id),
    amount_cents    BIGINT NOT NULL,
    currency        VARCHAR(3) DEFAULT 'EUR',
    status          VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    stripe_transfer_id VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- Social Features

CREATE TABLE follows (
    follower_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE event_saves (
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, event_id)
);

CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID REFERENCES events(id),
    user_id         UUID REFERENCES users(id),
    rating          INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID REFERENCES events(id),
    sender_id       UUID REFERENCES users(id),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty & Rewards

CREATE TABLE loyalty_points (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    points          INTEGER NOT NULL,
    reason          VARCHAR(50), -- attendance, referral, review, streak
    reference_id    UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Resale Marketplace

CREATE TABLE resale_listings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id       UUID REFERENCES tickets(id),
    seller_id       UUID REFERENCES users(id),
    price_cents     INTEGER NOT NULL,
    max_price_cents INTEGER, -- price cap (original + 20%)
    status          VARCHAR(20) DEFAULT 'active', -- active, sold, cancelled
    buyer_id        UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    sold_at         TIMESTAMPTZ
);

-- Indexes

CREATE INDEX idx_events_location ON events USING GIST (location);
CREATE INDEX idx_events_starts_at ON events (starts_at);
CREATE INDEX idx_events_category ON events (category);
CREATE INDEX idx_events_status ON events (status);
CREATE INDEX idx_tickets_event ON tickets (event_id);
CREATE INDEX idx_tickets_user ON tickets (user_id);
CREATE INDEX idx_tickets_qr ON tickets (qr_code);
CREATE INDEX idx_orders_user ON orders (user_id);
CREATE INDEX idx_promoter_links_code ON promoter_links (link_code);
CREATE INDEX idx_users_location ON users USING GIST (location);
```

---

## 7. API ARCHITECTURE

### 7.1 RESTful API Structure

```
BASE: /api/v1

── AUTH ──
POST   /auth/register
POST   /auth/login
POST   /auth/login/social          (Google, Apple, Facebook)
POST   /auth/forgot-password
POST   /auth/verify-email
POST   /auth/refresh-token
DELETE /auth/logout

── USERS ──
GET    /users/me
PATCH  /users/me
GET    /users/:id/public
GET    /users/me/tickets
GET    /users/me/orders
GET    /users/me/events-attending
GET    /users/me/loyalty

── EVENTS ──
GET    /events                     (feed, search, filter)
GET    /events/nearby              (geo-based)
GET    /events/recommended         (AI personalized)
GET    /events/:id
POST   /events                     (create)
PATCH  /events/:id                 (update)
DELETE /events/:id
POST   /events/:id/publish
GET    /events/:id/analytics
GET    /events/:id/attendees
GET    /events/:id/messages

── AI ──
POST   /ai/generate-event          (text → event)
POST   /ai/generate-description    (enhance description)
POST   /ai/suggest-pricing         (smart pricing)
POST   /ai/generate-image          (cover art)
POST   /ai/marketing-copy          (ads, emails, captions)

── TICKETS ──
GET    /events/:id/tiers
POST   /events/:id/tiers           (create tier)
PATCH  /tiers/:id
DELETE /tiers/:id

── ORDERS ──
POST   /orders                     (create order + payment)
GET    /orders/:id
POST   /orders/:id/refund
GET    /orders/:id/tickets

── CHECKIN ──
POST   /checkin/scan               (QR code → validate)
GET    /events/:id/checkin-stats

── PROMOTERS ──
GET    /promoter/dashboard
GET    /promoter/events             (events available to promote)
POST   /promoter/events/:id/link   (generate promo link)
GET    /promoter/links
GET    /promoter/earnings
POST   /promoter/payout

── SOCIAL ──
POST   /events/:id/save
DELETE /events/:id/save
POST   /users/:id/follow
DELETE /users/:id/follow
GET    /feed/friends               (friend activity)
POST   /events/:id/messages

── RESALE ──
POST   /resale/list                (list ticket for resale)
GET    /resale/event/:id           (available resale tickets)
POST   /resale/:id/buy
DELETE /resale/:id                 (cancel listing)

── ORGANIZATIONS ──
POST   /organizations
GET    /organizations/:id
PATCH  /organizations/:id
GET    /organizations/:id/events
POST   /organizations/:id/invite
```

### 7.2 WebSocket Events (Real-time)

```
── Client → Server ──
join_event_chat:{eventId}
send_message:{eventId, content}
join_dashboard:{eventId}

── Server → Client ──
new_message:{eventId, message}
ticket_sold:{eventId, count, revenue}
checkin:{eventId, attendeeName}
promoter_sale:{linkId, commission}
```

---

## 8. SECURITY ARCHITECTURE

| Layer | Protection |
|-------|-----------|
| Transport | TLS 1.3, HSTS, certificate pinning (mobile) |
| Auth | JWT with RS256, refresh rotation, device binding |
| Passwords | Argon2id hashing |
| API | Rate limiting (100/min), request signing, CORS |
| Payments | PCI DSS via Stripe (never touch card data) |
| Data | AES-256 encryption at rest, field-level for PII |
| Tickets | Cryptographically signed QR codes (Ed25519) |
| Resale | Price cap enforcement server-side, identity verification |
| Fraud | ML model: velocity checks, device fingerprinting, geo-anomaly |
| DDoS | AWS Shield + WAF + CloudFront |
| Secrets | AWS Secrets Manager, rotated quarterly |
| Access | RBAC + ABAC, principle of least privilege |
| Audit | Immutable audit log for all financial transactions |
| GDPR | Data export API, right to delete, consent management |

---

## 9. AWS CLOUD ARCHITECTURE

```
┌─────────────────── AWS Global ───────────────────┐
│                                                   │
│  Route53 (DNS) → CloudFront (CDN)                │
│       │                  │                        │
│       ▼                  ▼                        │
│  ┌─────────────────────────────┐                 │
│  │     ALB (Application LB)    │                 │
│  └──────────┬──────────────────┘                 │
│             │                                     │
│  ┌──────────▼──────────────────┐                 │
│  │   ECS Fargate Cluster       │                 │
│  │  ┌─────┐┌─────┐┌─────┐    │                 │
│  │  │API  ││API  ││API  │    │  Auto-scaling   │
│  │  │ x1  ││ x2  ││ x3  │    │  2-50 tasks     │
│  │  └─────┘└─────┘└─────┘    │                 │
│  │  ┌─────────┐ ┌──────────┐  │                 │
│  │  │Worker   │ │WebSocket │  │                 │
│  │  │Service  │ │Service   │  │                 │
│  │  └─────────┘ └──────────┘  │                 │
│  └─────────────────────────────┘                 │
│             │                                     │
│  ┌──────────▼──────────────────────────────┐     │
│  │              DATA LAYER                  │     │
│  │                                          │     │
│  │  RDS Aurora    ElastiCache   OpenSearch  │     │
│  │  PostgreSQL    Redis Cluster  (search)   │     │
│  │  (Multi-AZ)   (6 nodes)                 │     │
│  │                                          │     │
│  │  S3           MSK (Kafka)    DynamoDB   │     │
│  │  (media)      (events)       (sessions) │     │
│  └──────────────────────────────────────────┘     │
│                                                   │
│  ┌──────────────────────────────────────────┐     │
│  │              AI/ML LAYER                  │     │
│  │                                           │     │
│  │  SageMaker     Bedrock       Rekognition │     │
│  │  (recommend)   (text gen)    (moderation)│     │
│  └──────────────────────────────────────────┘     │
│                                                   │
│  ┌──────────────────────────────────────────┐     │
│  │           SUPPORTING SERVICES             │     │
│  │                                           │     │
│  │  SES (email)  SNS (push)   Pinpoint(SMS)│     │
│  │  Lambda       Step Functions  EventBridge│     │
│  │  Cognito      Secrets Mgr    CloudWatch  │     │
│  └──────────────────────────────────────────┘     │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Scaling Strategy:**
- API: ECS Fargate auto-scales 2→50 tasks (CPU > 60%)
- Database: Aurora read replicas + connection pooling (PgBouncer)
- Cache: Redis Cluster with 6 nodes (3 primary, 3 replica)
- CDN: CloudFront in 400+ edge locations
- Media: S3 + CloudFront + Lambda@Edge for image transforms
- Search: OpenSearch with 3 data nodes, auto-scaling

**Multi-Region Plan (Phase 3):**
- Primary: eu-west-1 (Ireland)
- Secondary: us-east-1 (Virginia)
- APAC: ap-southeast-1 (Singapore)
- Aurora Global Database for cross-region replication

---

## 10. MONETIZATION MODEL

### Revenue Streams

| Stream | Model | Projection (Year 2) |
|--------|-------|---------------------|
| Platform Fee | 2% per ticket sold | 60% of revenue |
| Organizer Subscriptions | Pro €29/mo, Business €99/mo | 20% of revenue |
| Promoted Events | Pay to boost in feed | 10% of revenue |
| Promoter Payouts | 0.5% processing on payouts | 3% of revenue |
| Sponsorship Marketplace | 10% of sponsorship deals | 5% of revenue |
| Premium Attendee | VIP membership €9.99/mo | 2% of revenue |

### Pricing Tiers

**Free (Organizer):**
- Unlimited free events
- Paid events: 2% + €0.50/ticket
- Basic analytics
- Email support

**Pro — €29/month (Organizer):**
- 1.5% + €0.30/ticket
- AI Event Creator (10/month)
- Advanced analytics
- Custom event pages
- Email marketing (5,000/month)
- Priority support

**Business — €99/month (Organizer):**
- 1% + €0.20/ticket
- Unlimited AI features
- Full analytics + forecasting
- Multi-organizer teams
- API access
- Phone support
- Custom branding
- Sponsor management

**Enterprise — Custom:**
- Volume discounts
- Dedicated account manager
- SLA guarantees
- White-label option
- Custom integrations

### Competitive Pricing Comparison

| Platform | Fee | Our Advantage |
|----------|-----|---------------|
| Eventbrite | 6.95% + €0.79/ticket | 3.5x cheaper |
| Ticketmaster | 15-25% | 10x cheaper |
| Universe | 5% + €0.79 | 2.5x cheaper |
| LSPTicketHive | 2% + €0.50 | Industry lowest |

---

## 11. VIRAL GROWTH STRATEGY

### Growth Loops

**Loop 1: Event Sharing (Organic)**
```
Attendee buys ticket → Gets shareable card → Posts to stories
→ Friends see → Discover event → Buy tickets → Share again
```

**Loop 2: Promoter Network (Incentivized)**
```
Promoter joins → Shares events → Earns commission
→ Recruits sub-promoters → Network grows → More sales
```

**Loop 3: Organizer Success (Product-led)**
```
Organizer creates event → Sells out fast → Tells other organizers
→ New organizer joins → Creates events → More attendees discover platform
```

**Loop 4: Group Booking (Social)**
```
Person books → Invites friends → Friends join platform
→ See more events → Book more → Invite more friends
```

### Tactical Growth Initiatives

1. **"First event free" for organizers** — zero fees on first €1,000 in sales
2. **Promoter onboarding bonus** — earn €50 on first 10 sales
3. **Referral program** — €10 credit for inviter + invitee
4. **Event embed widgets** — organizers embed ticket sales on their site
5. **Social proof notifications** — "Sarah just bought 2 tickets"
6. **Scarcity engine** — "3 tickets left" / "12 people viewing"
7. **Post-event sharing** — auto-generated memory cards to share
8. **University ambassador program** — free Pro plan for student orgs
9. **Integration partnerships** — Spotify (events from artists you follow), Instagram (event stories)
10. **SEO event pages** — every event is a Google-indexed page

---

## 12. COMPETITIVE ADVANTAGES OVER EVENTBRITE

| Dimension | Eventbrite | LSPTicketHive |
|-----------|-----------|---------------|
| Fees | 6.95% + €0.79 | 2% + €0.50 |
| Design | Dated (2012 era) | Apple-premium (2026) |
| Mobile | Functional | Native, buttery smooth |
| AI | None | Full AI suite |
| Discovery | SEO only | TikTok-style feed + map |
| Social | None | Friends, chat, activity |
| Promoters | Basic affiliates | Full promoter economy |
| Payouts | 5-7 business days | Same-day / instant |
| Personalization | Basic categories | ML-powered For You |
| Resale | Not supported | Built-in safe marketplace |
| Analytics | Basic charts | AI-powered insights |
| Networking | None | Event-based connections |
| Rewards | None | Loyalty points system |
| Event creation | 15 min form | 30 sec with AI |
| Check-in | Basic scanner | Offline-capable, fast |

---

## 13. MVP PLAN (12 Weeks)

### Week 1-4: Foundation

- [ ] Auth (email, Google, Apple login)
- [ ] User profiles (attendee, organizer, promoter roles)
- [ ] Event CRUD (create, read, update, publish)
- [ ] Ticket tiers (create, configure pricing)
- [ ] Stripe integration (checkout, payouts)
- [ ] Basic event page (public, SEO-friendly)

### Week 5-8: Core Experience

- [ ] Event discovery feed (cards, filters)
- [ ] Map-based discovery (nearby events)
- [ ] Search (keyword, date, category, location)
- [ ] Order flow (select tickets → pay → confirmation)
- [ ] Digital tickets with QR codes
- [ ] QR scanner (check-in app)
- [ ] Organizer dashboard (revenue, ticket sales)
- [ ] Email notifications (confirmation, reminders)

### Week 9-12: Differentiation

- [ ] Promoter links + commission tracking
- [ ] Promoter dashboard (earnings, clicks)
- [ ] AI event creator (text → event)
- [ ] Social: friend activity, event saves
- [ ] Mobile app (React Native, iOS + Android)
- [ ] Group booking
- [ ] Promo codes

### MVP Success Criteria
- 100 events created
- 1,000 tickets sold
- 50 promoters active
- < 3 sec page load
- 4.5+ app store rating
- €10,000 GTV processed

---

## 14. PHASE 2 & PHASE 3 ROADMAP

### Phase 2 (Month 4-9): Growth

- AI marketing assistant (auto-generate ads, emails, social posts)
- Smart pricing engine (dynamic pricing based on demand)
- Event chat (pre/post event messaging)
- Safe resale marketplace
- Loyalty rewards program
- Advanced analytics + forecasting
- Multi-organizer collaboration
- Waitlist management
- SMS marketing
- Event website builder (auto-generated microsites)
- Sponsorship marketplace
- Push notifications (smart timing)
- Apple Wallet + Google Wallet integration
- Offline QR scanning
- Multi-language (10 languages)
- Dark mode

### Phase 3 (Month 10-18): Scale

- Virtual/hybrid event support (streaming integration)
- AI networking (match attendees with similar interests)
- Event memories (AI photo/video compilation)
- VIP membership program
- Vendor marketplace (catering, AV, photographers)
- White-label solution (enterprise)
- API marketplace (third-party integrations)
- Territory management for promoters
- Influencer toolkit
- Advanced fraud detection (ML-based)
- Multi-region deployment (US, APAC)
- Crypto payments
- NFT tickets (optional)
- AR venue navigation
- Accessibility features (screen reader, captions)
- Revenue forecasting AI

---

## 15. INVESTOR PITCH STRATEGY

### Elevator Pitch (30 sec)

"LSPTicketHive is the AI-powered event platform that charges 70% less than Eventbrite while delivering 10x better tools. We combine TikTok-style discovery, Uber-simple booking, and the industry's first promoter economy to create a platform where events sell themselves. We're live, processing tickets, and growing 40% month-over-month."

### Key Metrics to Raise Seed (€2-5M)

| Metric | Target |
|--------|--------|
| Monthly GTV | €500K+ |
| Monthly growth | 30-40% |
| Organizer retention | > 80% |
| NPS | > 60 |
| Take rate | 2-3% |
| CAC payback | < 3 months |
| Events/month | 500+ |

### Investor Targets

**Seed (€2-5M):**
- Sequoia Scout
- Point Nine Capital (Berlin)
- Frontline Ventures (Dublin)
- Seedcamp
- Y Combinator

**Series A (€15-30M):**
- Accel
- Index Ventures
- a16z
- Benchmark

### Pitch Deck Structure (12 slides)

1. Cover: Logo + one-liner
2. Problem: Eventbrite is expensive, dated, and missing social
3. Solution: AI + Social + Low fees = Events that sell themselves
4. Product: Screenshots, demo video
5. Market: $1.5T events industry, $50B ticketing TAM
6. Business Model: 2% take rate, subscription upsell
7. Traction: GTV, growth rate, user testimonials
8. Growth: Viral loops, promoter network, organic SEO
9. Competition: Feature matrix showing clear wins
10. Team: Founders, advisors
11. Financials: Revenue forecast, unit economics
12. Ask: Amount, use of funds, milestones

---

## 16. GO-TO-MARKET PLAN

### Phase 1: Dublin (Month 1-3)

- Target: 50 organizers, 200 events
- Focus: Nightlife, music, food & drink events
- Tactics:
  - Direct outreach to top 50 Dublin event organizers
  - "First €1,000 free" offer
  - University ambassador program (Trinity, UCD, DCU)
  - Partner with 5 popular venues
  - Launch party (own event on own platform)

### Phase 2: Ireland (Month 4-6)

- Target: 500 organizers, 2,000 events
- Expand: Cork, Galway, Limerick
- Tactics:
  - PR campaign (tech media, event industry)
  - Promoter network launch (100 promoters)
  - Partnership: Tourism Ireland, Enterprise Ireland
  - Content: "How to sell out your event" blog/YouTube

### Phase 3: UK + Europe (Month 7-12)

- Target: 5,000 organizers, 20,000 events
- Cities: London, Manchester, Berlin, Amsterdam, Barcelona
- Tactics:
  - Hire city leads per market
  - Localized app (language, currency, regulations)
  - Strategic partnerships with venue networks
  - Paid acquisition (Instagram, TikTok ads)
  - Promoter army in each city

### Phase 4: Global (Month 13-24)

- US launch (NYC, LA, Miami, Austin)
- APAC (Singapore, Sydney, Tokyo)
- LATAM (Mexico City, São Paulo)

---

## 17. REVENUE FORECAST

| Year | Events | Tickets Sold | GTV | Revenue | Costs | Net |
|------|--------|-------------|-----|---------|-------|-----|
| 1 | 5,000 | 200K | €8M | €200K | €600K | -€400K |
| 2 | 50,000 | 2M | €100M | €3M | €2M | €1M |
| 3 | 200,000 | 15M | €750M | €20M | €10M | €10M |
| 4 | 500,000 | 50M | €2.5B | €70M | €30M | €40M |
| 5 | 1,000,000 | 150M | €10B | €250M | €100M | €150M |

**Unit Economics (steady state):**
- Average ticket price: €40
- Platform fee: 2% = €0.80 + €0.50 = €1.30/ticket
- Gross margin: 85%
- CAC (organizer): €50
- LTV (organizer): €2,400 (2 years × €100/month blended)
- LTV/CAC ratio: 48:1

---

## 18. AI FEATURES (UNIQUE DIFFERENTIATORS)

| Feature | Description | Competitor Has? |
|---------|-------------|-----------------|
| AI Event Creator | Describe in 1 sentence → full event page | No |
| Smart Pricing | ML predicts optimal price by demand | No |
| AI Cover Art | Generates event cover images | No |
| Marketing Copilot | Writes ads, emails, Instagram captions | No |
| Demand Forecasting | Predicts ticket sales trajectory | No |
| Attendee Matching | Suggests networking connections | No |
| Fraud Sentinel | Real-time bot/scam detection | Basic |
| Promotion Timing | Tells promoters when to post | No |
| Event Success Score | Rates event before publish | No |
| Smart Notifications | AI picks best time to notify each user | No |
| Review Summarizer | AI summary of all reviews | No |
| Churn Prediction | Warns organizers at risk of leaving | No |

---

## 19. GLOBAL PAYMENT INTEGRATIONS

| Region | Provider | Currencies | Methods |
|--------|----------|-----------|---------|
| Global | Stripe Connect | 135+ currencies | Cards, wallets |
| Europe | SEPA Direct Debit | EUR | Bank transfer |
| Ireland/UK | Open Banking | EUR, GBP | Instant bank pay |
| US | Stripe + ACH | USD | Cards, bank, Venmo |
| LATAM | MercadoPago | BRL, MXN | Local methods |
| Asia | Stripe + Adyen | SGD, JPY, AUD | Cards, GrabPay, PayPay |
| Africa | Flutterwave | NGN, KES, ZAR | M-Pesa, cards |
| Crypto | Coinbase Commerce | BTC, ETH, USDC | Wallet pay |

**Payout Schedule:**
- Free tier: 5 business days
- Pro: 2 business days
- Business: Same-day
- Enterprise: Instant

---

## 20. APP SITEMAP

```
LSPTicketHive App
│
├── Onboarding
│   ├── Splash
│   ├── Walkthrough (3 screens)
│   ├── Role Selection (Attendee/Organizer/Promoter)
│   └── Sign Up / Login
│
├── Attendee Experience
│   ├── Home (For You Feed)
│   ├── Map Discovery
│   ├── Search + Filters
│   ├── Event Detail
│   │   ├── About
│   │   ├── Tickets
│   │   ├── Location
│   │   ├── Organizer
│   │   ├── Reviews
│   │   ├── Who's Going
│   │   └── Chat
│   ├── Checkout
│   │   ├── Ticket Selection
│   │   ├── Group Booking
│   │   ├── Payment
│   │   └── Confirmation
│   ├── My Tickets (Wallet)
│   ├── Activity Feed
│   ├── Messages
│   ├── Notifications
│   └── Profile
│       ├── Edit Profile
│       ├── Order History
│       ├── Saved Events
│       ├── Loyalty Points
│       ├── Settings
│       └── Preferences
│
├── Organizer Experience
│   ├── Dashboard (Home)
│   ├── Events
│   │   ├── Event List
│   │   ├── Create Event
│   │   │   ├── AI Creator
│   │   │   └── Manual Form
│   │   ├── Edit Event
│   │   └── Event Analytics
│   ├── Revenue
│   │   ├── Overview
│   │   ├── Transactions
│   │   └── Payouts
│   ├── Attendees
│   │   ├── Guest List
│   │   ├── Check-in
│   │   └── Messaging
│   ├── Marketing
│   │   ├── Promo Codes
│   │   ├── Email Campaigns
│   │   └── AI Assistant
│   ├── Team
│   │   ├── Members
│   │   └── Roles
│   └── Settings
│       ├── Organization
│       ├── Payment
│       ├── Integrations
│       └── Branding
│
├── Promoter Experience
│   ├── Dashboard (Home)
│   ├── Browse Events
│   ├── My Links
│   ├── Earnings
│   │   ├── Overview
│   │   ├── History
│   │   └── Cash Out
│   ├── Leaderboard
│   ├── AI Suggestions
│   └── Settings
│
└── Shared
    ├── Scanner App (Organizer)
    ├── Notifications Center
    ├── Help & Support
    ├── Legal (Terms, Privacy)
    └── Onboarding Tours
```

---

## 21. DARK MODE & LIGHT MODE

### Light Mode

```
Background:      #FAFBFC
Surface:         #FFFFFF
Text Primary:    #1A1A2E
Text Secondary:  #6B7280
Border:          #E5E7EB
Brand:           #FF6B35
Accent:          #6C63FF
Success:         #00C48C
```

### Dark Mode

```
Background:      #0D0D14
Surface:         #1A1A2E
Text Primary:    #F9FAFB
Text Secondary:  #9CA3AF
Border:          #2D2D3D
Brand:           #FF8C5A (lighter orange for contrast)
Accent:          #8B83FF
Success:         #34D399
```

### Dark Mode Rules
- Cards have subtle 1px border (no shadow)
- Images maintain vibrancy
- Brand orange lightened for accessibility (WCAG AA)
- System preference auto-detect + manual toggle
- Smooth 300ms transition between modes

---

## 22. IMPLEMENTATION PRIORITY

Start building in this order:

1. **Auth + User system** (Week 1)
2. **Event CRUD + Database** (Week 2)
3. **Ticket tiers + Stripe checkout** (Week 3-4)
4. **Event discovery feed** (Week 5)
5. **QR tickets + scanner** (Week 6)
6. **Organizer dashboard** (Week 7)
7. **Promoter system** (Week 8-9)
8. **AI event creator** (Week 10)
9. **Mobile app** (Week 11-12)
10. **Polish + launch** (Week 12)

---

## 23. SUCCESS METRICS

### North Star: Monthly Gross Ticket Volume (GTV)

### Supporting Metrics

| Category | Metric | Target (6 months) |
|----------|--------|-------------------|
| Growth | Monthly active users | 50,000 |
| Growth | Events created/month | 1,000 |
| Revenue | Monthly GTV | €2M |
| Engagement | Tickets sold/month | 50,000 |
| Retention | Organizer 3-month retention | 80% |
| Quality | App store rating | 4.7+ |
| Efficiency | Customer acquisition cost | < €5 (attendee), < €50 (organizer) |
| Virality | K-factor | > 1.2 |
| Speed | Time to first ticket sold | < 24 hours |
| NPS | Net Promoter Score | > 60 |

---

*This is a living document. Update as product evolves.*
*Last updated: 2026-06-16*
