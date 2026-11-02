# Remaining launch work

## Step 3: production email delivery — deferred by owner
Confirmation and password-reset delivery to the owner were verified; the owner also completed password recovery successfully. Custom production email setup remains open. Choose a sender domain and email provider, configure domain verification and Supabase SMTP, then verify delivery to a non-team account. Do not treat current owner delivery as proof that public signup email works.

## Step 4: private app connection acceptance — waiting on credentials
Nine provider/encryption checks plus provider access-failure coverage run locally with fake credentials. Live private GitHub, Slack, and Airtable reads remain unverified. The owner's workspace is Free with no saved connections. Test paid access through Stripe sandbox before connecting; do not grant production Pro directly for testing or charge real money.

- GitHub: one test repository with an issue; fine-grained token limited to that repository with Issues read access.
- Slack: a test channel with a message; a dedicated bot token with the appropriate channel-history scope, and bot membership in that channel.
- Airtable: one test base/table with a sample record; personal access token limited to that base with data.records:read.

Enter tokens only in AgentSketch's connection fields. ChatGPT app connections do not authorize this website. After connecting each source, enable it on the test agent, verify a source-grounded result, disconnect it, and confirm that subsequent runs are blocked until that source is removed or reconnected.

## Later steps
Finish Stripe renewal/failure/browser-checkout tests, launch policies/support, launch monitoring/spend/recovery checks, live payment onboarding, and automatic GitHub deployments. Step 2 mobile checks were reported successful by the owner; malformed/oversized imports and successful subsequent recovery were verified in-browser.
