# Where we left off — 4 Oct 2026

## Done
- Code (Stripe Connect, refunds, AUD/Sydney time, migrations, legal pages) is in this folder.
  NOT yet committed/pushed to GitHub.
- **Supabase production project `officebnb-prod`** (Sydney, ref `gmkhxdfurmefoikexnpo`):
  - database migrations applied and verified (incl. new `20260928000100_service_role_grants.sql`)
  - `listing-photos` storage bucket created
  - 4 Edge Functions deployed (JWT verification off — each function checks the login itself)
  - secrets set: SITE_URL, ALLOWED_ORIGINS, STRIPE_SECRET_KEY (test), STRIPE_WEBHOOK_SECRET, STRIPE_CONNECT_WEBHOOK_SECRET
  - Auth Site URL + redirect URL = https://officebnb.vercel.app
- **Stripe (test mode / sandbox)**: two webhook endpoints created pointing at the stripe-webhook function
  (payments events + connected-account `account.updated`).
- **Vercel**: old `VITE_SUPABASE_PUBLISHABLE_KEY` deleted (pointed at the old project).

## Next (you)
1. Push the code: `git rm src/data/listings.ts supabase/schema.sql`, `git add -A`, `git commit`, `git push`
   (or link GitHub in claude.ai → Settings → Connectors and Claude pushes it).
2. Vercel → officebnb → Settings → Environment Variables (type **Config**, Production and Preview):
   - delete old `VITE_SUPABASE_URL`, then add:
   - VITE_SUPABASE_URL = https://gmkhxdfurmefoikexnpo.supabase.co
   - VITE_SUPABASE_PUBLISHABLE_KEY = (Supabase → officebnb-prod → Settings → API Keys → Publishable key)
   - VITE_STRIPE_PUBLISHABLE_KEY = (Stripe → Developers → API keys → Publishable key, pk_test_…)
   - VITE_BUSINESS_LEGAL_NAME, VITE_BUSINESS_ABN, VITE_SUPPORT_EMAIL
3. Redeploy (happens automatically on push).
4. Test booking with card 4242 4242 4242 4242 (DEPLOY.md step 9).
