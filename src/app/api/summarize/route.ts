import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChunkSignals, MeetingMetadata, MeetingType } from '@/types';

// In-memory rate limiting — resets on server restart, sufficient for internal use
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

interface SummarizeRequest {
  chunkSignals: ChunkSignals[];
  metadata: MeetingMetadata;
  meetingType: MeetingType;
  chatLog?: string;
}

const SYSTEM_PROMPT = `You are a senior meeting summarizer. Produce a summary that someone can scan in 30 seconds and know exactly what happened, what was decided, and what they need to do.

Write in direct, declarative language. No filler phrases like "The team discussed..." or "It was mentioned that..." — go straight to the substance. Use active voice and present tense where possible.

Output exactly these 8 sections in this order. Every section is mandatory — if nothing applies, write "None identified."

## Executive Summary
Exactly 5 bullets. Each bullet is one sentence stating a concrete outcome, decision, or finding. Written for someone who was not in the meeting.

## Key Decisions
Max 5 decisions. Each as: **Decision** — one-sentence rationale (Decided by: Name).
Only include explicit commitments where someone chose a course of action. Do not include discussion topics or suggestions.

## Customer Needs and Pain Points
Max 5 items. Synthesize each pain point into one clear sentence describing the underlying need or challenge. Do NOT paste raw transcript text. Attribute to the person who raised it.

## Objections, Risks, and Open Questions
Max 5 items. Each tagged as [Objection], [Risk], or [Open Question]. One sentence each. Only include items that need resolution — not rhetorical questions or settled matters.

## Next Steps
Markdown table: Owner | Action | Due Date.
Max 7 rows. Each action must be specific and completable. Use actual dates where stated. Use "TBD" only when no date was mentioned. Do not include vague items like "discuss further."

## Key Quotes
Exactly 4 quotes. Each must be under 30 words. Select for signal: emotion, strategic intent, commitment, or pushback. Format: > "Quote text" — **Speaker Name**

## Meeting Outcomes
Max 3 bullets. State what materially changed: agreements reached, relationships shifted, directions set. Not a recap — only net-new outcomes.

## Follow-Up Email Draft
Under 150 words. Professional, specific to this meeting. Open with a thank-you, summarize 2-3 key outcomes, list immediate next steps with owners, close with next meeting or check-in date if known.

Rules:
- Deduplicate aggressively. If two items say the same thing, keep the more specific one.
- Never repeat content across sections. Quotes should not duplicate Key Decisions or Pain Points.
- Every person mentioned as an owner must appear by full name, not pronoun.
- Output clean markdown only. No JSON. No preamble. No commentary.`;

export async function POST(request: NextRequest) {
  // Rate limit check
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Maximum 10 summaries per hour.' },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as SummarizeRequest;
    const { chunkSignals, metadata, meetingType, chatLog } = body;

    if (!chunkSignals?.length || !meetingType) {
      return NextResponse.json(
        { error: 'chunkSignals and meetingType are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not set' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    });

    const title = metadata?.title || 'Untitled Meeting';
    const date = metadata?.date || 'Not specified';
    const attendees = metadata?.attendees?.join(', ') || 'Not specified';

    let userMessage = `Meeting: ${title} | Date: ${date} | Type: ${meetingType} | Attendees: ${attendees}`;

    if (metadata?.purpose) {
      userMessage += `\nPurpose: ${metadata.purpose}`;
    }

    if (chatLog) {
      userMessage += `\n\nTeams Chat Context:\n${chatLog}`;
    }

    userMessage += `\n\nChunk signals:\n${JSON.stringify(chunkSignals, null, 2)}`;

    const completion = await openai.chat.completions.create(
      {
        model: model || 'qwen/qwen3-235b-a22b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 3000,
        temperature: 0.3,
      },
      { timeout: 60000 }
    );

    const rawContent = completion?.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error('Summarize empty response:', JSON.stringify(completion, null, 2));
      return NextResponse.json(
        { error: `OpenRouter returned no content. Model: ${model}` },
        { status: 500 }
      );
    }

    // Strip <think>...</think> blocks (Qwen 3 reasoning output)
    const content = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    return NextResponse.json({ markdown: content });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Summarization failed: ${message}` },
      { status: 500 }
    );
  }
}
