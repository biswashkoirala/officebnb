# Where we left off — 4 Oct 2026

## Done
- Code pushed to GitHub main (commit d663012, 4 Oct). Vercel deployed it and GitHub CI passed.
  Your local folder has the same files but its git history is behind: run
  `git fetch origin` then `git reset origin/main` (keeps your files, just syncs history).
- **Supabase production project `officebnb-prod`** (Sydney, ref `gmkhxdfurmefoikexnpo`):
  - database migrations applied and verified (incl. new `20260928000100_service_role_grants.sql`)
  - `listing-photos` storage bucket created
  - 4 Edge Functions deployed (JWT verification off — each function checks the login itself)
  - secrets set: SITE_URL, ALLOWED_ORIGINS, STRIPE_SECRET_KEY (test), STRIPE_WEBHOOK_SECRET, STRIPE_CONNECT_WEBHOOK_SECRET
  - Auth Site URL + redirect URL = https://officebnb.vercel.app
- **Stripe (test mode / sandbox)**: two webhook endpoints created pointing at the stripe-webhook function
  (payments events + connected-account `account.updated`).
- **Vercel**: environment variables updated to the new Supabase project + Stripe test key.

## Next
1. Run the test-mode checklist on https://officebnb.vercel.app (DEPLOY.md step 9):
   owner signs up → Set up payouts (Stripe test onboarding) → list a space →
   renter books with card 4242 4242 4242 4242 → check confirmation, refunds, double-booking.
2. Then go live (DEPLOY.md step 10): Stripe business verification with your ABN,
   live keys + live webhooks, legal page review.
