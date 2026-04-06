export type MeetingType = 'sales_discovery' | 'customer_support' | 'internal_sync';

export interface MeetingMetadata {
  title?: string;
  date?: string;
  attendees?: string[];
  purpose?: string;
}

export interface ChunkSignals {
  decisions: { text: string; rationale: string }[];
  pain_points: { speaker: string; text: string }[];
  action_items: { description: string; owner: string; due_date: string }[];
  quote_candidates: {
    speaker: string;
    timestamp: string;
    text: string;
    signal_type: string;
  }[];
  open_questions: string[];
}

export interface MeetingSummary {
  executive_summary: string[];
  decisions: { text: string; rationale: string }[];
  pain_points: string[];
  objections: {
    type: 'Objection' | 'Risk' | 'Open Question';
    text: string;
  }[];
  next_steps: { owner: string; action: string; due_date: string }[];
  quotes: { speaker: string; timestamp: string; text: string }[];
  outcomes: string[];
  email_draft: string;
}

export interface QualityResult {
  issues: {
    type: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  score: number;
  passed: boolean;
}
