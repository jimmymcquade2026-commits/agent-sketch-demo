# Launch policy drafts — owner inputs required before publication

These drafts describe implemented behavior and identify decisions still needed. They are not published terms or a completed legal review.

## Privacy notice draft
AgentSketch stores account information, agent instructions, reference text, run history, and app connection metadata in Supabase. Connection tokens are encrypted on the server and are not included in agent exports or model prompts. During a run, task text, saved instructions, references, and selected source excerpts are processed through Vercel AI Gateway and the configured model provider. Hosting, database, billing, and AI providers process records under their own policies. No promise is made here about their retention or model-training terms; verify the actual provider settings before publishing those details.

Account & data allows customers to export workspace data and request password-confirmed account deletion. Workspace deletion removes stored agents, runs, and connection credentials through database cascades. It does not erase Stripe billing records or provider-side execution records. A subscription must be fully ended before account deletion is allowed.

Owner must supply: legal operator identity, privacy/support contact, governing business location, retention periods including backups and logs, handling of privacy requests, eligible audience/age policy, actual analytics/cookies inventory, and any regional disclosures required for the intended launch audience.

## Service terms draft
AgentSketch lets customers save instructions and run on-demand AI tasks. Results can be incorrect and must be reviewed before use. Customers should submit only information they are authorized to process and connect only resources they are authorized to access. Current integrations are read-only and use limited snapshots. The service does not currently send external messages, change external records, perform scheduled work, or provide team sharing.

Free preview includes one agent and five attempts per UTC month (three/day). Launch costs $69 once per workspace, plus Starter $9/month, Plus $19/month, or Pro $39/month. See PRICING-COSTS.md for capacities and legacy terms. Failed attempts count. Provider capacity can interrupt execution. The owner must decide the service availability, acceptable-use rules, account suspension/termination terms, dispute process, and applicable legal provisions before publication.

## Billing/cancellation/refund draft
Current billing is sandbox-only and collects no real money. The launch fee is USD 69 once, with monthly plans at USD 9, 19, or 39. Customers manage subscription cancellation in Stripe's portal; the configured cancellation takes effect at the period end. Live billing is disabled. Before launch, the owner must confirm currency, taxes, renewal/cancellation wording, refund eligibility, response time, business identity, support contact, and required consumer notices. No refund promise or legal waiver is invented by this draft.

## Support draft
Select a monitored support address before public launch. Suggested intake fields: affected feature, approximate time, visible error, and steps to reproduce. Ask customers not to send passwords, API tokens, payment details, or unrelated private records. For execution problems, inspect history and usage before retrying the same task.
