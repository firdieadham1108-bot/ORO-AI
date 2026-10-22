// Voice Note / Audio Input bar (MASTER_BRIEF.md Optional A: Voice-to-Quote).
// Produces TEXT only. The workspace puts the transcript in the enquiry box and runs the normal
// /enquiry analysis on it, so voice and typed messages go through exactly the same pipeline.
import { useEffect, useRef, useState } from "react";
import { useTranscribeVoiceNote } from "@workspace/api-client-react";
import type { TranscriptionInput, TranscriptionResult } from "@workspace/api-client-react";
import { Mic, Square, Upload, Play, Loader2, Download, AudioLines, FastForward } from "lucide-react";
import { ErrorBox } from "@/components/shell";

const SAMPLE = {
  id: "contractor-cheras-condo",
  fileName: "contractor-voice-note-cheras-condo.mp3",
  seconds: 9,
};
const sampleUrl = `${import.meta.env.BASE_URL}samples/${SAMPLE.fileName}`;
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_RECORD_SECONDS = 60;
const UPLOAD_EXT = ["mp3", "m4a", "wav"];

// Fixed bar heights so the voice note looks like a real waveform (WhatsApp-style).
const BARS = [30, 52, 74, 46, 88, 62, 38, 70, 94, 58, 42, 80, 66, 34, 56, 90, 72, 48, 64, 84, 40, 60, 76, 50, 86, 44, 68, 36, 58, 78, 46, 28];

// Minimal typings for the Web Speech API (not in TypeScript's DOM library in all versions).
interface SpeechResultList { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } }
interface SpeechRec {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: SpeechResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type SpeechRecCtor = new () => SpeechRec;
const speechRecognitionCtor = (): SpeechRecCtor | undefined => {
  const w = window as unknown as { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};
const canMediaRecord = () => typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

const SPEECH_ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Open the app in its own browser tab and allow the microphone, or use Upload / Simulate instead.",
  "service-not-allowed": "This browser does not allow speech recognition here. Use Upload Audio File or the simulated voice note instead.",
  "no-speech": "No speech was heard. Try again, closer to the microphone.",
  "audio-capture": "No microphone was found. Use Upload Audio File or the simulated voice note instead.",
  network: "Browser speech recognition needs an internet connection. Use Upload Audio File or the simulated voice note instead.",
};

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read the audio file."));
    r.readAsDataURL(blob);
  });
}

type Mode =
  | { kind: "idle" }
  | { kind: "playing"; progress: number; seconds: number }
  | { kind: "recording"; engine: "speech" | "media"; seconds: number; interim: string };

export function Waveform({ progress = 0, live = false, compact = false }: { progress?: number; live?: boolean; compact?: boolean }) {
  return (
    <div className={`wave ${live ? "live" : ""} ${compact ? "compact" : ""}`} aria-hidden="true">
      {BARS.map((h, i) => (
        <span
          key={i}
          className={`wave-bar ${!live && i / BARS.length < progress ? "played" : ""}`}
          style={{ height: `${h}%`, animationDelay: live ? `${(i % 8) * 0.09}s` : undefined }}
        />
      ))}
    </div>
  );
}

export function VoiceInput({ onTranscript, disabled }: { onTranscript: (r: TranscriptionResult) => void; disabled?: boolean }) {
  const transcribe = useTranscribeVoiceNote();
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const busy = mode.kind !== "idle" || transcribe.isPending || !!disabled;
  const canRecord = typeof window !== "undefined" && (!!speechRecognitionCtor() || canMediaRecord());

  const clearTimer = () => { if (timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null; } };
  useEffect(() => () => { clearTimer(); audioRef.current?.pause(); stopRef.current?.(); }, []);

  const send = (data: TranscriptionInput) => {
    setLocalError(null);
    transcribe.mutate({ data }, { onSuccess: (r) => onTranscript(r) });
  };
  const start = () => { setLocalError(null); transcribe.reset(); };

  // ---- Simulated contractor voice note: plays the sample clip, then asks the server for its labelled transcript.
  const playSample = () => {
    start();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimer();
      audioRef.current?.pause();
      audioRef.current = null;
      stopRef.current = null;
      setMode({ kind: "idle" });
      send({ source: "sample", sampleId: SAMPLE.id, durationSeconds: SAMPLE.seconds });
    };
    stopRef.current = finish;
    setMode({ kind: "playing", progress: 0, seconds: 0 });
    const audio = new Audio(sampleUrl);
    audioRef.current = audio;
    audio.ontimeupdate = () => {
      const d = audio.duration || SAMPLE.seconds;
      setMode({ kind: "playing", progress: Math.min(1, audio.currentTime / d), seconds: audio.currentTime });
    };
    audio.onended = finish;
    audio.play().catch(() => {
      // No sound available (muted tab, blocked autoplay): animate the same length without audio.
      const started = Date.now();
      timerRef.current = window.setInterval(() => {
        const s = (Date.now() - started) / 1000;
        if (s >= SAMPLE.seconds) finish();
        else setMode({ kind: "playing", progress: s / SAMPLE.seconds, seconds: s });
      }, 100);
    });
  };

  // ---- Record: browser speech recognition if available, otherwise MediaRecorder + server transcription.
  const record = async () => {
    start();
    const Ctor = speechRecognitionCtor();
    const started = Date.now();
    const tick = (engine: "speech" | "media", interim = "") =>
      setMode({ kind: "recording", engine, seconds: (Date.now() - started) / 1000, interim });

    if (Ctor) {
      const rec = new Ctor();
      rec.lang = "en-MY";
      rec.continuous = true;
      rec.interimResults = true;
      let finalText = "";
      let interim = "";
      let failed = false;
      rec.onresult = (e) => {
        interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i]!;
          if (r.isFinal) finalText += `${r[0].transcript} `;
          else interim += r[0].transcript;
        }
        tick("speech", `${finalText}${interim}`.trim());
      };
      rec.onerror = (e) => {
        if (e.error === "aborted") return;
        failed = true;
        setLocalError(SPEECH_ERRORS[e.error] ?? `Speech recognition stopped (${e.error}).`);
      };
      rec.onend = () => {
        clearTimer();
        stopRef.current = null;
        setMode({ kind: "idle" });
        const text = `${finalText}${interim}`.trim();
        if (text) send({ source: "browser_speech", transcript: text.slice(0, 2000), durationSeconds: Math.round((Date.now() - started) / 1000) });
        else if (!failed) setLocalError(SPEECH_ERRORS["no-speech"]!);
      };
      stopRef.current = () => rec.stop();
      tick("speech");
      timerRef.current = window.setInterval(() => {
        const s = (Date.now() - started) / 1000;
        if (s >= MAX_RECORD_SECONDS) rec.stop();
        setMode((m) => (m.kind === "recording" ? { ...m, seconds: s } : m));
      }, 250);
      try { rec.start(); } catch { clearTimer(); setMode({ kind: "idle" }); setLocalError(SPEECH_ERRORS["service-not-allowed"]!); }
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setLocalError(SPEECH_ERRORS["not-allowed"]!);
      return;
    }
    const mr = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    mr.onstop = async () => {
      clearTimer();
      stopRef.current = null;
      stream.getTracks().forEach((t) => t.stop());
      setMode({ kind: "idle" });
      const type = mr.mimeType || "audio/webm";
      const blob = new Blob(chunks, { type });
      if (!blob.size) { setLocalError(SPEECH_ERRORS["no-speech"]!); return; }
      const ext = type.includes("ogg") ? "ogg" : type.includes("mp4") ? "m4a" : "webm";
      send({
        source: "recording", fileName: `voice-note.${ext}`, mimeType: type, audioBase64: await readAsDataUrl(blob),
        durationSeconds: Math.round((Date.now() - started) / 1000),
      });
    };
    stopRef.current = () => { if (mr.state !== "inactive") mr.stop(); };
    mr.start();
    tick("media");
    timerRef.current = window.setInterval(() => {
      const s = (Date.now() - started) / 1000;
      if (s >= MAX_RECORD_SECONDS) stopRef.current?.();
      else setMode((m) => (m.kind === "recording" ? { ...m, seconds: s } : m));
    }, 250);
  };

  // ---- Upload an audio file.
  const onFile = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    start();
    const ext = file.name.toLowerCase().split(".").pop() ?? "";
    if (!UPLOAD_EXT.includes(ext)) { setLocalError("Please choose an .mp3, .m4a or .wav audio file."); return; }
    if (file.size > MAX_BYTES) { setLocalError("That file is larger than 10 MB. Please send a shorter voice note."); return; }
    try {
      send({ source: "upload", fileName: file.name, mimeType: file.type || `audio/${ext}`, audioBase64: await readAsDataUrl(file) });
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Could not read the audio file.");
    }
  };

  return (
    <div className="voice-bar" data-testid="voice-bar">
      <div className="voice-head">
        <span className="voice-title"><AudioLines size={14} /> Voice Note / Audio Input</span>
        <a className="voice-sample-link" href={sampleUrl} download={SAMPLE.fileName} data-testid="link-download-sample">
          <Download size={12} /> Sample .mp3 for upload test
        </a>
      </div>

      {mode.kind === "idle" && !transcribe.isPending && (
        <div className="voice-actions">
          <button className="btn" disabled={busy || !canRecord} onClick={record} title={canRecord ? undefined : "This browser cannot record audio"} data-testid="button-voice-record">
            <Mic /> Record Voice Note
          </button>
          <button className="btn" disabled={busy} onClick={() => fileRef.current?.click()} data-testid="button-voice-upload">
            <Upload /> Upload Audio File (.mp3 / .m4a / .wav)
          </button>
          <button className="btn btn-voice-demo" disabled={busy} onClick={playSample} data-testid="button-voice-simulate">
            <Play /> Simulate 10s Contractor Voice Note
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
            data-testid="input-voice-file"
          />
        </div>
      )}

      {mode.kind === "playing" && (
        <div className="voice-live" data-testid="voice-playing">
          <span className="voice-avatar" aria-hidden="true">T</span>
          <div className="min-w-0 flex-1">
            <div className="voice-live-label">Technician voice note (demo) · {clock(mode.seconds)} / {clock(SAMPLE.seconds)}</div>
            <Waveform progress={mode.progress} />
          </div>
          <button className="btn btn-quiet" onClick={() => stopRef.current?.()} data-testid="button-voice-skip"><FastForward /> Skip</button>
        </div>
      )}

      {mode.kind === "recording" && (
        <div className="voice-live recording" data-testid="voice-recording">
          <span className="rec-dot" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="voice-live-label">
              Recording {clock(mode.seconds)} · {mode.engine === "speech" ? "browser speech recognition" : "audio recorder"}
            </div>
            <Waveform live compact />
            {mode.interim && <div className="voice-interim" data-testid="text-voice-interim">{mode.interim}</div>}
          </div>
          <button className="btn btn-primary" onClick={() => stopRef.current?.()} data-testid="button-voice-stop"><Square /> Stop</button>
        </div>
      )}

      {transcribe.isPending && (
        <div className="voice-live" data-testid="voice-transcribing">
          <Loader2 className="spin text-[#397c62]" size={18} />
          <div className="voice-live-label">Transcribing voice note…</div>
        </div>
      )}

      {localError && <div className="notice error mt-2 text-[12px]" role="alert" data-testid="text-voice-error">{localError}</div>}
      {transcribe.isError && <div className="mt-2"><ErrorBox error={transcribe.error} /></div>}
    </div>
  );
}
