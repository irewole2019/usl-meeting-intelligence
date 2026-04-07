/**
 * Rule-based quality pre-check
 *
 * Catches obvious issues without spending tokens.
 * Runs BEFORE the model-based quality check.
 */

import type { QualityResult } from '@/types';

interface QualityIssue {
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

const REQUIRED_SECTIONS = [
  'Executive Summary',
  'Key Decisions',
  'Customer Needs and Pain Points',
  'Objections, Risks, and Open Questions',
  'Next Steps',
  'Key Quotes',
  'Meeting Outcomes',
  'Follow-Up Email Draft',
];

function extractSection(markdown: string, heading: string): string | null {
  // Escape special regex characters in heading
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `^## ${escaped}[\\s]*\\n([\\s\\S]*?)(?=^## |$)`,
    'm'
  );
  const match = markdown.match(pattern);
  return match ? match[1].trim() : null;
}

export function runPreCheck(markdown: string): QualityResult {
  const issues: QualityIssue[] = [];

  // Check total word count — with tighter prompts, 200 is a reasonable floor
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  if (wordCount < 200) {
    issues.push({
      type: 'short_output',
      description: `Summary is only ${wordCount} words (minimum expected: 200). Likely a failed generation.`,
      severity: 'high',
    });
  }

  // Check all 8 required sections exist
  for (const section of REQUIRED_SECTIONS) {
    const content = extractSection(markdown, section);
    if (content === null) {
      const isHighSeverity = ['Executive Summary', 'Next Steps', 'Key Quotes', 'Follow-Up Email Draft'].includes(section);
      issues.push({
        type: `missing_section`,
        description: `Missing ## ${section} section.`,
        severity: isHighSeverity ? 'high' : 'medium',
      });
    }
  }

  // Check Next Steps for excessive TBDs
  const nextSteps = extractSection(markdown, 'Next Steps');
  if (nextSteps) {
    const tbdCount = (nextSteps.match(/\bTBD\b/g) || []).length;
    const rowCount = (nextSteps.match(/^\|(?!\s*-)/gm) || []).length - 1; // subtract header row
    if (rowCount > 0 && tbdCount > Math.ceil(rowCount * 0.6)) {
      issues.push({
        type: 'excessive_tbd',
        description: `${tbdCount} of ${rowCount} action items have TBD dates.`,
        severity: 'medium',
      });
    }
  }

  // Check Key Quotes has content
  const keyQuotes = extractSection(markdown, 'Key Quotes');
  if (keyQuotes !== null) {
    const quoteLines = keyQuotes.split('\n').filter((l) => l.trim().length > 0);
    if (quoteLines.length < 2) {
      issues.push({
        type: 'weak_quote',
        description: `Key Quotes has only ${quoteLines.length} line(s) (expected at least 4 quotes).`,
        severity: 'high',
      });
    }
  }

  // Check Key Decisions has content
  const keyDecisions = extractSection(markdown, 'Key Decisions');
  if (keyDecisions !== null && keyDecisions.length === 0) {
    issues.push({
      type: 'empty_decisions',
      description: 'Key Decisions section is empty.',
      severity: 'medium',
    });
  }

  const hasHighSeverity = issues.some((i) => i.severity === 'high');
  const score = hasHighSeverity
    ? Math.max(0, 40 - issues.length * 10)
    : Math.max(50, 90 - issues.length * 5);

  return {
    issues,
    score,
    passed: !hasHighSeverity && score >= 80,
  };
}
