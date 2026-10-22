// Voice-to-Quote (MASTER_BRIEF.md Optional A): turn a voice note into editable enquiry text.
//
// This layer ONLY produces text. It does not parse, price or schedule anything: the web app puts
// the transcript in the enquiry text box and sends it to POST /api/enquiry, the same pipeline as
// typed messages.
//
// Speech-to-text provider, checked on every request:
//   1. OPENAI_API_KEY (optional OPENAI_BASE_URL, OPENAI_TRANSCRIBE_MODEL; default model whisper-1)
//   2. Replit AI Integrations for OpenAI (AI_INTEGRATIONS_OPENAI_BASE_URL + _API_KEY), gpt-4o-mini-transcribe
//   3. Neither configured -> "Simulated Demo Transcription" of the built-in sample voice note.
// The demo sample button is always simulated, so the stage demo works with no key and no network.
import { logActivity } from "./db";

export const SIMULATED_LABEL = "Simulated Demo Transcription";
const ACTOR = "Salesperson (demo)";
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const UPLOAD_EXTENSIONS = ["mp3", "m4a", "wav"];
const RECORDING_EXTENSIONS = ["webm", "ogg", "mp4", "m4a", "wav", "mp3"];

export interface VoiceSample {
  id: string;
  fileName: string;
  durationSeconds: number;
  speaker: string;
  transcript: string;
}

/** Synthetic sample voice notes. The audio files are in the web app at public/samples/. */
export const VOICE_SAMPLES: VoiceSample[] = [
  {
    id: "contractor-cheras-condo",
    fileName: "contractor-voice-note-cheras-condo.mp3",
    durationSeconds: 9,
    speaker: "a technician on site, spoken by a synthetic AI voice",
    transcript:
      "Boss, client at Cheras Condo wants servicing for two 1.5HP aircons and a chemical wash this Monday, 26 October.",
  },
];
const DEFAULT_SAMPLE = VOICE_SAMPLES[0]!;

export type VoiceSource = "sample" | "upload" | "recording" | "browser_speech";

export interface TranscriptionRequest {
  source: VoiceSource;
  sampleId?: string;
  fileName?: string;
  mimeType?: string;
  audioBase64?: string;
  transcript?: string;
  durationSeconds?: number;
}

export interface TranscriptionResult {
  transcript: string;
  mode: "openai" | "simulated" | "browser";
  label: string;
  provider: string;
  source: VoiceSource;
  fileName: string | null;
  sampleId: string | null;
  durationSeconds: number | null;
  note: string;
}

export type TranscriptionOutcome =
  | { ok: true; result: TranscriptionResult }
  | { ok: false; status: 400 | 422; error: string };

interface SpeechProvider {
  baseUrl: string;
  apiKey: string;
  model: string;
  name: string;
}

function speechProvider(): SpeechProvider | null {
  const env = process.env;
  if (env.OPENAI_API_KEY) {
    const model = env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";
    return { baseUrl: env.OPENAI_BASE_URL || "https://api.openai.com/v1", apiKey: env.OPENAI_API_KEY, model, name: `OpenAI ${model}` };
  }
  if (env.AI_INTEGRATIONS_OPENAI_BASE_URL && env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    const model = "gpt-4o-mini-transcribe";
    return {
      baseUrl: env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: env.AI_INTEGRATIONS_OPENAI_API_KEY,
      model,
      name: `OpenAI ${model} (Replit AI Integrations)`,
    };
  }
  return null;
}

/** True when a real speech-to-text service is configured (shown in the UI). */
export function speechToTextConfigured(): boolean {
  return speechProvider() !== null;
}

const extensionOf = (fileName: string) => (fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "");
const sampleForFile = (fileName: string) => {
  const base = fileName.toLowerCase();
  return VOICE_SAMPLES.find((s) => base.includes(s.id) || base === s.fileName);
};

async function transcribeWithOpenAI(p: SpeechProvider, audio: Buffer, fileName: string, mimeType: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType || "application/octet-stream" }), fileName);
  form.append("model", p.model);
  form.append("response_format", "json");
  // Vocabulary hint: Malaysian aircon enquiries mix English, Bahasa Melayu and Chinese.
  form.append("prompt", "Aircon service enquiry in Malaysia. Terms: 1.0HP, 1.5HP, aircond, servicing, chemical wash, pasang, servis, biji, Cheras.");
  const res = await fetch(`${p.baseUrl.replace(/\/$/, "")}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${p.apiKey}` },
    body: form,
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`speech-to-text service answered HTTP ${res.status}`);
  const json = (await res.json()) as { text?: unknown };
  return typeof json.text === "string" ? json.text.trim() : "";
}

function simulated(
  req: TranscriptionRequest,
  fileName: string | null,
  note: string,
  sample: VoiceSample = DEFAULT_SAMPLE,
): TranscriptionResult {
  return {
    transcript: sample.transcript,
    mode: "simulated",
    label: SIMULATED_LABEL,
    provider: `Demo sample "${sample.fileName}"`,
    source: req.source,
    fileName,
    sampleId: sample.id,
    durationSeconds: req.durationSeconds ?? sample.durationSeconds,
    note,
  };
}

function logTranscribed(r: TranscriptionResult, warning = false): void {
  const from =
    r.source === "sample" ? "demo sample voice note" : r.source === "upload" ? `uploaded file "${r.fileName}"` : r.source === "recording" ? "recorded voice note" : "browser speech recognition";
  const quoted = r.transcript.length > 180 ? `${r.transcript.slice(0, 177)}...` : r.transcript;
  logActivity(
    "VOICE_TRANSCRIBED",
    `${r.label} of ${from} (${r.provider}): "${quoted}" Placed in the enquiry box for review before analysis.`,
    ACTOR,
    warning ? "warning" : "info",
  );
}

export async function transcribeVoiceNote(req: TranscriptionRequest): Promise<TranscriptionOutcome> {
  // 1. Text already recognised in the browser (Web Speech API): just record it.
  if (req.source === "browser_speech") {
    const text = req.transcript?.trim();
    if (!text) return { ok: false, status: 422, error: "No words were recognised. Try again, or type the enquiry." };
    const result: TranscriptionResult = {
      transcript: text,
      mode: "browser",
      label: "Browser Speech Recognition",
      provider: "Web Speech API in your browser",
      source: req.source,
      fileName: null,
      sampleId: null,
      durationSeconds: req.durationSeconds ?? null,
      note: "Recognised live by your browser. Check the words before relying on the quote.",
    };
    logTranscribed(result);
    return { ok: true, result };
  }

  // 2. Built-in demo sample: always simulated, so the stage demo never depends on a key or network.
  if (req.source === "sample") {
    const sample = VOICE_SAMPLES.find((s) => s.id === req.sampleId);
    if (!sample) return { ok: false, status: 400, error: "Unknown demo voice note." };
    const result = simulated(
      req,
      sample.fileName,
      `Built-in demo voice note: ${sample.speaker}. The words are pre-written, not transcribed live.`,
      sample,
    );
    logTranscribed(result);
    return { ok: true, result };
  }

  // 3. Uploaded file or browser recording.
  const fileName = (req.fileName?.trim() || (req.source === "recording" ? "voice-note.webm" : "")).slice(0, 200);
  const allowed = req.source === "upload" ? UPLOAD_EXTENSIONS : RECORDING_EXTENSIONS;
  if (!fileName || !allowed.includes(extensionOf(fileName))) {
    return { ok: false, status: 400, error: `Please choose an audio file ending in ${allowed.map((e) => `.${e}`).join(", ")}.` };
  }
  const base64 = (req.audioBase64 ?? "").replace(/^data:[^,]*,/, "");
  const audio = Buffer.from(base64, "base64");
  if (audio.length === 0) return { ok: false, status: 400, error: "The audio file is empty." };
  if (audio.length > MAX_AUDIO_BYTES) return { ok: false, status: 400, error: "The audio file is larger than 10 MB." };

  const provider = speechProvider();
  if (!provider) {
    const match = sampleForFile(fileName);
    const result = simulated(
      req,
      fileName,
      match
        ? `No speech-to-text key is configured. "${fileName}" is the demo sample, so its known words are shown.`
        : `No speech-to-text key is configured, so these are the demo sample's words, NOT the words in "${fileName}". Edit the text to match your audio.`,
      match,
    );
    logTranscribed(result);
    return { ok: true, result };
  }

  try {
    const text = await transcribeWithOpenAI(provider, audio, fileName, req.mimeType ?? "");
    if (!text) return { ok: false, status: 422, error: "No speech was detected in the audio. Please try again or type the enquiry." };
    const result: TranscriptionResult = {
      transcript: text.slice(0, 2000),
      mode: "openai",
      label: "AI Transcription",
      provider: provider.name,
      source: req.source,
      fileName,
      sampleId: null,
      durationSeconds: req.durationSeconds ?? null,
      note: "Transcribed by AI. Check names, numbers and dates before analysing.",
    };
    logTranscribed(result);
    return { ok: true, result };
  } catch (error) {
    // Keep the demo moving: fall back to the labelled sample and say exactly why.
    const reason = error instanceof Error ? error.message : "unknown error";
    const result = simulated(
      req,
      fileName,
      `The speech-to-text service failed (${reason}), so the demo sample's words are shown instead. Edit the text to match your audio.`,
      sampleForFile(fileName),
    );
    logTranscribed(result, true);
    return { ok: true, result };
  }
}
