# Sandbox subscription acceptance

Verified October 29, 2026. All Stripe operations used sandbox account acct_1T7NUlFuXgEJM2Ca with livemode=false. No real money moved.

- Created a disposable confirmed Supabase account and sandbox Stripe customer with Stripe's test Visa token.
- Created a subscription for the configured $19/month Pro price. Stripe reported active status and a paid 1900-cent invoice.
- Stripe delivered the subscription webhook to the deployed app. The user's entitlement changed to Pro without a manual database upgrade.
- The account could create a second agent, demonstrating the paid limit was applied.
- Canceled the sandbox subscription immediately. Stripe's webhook changed the entitlement back to Free.
- Further agent creation was blocked by the Free quota; previously saved agents were preserved.
- Signed out and removed the disposable Supabase account and dependent fixtures. Removed temporary local credentials. The canceled sandbox subscription remains as a labeled audit record.

## Hosted Checkout acceptance — November 2, 2026 (US Eastern)

Retested against release e325e2b15f10571cac0b863487e19a499d07f624 using a new disposable Supabase user and Stripe sandbox customer. All operations used livemode=false.

- Created a hosted Checkout session for the configured $19/month Pro price, with the disposable user's ID in the subscription metadata.
- Entered Stripe's declining test card (ending 0002). Checkout displayed a declined-card error and allowed correction.
- Replaced it with Stripe's successful test Visa (ending 4242); disabled optional Link saving. Checkout completed, reported payment_status=paid and amount_total=1900, and redirected to the app's billing success page.
- Confirmed the actual subscription webhook set the disposable user's entitlement to Pro for subscription sub_1UXWSwFuXgEJM2Carw6xJIRy.
- Canceled the sandbox subscription and confirmed the webhook returned the entitlement to Free.
- Removed the disposable Supabase account, dependent app records, temporary script, and local credentials. Both QA subscriptions created in this round were canceled; Stripe sandbox audit records remain. The owner's separate test subscription was preserved.

Renewal and failed-renewal behavior remain unverified. A labeled test clock/customer without any subscription was created, but this connector does not expose clock advancement/retrieval. Updating a different QA subscription's billing anchor did not create a renewal invoice; its initial paid invoice does not count as renewal evidence. Real private app integrations also still need dedicated app credentials.

## Launch pricing acceptance — November 3, 2026

All Stripe activity used sandbox account acct_1T7NUlFuXgEJM2Ca, livemode=false. Owner subscription and data were preserved. Patched production release: 2bcd0a2b98add91f472466f9c7aa6d23984fcac8, deployment dpl_8uoeSq8AQAyZnja9Ncn8FY9xAxEQ.

- Confirmed the deployed AI SDK execution path completed and saved real tasks. Checkout rejected the disposable account before its first successful preview.
- Found a real checkout failure: Prices Read was absent on the restricted key. Replaced direct catalog retrieval with strict validation of Checkout line items (amount, currency, quantity, IDs, interval, and duplicate/missing items) before returning a URL. Invalid new sessions expire. Added two regression tests. Customer assignment now updates only stripe_customer_id, preserving the checkout lease.
- 33 unit tests, production build, HTTP smoke checks, and actual GitHub Actions run 41674643583 passed.
- Browser payment with Stripe test Visa completed for $78: $69 launch plus $9 Starter. Invoice in_1UXkXsFuXgEJM2CaerArUR88 contains both exact line items. Subscription sub_1UXkXtFuXgEJM2Ca0N8u1BL0 became active and its real signed webhook set Starter and launch_paid=true. The initial session was created through the Stripe connector while diagnosing the website key; subsequent checkout contract checks use the patched website endpoint.
- Attempting another checkout while subscribed returned 409.
- Used the real portal UI to upgrade Starter to Plus. The confirmation displayed $10 due today and $19/month thereafter. Invoice in_1UXkb3FuXgEJM2CaIQ3md7tn was paid for $10, without another launch line. The real webhook set Plus.
- Used the portal to schedule a Starter downgrade at period end. Stripe created sub_sched_1UXkd8FuXgEJM2CaLXWfrWNv; current price and app access remained Plus. This verifies scheduling, not future execution.
- Used the portal to cancel at period end. It showed service ending December 3. Stripe cancel_at equaled current_period_end; app access remained Plus. Then immediately ended only the disposable subscription through the API for cleanup and confirmed Free with launch_paid=true.
- Rejoining Plus through the patched website created a $19-only session; the launch fee did not repeat. The unpaid session was expired.
- A second fresh disposable account completed a real AI preview on the patched release. Simultaneous Starter/Plus checkout requests left exactly one payable session and released the checkout lease. Through the website endpoint, verified first totals of Starter $78, Plus $88, and Pro $108, each containing exactly one $69 launch line and the selected monthly line. Same-plan retries reused their session. Tier changes expired the prior session. All unpaid QA sessions were expired after testing.
- Both disposable Supabase accounts and dependent workspace records were removed after signing out. Temporary scripts and credential-bearing processes were removed/stopped. The canceled subscription and sandbox invoice/customer records remain as test audit data; the test clock is scheduled to expire automatically. The owner's legacy Pro remained active with launch already covered.

### Remaining simulation blocker
The connector exposes test-clock creation but not advancement. The existing key can retrieve clocks through the installed SDK; advancing clock_1UXkUgFuXgEJM2CaGavAnNbP returned StripePermissionError 403 explicitly requiring Test Clocks Write (`billing_clock_write`). No permission was expanded. Renewal, failed-renewal, and future scheduled-change execution remain unverified. The clock/customer sandbox audit fixture expires automatically; no active subscription remains on it. Tax, live onboarding, and refund/dispute/fraud handling remain separate public-launch requirements.
