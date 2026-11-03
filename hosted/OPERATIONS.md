# AgentSketch operations

## Health and errors
- Check `/api/health`: 200 means the database is reachable; 503 means workspace access is degraded. This does not test AI-provider availability.
- Check `/api/status` for configuration gates and test/live billing mode. Neither route returns secrets or account data.
- Vercel function logs record `run_started`, `run_completed`, `run_failed`, and `run_history_failed` with elapsed milliseconds only. They deliberately omit prompts, outputs, tokens, email addresses, and provider error bodies.
- A `run_history_failed` event means a result reached the browser but was not stored. Have the customer download the visible output before leaving; do not rerun automatically.
- Vercel Hobby retains a short runtime-log window. A 15-minute query worked during verification. No external alert destination or long-term log drain is configured yet.

## Pause new AI work
Set `AGENT_RUNS_ENABLED=false` in the project's production environment and redeploy. Verify `/api/status` reports executionConfigured=false. New requests are rejected before authentication/reservation/model execution. Accounts, saved agents, existing results, and exports remain available. Restore true and redeploy when ready.

## Usage and spending
The app enforces daily per-account attempt limits before execution, idempotency for retries, a 145-second delivery wait with session cancellation, and agent output/time/usage limits. These are safeguards, not a guaranteed dollar ceiling: model usage limits are checked during execution and can overshoot a threshold. The team-level AI Gateway free credits are shared. Paid top-ups were not enabled during setup. Before public launch, the owner should confirm payment/top-up settings and choose a team spending alert threshold in Vercel. Do not promise unlimited AI capacity.

## Deployment and rollback
The repository's `Hosted app checks` GitHub Action runs the tests, production build, and local HTTP smoke checks on reviewed changes without deployment secrets. CI cannot yet gate Vercel production because the project's GitHub login/Git integration still needs the owner to connect it. When linking the existing agentsketch project, select repository jimmymcquade2026-commits/agent-sketch-demo and root directory hosted. Do not create another Vercel project. Preserve production aliases, OIDC, and preview protection.

For a bad release, promote the previous known-good production deployment using Vercel's rollback controls. Recheck health, signup, saved history, and webhook delivery. Rollback does not undo database changes. Keep schema changes additive and test before applying them.

## Data recovery
Customers can export agent definitions and workspace data from the app. Export currently includes up to 10,000 recent runs within a conservative 3 MB budget; older runs may require individual downloads. Tokens are excluded. This is not a substitute for infrastructure backups.

Before public launch, inspect the Supabase plan's actual backup retention and recovery features and choose a backup policy. Do not assume point-in-time recovery exists on the current plan. Test restores into a separate project; never overwrite production as a recovery rehearsal. Keep encrypted connection data and its AGENT_RUNTIME_SECRET together in a secured backup. Losing or rotating that secret requires reconnecting apps. Never commit database dumps, customer exports, or secret files to GitHub.

## Billing incidents
Keep BILLING_LIVE_ENABLED=false until live onboarding, legal/business details, and live-mode tests are complete. Stripe's webhook updates plan access; a checkout return page is not proof of payment. Retry failed webhook events after correcting the underlying error. The handler retrieves current subscription state to avoid a delayed event restoring a canceled subscription. Multiple subscription overlaps, refunds/disputes, and successful/failed renewals still require further acceptance testing before live launch.
