'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/Toast';

interface EmailDraftPanelProps {
  markdown: string;
}

function extractEmailDraft(markdown: string): string {
  const sections = markdown.split(/^## /m);
  for (const section of sections) {
    if (section.startsWith('Follow-Up Email Draft')) {
      return section.slice('Follow-Up Email Draft'.length).trim();
    }
  }
  return '';
}

export default function EmailDraftPanel({ markdown }: EmailDraftPanelProps) {
  const { toast } = useToast();
  const emailDraft = extractEmailDraft(markdown);

  const handleCopy = useCallback(async () => {
    if (!emailDraft) return;
    await navigator.clipboard.writeText(emailDraft);
    toast('Email draft copied to clipboard');
  }, [emailDraft, toast]);

  if (!emailDraft) return null;

  return (
    <div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Follow-Up Email Draft</h3>
        <button
          type="button"
          onClick={handleCopy}
          className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Copy Email
        </button>
      </div>
      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {emailDraft}
      </div>
    </div>
  );
}
