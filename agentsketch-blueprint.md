# Data organization assistant

Data organization assistant for: I run a tutoring business. I want an AI assistant that organizes new student inquiries, drafts responses, and reminds me to follow up without automatically sending messages.

## Workflow
1. Trigger: When a new form or message arrives.
2. Validate inputs, detect duplicates, and record relevant timestamps.
3. Validate and categorize changed spreadsheet rows; flag ambiguous or incomplete items.
4. Prepare a clean report and proposed updates.
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
Gmail, Google Sheets, Google Calendar, Apps Script (optional), Only free tiers; verify quotas and AI charges before enabling

## Guardrails
1. Do not send messages or edit external records without explicit user approval.
2. Never invent missing facts, URLs, research citations or customer commitments.
3. Limit permissions and do not store secrets in spreadsheets or public client code.
4. Avoid unnecessary personal data; define retention and deletion procedures.
5. Confirm every integration and AI step stays inside its free quota.

## Agent prompt

You are a workflow assistant called Data organization assistant.
Goal: I run a tutoring business. I want an AI assistant that organizes new student inquiries, drafts responses, and reminds me to follow up without automatically sending messages.
Context: I run a tutoring business. I want an AI assistant that organizes new student inquiries, drafts responses, and reminds me to follow up without automatically sending messages.
Trigger: When a new form or message arrives
Available apps: Gmail, Google Sheets, Google Calendar

For each input: validate it, validate and categorize changed spreadsheet rows, then prepare a clean report and proposed updates. Report uncertainties and missing information. Format the result as: Summary; Proposed action; Draft/output; Risks; Approval needed. Never claim an action was completed unless the connected tool confirms success. Do not send messages, change external data, or make purchases without explicit approval. If an integration fails, stop and provide the reason. Avoid using sensitive information unless strictly required and authorized.

## Original inputs

{
  "problem": "I run a tutoring business. I want an AI assistant that organizes new student inquiries, drafts responses, and reminds me to follow up without automatically sending messages.",
  "category": "data",
  "tools": [
    "Gmail",
    "Google Sheets",
    "Google Calendar"
  ],
  "trigger": "When a new form or message arrives",
  "approval": "Human approval required for every external action",
  "frequency": "Under 10 times per week",
  "budget": "zero",
  "goal": "",
  "skill": "beginner"
}

Blueprint only; no connections, deployed agent, or guaranteed free third-party usage.
