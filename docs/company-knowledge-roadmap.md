# Company Knowledge Roadmap

Saved from build session on 2025-04-06. To be taken up after v1 is stable in production.

## The Problem

Every summary is generated and forgotten. There's no organizational memory — no searchable archive, no cross-meeting intelligence, no aggregated action item tracking.

## What "Company Knowledge" Means

1. **Meeting history** — searchable archive of all summaries
2. **Decision log** — decisions extracted across meetings, queryable
3. **Action item tracking** — who owes what, across all meetings
4. **Customer intelligence** — pain points, quotes, objections aggregated per customer/account
5. **Patterns** — "what did we discuss with Acme Corp across the last 5 meetings?"

## Storage Options (ranked by practicality)

| Option | Effort | Fits Stack | Notes |
|--------|--------|-----------|-------|
| **Supabase** | Low | Yes (USL standard) | Postgres DB, free tier, JS SDK, row-level security. Best fit for v1.5 |
| **SharePoint** | Medium | If org uses it | Good for non-technical users browsing summaries. Requires MS Graph API auth |
| **Notion API** | Low | If team uses Notion | Push summaries as pages, auto-tagged by meeting type and date |
| **Google Drive** | Low | Simple | Push .docx/.md files to a shared folder via API |

**Recommendation:** Supabase for structured data, SharePoint/Drive for document access.

## Automation Paths

### Path 1: Auto-save after generation (simplest)
After `runPipeline` completes, POST the summary to a `/api/save` route that writes to Supabase. No user action needed.

```
Generate → Summary appears → Auto-saved to Supabase → Optional: push .docx to SharePoint
```

### Path 2: Webhook on save
"Save to Knowledge Base" button in the export toolbar. Sends structured summary (decisions, action items, quotes as JSON) to a webhook that fans out to Supabase + SharePoint + Slack.

### Path 3: Claude Cowork / Scheduled Agent
A Claude Code agent runs on schedule (daily/weekly), reads saved summaries from Supabase, and generates:
- Weekly decision digest
- Action item rollup (overdue items across all meetings)
- Customer intelligence briefs (aggregated by account)

Requires Path 1 or 2 first — need data stored before analyzing it.

## v1.5 Scope (Practical)

1. **Add Supabase** — `summaries` table: `id, title, date, meeting_type, attendees, markdown, decisions_json, action_items_json, quotes_json, created_at`
2. **Auto-save on generation** — POST to `/api/save` after pipeline completes
3. **History page** — `/history` route showing past summaries, filterable by date and meeting type
4. **"Save to SharePoint" button** — push .docx via MS Graph API on demand

## v2 Scope (The Real Value)

- Cross-meeting search ("what did the customer say about pricing?")
- Action item dashboard with status tracking
- Customer intelligence view aggregating all meetings per account
- Claude Cowork agent generating weekly digests
