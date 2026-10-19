import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import InterviewTimer from "@/components/interview/InterviewTimer";
import ConnectionStatus from "@/components/interview/ConnectionStatus";
import TranscriptBubble from "@/components/interview/TranscriptBubble";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { useAudioWebSocket } from "@/hooks/useAudioWebSocket";
import { sessionsApi } from "@/services/sessions";
import HardwareCheck from "@/components/HardwareCheck";
import { CheckCircle, Mic, MicOff, Monitor, WifiOff, X } from "lucide-react";
import ProctoringSetup from "@/components/interview/ProctoringSetup";
import { isDesktopChrome } from "@/utils/proctoring";
import { cn } from "@/lib/utils";
import type { CandidateInfo, InterviewState, InterviewSpeaker, TranscriptTurn } from "@/types";

export default function InterviewPage() {
  const { token } = useParams<{ token: string }>();
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [interviewState, setInterviewState] = useState<InterviewState>("idle");
  const [speaker, setSpeaker] = useState<InterviewSpeaker>(null);
  const [transcript, setTranscript] = useState<Pick<TranscriptTurn, "speaker" | "text">[]>([]);
  const [hardwareCheckDone, setHardwareCheckDone] = useState(false); // kept for green banner
  const [connectionLostLong, setConnectionLostLong] = useState(false);
  const [reconnectedPrompt, setReconnectedPrompt] = useState(false);
  const reconnectedPromptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionLostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  // Camera and entire-screen share, for assessments that require them: held here so they stay live into the
  // interview, and stopped when it's over or the page closes. Never recorded.
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [proctoringAcknowledged, setProctoringAcknowledged] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const proctoringStreamsRef = useRef<(MediaStream | null)[]>([]);
  proctoringStreamsRef.current = [cameraStream, screenStream];
  useEffect(() => () => proctoringStreamsRef.current.forEach((s) => s?.getTracks().forEach((t) => t.stop())), []);
  useEffect(() => {
    if (interviewState === "complete") proctoringStreamsRef.current.forEach((s) => s?.getTracks().forEach((t) => t.stop()));
  }, [interviewState]);
  const micMutedRef = useRef(false);
  // The live transcript scrolls itself to the newest turn, also when a notice or the stage changes its height.
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Fetch candidate info
  useEffect(() => {
    if (!token) return;
    sessionsApi.getCandidateInfo(token)
      .then((res) => {
        setCandidateInfo(res.data);
        setSessionId(res.data.session_id);
        if (res.data.session_status === "ended") setInterviewState("complete");
      })
      .catch(() => setInterviewState("complete"));
  }, [token]);

  const muteRef = useRef<(() => void) | null>(null);
  const unmuteRef = useRef<(() => void) | null>(null);

  const handleStateChange = useCallback((state: InterviewState) => {
    setInterviewState(state);

    if (state === "draining_audio") {
      // Mute mic, stop sending — wait for audio queue to drain then call audio_complete
      muteRef.current?.();
      audioCompleteCalledRef.current = false;
      // Safety timeout: call audio_complete after 10s even if drain never fires
      audioCompleteSafetyTimerRef.current = setTimeout(() => {
        callAudioComplete();
      }, 10_000);
      waitForDrain(() => callAudioComplete());
      return;
    }

    if (state === "reconnecting") {
      muteRef.current?.();
      connectionLostTimerRef.current = setTimeout(() => {
        setConnectionLostLong(true);
      }, 60_000);
    } else {
      if (connectionLostTimerRef.current) {
        clearTimeout(connectionLostTimerRef.current);
        connectionLostTimerRef.current = null;
      }
      setConnectionLostLong(false);
      if (state === "active" && !micMutedRef.current) unmuteRef.current?.();
    }
  }, []);

  const handleReconnected = useCallback(() => {
    if (reconnectedPromptTimerRef.current) clearTimeout(reconnectedPromptTimerRef.current);
    setReconnectedPrompt(true);
    reconnectedPromptTimerRef.current = setTimeout(() => setReconnectedPrompt(false), 10_000);
  }, []);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript, interviewState, speaker, reconnectedPrompt, connectionLostLong]);

  const handleTranscript = useCallback((turn: Pick<TranscriptTurn, "speaker" | "text">) => {
    setTranscript((prev) => [...prev.slice(-9), turn]); // keep last 10
  }, []);

  const { playChunk, stop: stopPlayback, scheduleAfterPlayback, waitForDrain, cancelDrain } = useAudioPlayback();
  const audioCompleteCalledRef = useRef(false);
  const audioCompleteSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const callAudioComplete = useCallback(async () => {
    if (audioCompleteCalledRef.current || !token) return;
    audioCompleteCalledRef.current = true;
    cancelDrain();
    if (audioCompleteSafetyTimerRef.current) {
      clearTimeout(audioCompleteSafetyTimerRef.current);
      audioCompleteSafetyTimerRef.current = null;
    }
    // Retry until success — endpoint now always returns ended:true or an error.
    // ended:false is no longer a valid response; any success means the session ended.
    const attempt = async (delay: number) => {
      try {
        await sessionsApi.audioComplete(token);
      } catch {
        setTimeout(() => attempt(Math.min(delay * 2, 8000)), delay);
      }
    };
    attempt(2000);
  }, [token, cancelDrain]);

  const handleSpeakerChange = useCallback((newSpeaker: InterviewSpeaker) => {
    if (newSpeaker === "ai") {
      setSpeaker("ai");
      muteRef.current?.();
    } else if (newSpeaker === "candidate") {
      scheduleAfterPlayback(() => {
        setSpeaker("candidate");
        if (!micMutedRef.current) unmuteRef.current?.();
      });
    }
  }, [scheduleAfterPlayback]);

  const { connect, send, sendJson, disconnect, connectionState } = useAudioWebSocket({
    sessionId: sessionId ?? 0,
    token,
    onAudioChunk: playChunk,
    onTranscript: handleTranscript,
    onStateChange: handleStateChange,
    onSpeakerChange: handleSpeakerChange,
    onReconnected: handleReconnected,
  });

  const { start: startCapture, stop: stopCapture, mute, unmute } = useAudioCapture({
    onFrame: send,
  });

  muteRef.current = mute;
  unmuteRef.current = unmute;

  const toggleMic = useCallback(() => {
    if (micMutedRef.current) {
      micMutedRef.current = false;
      setMicMuted(false);
      unmute();
    } else {
      micMutedRef.current = true;
      setMicMuted(true);
      mute();
    }
  }, [mute, unmute]);

  const startInterview = useCallback(async () => {
    if (!sessionId) return;
    setInterviewState("connecting");
    connect();
    await startCapture();
    // Start muted — only unmute when backend sends speaker_changed: candidate.
    // This prevents mic audio from being sent during AI speech, since separate
    // AudioContexts for capture/playback break the browser's echo cancellation.
    muteRef.current?.();
  }, [sessionId, connect, startCapture]);

  const endInterview = useCallback(async () => {
    setInterviewState("ending");
    if (reconnectedPromptTimerRef.current) clearTimeout(reconnectedPromptTimerRef.current);
    stopCapture();
    stopPlayback();
    sendJson({ type: "end_session" });
    disconnect();
    setInterviewState("complete");
  }, [stopCapture, stopPlayback, sendJson, disconnect]);

  const wsConnectionStatus =
    interviewState === "reconnecting"
      ? connectionLostLong ? "lost" : "reconnecting"
      : connectionState === "connected"
      ? "connected"
      : "reconnecting";

  const proctoring = !!candidateInfo?.proctoring_required;
  const proctoringReady = !!cameraStream && !!screenStream && proctoringAcknowledged;

  // ── State A: Pre-start ──────────────────────────────────────────────────
  if (interviewState === "idle") {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">{candidateInfo?.role_title ?? "AI Interview"}</h1>
          {candidateInfo && (
            <p className="text-sm text-muted-foreground">
              {candidateInfo.time_limit_min} minutes
            </p>
          )}
        </div>

        {proctoring && !isDesktopChrome() ? (
          <div role="alert" className="space-y-3 rounded-lg border p-6 text-center">
            <Monitor className="mx-auto h-8 w-8 text-primary" />
            <h2 className="font-semibold">This interview needs Chrome on a computer</h2>
            <p className="text-sm text-muted-foreground">
              It asks you to keep your camera on and share your entire screen, which phones and other browsers
              can't do. Open your invite link in Google Chrome on a laptop or desktop computer.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => setLinkCopied(true), () => {})}
            >
              {linkCopied ? "Link copied" : "Copy invite link"}
            </Button>
          </div>
        ) : !hardwareCheckDone ? (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1.5 text-muted-foreground">
              <p>• This is a voice interview. Make sure you're in a quiet place.</p>
              <p>• The AI will ask follow-up questions — there are no scripts.</p>
              <p>• The session will last up to {candidateInfo?.time_limit_min ?? "—"} minutes.</p>
              <p>• Your mic will be active throughout. You can end anytime.</p>
            </div>
            {proctoring && (
              <ProctoringSetup
                camera={cameraStream}
                screen={screenStream}
                acknowledged={proctoringAcknowledged}
                onCamera={setCameraStream}
                onScreen={setScreenStream}
                onAcknowledge={setProctoringAcknowledged}
              />
            )}
            <HardwareCheck
              extraReady={!proctoring || proctoringReady}
              onStart={() => { setHardwareCheckDone(true); startInterview(); }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Hardware checks passed. You're ready to start.</span>
            </div>
            <Button className="w-full" size="lg" onClick={startInterview}>
              <Mic className="h-4 w-4 mr-2" />
              Start Interview
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── State F: Complete ───────────────────────────────────────────────────
  if (interviewState === "complete") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-4xl">✅</div>
        <h2 className="text-xl font-semibold">Interview Complete</h2>
        <p className="text-sm text-muted-foreground">
          Thank you. The interview has been recorded.
          <br />
          The hiring team will review your results and follow up with you.
        </p>
      </div>
    );
  }

  // ── States B/C/D/E: Active interview ────────────────────────────────────
  // One stage at a time: whose turn it is, from the server's speaker_changed (the page doesn't hear the voice itself).
  const stage: StageKind =
    interviewState === "connecting"
      ? "connecting"
      : interviewState === "draining_audio"
      ? "wrapping"
      : interviewState === "reconnecting"
      ? "reconnecting"
      : speaker === "ai"
      ? "ai"
      : speaker === "candidate"
      ? "candidate"
      : "waiting";

  return (
    // The layout's header is 3rem; the room fills the rest, so the transcript scrolls and the controls stay in reach.
    <div className="mx-auto flex h-[calc(100dvh-3rem)] w-full max-w-xl flex-col px-4">
      {/* Role and time */}
      <div className="-mx-4 flex items-center justify-between gap-3 bg-[hsl(var(--primary-deep))] px-4 py-3 text-white sm:mx-0 sm:mt-4 sm:rounded-2xl">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary motion-safe:animate-pulse" />
            Live interview
          </p>
          <h1 className="truncate text-base font-semibold">{candidateInfo?.role_title ?? "Interview"}</h1>
        </div>
        {candidateInfo && (
          <div className="shrink-0 rounded-full bg-white px-3 py-1 shadow-sm">
            <InterviewTimer
              totalSeconds={candidateInfo.time_limit_min * 60}
              running={interviewState === "active"}
              onExpired={endInterview}
            />
          </div>
        )}
      </div>

      {/* Connection notices */}
      {/* A short reconnect shows on the stage; only a long one needs a notice. */}
      {interviewState === "reconnecting" && connectionLostLong && (
        <div role="alert" className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Connection is taking too long to restore. Please wait, and contact the interviewer if this persists.</span>
        </div>
      )}

      {reconnectedPrompt && (
        <div role="status" className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <span>Reconnected — please say <strong>"check"</strong> or continue your answer to resume.</span>
          <button
            aria-label="Dismiss"
            className="-m-1 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setReconnectedPrompt(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <VoiceStage stage={stage} compact={transcript.length > 0} />

      {/* Transcript, newest at the bottom and kept in view */}
      <div ref={transcriptRef} className="-mx-4 min-h-0 flex-1 space-y-3 overflow-y-auto scroll-smooth px-4 pb-4 pt-4 [mask-image:linear-gradient(to_bottom,transparent,black_1.5rem)] motion-reduce:scroll-auto">
        {transcript.map((turn, i) => (
          <TranscriptBubble key={i} speaker={turn.speaker} text={turn.text} />
        ))}
      </div>

      {/* Controls */}
      <div className="-mx-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <ConnectionStatus state={wsConnectionStatus} />

        <button
          type="button"
          onClick={toggleMic}
          aria-pressed={micMuted}
          aria-label={micMuted ? "Unmute microphone" : "Mute microphone"}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            micMuted ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {micMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>

        <div className="flex items-center justify-end gap-2">
          {import.meta.env.DEV && (
            <Button variant="ghost" size="sm" className="hidden text-xs text-muted-foreground sm:inline-flex"
              onClick={() => sendJson({ type: "debug_force_reconnect" })}>
              ⚡ Reconnect
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                End interview
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End interview?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to end the interview early?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={endInterview}>End interview</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

type StageKind = "connecting" | "waiting" | "ai" | "candidate" | "wrapping" | "reconnecting";

const STAGE_COPY: Record<StageKind, { title: string; hint: string }> = {
  connecting: { title: "Connecting to the interviewer", hint: "This takes a few seconds." },
  waiting: { title: "The interviewer is about to start", hint: "You'll hear the first question in a moment." },
  ai: { title: "Interviewer is speaking", hint: "Listen to the question. Your turn comes when the bars turn yellow." },
  candidate: { title: "Your turn", hint: "Speak when you're ready, and take your time." },
  wrapping: { title: "Wrapping up", hint: "The interviewer is finishing. Please stay on this page." },
  reconnecting: { title: "Reconnecting", hint: "Hold on a moment; the interview picks up where it left off." },
};

const BAR_REST = [10, 18, 26, 18, 10];

/** Whose turn it is, as five bars: teal while the interviewer speaks, yellow on the candidate's turn. */
function VoiceStage({ stage, compact }: { stage: StageKind; compact: boolean }) {
  const moving = stage === "ai" || stage === "candidate" || stage === "wrapping";
  const color = stage === "candidate" ? "bg-secondary" : moving ? "bg-primary" : "bg-muted-foreground/30";
  const { title, hint } = STAGE_COPY[stage];

  return (
    <div className={cn("flex flex-col items-center text-center transition-all", compact ? "py-4" : "flex-1 justify-center py-10")}>
      <div
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center rounded-full transition-all",
          compact ? "h-16 w-16" : "h-24 w-24",
          stage === "candidate" ? "bg-secondary/15" : "bg-primary/10"
        )}
      >
        <div className="flex h-10 items-end gap-1.5">
          {BAR_REST.map((height, i) => (
            <span
              key={i}
              className={cn("w-2 rounded-full", color, moving && "motion-safe:animate-voice-bar")}
              style={{
                height,
                animationDelay: `${i * 0.12}s`,
                animationDuration: `${0.7 + (i % 3) * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
      <p aria-live="polite" className={cn("font-semibold", compact ? "mt-3 text-base" : "mt-4 text-lg")}>{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
