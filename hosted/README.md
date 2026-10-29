# AgentSketch hosted workspace

The Next.js application in this directory replaces the blueprint-only experience with account-based agent creation, execution, saved results, paid capacity, and private read-only sources. The existing GitHub Pages website is preserved in `../docs/` until the hosted app has passed deployment testing.

## Implemented

- Monochrome, responsive workspace with six starter templates and a three-step agent builder.
- Supabase email/password sign-in, email confirmation, password recovery, private saved agents, editing/deletion, and run history.
- Text/Markdown/CSV/JSON reference import and result downloads.
- Authenticated `/api/run` backed by the eve agent runtime and Vercel AI Gateway. It checks ownership and reserves quota before starting model work, deduplicates request IDs, cancels timed-out sessions, and preserves results if history persistence fails.
- Free: one agent and ten attempts per UTC day. Pro: twenty agents, one hundred attempts per UTC day, and private app sources. Quotas are serialized in the database and cannot be changed from the browser.
- Public GitHub repository tool. Pro source adapters for a private GitHub repository (15 recent issues/PRs), a Slack channel (15 recent messages), and an Airtable table (25 records). All are read-only. Users explicitly enable a saved source on each agent. Credentials are AES-256-GCM encrypted with user/provider binding and never included in model prompts.
- Stripe Checkout, subscription portal, signed webhooks, and idempotent/out-of-order subscription updates. Success-page navigation does not grant Pro.

## Current external resources

- Supabase project: `hqfocxsdqurvjooibcbe`; workspace, billing, and connection migrations are applied.
- Vercel project: `prj_RMsx865pYbdirUUb9oItNaX8zw7w` (`agentsketch`). Team: `team_9fOwP9EdXurUD0MkJxXxT2fl`. Team-access consent still blocks deployment. The GitHub login connection also needs linking if automatic Git-based deployments are desired.
- Stripe sandbox: `acct_1T7NUlFuXgEJM2Ca`. Test Pro price: `price_1UVvHkFuXgEJM2CaPWSBVfPt`, USD 19/month. No live charges are enabled.

## Deployment configuration

Use Node 24 and set the Vercel root directory to `hosted` when connecting this repository. `npm run build` builds the Next.js frontend; `withEve` adds the agent service during Vercel deployment. `npm run build:eve` also validates the standalone agent bundle. Follow `AGENTS.md` for framework operations.

Copy `.env.example` into environment configuration. Public Supabase URL and publishable key can be browser-visible. All other secrets must remain server-only:

| Variable | Purpose |
|---|---|
| `AGENT_RUNTIME_SECRET` | Random secret of at least 32 bytes; authenticates the internal agent service and encrypts private app credentials. Preserve it across deployments. Rotating it requires reconnecting saved apps. |
| `SUPABASE_SECRET_KEY` | Project secret/service-role key for private connection and billing administration. Free runs use the caller's verified JWT and RLS instead. |
| `STRIPE_SECRET_KEY` | Prefer a sandbox restricted key with access to customers, subscriptions, Checkout Sessions, and billing portal sessions. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the deployed `/api/billing/webhook` endpoint. |
| `STRIPE_PRO_PRICE_ID` | Sandbox price ID above. |
| `APP_URL` | Final HTTPS application origin for billing redirects. |
| `BILLING_LIVE_ENABLED` | Keep `false` during testing. Live mode requires explicit live keys, price, webhook, and this flag. |
| `AGENT_BASE_URL` | Optional explicit eve service origin for local/non-Vercel setups. Vercel uses its deployment origin by default. |

Vercel's project OIDC authenticates model requests to AI Gateway; model credits/access still need verification in the deployed environment. ChatGPT subscription credits and ChatGPT app connections are not automatically usable by this website.

Configure Supabase's site URL and redirect allowlist for the final app origin so confirmation and recovery links return correctly. Verify email delivery; production signup may require custom SMTP.

Register Stripe webhook events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Enable the Stripe customer portal with cancellation and payment-method management. Test purchase, renewal, failed payment, and cancellation before accepting live payments.

Private sources require each customer's restricted provider token, entered in the site's secure form. The UI will not accept tokens until server-side credential storage is configured. Provider OAuth, outgoing messages, record edits, scheduled execution, and team sharing are not implemented.

## Verification

```sh
npm ci
npm run test
npm run typecheck
npm run build
npm run build:eve
node tests/http-smoke.mjs
```

`tests/database-security.sql` is a transaction-only integration test for Supabase; fixture data is rolled back. It verifies user isolation, quotas, credential-column secrecy, blocked self-upgrades, duplicate/stale billing events, and cancellation.

Unit tests use mocked provider responses. The HTTP smoke test uses local-only fake billing credentials, verifies signatures without calling Stripe, and makes no model calls. These tests do not establish a successful real model run, real provider-token connection, email delivery, payment, or deployed OAuth flow. Complete those checks after deployment credentials are configured.

The local eve build can report no sandbox provider outside Vercel/Docker. Default filesystem/shell tools are disabled, and the authored tools do not request a sandbox. Verify the production agent service health and a real bounded run after deployment.

The billing-event table intentionally has RLS enabled without user policies: only the service role can access it. The database advisor reports this as informational, not a missing user-access grant.
