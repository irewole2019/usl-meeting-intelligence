/**
 * File Parser
 *
 * Extracts plain text from .vtt, .txt, and .docx files.
 * Runs client-side using FileReader.
 */

import mammoth from 'mammoth';

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file as text.'));
    reader.readAsText(file);
  });
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file as binary.'));
    reader.readAsArrayBuffer(file);
  });
}

function parseVttContent(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];

  let currentTimestamp = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip WEBVTT header, empty lines, numeric cue identifiers, NOTE blocks
    if (line === 'WEBVTT' || line === '' || /^\d+$/.test(line) || /^NOTE\b/.test(line)) {
      continue;
    }

    // Timestamp line
    const tsMatch = line.match(/(\d{2}:\d{2}[:.]\d{2,3})\s*-->\s*\d{2}:\d{2}[:.]\d{2,3}/);
    if (tsMatch) {
      const raw = tsMatch[1];
      const parts = raw.match(/(\d{1,2}):(\d{2})(?:[:.]\d{2,3})?/);
      if (parts) {
        const h = parseInt(parts[1], 10);
        const m = parseInt(parts[2], 10);
        currentTimestamp = h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}:00`;
      }
      continue;
    }

    // Cue text — may contain <v Speaker>text</v> tags
    let speaker = '';
    let content = line;

    const vTagMatch = line.match(/^<v\s+([^>]+)>(.*)$/);
    if (vTagMatch) {
      speaker = vTagMatch[1].trim();
      content = vTagMatch[2].replace(/<\/v>/g, '').trim();
    } else {
      const colonMatch = line.match(/^([A-Za-z][A-Za-z\s.'-]{0,40}):\s+(.+)$/);
      if (colonMatch) {
        speaker = colonMatch[1].trim();
        content = colonMatch[2].trim();
      }
    }

    // Strip remaining HTML tags
    content = content.replace(/<[^>]+>/g, '').trim();
    if (!content) continue;

    if (speaker) {
      output.push(`${speaker} [${currentTimestamp}]: ${content}`);
    } else {
      output.push(currentTimestamp ? `[${currentTimestamp}]: ${content}` : content);
    }
  }

  return output.join('\n');
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await readAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer });

  if (result.messages.length > 0) {
    console.warn('Mammoth warnings:', result.messages);
  }

  return result.value;
}

export async function parseFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.vtt')) {
    const text = await readAsText(file);
    return parseVttContent(text);
  }

  if (name.endsWith('.txt')) {
    return readAsText(file);
  }

  if (name.endsWith('.docx')) {
    return parseDocx(file);
  }

  throw new Error('Unsupported file type. Please upload a .vtt, .txt, or .docx file.');
}
