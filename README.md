# AdilStore

A fair, ad-free, privacy-first app store competing with Google Play and Apple App Store.

## Principles

1. **Zero pay-to-win** — ranking is purely merit-based, no promoted placements, ever
2. **No ads** — we will never sell visibility
3. **Radical ease of sharing** — sharing an app should feel like sending a WhatsApp link
4. **Developer-first fairness** — submitting an app should not require bureaucratic hoops

## Tech Stack

- **Frontend**: Vanilla JS + Vite (ES modules, no framework lock-in)
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Hosting**: GitHub Pages (static) / Vercel (with SSR later)
- **Database**: PostgreSQL via Supabase

## Project Structure

```
AdilStore/
├── index.html              # App shell (Vite entry)
├── src/
│   ├── main.js             # Boot: router, auth, data loading
│   ├── components/         # Reusable UI components
│   │   ├── Header.js
│   │   ├── AppCard.js
│   │   ├── SearchBar.js
│   │   ├── Filters.js
│   │   ├── FeaturedRow.js
│   │   ├── HeroSection.js
│   │   └── Footer.js
│   ├── pages/              # Route-level page renderers
│   │   ├── HomePage.js
│   │   ├── AppDetailPage.js
│   │   ├── LoginPage.js
│   │   ├── RegisterPage.js
│   │   ├── DeveloperPortalPage.js
│   │   ├── SubmitAppPage.js
│   │   └── AdminReviewPage.js
│   ├── lib/                # Core modules
│   │   ├── supabase.js     # Supabase client
│   │   ├── router.js       # Hash-based SPA router
│   │   ├── state.js        # Reactive state store
│   │   ├── auth.js         # Authentication
│   │   ├── api.js          # Data access layer
│   │   ├── i18n.js         # Internationalization (EN/TR)
│   │   └── sanitize.js     # XSS prevention
│   ├── data/
│   │   └── fallback-apps.js # Offline fallback data
│   └── styles/
│       └── main.css        # Design system
├── supabase/
│   └── migrations/         # Database schema
│       ├── 001_core_schema.sql
│       ├── 002_ranking_function.sql
│       └── 003_seed_legacy_data.sql
├── icons/                  # App icons
├── public/                 # Static assets
└── index.legacy.html       # Original monolith (preserved)
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Database Setup

Apply migrations to your Supabase project in order:

```bash
# Via Supabase CLI
supabase db push

# Or manually via SQL editor in Supabase dashboard:
# 1. Run supabase/migrations/001_core_schema.sql
# 2. Run supabase/migrations/002_ranking_function.sql
# 3. Run supabase/migrations/003_seed_legacy_data.sql
```

## Fair Ranking Algorithm

The ranking score is computed every 6 hours using this formula:

```
rank_score =
  (install_velocity_7d * 0.20)   — recent growth momentum
+ (review_engagement   * 0.25)   — quality signal from real users
+ (review_score        * 0.20)   — average rating weighted by volume
+ (update_recency      * 0.15)   — actively maintained apps rank higher
+ (report_penalty      * -0.30)  — problematic apps get deprioritized
+ (dev_responsiveness  * 0.10)   — developers who reply to reviews rank higher
```

Anti-manipulation rules:
- Install spikes >3x weekly average are flagged and dampened by 50%
- No factor is purchasable — there is no promoted placement
- Review volume uses logarithmic weighting to prevent gaming

## License

GPL-3.0
