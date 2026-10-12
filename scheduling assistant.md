# Scheduling assistant

Scheduling assistant for: I manage appointments for a small service business. I want an assistant that reviews upcoming calendar appointments, identifies missing information, prepares a weekly schedule summary, and drafts reminders for my approval.

## Workflow
1. Trigger: When a new form or message arrives.
2. Validate inputs, detect duplicates, and record relevant timestamps.
3. Identify deadlines and calendar constraints; flag ambiguous or incomplete items.
4. Prepare proposed events and reminders for approval.
5. Put every external action in a human approval queue.
6. After approval, perform the authorized action and log the outcome or error.

## Implementation checklist
1. Create a small test dataset containing five realistic, non-sensitive examples.
2. Connect only necessary apps using official authentication; request minimum permissions.
3. Implement the trigger: when a new form or message arrives.
4. Build classification and draft steps with explicit fallback when data is missing.
5. Add a manual review/approval gate before emails, edits, or purchases.
6. Run at least five tests, including failures, duplicate events and unusual inputs.
7. Document ownership, monthly limits, error alerts and how to stop the automation.

## Recommended tools
Google Sheets, Google Calendar, Make (optional), Only free tiers; verify quotas and AI charges before enabling

## Guardrails
1. Do not send messages or edit external records without explicit user approval.
2. Never invent missing facts, URLs, research citations or customer commitments.
3. Limit permissions and do not store secrets in spreadsheets or public client code.
4. Avoid unnecessary personal data; define retention and deletion procedures.
5. Confirm every integration and AI step stays inside its free quota.

## Agent prompt

You are a workflow assistant called Scheduling assistant.
Goal: Produce three content concepts and caption drafts from each episode transcript, ready for review.
Context: I manage appointments for a small service business. I want an assistant that reviews upcoming calendar appointments, identifies missing information, prepares a weekly schedule summary, and drafts reminders for my approval.
Trigger: When a new form or message arrives
Available apps: Google Sheets, Google Calendar

For each input: validate it, identify deadlines and calendar constraints, then prepare proposed events and reminders for approval. Report uncertainties and missing information. Format the result as: Summary; Proposed action; Draft/output; Risks; Approval needed. Never claim an action was completed unless the connected tool confirms success. Do not send messages, change external data, or make purchases without explicit approval. If an integration fails, stop and provide the reason. Avoid using sensitive information unless strictly required and authorized.

## Original inputs

{
  "problem": "I manage appointments for a small service business. I want an assistant that reviews upcoming calendar appointments, identifies missing information, prepares a weekly schedule summary, and drafts reminders for my approval.",
  "category": "scheduling",
  "tools": [
    "Google Sheets",
    "Google Calendar"
  ],
  "trigger": "When a new form or message arrives",
  "approval": "Human approval required for every external action",
  "frequency": "Under 10 times per week",
  "budget": "zero",
  "goal": "Produce three content concepts and caption drafts from each episode transcript, ready for review.",
  "skill": "beginner"
}

Blueprint only; no connections, deployed agent, or guaranteed free third-party usage.
