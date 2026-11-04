# Owner setup before public sales

Updated November 4, 2026 (US Eastern). The app remains a Stripe sandbox preview. No paid service, domain, live payment, or automatic AI-credit purchase was enabled.

## Complete these external steps

| Item | What is needed | Where to enter it |
| --- | --- | --- |
| Email | A sender domain you control, an SMTP provider, verified DNS, and signup/reset delivery to a non-team address | Supabase Auth email/SMTP settings |
| Connections | Dedicated read-only GitHub Issues token/repository; Slack bot token/channel membership; Airtable token limited to a test base/table | AgentSketch Apps & connections, never chat |
| Renewal testing | Test Clocks Write on the website's sandbox restricted Stripe key, or simulated clock advancement in the Stripe dashboard | Stripe sandbox API-key permissions |
| Commercial hosting | A commercial-eligible Vercel plan; approve its subscription before purchase | Existing Vercel agentsketch project/team |
| Business and support | Legal operator identity/location, monitored support email, audience, privacy retention, terms, cancellation/refund rules, and applicable tax registrations | Review LAUNCH-POLICY-DRAFTS.md, publish approved policies, then configure their URLs |
| Live billing | Business/bank onboarding, live restricted key/prices/signing secret, lifecycle and risk acceptance | Stripe and Vercel server-only environment variables |
| AI spending | Fund shared Gateway usage, choose a monthly limit/alert threshold and notification destination, verify top-up behavior | Vercel AI Gateway and spending controls |
| Recovery | Pick backup retention, choose a restore target, and complete a provider-level restore rehearsal | Supabase; see RECOVERY.md |
| Account security | Review leaked-password protection and replace secrets previously pasted into chat | Supabase / Stripe; update Vercel secrets directly |
| Git deployment | Connect the existing project to jimmymcquade2026-commits/agent-sketch-demo, production branch main, root hosted | Vercel Git settings; owner GitHub login connection is still needed |

Supabase password protection: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . The current advisor reports this disabled. The service-only billing_events and billing_alerts tables intentionally have no customer RLS policies.

## Owner controls in the app

Sign in with the existing owner account and select **Launch checklist**. It shows prerequisite confirmations and up to 50 open billing alerts. The owner identity is matched against server-only OWNER_USER_ID after verifying the Supabase session. Other users cannot read or update this endpoint.

Refunds, disputes, and early fraud warnings are queued with event/charge/customer IDs only. If Stripe sends just a charge ID, resolve its customer in Stripe. Review the event and take any business/payment action in Stripe, then mark it reviewed in AgentSketch. Marking reviewed does not refund, cancel, release a hold, or change entitlements. The risk-response policy and actual provider risk-event acceptance still need owner approval/testing before real sales.

## Confirm prerequisites and release

Confirm each item only after its external work and acceptance checks have passed. Set the corresponding server-only flags from .env.example to true; a flag is an owner attestation, not an automatic test of the external service. Set TERMS_URL and PRIVACY_URL to approved HTTPS pages and SUPPORT_EMAIL to your monitored address. Approved links appear in the footer when POLICIES_APPROVED=true.

After the live Stripe configuration is ready, set BILLING_LIVE_ENABLED=true and LAUNCH_APPROVED=true and redeploy. Live checkout stays blocked if any required prerequisite is missing. Webhook processing and subscription management remain available even while new live checkouts are blocked, so customers can still cancel existing subscriptions.

## Monitoring

The Production health GitHub workflow checks /api/health and /api/status about every 30 minutes, can be run manually, and runs when its files change. It uses no credentials and makes no AI call. GitHub scheduling is best-effort. Review Actions failures and choose your GitHub notification settings; no email recipient or paid alert service was configured. The check covers database reachability and service configuration, not model quality, public email delivery, or payment delivery.

The Hosted app checks workflow continues to audit dependencies, test, build, and run HTTP checks. Automatic Vercel deployment still requires the owner Git connection; until then source deployments are manual.
