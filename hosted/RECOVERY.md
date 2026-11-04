# Backup and recovery rehearsal

Provider-level backup retention and a restore rehearsal remain owner decisions. Supabase Free should not be treated as having a verified production backup. This runbook does not claim that an off-site backup or point-in-time recovery has been configured.

1. Before public sales, choose an actual backup method/retention in Supabase and verify its current plan requirements. Name the operator who checks successful backups and handles a restore.
2. Preserve the database schema/migrations, Auth configuration, provider webhook configuration, and encrypted copies of required server secrets in a secured location. Never commit secrets, exports, customer data, or database dumps to GitHub. AGENT_RUNTIME_SECRET is also the connection-vault encryption key; recovery needs the matching key.
3. Restore a backup into a separate isolated Supabase project. Creating that project or upgrading backup features may require owner approval/payment. Never rehearse by overwriting production.
4. Keep Stripe and AI execution disabled on the restore target. Use sandbox-only billing if needed. Reconfigure Auth URLs and email so the rehearsal cannot send recovery messages or payment events to real customers.
5. Verify agent/run/entitlement counts against the snapshot, customer isolation, connection-vault decryption with the matching key, and deletion/export behavior. Run tests/database-security.sql and tests/pricing-security.sql against the isolated target; both use fixtures and roll back. Never export real credentials into test output.
6. Test confirmation/password recovery with a dedicated test account, then a bounded agent run after enabling test AI capacity. Confirm idempotent runs, limits, and sandbox webhook delivery. Do not replay live billing events against production.
7. Record the backup time, restored time, data gap, failures, operator, and restore duration. Approve RECOVERY_VERIFIED only after the target passes. Remove the disposable restore target when permitted and confirm it will not continue incurring charges.

AgentSketch customers can separately download their workspace from Account & data and export individual agent definitions. These portable exports exclude credentials and are not a full infrastructure backup. Existing tests verify portable definitions and private-source disabling on import; those checks do not establish provider-level disaster recovery.

For a bad app deployment, roll back to the previous known-good Vercel deployment, then check health, account access, saved output, and webhook delivery. A code rollback does not undo database changes. The billing review table migration is additive and does not change existing customer plans.
