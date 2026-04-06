# USL Systems - Architecture and Build Standards

**Version 1.0 | March 2026 | Internal Use Only**

> This document defines how USL Systems builds. It is the single source of truth for stack decisions, project structure, team ownership, naming conventions, and the shared context framework every builder uses. If you are opening a new project or a new Claude Code session, start here.

---

## 1. Who We Are and How We Build

USL Systems is an AI-native revenue systems firm. We build custom sales platforms, dealer portals, and revenue intelligence tools for mid-market manufacturers and distributors. AI is not a feature we advertise. It is the operating infrastructure behind everything we deliver.

Being AI-native has a specific meaning for how we build:

- Claude Code is our AI development environment across all projects. Every engineer uses it.
- The Anthropic API (`claude-sonnet-4-20250514`) powers the intelligence layer in our client-facing products.
- Context is engineered, not assumed. Every session, every project, every person starts from shared documented context.
- Speed is a feature. Our stack eliminates decisions that have already been made. Builders build.

> **The Golden Rule:** Any decision that has already been made once should never be made again. This document captures those decisions so the team's cognitive energy goes to the problems that actually require human judgment.

### 1.1 Our Three Products

| Product | Entry Point | Build Range |
|---|---|---|
| Sales Velocity Platform | 2-week audit ($15K-$25K) | $75K-$125K build + retainer |
| Dealer Revenue Portal | 1-week discovery sprint ($20K-$30K) | $160K-$275K build + retainer |
| Revenue Intelligence Hub | 2-week audit ($12K-$18K) | $60K-$110K build + retainer |

---

## 2. The Non-Negotiable Stack

These are not preferences. They are decisions that have been made once and will not be revisited per project. Every build uses this stack unless a specific technical constraint makes it impossible, in which case the Backend Engineer documents the exception in the project's `/context/decisions.md` before deviating.

### 2.1 Core Stack

| Layer | Tool / Service | Owner | Notes |
|---|---|---|---|
| Frontend Framework | Next.js | Frontend Engineer | All client-facing UIs. No alternative. |
| Database + Auth | Supabase | Backend Engineer | Backend Engineer owns production. Frontend reads only. |
| AI Engine | Anthropic API (`claude-sonnet-4-20250514`) | Backend Engineer | No model substitutions without Backend Engineer sign-off. |
| Deployment | Vercel | Backend + Frontend | Netlify is fallback only. Document if used. |
| Version Control | GitHub (uslsystems org) | Backend Engineer | All code here. Main branch is protected. |
| Code Editor (AI) | Cursor ($20/mo) | Backend + Frontend | VS Code + Copilot is backup. Cursor is standard. |
| PDF Generation | React-PDF | Backend Engineer | Stack is built around this. No alternative. |
| Website Crawling | Firecrawl ($19/mo) | Backend Engineer | Audit tool dependency. Required for Sales Velocity Audit. |
| Design / UX | Figma | UX Lead | UX Lead owns structure. Brand Designer owns visual execution. |
| CRM | HubSpot | Operations Lead + GTM Lead | All deals and contacts. Nothing lives in spreadsheets. |

### 2.2 Rules of Use

- All deals and contacts live in HubSpot. If it is not in HubSpot, it does not exist commercially.
- All code lives in GitHub under the uslsystems org. No exceptions.
- Supabase production schema: Backend Engineer owns it. Frontend reads. Nobody else touches production.
- If you need to deviate from the stack, document why in `/context/decisions.md` before you do it.
- Cursor is the standard AI code editor. Use `claude-sonnet-4-20250514` as the model inside it.

---

## 3. Project Structure

Every USL Systems project follows the same repository and folder structure. This is not a suggestion. Consistent structure is what makes shared context possible across different people and different Claude Code sessions.

### 3.1 Repository Structure

Every project repo under `github.com/uslsystems/` follows this layout:

| Path | Purpose |
|---|---|
| `/CLAUDE.md` | Root context file. Claude Code reads this automatically. Contains project overview, stack decisions, key rules, and who to ask for what. |
| `/context/decisions.md` | Architectural decisions and the reasoning behind them. Written once, never deleted. |
| `/context/conventions.md` | Project-specific naming, file structure, patterns, and rules. |
| `/context/state.md` | Living document. What is built, what is in progress, what is next. Updated every session. |
| `/context/people.md` | Team ownership map. Who to involve for which decisions. |
| `/src/app/` | Next.js app router pages and layouts. |
| `/src/components/` | Shared UI components. PascalCase naming. |
| `/src/lib/` | Utility functions, API clients, helpers. |
| `/src/types/` | TypeScript type definitions shared across the app. |
| `/src/hooks/` | Custom React hooks. |
| `/supabase/migrations/` | Database migration files. Sequential naming. |
| `/docs/` | Project-specific technical documentation. |

### 3.2 Active Projects

| Project | Repo Name | Description |
|---|---|---|
| Sales Velocity Audit | `uslsystems-audit` | 7-question scoring tool. Firecrawl + Claude API report generation. Primary lead magnet. |
| USL Systems Website | `uslsystems-site` | uslsystems.co. Next.js. Manufacturing/distribution positioning. |
| Client Portal builds | `uslsystems-[client-name]` | Each client build gets its own repo. Naming: `uslsystems-[client-name]`. |

---

## 4. Naming Conventions

Consistency in naming eliminates a whole class of coordination problems. These rules apply to every project.

### 4.1 Code Conventions

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase | `AuditScoreCard.tsx` |
| API route files | kebab-case | `/api/audit-submit/route.ts` |
| Database tables | snake_case | `audit_responses`, `lead_scores` |
| Database columns | snake_case | `company_name`, `created_at` |
| TypeScript types | PascalCase | `AuditQuestion`, `LeadScore` |
| Utility functions | camelCase | `calculateAuditScore()` |
| Custom hooks | useCamelCase | `useAuditForm`, `useLeadData` |
| Environment variables | UPPER_SNAKE_CASE | `NEXT_PUBLIC_SUPABASE_URL` |
| Migration files | YYYYMMDD_description | `20260317_add_audit_responses.sql` |

### 4.2 Commit Message Convention

Format: `type: short description - reason or context if non-obvious`

| Type | When to Use |
|---|---|
| `feat:` | New feature or capability added |
| `fix:` | Bug fix. Always include what caused it. |
| `refactor:` | Code restructure with no behavior change |
| `chore:` | Config, deps, tooling changes |
| `docs:` | Documentation or context file update |
| `schema:` | Supabase migration or data model change |

**Example:**
```
fix: form validation not submitting on mobile - Supabase RLS policy was blocking anon writes. Added insert policy to audit_responses table.
```

---

## 5. Team Ownership

Every domain has one owner. That owner makes final decisions within their domain without needing approval. Outside your domain, consult the owner before making changes.

| Role | Domain Authority | They Own in Builds | Ask Before Touching |
|---|---|---|---|
| Backend Engineer | Backend architecture, data schema, API design | Supabase schema, Claude API integration, all server-side logic | Any Supabase migration, any new API route or endpoint |
| Frontend Engineer | Frontend tech choices, component architecture | Next.js pages, UI components, client-side state | Changing component structure or adding new global state |
| UX Lead | UX decisions, interaction design, Figma | All Figma prototypes, user flows, information architecture | Any UI pattern not in the Figma spec |
| Brand Designer | Visual execution, brand system | Marketing assets, PDF templates, UI visual polish | Any color, typography, or visual element change |
| Studio Lead | Offer pricing, scope, client direction | Final call on what is in/out of scope | Any scope addition or client-facing commitment |
| Operations Lead | Brand voice, written materials, internal systems | All outbound copy, proposals, documentation | Any copy that leaves the team |

---

## 6. Shared Context Framework

Claude Code has no memory between sessions. Every new session, every new person, starts at zero unless we engineer the context in. This section defines the system that solves that.

### 6.1 How It Works

Context lives in the repository, not in any person's head. Three components make this work:

- `CLAUDE.md` - the standing brief Claude reads automatically at session start
- The `/context/` folder - structured documents that hold decisions, conventions, and current state
- The session handoff protocol - the discipline that keeps it current

### 6.2 CLAUDE.md - What Goes In It

Every project has a `CLAUDE.md` at the root. This is the first thing Claude reads. It answers: what is this project, what stack does it use, what are the key rules, and who owns what.

Required sections:
1. Project summary (2-3 sentences)
2. Stack (with any project-specific notes)
3. Key rules (what Claude should always / never do here)
4. Current state (link to `/context/state.md`)
5. Ownership (who to reference for each domain)

### 6.3 The /context/ Folder

| File | What It Contains | Update Frequency |
|---|---|---|
| `decisions.md` | Why things are built the way they are. Written once. Never deleted. | When a major decision is made |
| `conventions.md` | Project-specific patterns, file structure, naming exceptions. | When a new pattern is established |
| `state.md` | What is done, what is in progress, what is next. The most important file. | Every session |
| `people.md` | Who to involve for which decisions. Contact info and domain map. | When team changes or roles shift |

### 6.4 Session Handoff Protocol

Two steps per session. These are not optional.

**Session start** - paste this into Claude Code before touching any code:

```
Read /context/state.md and CLAUDE.md before we start. Summarize what is in progress and ask me what we are working on today.
```

**Session end** - paste this before closing:

```
Update /context/state.md with what we built today, any decisions we made, and what is next. Note anything the next session should know.
```

> `state.md` is to builds what HubSpot is to deals. If it is not updated, it does not exist for the next session. Treat it the same way.

---

## 7. Build Phase Standards

Every client build follows the same six-week delivery structure.

| Phase | Duration | Builder Deliverables | Context Update Required |
|---|---|---|---|
| Understand | Week 1 | Process audit, current state map, stakeholder interview notes | `decisions.md`: document integration constraints found in client's current stack |
| Define | Week 2 | Architecture plan, data model, integration requirements | `decisions.md`: full architecture rationale. `conventions.md`: project-specific patterns. |
| Design | Week 3 | Supabase schema live, API contract agreed, Figma spec signed off | `state.md`: schema version and API endpoints documented |
| Build | Weeks 4-5 | Production code, integrations, QA, staging environment | `state.md`: updated every session. `decisions.md`: any deviations from original plan. |
| Support | Week 6 | Handoff docs, training materials, retainer onboarding | All `/context/` files finalized. `CLAUDE.md` updated for retainer engineer. |

---

## 8. Document Maintenance

| Document | Owner | Update Trigger |
|---|---|---|
| This document (Architecture Standards) | Studio Lead + Backend Engineer | Stack change, new convention, new project type |
| Project `CLAUDE.md` | Engineer who opened the project | Any structural change to the project |
| `/context/state.md` | Engineer running the session | End of every build session |
| `/context/decisions.md` | Backend Engineer (architecture), others in their domain | When a non-obvious decision is made |
| `/context/conventions.md` | Backend or Frontend Engineer | When a new project-specific pattern is established |

Version history for this document lives in GitHub. Do not maintain a changelog inside the file.
