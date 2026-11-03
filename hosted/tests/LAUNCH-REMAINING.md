# Remaining launch work

## Step 3: production email delivery — deferred by owner
Confirmation and password-reset delivery to the owner were verified; the owner also completed password recovery successfully. Custom production email setup remains open. Choose a sender domain and email provider, configure domain verification and Supabase SMTP, then verify delivery to a non-team account. Do not treat current owner delivery as proof that public signup email works.

## Step 4: private app connection acceptance — waiting on credentials
Ten provider/encryption/access-failure checks run locally with fake credentials. Live private GitHub, Slack, and Airtable reads remain unverified. The owner's workspace received test Pro via a real Stripe sandbox subscription and webhook (no real charge), configured to cancel at the period end. GitHub test issue #1 exists. Dedicated app tokens remain needed. Do not reuse ChatGPT connector credentials.

- GitHub: one test repository with an issue; fine-grained token limited to that repository with Issues read access.
- Slack: a test channel with a message; a dedicated bot token with the appropriate channel-history scope, and bot membership in that channel.
- Airtable: one test base/table with a sample record; personal access token limited to that base with data.records:read.

Enter tokens only in AgentSketch's connection fields. ChatGPT app connections do not authorize this website. After connecting each source, enable it on the test agent, verify a source-grounded result, disconnect it, and confirm that subsequent runs are blocked until that source is removed or reconnected.

## Later steps
Finish Stripe renewal/failure tests, launch policies/support, owner-selected monitoring/spend/recovery setup, live payment onboarding, and automatic GitHub deployments. Browser Checkout passed during the completion round below. Step 2 mobile checks were reported successful by the owner; malformed/oversized imports and successful subsequent recovery were verified in-browser.


## Autonomous completion round
- Upgraded Next.js to 16.4.4, Zod to 4.6.6, Vercel Connect to 2.8.0, and OIDC to 4.0.6; constrained Undici to patched 8.12.2. Production audit reports zero known vulnerabilities after installation.
- 28 unit tests pass. Agent build, Next production build, and HTTP smoke checks pass. Database security fixture passes and rolls all data back.
- Added secret-free GitHub Actions checks (audit, tests, both builds, HTTP verification), /api/health, an emergency AI-run pause switch, sanitized run outcome telemetry, security response headers, error/404 recovery pages, and a visible top-bar sign-in control.
- Release e325e2b15f10571cac0b863487e19a499d07f624 is deployed to production. GitHub Actions run 41558672798 passed. The deployed /api/health returned 200 with no-store; a real bounded AI task completed and its result was saved. Sanitized run_completed telemetry was visible in Vercel logs.
- Hosted Stripe sandbox Checkout rejected a declined test card and then recovered successfully with a test Visa. The session completed with payment_status=paid, redirected to AgentSketch, and the real webhook upgraded the disposable account to Pro. Canceling that subscription returned it to Free. See BILLING-ACCEPTANCE.md. No real charges were made.
- Added OPERATIONS.md and LAUNCH-POLICY-DRAFTS.md. Draft policies remain unpublished until operator identity, support contact, retention, refund rules, and required legal/business decisions are supplied.
- Recent Vercel error/fatal log query found no records; no claim is made about periods outside that short retention window.
- Supabase advisor warns that leaked-password protection is disabled. Owner must review the dashboard setting and plan availability. The informational no-policy billing_events notice is intentional because only service_role accesses that table.
- Stripe test clock creation succeeded, but the connector does not expose clock advance/retrieve operations. Resetting another disposable subscription's billing anchor produced no renewal invoice, so renewal and failed-renewal simulation remain unverified. No subscription was created on the clock; that labeled sandbox fixture expires automatically. All non-clock QA subscriptions were canceled; disposable Supabase accounts, dependent app records, and temporary local credentials were removed. Canceled Stripe audit records remain in the sandbox.

## Owner actions at the end
1. Enter dedicated read-only GitHub, Slack, and Airtable tokens/resources in AgentSketch. Live source-grounded reads and disconnect behavior can then be checked. Tokens must not be pasted into chat.
2. Choose/control a sender domain and an email provider; verify DNS and connect SMTP for non-team signup delivery.
3. Complete Stripe live onboarding only when ready; confirm tax obligations, support/business details, final policies, refund terms, and billing-risk handling before enabling real charges.
4. Provide access to Stripe test-clock advancement or run the dashboard's simulated renewal and payment-failure flows. Browser Checkout is already verified.
5. Connect the existing Vercel agentsketch project to the repository using root hosted and review production branch/check gates. The GitHub tests are separate from deployment linking.
6. Choose a spending alert threshold, monitoring destination, backup retention/recovery plan, and review Supabase leaked-password protection. No paid observability, backup upgrade, domain, or credit purchase was enabled.
