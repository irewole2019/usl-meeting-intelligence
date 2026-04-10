'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { runPipeline } from '@/lib/pipeline';
import { parseFile } from '@/lib/fileParser';
import { useToast } from '@/components/Toast';
import ExportToolbar from '@/components/ExportToolbar';
import QuotePanel, { parseQuotes } from '@/components/QuotePanel';
import EmailDraftPanel from '@/components/EmailDraftPanel';
import LoadingState from '@/components/LoadingState';
import type { MeetingType, MeetingMetadata, QualityResult } from '@/types';

const MAX_TRANSCRIPT_CHARS = 120000;
const HISTORY_KEY = 'meeting-intelligence-history';
const MAX_HISTORY = 10;

const MEETING_TYPES: { value: MeetingType; label: string; description: string }[] = [
  { value: 'sales_discovery', label: 'Sales Discovery', description: 'Needs, objections, next steps, quotes' },
  { value: 'customer_support', label: 'Customer Support', description: 'Issues, resolution, follow-up, sentiment' },
  { value: 'internal_sync', label: 'Internal Sync', description: 'Decisions, blockers, action items, owners' },
];

interface HistoryEntry {
  id: string;
  title: string;
  date: string;
  meetingType: MeetingType;
  markdown: string;
  createdAt: string;
}

// 3.5 — Auto-detect meeting type from transcript content
function detectMeetingType(text: string): MeetingType | null {
  const sample = text.slice(0, 2000).toLowerCase();

  const salesSignals = ['demo', 'pricing', 'proposal', 'prospect', 'pipeline', 'deal', 'contract', 'objection', 'competitor', 'budget', 'decision maker', 'close', 'discovery'];
  const supportSignals = ['ticket', 'issue', 'bug', 'resolved', 'escalat', 'customer complaint', 'support', 'incident', 'workaround', 'SLA', 'outage', 'resolution'];
  const internalSignals = ['standup', 'sprint', 'blocker', 'retro', 'planning', 'backlog', 'velocity', 'deploy', 'release', 'PR review', 'on track', 'update'];

  const salesScore = salesSignals.filter((s) => sample.includes(s)).length;
  const supportScore = supportSignals.filter((s) => sample.includes(s)).length;
  const internalScore = internalSignals.filter((s) => sample.includes(s)).length;

  const max = Math.max(salesScore, supportScore, internalScore);
  if (max < 2) return null; // Not enough signal

  if (salesScore === max) return 'sales_discovery';
  if (supportScore === max) return 'customer_support';
  return 'internal_sync';
}

// 3.6 — localStorage history helpers
function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToHistory(entry: HistoryEntry) {
  const history = loadHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export default function Home() {
  const { toast } = useToast();

  // Input state
  const [transcript, setTranscript] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('sales_discovery');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState('');
  const [quality, setQuality] = useState<QualityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [transcriptWarning, setTranscriptWarning] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // File parsing state
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

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

  // Check transcript length + auto-detect meeting type
  useEffect(() => {
    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      setTranscriptWarning(
        `Transcript is ${transcript.length.toLocaleString()} characters (limit: ${MAX_TRANSCRIPT_CHARS.toLocaleString()}). Very long transcripts may produce lower quality output.`
      );
    } else {
      setTranscriptWarning(null);
    }

    // 3.5 — Auto-detect on paste/upload (only if transcript just appeared)
    if (transcript.length > 200) {
      const detected = detectMeetingType(transcript);
      if (detected && detected !== meetingType) {
        setMeetingType(detected);
        toast(`Auto-detected: ${MEETING_TYPES.find((t) => t.value === detected)?.label}`, 'success');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  // 3.1 — Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    setFileName(file.name);
    setFileError(null);
    setIsParsingFile(true);
    try {
      const text = await parseFile(file);
      setTranscript(text);
      toast(`Loaded ${file.name}`);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to parse file.');
      toast('Failed to parse file', 'error');
    } finally {
      setIsParsingFile(false);
    }
  }, [toast]);

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
    setIsEditing(false);
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

      // 3.6 — Save to localStorage history
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        title: title || `${MEETING_TYPES.find((t) => t.value === meetingType)?.label} Summary`,
        date: date || new Date().toISOString().slice(0, 10),
        meetingType,
        markdown: result.markdown,
        createdAt: new Date().toISOString(),
      };
      saveToHistory(entry);
      setHistory(loadHistory());

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
      toast('Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewSummary = useCallback(() => {
    setTranscript('');
    setFileName(null);
    setSummaryMarkdown(null);
    setIsEditing(false);
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

  // 3.6 — Load a history entry
  const handleLoadHistory = useCallback((entry: HistoryEntry) => {
    setSummaryMarkdown(entry.markdown);
    setTitle(entry.title);
    setDate(entry.date);
    setMeetingType(entry.meetingType);
    setShowHistory(false);
    setIsEditing(false);
    setQuality(null);
    toast(`Loaded: ${entry.title}`);
  }, [toast]);

  // 3.4 — Editable summary
  const handleToggleEdit = useCallback(() => {
    if (isEditing && summaryMarkdown) {
      setSummaryMarkdown(editedMarkdown);
      setIsEditing(false);
      toast('Summary updated');
    } else if (summaryMarkdown) {
      setEditedMarkdown(summaryMarkdown);
      setIsEditing(true);
    }
  }, [isEditing, summaryMarkdown, editedMarkdown, toast]);

  const displayMarkdown = summaryMarkdown || '';
  const quotes = displayMarkdown ? parseQuotes(displayMarkdown) : [];

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
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Meeting Intelligence</h1>
            <p className="text-gray-500">
              Paste a transcript, choose a meeting type, get a structured summary.
            </p>
          </div>
          {/* 3.6 — History button */}
          {history.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                History ({history.length})
              </button>
              {showHistory && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                  {history.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => handleLoadHistory(entry)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{entry.title}</p>
                      <p className="text-xs text-gray-500">{entry.date} · {MEETING_TYPES.find((t) => t.value === entry.meetingType)?.label}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3.1 — Transcript Input with Drag & Drop */}
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
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative ${isDragging ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}
          >
            {isDragging && (
              <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-10">
                <p className="text-sm font-medium text-blue-600">Drop file here</p>
              </div>
            )}
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your Teams meeting transcript here or drag & drop a .vtt, .txt, or .docx file..."
              className="w-full min-h-[300px] p-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>
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
          <button type="button" onClick={() => setShowMetadata(!showMetadata)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium">
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
          <button type="button" onClick={() => setShowChatLog(!showChatLog)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium">
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

            {/* 3.4 — Edit toggle */}
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={handleToggleEdit}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                {isEditing ? 'Save edits' : 'Edit summary'}
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: Rendered or Editable Markdown */}
              <div className="lg:w-[60%] min-w-0">
                {isEditing ? (
                  <textarea
                    value={editedMarkdown}
                    onChange={(e) => setEditedMarkdown(e.target.value)}
                    className="w-full min-h-[600px] p-4 border border-gray-300 rounded-lg text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-table:text-sm prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-medium prose-th:text-gray-700 prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-gray-200 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-1 prose-blockquote:text-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {summaryMarkdown}
                    </ReactMarkdown>
                  </div>
                )}

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
