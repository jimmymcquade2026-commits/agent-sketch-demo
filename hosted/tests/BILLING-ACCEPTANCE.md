# Sandbox subscription acceptance

Verified October 29, 2026. All Stripe operations used sandbox account acct_1T7NUlFuXgEJM2Ca with livemode=false. No real money moved.

- Created a disposable confirmed Supabase account and sandbox Stripe customer with Stripe's test Visa token.
- Created a subscription for the configured $19/month Pro price. Stripe reported active status and a paid 1900-cent invoice.
- Stripe delivered the subscription webhook to the deployed app. The user's entitlement changed to Pro without a manual database upgrade.
- The account could create a second agent, demonstrating the paid limit was applied.
- Canceled the sandbox subscription immediately. Stripe's webhook changed the entitlement back to Free.
- Further agent creation was blocked by the Free quota; previously saved agents were preserved.
- Signed out and removed the disposable Supabase account and dependent fixtures. Removed temporary local credentials. The canceled sandbox subscription remains as a labeled audit record.

This tests the real Stripe-to-app subscription webhook lifecycle. Checkout-session creation passed separately; browser-based card entry, renewal/failed-renewal behavior, and real private app integrations remain unverified.
