# Step 2 acceptance checks

Completed through the hosted browser and exported files:

- Signed in; created and saved Test — Meeting follow-up through the setup wizard.
- Submitted one sample task. History shows one completed run, with the expected owners and deadlines and no invented launch date.
- Copied the output and verified it by pasting into a browser field.
- Downloaded the result and verified its complete text.
- Refreshed the browser; account session, saved agent, and completed history persisted.
- Searched loaded history successfully; found and fixed a missing no-match explanation.
- Opened agent editing, verified empty-name validation, and saved the existing agent without creating another agent or run.
- Downloaded the portable agent configuration; verified identifiers and credential fields are excluded.
- Imported a safe agent file into review. Private sources were disabled; no agent was saved by importing alone.
- Downloaded workspace data and verified one agent and one completed run with no credential fields.
- Opened account-deletion review, verified confirmation/password requirements, and canceled without deleting the user account.

Earlier disposable-account API checks verified authentication, run idempotency, free agent quotas, workspace export, incorrect deletion confirmation/password rejection, and completed account deletion with cascading workspace cleanup.

Remaining: real mobile device layout; browser import error recovery for invalid files; account email delivery and password recovery (step 3). No extra model run was submitted during the remaining desktop checks.
