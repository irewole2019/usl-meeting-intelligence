'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { runPipeline } from '@/lib/pipeline';
import { parseFile } from '@/lib/fileParser';
import ExportToolbar from '@/components/ExportToolbar';
import QuotePanel, { parseQuotes } from '@/components/QuotePanel';
import EmailDraftPanel from '@/components/EmailDraftPanel';
import LoadingState from '@/components/LoadingState';
import type { MeetingType, MeetingMetadata, QualityResult } from '@/types';

const MAX_TRANSCRIPT_CHARS = 120000;

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

  // Config state
  const [configError, setConfigError] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [summaryMarkdown, setSummaryMarkdown] = useState<string | null>(null);
  const [quality, setQuality] = useState<QualityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [transcriptWarning, setTranscriptWarning] = useState<string | null>(null);

  // File parsing state
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Check API key on load
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (!data.config?.hasApiKey) {
          setConfigError('OpenRouter API key is not configured. Add OPENROUTER_API_KEY to your .env.local file and restart the server.');
        }
      })
      .catch(() => {});
  }, []);

  // Check transcript length
  useEffect(() => {
    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      setTranscriptWarning(
        `Transcript is ${transcript.length.toLocaleString()} characters (limit: ${MAX_TRANSCRIPT_CHARS.toLocaleString()}). Very long transcripts may produce lower quality output.`
      );
    } else {
      setTranscriptWarning(null);
    }
  }, [transcript]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileError(null);
    setIsParsingFile(true);
    try {
      const text = await parseFile(file);
      setTranscript(text);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to parse file.');
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setSummaryMarkdown(null);
    setQuality(null);
    setWarnings([]);
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

      setSummaryMarkdown(result.markdown);
      setWarnings(result.warnings);

      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      // Quality check (non-blocking)
      try {
        const qualityRes = await fetch('/api/quality', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown: result.markdown }),
        });
        if (qualityRes.ok) {
          const { result: qualityResult } = await qualityRes.json();
          setQuality(qualityResult);
        }
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewSummary = useCallback(() => {
    setTranscript('');
    setFileName(null);
    setSummaryMarkdown(null);
    setQuality(null);
    setWarnings([]);
    setError(null);
    setProgress({ current: 0, total: 0 });
    setChatLog('');
    setTitle('');
    setDate('');
    setAttendees('');
    setPurpose('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const quotes = summaryMarkdown ? parseQuotes(summaryMarkdown) : [];

  return (
    <main className="min-h-screen bg-white">
      <div className={`mx-auto px-6 py-12 ${summaryMarkdown ? 'max-w-6xl' : 'max-w-3xl'} transition-all`}>
        {/* Config Error */}
        {configError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {configError}
          </div>
        )}

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
                disabled={isParsingFile}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
              >
                {isParsingFile ? 'Reading file...' : 'Upload file'}
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
          {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
          {transcriptWarning && <p className="mt-2 text-sm text-amber-600">{transcriptWarning}</p>}
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
            <svg className={`w-4 h-4 transition-transform ${showMetadata ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Meeting details (optional)
          </button>
          {showMetadata && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="title" className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q3 Pipeline Review" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="date" className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="attendees" className="block text-xs font-medium text-gray-600 mb-1">Attendees</label>
                <input id="attendees" type="text" value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="Sarah Jones, Mark Chen, Lisa Park" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="purpose" className="block text-xs font-medium text-gray-600 mb-1">Purpose</label>
                <input id="purpose" type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Discuss Q3 targets" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
            <svg className={`w-4 h-4 transition-transform ${showChatLog ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          disabled={!transcript.trim() || isGenerating || !!configError}
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-lg text-base hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? 'Generating...' : 'Generate Summary'}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {/* Loading */}
        {isGenerating && <LoadingState current={progress.current} total={progress.total} />}

        {/* Warnings */}
        {warnings.length > 0 && !isGenerating && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            {warnings.map((w, i) => (
              <p key={i} className="text-sm text-amber-700">{w}</p>
            ))}
          </div>
        )}

        {/* Summary */}
        {summaryMarkdown && !isGenerating && (
          <div className="mt-8" ref={summaryRef}>
            <ExportToolbar
              markdown={summaryMarkdown}
              quality={quality}
              title={title}
              date={date}
              attendees={attendees}
              meetingType={meetingType}
              onNewSummary={handleNewSummary}
            />

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: Rendered Markdown */}
              <div className="lg:w-[60%] min-w-0">
                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-table:text-sm prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-medium prose-th:text-gray-700 prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-gray-200 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-1 prose-blockquote:text-gray-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {summaryMarkdown}
                  </ReactMarkdown>
                </div>

                {/* Email Draft Panel */}
                <EmailDraftPanel markdown={summaryMarkdown} />
              </div>

              {/* Right: Key Quotes */}
              <div className="lg:w-[40%]">
                <QuotePanel quotes={quotes} quality={quality} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
