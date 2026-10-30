# Hosted acceptance checks

Verified October 29, 2026 against https://agentsketch-jimmyhmcquade-7436.vercel.app using a disposable confirmed account.

- Real GPT-4.1 mini meeting-notes task returned a completed deliverable (prior round).
- Public GitHub task returned the AgentSketch repository URL, TypeScript language, and zero stars.
- Replaying the same request ID returned the same run ID and output; the account still had exactly one run.
- Free plan rejected a second saved agent.
- Free plan rejected private app connection creation with HTTP 403.
- Unknown agent ID returned HTTP 404.
- After filling the remaining quota with database-only fixtures, the next run returned HTTP 429 without launching model work.
- Disposable account was signed out and deleted; related fixtures and local temporary credentials were removed.

Sandbox Checkout session creation, portal session creation, signed webhook handling, and Supabase email redirect target passed in the preceding round. No real payment was made. A completed sandbox payment/subscription lifecycle, real private-provider tokens, and production email delivery remain to be tested. ChatGPT-connected accounts do not automatically authorize the website's own integrations.
