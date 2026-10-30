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
- Vercel project: `prj_RMsx865pYbdirUUb9oItNaX8zw7w` (`agentsketch`). Team: `team_9fOwP9EdXurUD0MkJxXxT2fl`. Production is deployed at https://agentsketch-jimmyhmcquade-7436.vercel.app. Preview deployment protection remains enabled. The GitHub login connection also needs linking if automatic Git-based deployments are desired.
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

Vercel's project OIDC authenticates model requests to AI Gateway; the hosted execution test reached AI Gateway but was rejected with `customer_verification_required`: the Vercel team must add a payment card to activate model access. ChatGPT subscription credits and ChatGPT app connections are not automatically usable by this website.

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

## Hosted verification — October 29, 2026

Production build and public site access passed. A disposable confirmed Supabase account signed in and saved an agent successfully, then was signed out and deleted. The signed Stripe webhook returned 200, and a customer portal session was created successfully. Sandbox webhook `we_1UW09NFuXgEJM2CamtZbv2XA` and default portal configuration `bpc_1UW0AaFuXgEJM2CaVHBLzBk9` are configured. No payment was made. The real agent run is blocked by Vercel AI Gateway payment-card verification. Checkout was rejected with `StripePermissionError / more_permissions_required`: enable Checkout Sessions Write (`checkout_session_write`) on the configured sandbox restricted key. Supabase email redirect configuration remains pending. Set Site URL to `https://agentsketch-jimmyhmcquade-7436.vercel.app` and allow redirects to that origin. The browser dashboard requires Supabase sign-in; the connector does not expose Auth URL settings.

## Free-credit model verified — October 29, 2026

At the owner’s request, the agent now uses `openai/gpt-4.1-mini` without a reasoning-effort override. The production deployment completed a real meeting-notes task, returning and saving an action list and complete follow-up email (HTTP 200). Sandbox checkout, customer portal, and signed webhook requests also returned 200. Supabase’s generated email link was verified to redirect to the production app. The earlier model-access and Checkout permission blockers above are historical and resolved for this configuration. No AI credit purchase, paid-tier upgrade, or auto top-up was enabled. Vercel’s $5 monthly free credit allowance is shared across the team and is usage-limited, not unlimited model access.
