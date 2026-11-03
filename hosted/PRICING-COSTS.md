# Launch pricing and operating costs

Researched November 2, 2026 (US Eastern). These are planning estimates, not guaranteed bills or profit. No paid infrastructure plan, AI credits, automatic top-up, or live Stripe payments were purchased/enabled.

## Sources and assumptions

- GPT-4.1 mini through AI Gateway: $0.40 / million input tokens, $1.60 / million output tokens; caching discounts excluded. Verified against the complete live model catalog and https://vercel.com/ai-gateway/models/gpt-4.1-mini .
- AI Gateway: provider list pricing, no token markup. The $5/month eligible free allowance is shared across the app, not per customer; purchased-credit accounts use paid credits. Do not build business margins on free credits: https://vercel.com/docs/ai-gateway/pricing .
- Vercel Pro starts at $20/month; Hobby is for non-commercial personal use. A commercial launch needs a suitable paid plan. https://vercel.com/pricing and https://vercel.com/docs/plans/hobby .
- Supabase Free is $0; Pro starts at $25/month including one Micro compute instance via credits and seven-day daily backups. A production planning baseline is therefore $45/month shared hosting/database cost, before overages, email, domain, taxes, monitoring, support, and refunds. Supabase Pro has not been purchased. https://supabase.com/pricing .
- Vercel Washington DC Fluid rates: $0.128 / active CPU-hour, $0.0106 / GB-hour, plus $0.60 / million invocations, subject to included credits. Example assumption: one 2 GB instance, 10 seconds elapsed, 0.2 seconds active CPU is approximately $0.000067 per run before other requests, bandwidth, concurrency effects, and credits. Measure actual billed usage before relying on it. https://vercel.com/docs/functions/usage-and-pricing .
- Standard US domestic card example: Stripe Payments 2.9% + $0.30, plus Billing 0.7% of subscription volume. Other payment methods, foreign cards, currency conversion, tax products, disputes, and account terms can cost more. Budget conservatively at 3.6% + $0.30 for subscription receipts and the first combined invoice. https://stripe.com/pricing and https://stripe.com/billing/pricing .

## Implemented offer

$69 one-time **workspace** launch, not per agent. Customers must complete a successful preview task before the app starts checkout. This activates hosted usage inside AgentSketch; it does not buy a dedicated server, external deployment, custom connector, or hands-on consulting.

| Plan | Monthly price | Saved agents | Monthly attempts | Daily attempts | Private connections | First payment |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| Free preview | $0 | 1 | 5 | 3 | No | $0 |
| Starter | $9 | 1 | 100 | 10 | No | $78 |
| Plus | $19 | 5 | 400 | 40 | Yes | $88 |
| Pro | $39 | 20 | 1,000 | 100 | Yes | $108 |

Allowances are per workspace and reset at the first of the UTC calendar month, independently of the subscription billing date; no rollover or automatic overage billing. A failed attempt counts. Request-ID retries reuse the same run. Legacy $19 Pro customers retain 20 agents/100 attempts per day and are exempt from the launch fee.

## Unit economics

The hosted run now makes one bounded generation with no SDK retries or tool loops, at most 24,000 UTF-8 bytes of authored prompt/context, 2,000 output tokens, and a 60-second abort. Task/instructions must fit; reference excerpts are shortened with a visible marker. A typical illustrative request of 6,000 input + 1,000 output tokens costs $0.004 in model tokens. A conservative token-envelope estimate of 25,000 input tokens (allowing framing) + 2,000 output tokens is $0.0132. This is a model-cost planning envelope, not a vendor-guaranteed dollar cap; provider retries/failover, billing changes, and platform overhead still need monitoring.

| Monthly plan | Typical AI at full allowance | Conservative AI envelope | Example Stripe fee | Remaining after conservative AI + Stripe |
| --- | ---: | ---: | ---: | ---: |
| $9 Starter | $0.40 | $1.32 | $0.62 | $7.06 |
| $19 Plus | $1.60 | $5.28 | $0.98 | $12.74 |
| $39 Pro | $4.00 | $13.20 | $1.70 | $24.10 |

The last column is **not profit**: shared infrastructure, free users, execution/bandwidth, tax, acquisition, support, refunds, and disputes remain. With the $45/month baseline and the conservative model envelope, roughly 7 Starter, 4 Plus, or 2 Pro customers cover only that baseline before those remaining costs. One-time launch revenue should fund onboarding/acquisition and reserves, not hide recurring losses.

## Billing behavior and rollout

- Separate Stripe sandbox Products/Prices for launch, Starter, Plus, and Pro; the old $19 price is kept for legacy subscriptions.
- First subscription Checkout includes launch + first month. Paid launch is recorded from a signed paid Checkout event after checking the server-configured launch line item and customer ownership. Subsequent subscriptions omit launch. New paid tiers cannot be granted without launch payment; existing subscribers are grandfathered.
- Per-account checkout lease plus open-session reuse/expiration prevents concurrent initial checkouts from collecting the fee twice. Active/unresolved subscriptions block duplicate subscriptions. Configured Stripe prices are checked against displayed USD amounts using Checkout line items before returning a payable URL; invalid newly created sessions are expired. This uses the existing Checkout permission without requiring catalog Prices Read access.
- Subscription and invoice webhooks retrieve current subscription state, including cancellation and payment failure. The portal supports prorated upgrades and end-of-period downgrades/cancellation. Portal changes do not charge another launch fee.
- Live mode stays disabled. Before real sales: owner must move commercial hosting to an eligible plan, fund/monitor shared AI capacity, finish public SMTP, approve policies/support/refund/tax details, and finish renewal/failure/risk-event acceptance. Automatic tax is not enabled without the owner's applicable registrations.
