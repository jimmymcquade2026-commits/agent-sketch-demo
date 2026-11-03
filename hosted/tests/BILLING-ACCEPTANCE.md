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
