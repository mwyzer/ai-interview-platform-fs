import { Camera, Monitor, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProctoringPauseProps {
  camera: boolean; // the camera stopped
  screen: boolean; // the screen share stopped
  busy: boolean;
  error: string | null;
  onResumeCamera: () => void;
  onResumeScreen: () => void;
}

/** Covers the interview while the camera or the screen share is off; the timer keeps running underneath. */
export default function ProctoringPause({ camera, screen, busy, error, onResumeCamera, onResumeScreen }: ProctoringPauseProps) {
  const what = camera && screen ? "Your camera and screen sharing" : camera ? "Your camera" : "Your screen sharing";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div role="alertdialog" aria-modal="true" aria-labelledby="pause-title" aria-describedby="pause-body"
        className="w-full max-w-sm space-y-4 rounded-2xl bg-background p-6 text-center shadow-xl">
        <PauseCircle className="mx-auto h-10 w-10 text-amber-500" />
        <div className="space-y-1.5">
          <h2 id="pause-title" className="text-lg font-semibold">Interview paused</h2>
          <p id="pause-body" className="text-sm text-muted-foreground">
            {what} stopped. Your microphone is off until you turn {camera && screen ? "them" : "it"} back on.
            The timer keeps running.
          </p>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          {camera && (
            <Button onClick={onResumeCamera} disabled={busy}>
              <Camera className="mr-2 h-4 w-4" /> Turn camera back on
            </Button>
          )}
          {screen && (
            <Button onClick={onResumeScreen} disabled={busy} variant={camera ? "outline" : "default"}>
              <Monitor className="mr-2 h-4 w-4" /> Share your entire screen again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
