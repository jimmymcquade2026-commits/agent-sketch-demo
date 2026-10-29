export const connectionCatalog=[
 {id:'github_private',name:'GitHub repository',resource:'owner/repository',help:'Use a fine-grained token restricted to this repository with Issues: read permission. Reads up to 15 recent open issues; does not change code.',url:'https://github.com/settings/personal-access-tokens/new'},
 {id:'slack',name:'Slack channel',resource:'Channel ID, e.g. C0123456789',help:'Use a bot token from your own Slack app with channels:history (or groups:history). Invite the bot to this channel first. Reads up to 15 recent messages; does not send messages.',url:'https://api.slack.com/apps'},
 {id:'airtable',name:'Airtable table',resource:'appBaseId/tblTableId',help:'Use a personal access token with data.records:read and access only to this base. Reads up to 25 records; does not edit records.',url:'https://airtable.com/create/tokens'},
] as const;
