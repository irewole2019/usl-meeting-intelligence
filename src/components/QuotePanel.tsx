'use client';

import type { QualityResult } from '@/types';

interface ParsedQuote {
  text: string;
  speaker: string;
  timestamp: string;
}

function extractQuoteParts(raw: string): ParsedQuote {
  let speaker = '';
  let timestamp = '';
  let text = raw;

  const endPattern = /\s*[—–-]\s*\*{0,2}([^[(*\n]+?)\*{0,2}\s*[\[(](\d{1,2}:\d{2}(?::\d{2})?)[\])]/;
  const endMatch = text.match(endPattern);
  if (endMatch) {
    speaker = endMatch[1].trim();
    timestamp = endMatch[2];
    text = text.replace(endPattern, '').trim();
  } else {
    const startPattern = /^\*{0,2}([^:*\n]+?)\*{0,2}\s*[\[(](\d{1,2}:\d{2}(?::\d{2})?)[\])]\s*:\s*/;
    const startMatch = text.match(startPattern);
    if (startMatch) {
      speaker = startMatch[1].trim();
      timestamp = startMatch[2];
      text = text.replace(startPattern, '').trim();
    }
  }

  // Try to extract speaker from — **Name** format without timestamp
  if (!speaker) {
    const dashSpeaker = text.match(/\s*[—–-]\s*\*{0,2}([^*\n]+?)\*{0,2}\s*$/);
    if (dashSpeaker) {
      speaker = dashSpeaker[1].trim();
      text = text.replace(dashSpeaker[0], '').trim();
    }
  }

  text = text.replace(/^[""]|[""]$/g, '').trim();

  return { text, speaker, timestamp };
}

export function parseQuotes(markdown: string): ParsedQuote[] {
  const match = markdown.match(/## Key Quotes[\s]*\n([\s\S]*?)(?=\n## |$)/);
  if (!match) return [];

  const section = match[1].trim();
  const quotes: ParsedQuote[] = [];
  const lines = section.split('\n').filter((l) => l.trim());

  let currentQuote = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-*>]|\d+\./.test(trimmed)) {
      if (currentQuote) quotes.push(extractQuoteParts(currentQuote));
      currentQuote = trimmed.replace(/^[-*>\d.]+\s*/, '');
    } else if (currentQuote) {
      currentQuote += ' ' + trimmed;
    }
  }
  if (currentQuote) quotes.push(extractQuoteParts(currentQuote));

  return quotes;
}

function QuoteCard({ quote }: { quote: ParsedQuote }) {
  return (
    <div className="border-l-4 border-brand pl-4 py-3">
      <p className="text-sm text-gray-800 italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
      {(quote.speaker || quote.timestamp) && (
        <p className="text-xs text-gray-500 mt-2">
          {quote.speaker && <span className="font-medium">{quote.speaker}</span>}
          {quote.speaker && quote.timestamp && ' · '}
          {quote.timestamp && <span>{quote.timestamp}</span>}
        </p>
      )}
    </div>
  );
}

interface QuotePanelProps {
  quotes: ParsedQuote[];
  quality: QualityResult | null;
}

export default function QuotePanel({ quotes, quality }: QuotePanelProps) {
  const highSeverityIssues = quality?.issues.filter((i) => i.severity === 'high') || [];

  return (
    <div className="sticky top-8">
      {highSeverityIssues.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-800 mb-1">Quality warnings</p>
          <ul className="space-y-1">
            {highSeverityIssues.map((issue, i) => (
              <li key={i} className="text-xs text-amber-700">{issue.description}</li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-900 mb-4">Key Quotes</h3>

      {quotes.length > 0 ? (
        <div className="space-y-4">
          {quotes.map((quote, i) => (
            <QuoteCard key={i} quote={quote} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No quotes extracted.</p>
      )}
    </div>
  );
}
