
**CLAUDE CODE  |  BUILD SEQUENCE**

**Meeting Intelligence**

Transcript Summarization App


Solo Builder  |  Start to Finish  |  14 Days

Domain: meeting.uslsystems.co

Prepared by USL Systems  |  Confidential


# How to Use This Document

This is a build sequence, not a prompt library. Each session has one job, one set of context files to attach, one Claude Code prompt to start from, and a definition of done. Read each session fully before opening Claude Code. Do not combine sessions. Do not add scope mid-session.


## What Claude Code Needs

Claude Code reads your project files, understands the structure, and works through tasks autonomously. It does not need perfectly crafted prompts. It needs clear scope, the right files attached as context, and a definition of done so it knows when to stop. The prompts in this document are session starters, not scripts. Adapt them to what you are actually seeing in your codebase.


## The Four Rules

- Each session has a single clear output. Complete it, verify the definition of done, then move on. Do not add scope mid-session. One session, one job.

- Attach the files listed at the start of each session. Without the right context, Claude Code makes assumptions that create rework. Context in, every time.

- Every session has a definition of done. Check every item before starting the next session. A gap found now takes minutes to fix. A gap found in Phase 3 cascades. Verify before moving on.

- If Claude Code suggests adding something not in the definition of done, log it in the backlog at the end of this document and move on. Less is more.


## Phase Overview

| Phase | Name | What Gets Built |
| --- | --- | --- |
| Phase 0 | Pre-Build | Accounts, API keys, project scaffolding, env setup. No product code until this is done. |
| Phase 1 | Backend Pipeline | Markdown converter, chunker, chunk summarizer, final reducer, quality checker API routes. |
| Phase 2 | Frontend | Input UI, template selector, loading state, summary display, quote panel, export. |
| Phase 3 | File Handling | .vtt, .txt, and .docx upload parsing. DOCX summary export. |
| Phase 4 | Polish and Error Handling | Resilience, edge cases, prompt tuning against real transcripts. |
| Phase 5 | Deploy and Domain | Vercel production deployment, custom domain, DNS, environment variables. |


| Reference Document Attach the Meeting Intelligence PRD v1.0 to every Claude Code session. It is the authoritative source for output format, prompts, and scope decisions. |
| --- |


# Pre-Build Checklist  |  Complete Before Phase 0 Begins

Nothing in the build sequence starts until every item on this list is confirmed. Skipping any item is the fastest way to lose a day mid-build.


## Accounts and Access

□  **Claude Max plan active.**  Claude Code installed and confirmed working on your machine.

□  **OpenRouter account created.**  Visit openrouter.ai, create an account, and add at least $10 in credits.

□  **OpenRouter API key generated.**  Settings > API Keys. Copy it. Store securely. Never put it in code.

□  **Qwen 3 model confirmed available.**  In OpenRouter, search for qwen/qwen3-235b-a22b. Confirm it appears and is enabled.

□  **Vercel account created.**  Connect to your GitHub account during setup.

□  **GitHub repository created.**  Name it meeting-intelligence. Initialize with a README. Create main and dev branches.

□  **Node.js installed.**  Run node --version. Must be v18 or higher.

□  **npm confirmed working.**  Run npm --version. Must be v8 or higher.


## Domain Preparation

The target domain is meeting.uslsystems.co. This is a subdomain of uslsystems.co. You will need access to the DNS settings for uslsystems.co to complete Phase 5. Confirm the following before you start:


□  **You have login access to the DNS provider for uslsystems.co.**  This is wherever the domain is registered: GoDaddy, Cloudflare, Namecheap, or similar.

□  **You can create CNAME records on uslsystems.co.**  Confirm your access level allows DNS record creation.

□  **The subdomain meeting.uslsystems.co is not already in use.**  Check by visiting it in a browser. It should return nothing or an error.


## Environment Variables (prepare before Phase 0)

You will create a .env.local file in the project root in Phase 0. Prepare these values now so you are not hunting for them mid-build.


| Variable | Where to Get It |
| --- | --- |
| OPENROUTER_API_KEY | OpenRouter dashboard > API Keys |
| OPENROUTER_MODEL | Set to: qwen/qwen3-235b-a22b |
| NEXT_PUBLIC_APP_NAME | Set to: Meeting Intelligence |
| MAX_TRANSCRIPT_CHARS | Set to: 120000 (adjust after testing) |
| CHUNK_TOKEN_TARGET | Set to: 2000 |


## File Inputs to Have Ready for Testing

Before Phase 1 ends, you will need real transcript files to test against. Collect these now so you are not blocked during QA.


□  **At least 2 Teams .vtt transcript files.**  Export from a Teams meeting recap. Mix of short (20 min) and long (60+ min).

□  **At least 1 raw .txt transcript.**  Copy-paste from a Teams transcript view and save as .txt.

□  **At least 1 .docx file containing transcript text.**  A Word document where someone pasted or typed meeting notes.

□  **At least 1 Teams chat export.**  Copy from the Teams chat panel and save as plain text.


| Why this matters The prompts in the PRD were designed for real messy transcripts, not synthetic ones. Testing against clean or invented text will give you false confidence. Use real files from the start. |
| --- |


# Phase 0  |  Project Setup

Two sessions. No product features. Everything subsequent phases build on.


| Phase 0  |  Session 1  |  Scaffold the Next.js Project Owner: You |
| --- |


**Context to give Claude Code:**

- No files to attach yet. This session starts from nothing.


**Claude Code prompt:**

| Session 0.1 Prompt Scaffold a new Next.js 14 project using the App Router. Use TypeScript. Use Tailwind CSS for styling. Use the src/ directory structure.  Project name: meeting-intelligence  After scaffolding, do the following: 1. Create a .env.local file at the project root with these variables (leave values as placeholders for now):    OPENROUTER_API_KEY=    OPENROUTER_MODEL=qwen/qwen3-235b-a22b    NEXT_PUBLIC_APP_NAME=Meeting Intelligence    MAX_TRANSCRIPT_CHARS=120000    CHUNK_TOKEN_TARGET=2000 2. Add .env.local to .gitignore if it is not already there. 3. Create a .env.local.example file with the same keys but empty values. This one DOES go in git. 4. Create a /docs folder at the project root. This is where I will put the PRD and other reference documents. 5. Create a /lib folder inside /src for utility functions. 6. Create a /types folder inside /src for shared TypeScript types. 7. Run npm install and confirm the dev server starts without errors.  Do not build any UI or logic yet. Scaffold only. |
| --- |


**Definition of Done:**

□  **npm run dev starts without errors.**

□  **.env.local exists and is in .gitignore.**

□  **.env.local.example exists and is tracked in git.**

□  **src/lib and src/types directories exist.**

□  **docs/ directory exists at project root.**

□  **Project pushed to GitHub on the dev branch.**


| Phase 0  |  Session 2  |  Install Dependencies and Define Types Owner: You |
| --- |


**Context to give Claude Code:**

- Attach the Meeting Intelligence PRD v1.0

- Attach your current package.json


**Install these packages:**


| Package | Purpose |
| --- | --- |
| mammoth | Parse .docx files to extract plain text from uploaded transcripts |
| webvtt-parser | Parse .vtt files from Teams transcript exports |
| docx | Generate .docx summary exports for users to download |
| tiktoken | Count tokens accurately before sending to OpenRouter |
| openai | OpenAI-compatible SDK used to call OpenRouter (same API format) |
| react-markdown | Render the markdown summary output in the browser |
| remark-gfm | GitHub Flavored Markdown support for tables in the rendered output |


**Claude Code prompt:**

| Session 0.2 Prompt Install the following npm packages: mammoth, webvtt-parser, docx, tiktoken, openai, react-markdown, remark-gfm  Then create the following TypeScript types in src/types/index.ts:  MeetingType: union type of 'sales_discovery' | 'customer_support' | 'internal_sync'  MeetingMetadata: { title?: string; date?: string; attendees?: string[]; purpose?: string; }  ChunkSignals: { decisions: { text: string; rationale: string }[]; pain_points: { speaker: string; text: string }[]; action_items: { description: string; owner: string; due_date: string }[]; quote_candidates: { speaker: string; timestamp: string; text: string; signal_type: string }[]; open_questions: string[]; }  MeetingSummary: { executive_summary: string[]; decisions: { text: string; rationale: string }[]; pain_points: string[]; objections: { type: 'Objection' | 'Risk' | 'Open Question'; text: string }[]; next_steps: { owner: string; action: string; due_date: string }[]; quotes: { speaker: string; timestamp: string; text: string }[]; outcomes: string[]; email_draft: string; }  QualityResult: { issues: { type: string; description: string; severity: 'high' | 'medium' | 'low' }[]; score: number; passed: boolean; }  Confirm all packages install cleanly and types compile without errors. |
| --- |


**Definition of Done:**

□  **All packages install without errors.**

□  **src/types/index.ts exists with all five types defined.**

□  **npm run build completes without TypeScript errors.**


# Phase 1  |  Backend Pipeline

Five sessions. This is the core of the product. Build each session in order. Do not start Session 1.2 until 1.1 is verified.


| Important Each API route in this phase uses the OpenRouter API. The model is called using the openai SDK pointed at the OpenRouter base URL (https://openrouter.ai/api/v1). The model name is qwen/qwen3-235b-a22b. This is the same API shape as OpenAI, just a different base URL and model string. |
| --- |


| Phase 1  |  Session 1  |  Markdown Converter Owner: You |
| --- |


**Context to give Claude Code:**

- Attach src/types/index.ts

- Attach the PRD v1.0 (Section 5, Prompt 1)


**Claude Code prompt:**

| Session 1.1 Prompt Build the transcript markdown converter in src/lib/converter.ts  This function takes raw transcript text (string) and returns cleaned markdown (string). It does NOT call the AI model. It runs as a pure utility function.  The converter must: 1. Detect and handle three input formats:    - .vtt format: lines beginning with timestamps like 00:01:23.456 --> 00:01:26.789    - Speaker-labeled format: lines like 'Sarah Jones: text here' or 'SARAH: text'    - Raw paragraphs: no speaker labels, no timestamps 2. For .vtt format: extract speaker name and timestamp from WEBVTT cue headers, clean the cue text, output as ## Speaker [HH:MM] 3. For speaker-labeled format: normalize speaker names to title case, group consecutive lines from the same speaker, output as ## Speaker [if timestamp present] 4. For raw paragraphs: wrap each paragraph in a markdown block with no speaker heading 5. Strip filler words: um, uh, like (when used as filler), you know, I mean, sort of, kind of (use a conservative regex, do not strip words that are part of meaning) 6. Collapse 3+ consecutive spaces into one. Remove blank lines that appear 3+ times in a row. 7. Return the cleaned markdown string.  Also build: src/lib/chunker.ts This function takes cleaned markdown (string) and a target token count (number, default 2000) and returns an array of strings (chunks). Chunking rules: - Use the tiktoken library to count tokens (model: cl100k_base encoding) - Split at speaker boundaries (## headings) when possible - Never split mid-sentence - Add 100 token overlap at each boundary by appending the last 100 tokens of the previous chunk to the start of the next - Return chunks as string[]  Write a simple test in src/lib/__tests__/converter.test.ts that runs the converter on a 10-line sample .vtt string and confirms it returns markdown with ## headings. |
| --- |


**Definition of Done:**

□  **src/lib/converter.ts exports a convertTranscript(text: string): string function.**

□  **src/lib/chunker.ts exports a chunkTranscript(markdown: string, targetTokens?: number): string[] function.**

□  **Converter correctly handles .vtt, speaker-labeled, and raw paragraph formats.**

□  **Chunker never produces a chunk exceeding targetTokens + 200 (overlap buffer).**

□  **Test passes on the sample .vtt string.**


| Phase 1  |  Session 2  |  Chunk Summarizer API Route Owner: You |
| --- |


**Context to give Claude Code:**

- Attach src/lib/converter.ts

- Attach src/lib/chunker.ts

- Attach src/types/index.ts

- Attach PRD v1.0 (Section 5, Prompt 2)


**Claude Code prompt:**

| Session 1.2 Prompt Build a Next.js API route at src/app/api/chunk/route.ts  This route accepts POST requests with a JSON body: { chunk: string; chunkIndex: number; totalChunks: number; meetingType: MeetingType; }  It must: 1. Call the OpenRouter API using the openai SDK:    - Base URL: https://openrouter.ai/api/v1    - Model: process.env.OPENROUTER_MODEL    - API key: process.env.OPENROUTER_API_KEY 2. Use this exact system prompt:    'You are a meeting analyst. Extract structured signals from the transcript excerpt below. Output only valid JSON matching this schema exactly. Do not include any preamble, explanation, or markdown formatting. Output raw JSON only. Schema: { "decisions": [{"text": string, "rationale": string}], "pain_points": [{"speaker": string, "text": string}], "action_items": [{"description": string, "owner": string, "due_date": string}], "quote_candidates": [{"speaker": string, "timestamp": string, "text": string, "signal_type": string}], "open_questions": [string] }' 3. Include in the user message: the meeting type, chunk index (N of TOTAL), and the chunk text 4. Parse the response as JSON into a ChunkSignals object 5. Return { signals: ChunkSignals } on success 6. Return { error: string, detail: string } with status 500 on failure 7. Set a 30 second timeout on the OpenRouter call  Do not stream. Use a standard completion call. Keep max_tokens at 1500. |
| --- |


**Definition of Done:**

□  **POST /api/chunk returns a valid ChunkSignals JSON object when called with a real chunk.**

□  **The route uses environment variables for model name and API key. No hardcoded values.**

□  **A malformed OpenRouter response returns a structured error, not an uncaught exception.**


| Phase 1  |  Session 3  |  Final Reducer API Route Owner: You |
| --- |


**Context to give Claude Code:**

- Attach src/app/api/chunk/route.ts

- Attach src/types/index.ts

- Attach PRD v1.0 (Section 5, Prompt 3)


**Claude Code prompt:**

| Session 1.3 Prompt Build a Next.js API route at src/app/api/summarize/route.ts  This route accepts POST requests with a JSON body: { chunkSignals: ChunkSignals[]; metadata: MeetingMetadata; meetingType: MeetingType; chatLog?: string; }  It must: 1. Concatenate all chunk signals into a single JSON string to include in the prompt 2. Call OpenRouter with the Final Reducer prompt from the PRD (Section 5, Prompt 3) 3. The system prompt must instruct the model to output clean markdown only, no JSON, with these exact section headings in this order:    ## Executive Summary    ## Key Decisions    ## Customer Needs and Pain Points    ## Objections, Risks, and Open Questions    ## Next Steps    ## Key Quotes    ## Meeting Outcomes    ## Follow-Up Email Draft 4. Include meeting metadata (title, date, attendees, type) in the user message context 5. If chatLog is provided, append it with the label 'Teams Chat Context:' before the chunk signals 6. Set max_tokens to 3000 7. Return { markdown: string } on success 8. Return { error: string } with status 500 on failure  Also build: a single orchestrator function at src/lib/pipeline.ts This function accepts the raw transcript text, optional chat log, meeting type, and metadata. It runs the full pipeline in order: convert -> chunk -> call /api/chunk for each chunk (with 500ms delay between calls to avoid rate limits) -> call /api/summarize with all signals. Return the final markdown string. This is the only function the frontend will call. |
| --- |


**Definition of Done:**

□  **POST /api/summarize returns a markdown string with all 8 sections present.**

□  **src/lib/pipeline.ts exports a runPipeline(args) function.**

□  **End-to-end pipeline test: paste a real 10-minute transcript into a test script, run pipeline, confirm all 8 sections appear in output.**


| Phase 1  |  Session 4  |  Quality Checker API Route Owner: You |
| --- |


**Context to give Claude Code:**

- Attach src/app/api/summarize/route.ts

- Attach src/types/index.ts

- Attach PRD v1.0 (Section 5, Prompt 4)


**Claude Code prompt:**

| Session 1.4 Prompt Build a Next.js API route at src/app/api/quality/route.ts  This route accepts POST requests with a JSON body: { markdown: string }  It must: 1. Call OpenRouter with the Quality Checker prompt from the PRD (Section 5, Prompt 4) 2. The model must return only valid JSON matching QualityResult (no preamble, no markdown formatting) 3. Parse the response and return { result: QualityResult } 4. On parse failure, return a default QualityResult with score: 0, passed: false, and one issue of type 'parse_error'  Also build a rule-based pre-check in src/lib/qualityCheck.ts that runs BEFORE the model call and catches obvious issues without spending tokens: - Missing ## Next Steps section: high severity - Fewer than 2 lines in ## Key Quotes section: high severity - The string 'TBD' appearing more than 4 times in the Next Steps section: medium severity - Missing ## Key Decisions section or section is empty: medium severity - Total markdown output under 300 words: high severity (likely a failed generation)  If the pre-check finds a high severity issue, return that result immediately without calling the model. If pre-check passes, call the model for deeper review. Merge and deduplicate issues from both sources before returning. |
| --- |


**Definition of Done:**

□  **POST /api/quality returns a QualityResult with correct severity flags when given a weak summary.**

□  **Rule-based pre-check catches missing sections without a model call.**

□  **A passing summary (score 80+) returns passed: true.**


# Phase 2  |  Frontend

Four sessions. Build the complete user interface. The goal at the end of this phase is a working end-to-end flow: input to summary to export.


| Phase 2  |  Session 1  |  Input Page and Template Selector Owner: You |
| --- |


**Context to give Claude Code:**

- Attach src/lib/pipeline.ts

- Attach src/types/index.ts

- Attach PRD v1.0 (Sections 2 and 3)


**Claude Code prompt:**

| Session 2.1 Prompt Build the main input page at src/app/page.tsx  The page is a single-column layout with a clean, minimal style. No sidebar. No nav. Just the tool.  The page must include: 1. App title: 'Meeting Intelligence' in a large, clean heading 2. A transcript input area with a large textarea (minimum 300px tall) and a label: 'Paste your transcript or upload a file' 3. A file upload button next to the textarea label that accepts .txt, .vtt, and .docx files (file parsing is wired in Phase 3; for now, show the filename on selection but do not parse) 4. A meeting type selector with three clearly labeled options presented as large radio buttons or toggle chips:    - Sales Discovery    - Customer Support    - Internal Sync 5. An optional metadata section (collapsible, collapsed by default) with fields for: Meeting title, Date, Attendees (comma-separated), Purpose 6. An optional chat log textarea (collapsible, collapsed by default) with label: 'Teams chat log (optional)' 7. A Generate Summary button. Disabled when the transcript area is empty.  Styling: - Use Tailwind CSS only - Clean white background, dark text, blue accent for primary actions - Generous padding. Readable at 1280px wide and on a tablet. - The Generate Summary button should be visually prominent (full width or large)  State management: - Use React useState for all field values - On Generate Summary click: set a loading state (isGenerating: true), call src/lib/pipeline.ts runPipeline with the current field values, store the result in state - The summary display (Phase 2, Session 2) will be built next. For now, console.log the result and show a placeholder div. |
| --- |


**Definition of Done:**

□  **All input fields render correctly on desktop (1280px) and tablet (768px).**

□  **Generate Summary is disabled when transcript is empty.**

□  **Meeting type selector has exactly three options and one is always selected.**

□  **Optional sections (metadata, chat) collapse and expand correctly.**

□  **Clicking Generate Summary calls runPipeline and logs the result.**


| Phase 2  |  Session 2  |  Summary Display and Quote Panel Owner: You |
| --- |


**Context to give Claude Code:**

- Attach src/app/page.tsx from Session 2.1

- Attach src/types/index.ts


**Claude Code prompt:**

| Session 2.2 Prompt Build the summary display section that appears below the input form after generation completes.  The display must include: 1. A split view with two columns on desktop, single column on mobile:    Left column (60% width): rendered markdown of the full summary using react-markdown with remark-gfm    Right column (40% width): the Key Quotes panel (see below) 2. Key Quotes panel:    - Extract the ## Key Quotes section from the markdown    - Display each quote as a card with the quote text, speaker name, and timestamp    - Cards have a subtle left border in the brand blue color    - If the quality checker returned issues, show a warning banner above the quotes panel listing the high-severity issues 3. Quality indicator:    - Show a small score badge (e.g., 'Quality: 84 / 100') in the top-right of the summary area    - Green if passed, amber if score 60-79, red if below 60 4. A loading state that replaces the summary area while isGenerating is true:    - Show a progress message that updates as each chunk is processed    - Message format: 'Processing chunk 2 of 7...'    - Use a simple animated spinner or progress bar  Wire the quality checker: after runPipeline returns the markdown, call POST /api/quality with the markdown and store the QualityResult in state. Show it in the quality indicator.  The left column markdown rendering must style: - ## headings as clearly visible section headers - Tables (for Next Steps) with clean borders - Blockquotes (if used for quotes) with the blue left border style |
| --- |


**Definition of Done:**

□  **Summary renders correctly with all 8 sections styled and readable.**

□  **Key Quotes panel shows individual quote cards.**

□  **Quality score badge displays with correct color coding.**

□  **High-severity quality issues appear as a warning banner.**

□  **Loading state shows chunk progress during generation.**


| Phase 2  |  Session 3  |  Export Functions Owner: You |
| --- |


**Context to give Claude Code:**

- Attach src/app/page.tsx

- Attach src/types/index.ts


**Claude Code prompt:**

| Session 2.3 Prompt Add three export options to the summary area. Place them in a toolbar above the summary display.  Option 1: Copy to Clipboard - Button: 'Copy Markdown' - Copies the full summary markdown string to the clipboard - Button text changes to 'Copied!' for 2 seconds, then reverts  Option 2: Download as .md - Button: 'Download .md' - Creates a Blob from the markdown string with type text/markdown - Filename: meeting-summary-[YYYY-MM-DD].md using the date from metadata or today's date - Triggers a browser download  Option 3: Copy Email Draft - Button: 'Copy Email' - Extracts only the ## Follow-Up Email Draft section from the markdown - Copies it to clipboard - Button text changes to 'Copied!' for 2 seconds  All three buttons should be clearly visible but not visually dominant. Use outlined button style. Buttons should only render when a summary is present (not during loading or before generation). |
| --- |


**Definition of Done:**

□  **All three export buttons appear only when a summary exists.**

□  **Copy to Clipboard copies the full markdown and shows confirmation.**

□  **Download .md triggers a file download with the correct filename.**

□  **Copy Email extracts only the email section and copies it.**


| Phase 2  |  Session 4  |  Full End-to-End Smoke Test Owner: You |
| --- |


**Context to give Claude Code:**

- This is a QA session, not a build session. Attach your full codebase.


**Claude Code prompt:**

| Session 2.4 Prompt Run a full end-to-end smoke test of the application using these three scenarios. Fix any issues you find.  Scenario A: Short internal sync - Paste a 5-minute internal team sync transcript (you can invent one for this test) - Select: Internal Sync - Generate and confirm all 8 sections appear - Confirm quality score is above 60 - Download the .md file and confirm it is not empty  Scenario B: Missing data handling - Paste only 3 lines of transcript text (very short, insufficient for a real summary) - Generate and confirm the quality checker flags it with a high-severity issue - Confirm the app does not crash  Scenario C: Metadata included - Paste a 10-minute sales discovery transcript - Fill in all metadata fields - Select: Sales Discovery - Generate and confirm the summary uses the metadata (title appears in the output)  Report the result of each scenario. Fix any failures before closing this session. |
| --- |


**Definition of Done:**

□  **All three scenarios complete without application errors.**

□  **Scenario B correctly surfaces quality warnings.**

□  **Metadata from Scenario C appears in the output.**


# Phase 3  |  File Handling

Two sessions. Adds .vtt, .txt, and .docx upload parsing for transcript input, and .docx export for summary output.


| Phase 3  |  Session 1  |  Transcript File Parsing (.vtt, .txt, .docx) Owner: You |
| --- |


**Context to give Claude Code:**

- Attach src/lib/converter.ts

- Attach src/app/page.tsx

- Attach src/types/index.ts


**Claude Code prompt:**

| Session 3.1 Prompt Build a file parser utility at src/lib/fileParser.ts  This function accepts a File object (from the browser file input) and returns a Promise<string> containing the extracted plain text.  It must handle three file types:  1. .vtt files:    - Read as text using FileReader    - Parse using the webvtt-parser library    - Extract cue text and any speaker labels embedded in the cues    - Return formatted as: 'SPEAKER [HH:MM]: cue text' per line  2. .txt files:    - Read as text using FileReader    - Return the raw text content directly  3. .docx files:    - Read as ArrayBuffer using FileReader    - Pass to mammoth.extractRawText({ arrayBuffer })    - Return the extracted plain text value    - If mammoth returns messages (warnings), log them to console but do not throw  4. Any other file type: throw an Error('Unsupported file type. Please upload a .vtt, .txt, or .docx file.')  Wire this into src/app/page.tsx: - When a file is selected in the file upload input, call parseFile(file) - On success: populate the transcript textarea with the parsed text - On error: show an inline error message below the file input - Show a brief loading state (e.g., 'Reading file...') while parsing |
| --- |


**Definition of Done:**

□  **Uploading a .vtt file populates the transcript textarea with parsed cue text.**

□  **Uploading a .txt file populates the textarea with raw text.**

□  **Uploading a .docx file extracts and populates the text correctly via mammoth.**

□  **Uploading an unsupported file type shows a clear error message.**

□  **Test with one real file of each supported type.**


| Phase 3  |  Session 2  |  Summary Export as .docx Owner: You |
| --- |


**Context to give Claude Code:**

- Attach src/app/page.tsx

- Attach src/types/index.ts


**Claude Code prompt:**

| Session 3.2 Prompt Build a DOCX export utility at src/lib/exportDocx.ts  This function accepts the summary markdown string and optional MeetingMetadata and returns a Promise<Blob> containing a valid .docx file.  Use the 'docx' npm library. The exported document must: 1. Use US Letter page size (12240 x 15840 DXA) with 1-inch margins 2. Include a title at the top: the meeting title from metadata, or 'Meeting Summary' if not provided 3. Include the date below the title if provided 4. Parse the markdown into sections by splitting on ## headings 5. Render each section heading as a Heading2 style 6. Render each section body as normal body paragraphs 7. Render the Next Steps section as a simple table with three columns: Owner, Action, Due Date (parse the markdown table rows) 8. Render Key Quotes as indented paragraphs with a subtle left border style 9. Use Arial font throughout. Body text at 11pt. Headings at 14pt bold. 10. Return the document as a Blob using Packer.toBlob(doc)  Add a 'Download .docx' button to the export toolbar in src/app/page.tsx On click: call exportDocx(markdown, metadata), create an object URL from the Blob, trigger a download Filename: meeting-summary-[YYYY-MM-DD].docx  The .docx export does not need to perfectly replicate the markdown rendering. It needs to be clean, readable, and professional. |
| --- |


**Definition of Done:**

□  **Download .docx button appears in the export toolbar when a summary exists.**

□  **Clicking it downloads a valid .docx file (opens in Word without errors).**

□  **The document contains all 8 sections with correct headings.**

□  **Next Steps section renders as a table in Word.**

□  **The document is readable and professional without additional formatting.**


# Phase 4  |  Polish and Error Handling

Two sessions. Make the app resilient and ready for real internal use.


| Phase 4  |  Session 1  |  Error Handling and Edge Cases Owner: You |
| --- |


**Claude Code prompt:**

| Session 4.1 Prompt Audit the application for unhandled errors and add resilience. Address each of these scenarios:  1. OpenRouter timeout or 5xx error during chunk processing:    - Retry the failed chunk once after a 2 second delay    - If the retry also fails, skip the chunk and continue with the remaining chunks    - Show a non-blocking warning in the UI: 'One chunk could not be processed and was skipped.'  2. Final reducer returns malformed output (not valid 8-section markdown):    - Show the raw output to the user anyway with a warning banner: 'The summary could not be fully structured. Raw output is shown below.'    - Do not crash or show an empty state  3. Transcript too long (over MAX_TRANSCRIPT_CHARS characters):    - Before starting generation, check character count    - If over the limit, show an inline warning with the count and the limit    - Still allow generation but inform the user that very long transcripts may produce lower quality output  4. Empty OpenRouter API key:    - On app load, check that OPENROUTER_API_KEY is set in the environment    - If missing, show a configuration error banner at the top of the page    - Disable the Generate button  5. Network offline:    - If the fetch call fails due to network error, show: 'Generation failed. Check your connection and try again.'    - Restore the form to its pre-generation state so the user can retry without re-entering data |
| --- |


**Definition of Done:**

□  **Each of the five error scenarios is handled without a crash or blank screen.**

□  **Error messages are clear and actionable, not generic.**


| Phase 4  |  Session 2  |  Prompt Tuning Against Real Transcripts Owner: You |
| --- |


This is a manual QA session, not a code session. Run the full pipeline against your 4 real test transcripts collected in the pre-build checklist. Evaluate each output against this rubric:


| Check | Pass Criteria | Common Fix |
| --- | --- | --- |
| Executive Summary | 5 to 8 bullets. Each bullet is meaningful and standalone. | If bullets are vague, add 'Be specific and concrete' to the system prompt. |
| Next Steps table | Each row has a real owner name or role. TBD is rare. | If owners are missing, add 'Infer the owner from context if not stated' to prompt. |
| Key Quotes | 4 to 8 quotes. Each is verbatim and high-signal. | If quotes are generic, add 'Prefer quotes that reveal emotion, priority, or commitment.' |
| Follow-up email | Under 200 words. Professional. Specific to this meeting. | If too generic, pass metadata more explicitly in the user message. |
| Section order | All 8 sections present in the specified order. | If a section is missing, add it explicitly to the ordered list in the reducer prompt. |


Log any prompts you adjust and why in the Decision Log at the end of this document. This protects you from reverting good changes accidentally.


# Phase 5  |  Deploy and Domain

Three sessions. Deploy to Vercel production and connect the custom subdomain meeting.uslsystems.co.


| Phase 5  |  Session 1  |  Vercel Production Deployment Owner: You |
| --- |


**Steps to complete before Claude Code:**

- Push all Phase 4 changes to the main branch on GitHub.

- Log into your Vercel account at vercel.com.

- Click Add New > Project.

- Import your meeting-intelligence GitHub repository.

- Leave all build settings as default (Vercel auto-detects Next.js).

- Before clicking Deploy, go to Environment Variables and add the following:


| Variable | Value |
| --- | --- |
| OPENROUTER_API_KEY | Your OpenRouter API key |
| OPENROUTER_MODEL | qwen/qwen3-235b-a22b |
| NEXT_PUBLIC_APP_NAME | Meeting Intelligence |
| MAX_TRANSCRIPT_CHARS | 120000 |
| CHUNK_TOKEN_TARGET | 2000 |


- Click Deploy. Wait for the build to complete (typically 60-90 seconds).

- Open the generated .vercel.app URL and run Scenario A from Phase 2 Session 4 to confirm production works.


| If the build fails The most common cause is a missing environment variable referenced in code. Check the build logs in Vercel. Look for 'undefined' or 'cannot read property of undefined' errors near API route files. |
| --- |


| Phase 5  |  Session 2  |  Connect Custom Domain: meeting.uslsystems.co Owner: You |
| --- |


This session has two parts: adding the domain in Vercel, and creating the DNS record with your domain registrar.


### Part A: Add the Domain in Vercel

- In your Vercel project, go to Settings > Domains.

- Click Add Domain and type: meeting.uslsystems.co

- Vercel will show you a DNS record to create. It will be one of two types:


| Record Type | When Vercel shows this |
| --- | --- |
| CNAME record | Most common for subdomains. Vercel provides a target like cname.vercel-dns.com |
| A record | Less common. Vercel provides an IP address like 76.76.21.21 |


Copy the exact record type, name, and value that Vercel shows you. You will need them in Part B.


### Part B: Create the DNS Record

Log into your DNS provider for uslsystems.co (GoDaddy, Cloudflare, Namecheap, or wherever the domain is registered). Navigate to the DNS management section. Create a new record:


| Field | Value to Enter |
| --- | --- |
| Type | CNAME (or A, depending on what Vercel showed you) |
| Name / Host | meeting  (this is the subdomain prefix only, not the full domain) |
| Value / Points To | The exact value Vercel provided (e.g., cname.vercel-dns.com) |
| TTL | 300 seconds (5 minutes) for faster propagation during setup |


| Cloudflare Users If uslsystems.co is proxied through Cloudflare (orange cloud), you must set the meeting CNAME record to DNS Only (gray cloud) for Vercel to verify the domain. Full proxy mode conflicts with Vercel's SSL provisioning. |
| --- |


### Part C: Wait and Verify

- Return to Vercel > Settings > Domains. The domain status will show 'Verifying' initially.

- DNS propagation typically takes 5 to 30 minutes for a new subdomain CNAME. In rare cases it can take up to 2 hours.

- Once Vercel shows the domain as valid and SSL is provisioned (green checkmark), visit https://meeting.uslsystems.co in your browser.

- Run the end-to-end smoke test from Phase 2 Session 4 on the live domain to confirm everything works.


| SSL is automatic Vercel provisions an SSL certificate automatically via Let's Encrypt once the DNS record is verified. You do not need to do anything additional for HTTPS. |
| --- |


| Phase 5  |  Session 3  |  Production Hardening Owner: You |
| --- |


**Claude Code prompt:**

| Session 5.3 Prompt Add the following production configurations to the Next.js app before final deployment.  1. Add a next.config.ts with these settings:    - Set headers to include X-Content-Type-Options: nosniff and X-Frame-Options: DENY on all routes    - Set poweredByHeader: false to remove the X-Powered-By header  2. Add a robots.txt at public/robots.txt that disallows all crawlers:    User-agent: *    Disallow: /    (This is an internal tool. It should not be indexed.)  3. Add rate limiting to the /api/summarize route:    - Track requests by IP address using a simple in-memory Map    - Allow a maximum of 10 requests per IP per hour    - Return 429 Too Many Requests with a message if the limit is exceeded    - Note: in-memory rate limiting resets on server restart; this is sufficient for internal use  4. Add a basic health check route at /api/health that returns: { status: 'ok', timestamp: ISO string }  5. Confirm that no API keys or secrets are included in any client-side bundle.    - Run: grep -r 'OPENROUTER_API_KEY' .next/ and confirm zero results in the client bundle  Push to main and confirm the Vercel deployment succeeds. |
| --- |


**Definition of Done:**

□  **Security headers present on all routes (verify with curl -I https://meeting.uslsystems.co).**

□  **robots.txt returns Disallow: / for all crawlers.**

□  **Rate limiting returns 429 after 10 requests from the same IP.**

□  **/api/health returns status: ok.**

□  **No API key found in client bundle grep.**

□  **Production deployment on meeting.uslsystems.co is fully functional.**


# Decision Log  |  Update Throughout the Build

Log every significant decision made during the build. This becomes the record of why things were built the way they were. Especially important for prompt changes, scope deviations, and anything that differed from the PRD.


| Date | Decision | Reason |
| --- | --- | --- |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |



# Phase 2+ Backlog  |  Do Not Build Now

Every idea that comes up during the build that is not in the v1 scope goes here. Log it and move on. Do not build it.


| Feature | Why Deferred | Logged By |
| --- | --- | --- |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |



# Quick Reference  |  Key URLs and Commands


| Item | Value |
| --- | --- |
| Local dev server | npm run dev (http://localhost:3000) |
| OpenRouter dashboard | https://openrouter.ai/settings/keys |
| Vercel dashboard | https://vercel.com/dashboard |
| Production URL | https://meeting.uslsystems.co |
| Health check | https://meeting.uslsystems.co/api/health |
| GitHub repository | https://github.com/[your-org]/meeting-intelligence |
| Deploy to production | Push to main branch (auto-deploys via Vercel) |
| View Vercel logs | Vercel dashboard > Project > Functions tab |



# Environment Variable Reference


| Variable | Required | Notes |
| --- | --- | --- |
| OPENROUTER_API_KEY | Yes | Never expose client-side. Server-only. |
| OPENROUTER_MODEL | Yes | qwen/qwen3-235b-a22b at launch. Can swap models here. |
| NEXT_PUBLIC_APP_NAME | No | Displayed in the UI header. |
| MAX_TRANSCRIPT_CHARS | No | Default 120000. Increase if needed. |
| CHUNK_TOKEN_TARGET | No | Default 2000. Lower if model outputs are poor on long meetings. |

