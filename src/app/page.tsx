'use client';

import { useState, useRef } from 'react';
import { runPipeline } from '@/lib/pipeline';
import type { MeetingType, MeetingMetadata } from '@/types';

const MEETING_TYPES: { value: MeetingType; label: string; description: string }[] = [
  { value: 'sales_discovery', label: 'Sales Discovery', description: 'Needs, objections, next steps, quotes' },
  { value: 'customer_support', label: 'Customer Support', description: 'Issues, resolution, follow-up, sentiment' },
  { value: 'internal_sync', label: 'Internal Sync', description: 'Decisions, blockers, action items, owners' },
];

export default function Home() {
  // Input state
  const [transcript, setTranscript] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('sales_discovery');
  const [fileName, setFileName] = useState<string | null>(null);

  // Metadata state
  const [showMetadata, setShowMetadata] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [attendees, setAttendees] = useState('');
  const [purpose, setPurpose] = useState('');

  // Chat log state
  const [showChatLog, setShowChatLog] = useState(false);
  const [chatLog, setChatLog] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [summaryMarkdown, setSummaryMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // File parsing wired in Phase 3 — for now just show the filename
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setSummaryMarkdown(null);
    setProgress({ current: 0, total: 0 });

    try {
      const metadata: MeetingMetadata = {};
      if (title) metadata.title = title;
      if (date) metadata.date = date;
      if (attendees) metadata.attendees = attendees.split(',').map((a) => a.trim()).filter(Boolean);
      if (purpose) metadata.purpose = purpose;

      const result = await runPipeline({
        transcript,
        meetingType,
        metadata,
        chatLog: chatLog || undefined,
        onProgress: (current, total) => setProgress({ current, total }),
      });

      setSummaryMarkdown(result);
      console.log('Pipeline result:', result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      console.error('Pipeline error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Meeting Intelligence</h1>
        <p className="text-gray-500 mb-10">
          Paste a transcript, choose a meeting type, get a structured summary.
        </p>

        {/* Transcript Input */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="transcript" className="text-sm font-medium text-gray-700">
              Paste your transcript or upload a file
            </label>
            <div className="flex items-center gap-2">
              {fileName && (
                <span className="text-sm text-gray-500 truncate max-w-[200px]">{fileName}</span>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Upload file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.vtt,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your Teams meeting transcript here..."
            className="w-full min-h-[300px] p-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
        </div>

        {/* Meeting Type Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">Meeting type</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MEETING_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setMeetingType(type.value)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  meetingType === type.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`text-sm font-semibold ${meetingType === type.value ? 'text-blue-700' : 'text-gray-900'}`}>
                  {type.label}
                </div>
                <div className="text-xs text-gray-500 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Metadata */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowMetadata(!showMetadata)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showMetadata ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Meeting details (optional)
          </button>
          {showMetadata && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="title" className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Pipeline Review"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="date" className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="attendees" className="block text-xs font-medium text-gray-600 mb-1">Attendees</label>
                <input
                  id="attendees"
                  type="text"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  placeholder="Sarah Jones, Mark Chen, Lisa Park"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="purpose" className="block text-xs font-medium text-gray-600 mb-1">Purpose</label>
                <input
                  id="purpose"
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Discuss Q3 targets"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Optional Chat Log */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setShowChatLog(!showChatLog)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showChatLog ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Teams chat log (optional)
          </button>
          {showChatLog && (
            <textarea
              value={chatLog}
              onChange={(e) => setChatLog(e.target.value)}
              placeholder="Paste the Teams meeting chat here..."
              className="mt-3 w-full min-h-[150px] p-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          )}
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!transcript.trim() || isGenerating}
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-lg text-base hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating
            ? progress.total > 0
              ? `Processing chunk ${progress.current} of ${progress.total}...`
              : 'Starting...'
            : 'Generate Summary'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary Placeholder */}
        {summaryMarkdown && (
          <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500">Summary generated. Display coming in Phase 2, Session 2.</p>
          </div>
        )}
      </div>
    </main>
  );
}
