# Tenbao

(Repo: `app-for-ten`.) A tiny Shopee/Taobao-style marketplace for a private group of up to ten people.
Members can list items, browse, add to cart, and place orders.

**Stack:** Next.js (App Router) · Supabase (Auth + Postgres) · Tailwind CSS · deploy on Vercel

## Setup

1. **Create a Supabase project** (free) at [supabase.com](https://supabase.com).
2. **Create the database:** in the Supabase dashboard open *SQL Editor*, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click *Run*.
3. **(Optional) Skip email confirmation:** *Authentication → Sign In / Providers → Email*, turn off
   "Confirm email" so members can log in right after signing up.
4. **Add your keys:** copy `.env.example` to `.env.local` and fill in the values from
   *Project Settings → API* (the publishable key or the legacy anon key both work).
5. **Run it:**

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:3000.

## Deploy

Import the repo on [vercel.com](https://vercel.com), add the same two environment variables,
and deploy. Every push to `main` redeploys automatically.

## How it works

| Page | What it does |
| --- | --- |
| `/login` | Email + password log in / sign up |
| `/` | All products |
| `/products/[id]` | Product details, add to cart |
| `/cart` | Change quantities, place order |
| `/orders` | Your past orders |
| `/sell` | List new items, delete your listings, add demo items |

- Every page except `/login` requires being logged in (`src/proxy.ts`).
- Sign-up is capped at **10 members** by a database trigger in `supabase/schema.sql`.
- Row Level Security makes sure members only see their own cart and orders, and can only edit
  their own listings.
- **Add 30 demo items** on `/sell` fills the shop with sample products from
  [DummyJSON](https://dummyjson.com), listed under your account. Running it again skips items you
  already have.
- Checkout runs as one database function (`checkout()`), so the order, the stock change, and
  emptying the cart all happen together.
