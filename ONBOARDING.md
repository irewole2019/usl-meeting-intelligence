# Onboarding - USL Systems Engineering

Welcome. This page tells you exactly what to read and do before writing your first line of code.

---

## Step 1 - Read the Architecture Standards

Start here before anything else:
[USL_Architecture_Standards.md](./USL_Architecture_Standards.md)

This covers: who we are, the non-negotiable stack, project structure, naming conventions, team ownership, and the shared context system. Every decision in there has already been made. You do not need to make it again.

---

## Step 2 - Understand the Context System

We use Claude Code across all projects. Claude Code has no memory between sessions, which means every session starts at zero unless we engineer the context in.

Every repo has two things that solve this:

**`CLAUDE.md` at the root** - Claude reads this automatically when you open a session. It tells Claude what the project is, what stack it uses, and who owns what.

**A `/context/` folder** with four files:

| File | What it is |
|---|---|
| `state.md` | What is built, what is in progress, what is next. Updated every session. |
| `decisions.md` | Why things are built the way they are. Written once, never deleted. |
| `conventions.md` | Project-specific naming and patterns. |
| `people.md` | Who to involve for which decisions. |

Before your first session on any project, read these files. They are your briefing.

---

## Step 3 - Set Up Your Tools

| Tool | Action |
|---|---|
| Cursor | Install at cursor.com. This is the standard AI code editor. Set the model to `claude-sonnet-4-20250514`. |
| GitHub | Make sure you have been added to the `uslsystems` org with the correct repo access. |
| Supabase | Ask the Backend Engineer for project access. Do not touch production schema without their sign-off. |
| Vercel | Ask Studio Lead or Backend Engineer for team access. |
| HubSpot | Ask Operations Lead for access if your role requires it. |
| Microsoft Teams | You should already have this. Channels you need: `#general`, `#builds`, `#gtm-outbound`, `#hot-leads`. |

---

## Step 4 - Learn the Two Session Prompts

Copy these into a note you can access quickly. You will use them every session.

**At the start of every Claude Code session, paste this first:**

```
Read /context/state.md and CLAUDE.md before we start. Summarize what is in progress and ask me what we are working on today.
```

**At the end of every session, paste this before closing:**

```
Update /context/state.md with what we built today, any decisions we made, and what is next. Note anything the next session should know.
```

These are also pinned in the `#builds` Teams channel.

---

## Step 5 - Know Who Owns What

Make a decision within your domain without asking. Outside your domain, ask the owner before touching anything.

| Domain | Owner | Ask before... |
|---|---|---|
| Supabase schema, API routes | Backend Engineer | Any schema change or new endpoint |
| Next.js pages, UI components | Frontend Engineer | Changing component structure |
| Figma, UX flows | UX Lead | Any pattern not in the Figma spec |
| Copy, brand voice | Operations Lead | Anything the client or prospect will read |
| Scope, pricing, client direction | Studio Lead | Any client-facing commitment |

If you are unsure whether something is in your domain, it is faster to ask than to fix a problem later. Post in `#builds` and tag the relevant person. Four-hour response window during working hours.

---

## Step 6 - Understand Commit Messages

Every commit follows this format:

```
type: short description - reason if non-obvious
```

Types: `feat:` `fix:` `refactor:` `chore:` `docs:` `schema:`

The reason matters. A commit that says `fix: form validation` tells nobody anything. A commit that says `fix: form validation - Supabase RLS was blocking anon inserts, added policy to audit_responses` tells the next person exactly what happened and why.

---

## Week One Checklist

- [ ] Read the Architecture Standards doc in full
- [ ] Read `CLAUDE.md` and `/context/state.md` for each project you are working on
- [ ] Confirm access to GitHub, Supabase, Vercel, and Teams
- [ ] Pin the two session prompts somewhere accessible
- [ ] Join your first Build Sync (Tuesdays and Thursdays, 9:30 AM CST)
- [ ] Complete your first session using the start and end prompts

---

## Questions

Post in `#builds` for anything technical. Message the Studio Lead directly if you need a decision that affects scope or the client. Do not sit on a blocker for more than four hours without flagging it.
