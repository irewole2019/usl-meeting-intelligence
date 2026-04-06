
**PRODUCT REQUIREMENTS DOCUMENT**

**Meeting Intelligence App**

Internal Transcript Summarization Tool


Version 1.0

April 2026

**Status: Draft**


# 1. Product Overview

Meeting Intelligence is a lightweight internal web application that converts Microsoft Teams meeting transcripts (and optional chat logs) into structured, high-quality summaries. The product is inspired by Granola.ai in its simplicity and speed, but scoped specifically for internal team use with no dependency on third-party integrations or meeting bot infrastructure.


The core idea is simple: paste or upload your transcript, choose a meeting type, and get a clean, structured summary in seconds. No account setup, no recording permissions, no calendar sync required at launch.


## 1.1 Problem Statement

After a Teams meeting, teams lose time reconstructing what was decided, who owns what, and what customers actually said. Meeting notes are inconsistent across team members, action items get buried in chat threads, and there is no reliable way to capture customer quotes for follow-up or coaching. Existing tools either require deep integrations (recording bots, admin permissions) or produce low-quality summaries that still need significant editing.


## 1.2 Goals

- Reduce post-meeting documentation time from 20-40 minutes to under 5 minutes

- Produce consistent, structured summaries with zero manual formatting

- Surface verbatim customer quotes that reflect sentiment and priorities

- Generate a ready-to-send follow-up email draft from every meeting

- Work with messy, real-world Teams transcripts without requiring clean input


| Out of Scope (v1) Real-time transcription, meeting bot integration, calendar sync, multi-user collaboration on summaries, and persistent user accounts. These are v2 candidates. |
| --- |


## 1.3 Target Users

Internal team members who run or attend external-facing meetings (sales, customer success, support) and internal syncs. No technical skill required. The app should feel as easy to use as a paste-and-go web tool.



# 2. User Flow (v1)

The v1 user experience is a single-page flow with five steps. There is no login, no dashboard, and no persistent state between sessions in v1.


## Step 1: Input

- User pastes raw transcript text into the main text area OR uploads a .txt or .vtt file exported from Teams

- Optionally pastes Teams meeting chat below the transcript in a secondary text area

- Optionally fills in meeting metadata: title, date, attendees, and purpose


## Step 2: Template Selection

User selects one of three meeting templates. This controls which output sections are emphasized and what signals the model is prompted to prioritize.


| Template | Primary Emphasis | Typical Use |
| --- | --- | --- |
| Sales Discovery | Customer needs, objections, next steps, key quotes | First calls, demos, discovery sessions |
| Customer Support | Issue summary, resolution, follow-up actions, sentiment | Support calls, escalations, QBRs |
| Internal Sync | Decisions, blockers, action items, owners | Team standups, planning, retrospectives |


## Step 3: Generate

- User clicks Generate Summary

- A loading state shows with estimated time (typically 10-25 seconds for a 60-minute transcript)

- The app processes the transcript: cleans it to markdown, chunks it intelligently, runs the summarization pipeline


## Step 4: Review and Edit

- The structured summary renders in a split-panel view: raw output on the left, editable markdown preview on the right

- Key quotes are visually highlighted in a dedicated section

- User can edit any section inline before exporting

- Action items are listed in a scannable table with owner and due date columns


## Step 5: Export

- Copy to clipboard (full markdown)

- Download as .md file

- Download as .docx (stretch goal for v1, confirmed for v1.5)

- Copy the follow-up email draft separately



# 3. Output Specification

Every summary produced by the app must include the following eight sections, in this order. Section names are stable and consistent across all meeting types, though emphasis and depth will vary by template.


| Section | Description |
| --- | --- |
| Executive Summary | 5 to 8 bullets covering the most important outcomes of the meeting. Written for someone who was not in the room. |
| Key Decisions + Rationale | Explicit decisions made during the meeting, each with a brief note on why that decision was reached. |
| Customer Needs / Pain Points | Verbatim or near-verbatim statements from the customer describing their challenges, goals, or requirements. Sourced directly from the transcript. |
| Objections / Risks / Open Questions | Concerns raised, unresolved questions, and risks flagged during the meeting. Each item flagged as Objection, Risk, or Open Question. |
| Next Steps | Action items with owner name or role, and due date if stated. Uses TBD for unspecified dates. Presented as a table. |
| Key Quotes | 4 to 8 verbatim excerpts from the transcript. Selected for sentiment signal, priority, or outcome relevance. Each includes speaker and timestamp if available. |
| Meeting Outcomes | What materially changed as a result of this meeting. Different from next steps: this captures shifts in understanding, relationship, or agreed direction. |
| Follow-Up Email Draft | A short, professional email (under 200 words) suitable for sending to the external attendees or internal stakeholders immediately after the meeting. |


| Quality Bar for Quotes Quotes must be selected for signal, not length. A good quote reflects customer sentiment, a key priority, an objection, or a commitment. Filler phrases, pleasantries, and off-topic comments are excluded. |
| --- |



# 4. Technical Architecture

## 4.1 Stack Recommendation

The following stack is chosen for speed to build, low operational overhead, and the ability for a single engineer to own the full system in v1.


| Layer | Technology |
| --- | --- |
| Frontend | Next.js (React) deployed on Vercel. Tailwind CSS for styling. No auth required in v1. |
| Backend API | Next.js API routes (serverless). Handles transcript processing, model calls, and response formatting. |
| AI Model | Qwen 3 via OpenRouter API. Called with structured prompts for each pipeline stage. |
| File Handling | Files processed in memory only. No storage in v1. Transcripts are not persisted after session ends. |
| Export | Markdown generated server-side. DOCX export via docx.js library (v1.5). |
| Hosting | Vercel free tier sufficient for internal use at low volume. |


## 4.2 Summarization Pipeline

The pipeline runs in three sequential stages. This map-reduce approach keeps individual model calls within token limits and ensures that long transcripts (90+ minute meetings) are handled reliably.


### Stage 1: Markdown Conversion

The raw transcript is cleaned and converted to structured markdown before any summarization occurs. This removes filler words, normalizes speaker labels, collapses repeated phrases, and reduces token count by 30-50% compared to raw transcript text.


- Input: raw .txt or .vtt content

- Output: markdown with speaker headings (## Sarah [10:03]) and cleaned dialogue

- Target output size: under 60% of input token count


### Stage 2: Chunk Summarizer

The cleaned markdown is split into chunks of approximately 2,000 tokens each. Chunks are cut at speaker boundaries or paragraph breaks, never mid-sentence. Each chunk is sent to the model independently with the chunk summarizer prompt, which extracts structured signals from that portion of the meeting.


- Chunk size: 1,800 to 2,200 tokens

- Overlap: 100 tokens at boundaries to prevent signal loss at cuts

- Output per chunk: decisions, pain points, action items, quote candidates, open questions


### Stage 3: Final Reducer

All chunk outputs are concatenated and passed to the final reducer prompt. This stage consolidates, deduplicates, and formats the final structured summary. It also generates the follow-up email draft.


- Input: all chunk summaries concatenated

- Output: the full 8-section structured summary in clean markdown

- This is the only stage that produces the final output seen by the user


## 4.3 Data Model

In v1, there is no database. All state lives in the browser session. The following schema describes the logical data model for v1.5 when lightweight persistence is added.


| Object | Fields |
| --- | --- |
| Meeting | id, title, date, meeting_type, attendees[], created_at |
| Upload | meeting_id, transcript_text, chat_text, file_name, character_count |
| Summary | meeting_id, executive_summary, decisions[], pain_points[], objections[], next_steps[], quotes[], outcomes, email_draft, generated_at, model_version |
| ActionItem | summary_id, description, owner, due_date, status |
| Quote | summary_id, text, speaker, timestamp, selected_by_user |


## 4.4 Token Cost Controls

- Markdown conversion reduces input size before any model call

- Chunk summaries are compact (300-500 tokens each) to keep the reducer input manageable

- No redundant model calls: conversion, chunking, and reduction each run once

- Optional: cache chunk outputs by hash so re-running on the same transcript skips Stage 2

- Estimate per meeting: 60-minute transcript typically costs under $0.05 at Qwen 3 pricing via OpenRouter



# 5. Prompting Pack

All four prompts below are written for Qwen 3 via the OpenRouter API. Each prompt uses explicit output schemas to ensure consistent, parseable responses. Placeholders are shown in [BRACKETS].


## Prompt 1: Markdown Converter

| Purpose Cleans raw Teams transcript text into structured, token-efficient markdown. Run before any summarization. |
| --- |


**System:**

You are a transcript cleaner. Your job is to convert raw meeting transcript text into clean, structured markdown. Follow these rules strictly:

- Remove filler words (um, uh, like, you know) unless they are part of a meaningful quote

- Format each speaker turn as: ## [Speaker Name] [HH:MM] followed by their cleaned dialogue

- Collapse repeated or stuttered phrases to their final clean version

- Preserve meaning and intent. Do not paraphrase or summarize. Only clean.

- Output only the cleaned markdown. No preamble, no commentary.


**User:**

Clean the following transcript into structured markdown:

[RAW_TRANSCRIPT_TEXT]


## Prompt 2: Chunk Summarizer

| Purpose Extracts structured signals from a single transcript chunk. Run once per chunk in Stage 2. |
| --- |


**System:**

You are a meeting analyst. Extract structured signals from the transcript excerpt below. Output only valid JSON matching this schema exactly:

{ "decisions": [{"text": string, "rationale": string}], "pain_points": [{"speaker": string, "text": string}], "action_items": [{"description": string, "owner": string, "due_date": string}], "quote_candidates": [{"speaker": string, "timestamp": string, "text": string, "signal_type": "sentiment|priority|objection|commitment"}], "open_questions": [string] }


**User:**

Meeting type: [MEETING_TYPE]
Chunk [N] of [TOTAL]:

[CHUNK_MARKDOWN]


## Prompt 3: Final Reducer

| Purpose Consolidates all chunk summaries into the final 8-section output. Run once in Stage 3. |
| --- |


**System:**

You are a senior meeting summarizer. You will receive structured signals extracted from chunks of a meeting transcript. Consolidate them into a final summary with these eight sections, in this exact order:

- Executive Summary (5-8 bullets)

- Key Decisions + Rationale

- Customer Needs / Pain Points

- Objections / Risks / Open Questions (tag each item as Objection, Risk, or Open Question)

- Next Steps (table: Owner | Action | Due Date)

- Key Quotes (select 4-8 verbatim quotes with the strongest signal; include speaker and timestamp)

- Meeting Outcomes

- Follow-Up Email Draft


Rules: Remove duplicates. Prefer specificity over generality. Quotes must be verbatim from the input, not paraphrased. If owner or due date is unknown, use TBD. Output clean markdown only.


**User:**

Meeting: [TITLE] | Date: [DATE] | Type: [MEETING_TYPE] | Attendees: [ATTENDEES]

Chunk signals:
[ALL_CHUNK_JSON_CONCATENATED]

Optional chat log:
[CHAT_LOG_OR_NONE]


## Prompt 4: Quality Checker

| Purpose Validates the final summary for completeness. Run after Stage 3 and surface warnings to the user. |
| --- |


**System:**

You are a quality reviewer for meeting summaries. Check the summary below and return a JSON object with this schema:

{ "issues": [{"type": "missing_owner|missing_decision|weak_quote|missing_next_steps|missing_outcome", "description": string, "severity": "high|medium|low"}], "score": number (0-100), "passed": boolean }


Flag as high severity: action items with no owner, zero key quotes, no decisions section. Flag as medium: TBD due dates on more than 3 items, fewer than 4 quotes. Score of 80 or above passes.


**User:**

[FINAL_SUMMARY_MARKDOWN]



# 6. Scope: v1 vs v1.5 vs v2


| Feature | v1 (2 weeks) | v1.5 / v2 |
| --- | --- | --- |
| Transcript paste / .txt upload | Yes | - |
| .vtt file upload (Teams format) | Yes | - |
| 3 meeting templates | Yes | - |
| 8-section structured output | Yes | - |
| Key quotes with attribution | Yes | - |
| Follow-up email draft | Yes | - |
| Copy to clipboard (markdown) | Yes | - |
| Download as .md file | Yes | - |
| Optional chat log input | Yes | - |
| Quality checker warnings | Yes (inline) | - |
| Download as .docx | Stretch | v1.5 |
| Persistent summary history | No | v1.5 |
| User accounts / auth | No | v1.5 |
| Summary editing with autosave | No | v1.5 |
| Teams tab embed | No | v2 |
| Graph API transcript pull | No | v2 |
| Custom org terminology | No | v2 |
| PII redaction controls | No | v2 |
| Multi-user shared summaries | No | v2 |



# 7. Teams Integration Options

Direct Teams integration is not required for v1 but is a realistic v2 path. The three options below are listed in order of increasing complexity.


## Option A: Open Web App (Recommended for v1)

User exports transcript from Teams manually (Download transcript from meeting recap), opens the web app, pastes or uploads the file. No Teams permissions required.


- Complexity: Low

- Prerequisites: None

- Risk: Requires a manual step from the user each time

- Verdict: The right starting point. Validate the core product before adding integration overhead.


## Option B: Teams Messaging Extension (Bot)

A Teams app that accepts a transcript file or paste via a bot command. User types /summarize in a Teams chat, attaches the transcript file, and receives the summary as a bot response card.


- Complexity: Medium (requires Teams app registration, bot framework setup, Azure Bot Service)

- Prerequisites: Microsoft 365 admin approval to deploy a custom Teams app, Azure subscription for bot hosting

- Risk: Admin approval can take weeks in enterprise environments

- Verdict: Good v1.5 target if the team gets admin buy-in early


## Option C: Graph API Transcript Pull

Microsoft Graph API exposes meeting transcripts for Teams Premium accounts. This would allow the app to pull transcripts automatically after a meeting ends, without the user needing to export anything.


- Complexity: High (OAuth app registration, admin consent, Teams Premium license required for transcript API)

- Prerequisites: Teams Premium for all users, Azure AD app registration with admin consent, tenant-level API permissions

- Risk: License cost, security review, and policy restrictions in enterprise tenants

- Verdict: The cleanest long-term experience but not worth the setup cost until v1 usage is validated


| Recommendation Ship v1 as a standalone web app. If usage is high, pursue Option B (Teams bot) for v1.5. Reserve Option C for v2 when there is a business case for the license investment. |
| --- |



# 8. Implementation Plan


## Phase 0: Setup (Days 1-2)

- Initialize Next.js project, deploy empty shell to Vercel

- Set up OpenRouter account and test Qwen 3 API calls with a sample transcript

- Define the prompt pack (use the prompts in Section 5 as starting point, tune with 3-5 real transcripts)

- Create a simple .env config for API keys


## Phase 1: Core Pipeline (Days 3-6)

- Build the markdown converter function (can run client-side with regex before hitting the API)

- Build the chunker (split by speaker boundary, target 2,000 tokens per chunk)

- Build the chunk summarizer API route (POST /api/chunk with transcript chunk, returns JSON signals)

- Build the final reducer API route (POST /api/summarize with all chunk outputs, returns markdown)

- Test end-to-end with 3 real transcript files of varying length


## Phase 2: Frontend (Days 7-10)

- Build the single-page input UI: transcript textarea, optional chat textarea, metadata fields, template selector

- Build the loading state with progress indication (chunk 1 of N processing)

- Build the summary display: render structured markdown sections, highlight quotes panel

- Build copy to clipboard and download as .md export

- Add quality checker inline warnings (flag missing owners, weak quotes)


## Phase 3: Polish and Ship (Days 11-14)

- Test with 10+ real transcripts across all three meeting types

- Tune prompts based on output quality review

- Add basic error handling (transcript too short, API timeout, malformed output)

- Write a one-page internal usage guide

- Share with 3-5 internal users for feedback before broader rollout


| Definition of Done for v1 A user can paste a Teams transcript, select a meeting type, generate a summary with all 8 sections, and export the result in under 90 seconds total time from paste to download. |
| --- |



# 9. Success Metrics

v1 is validated when the following are true after 30 days of internal use:


| Metric | Target |
| --- | --- |
| Time from paste to exported summary | Under 90 seconds for a 60-minute transcript |
| User-reported summary quality | 4 out of 5 or higher on a simple internal rating |
| Action items with identified owner | 80% of action items have a named owner, not TBD |
| Quote quality acceptance | Users keep or lightly edit more than 70% of extracted quotes |
| Weekly active users | 5 or more internal users running at least 1 summary per week |
| Error rate | Under 5% of summaries fail or require a manual retry |



# 10. Risks and Mitigations


| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Qwen 3 output quality is inconsistent on messy transcripts | Medium | Test with 10+ real transcripts in Phase 0. Have fallback prompt variants ready. |
| Teams transcript export format changes | Low | Accept multiple input formats (.txt, .vtt, raw paste). Parser is format-agnostic. |
| Token costs spike with very long meetings | Low | Chunk pipeline caps individual calls. Add a transcript length warning at 15,000 tokens. |
| Users paste sensitive PII (deal values, personal data) | Medium | Add a data handling notice in the UI. PII redaction controls are in the v2 roadmap. |
| Internal adoption is low due to the manual export step | Medium | Document the Teams transcript export flow clearly. Pursue Teams bot integration in v1.5 if friction is cited as a barrier. |

