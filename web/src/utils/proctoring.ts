// Camera and full-screen share for assessments that require them (monitored while live, never recorded).

interface UADataLike {
  mobile: boolean;
  brands: { brand: string }[];
}

/**
 * Chrome on a computer: the only setup where the interview can require a full-screen share. Phones can't share
 * their screen, and Edge, Opera and Brave report "Chrome" in their user agent too, so the browser's own brand list
 * (User-Agent Client Hints) decides when it's there; the user-agent string is the fallback.
 */
export function isDesktopChrome(
  userAgent: string = navigator.userAgent,
  uaData: UADataLike | undefined = (navigator as Navigator & { userAgentData?: UADataLike }).userAgentData
): boolean {
  if (uaData && Array.isArray(uaData.brands) && uaData.brands.length > 0) {
    return !uaData.mobile && uaData.brands.some((b) => b.brand === "Google Chrome");
  }
  const isChrome = /Chrome\/\d+/.test(userAgent) && !/Edg\/|OPR\/|Brave|SamsungBrowser|YaBrowser/.test(userAgent);
  const isMobile = /Mobi|Android|iPhone|iPad|CriOS/.test(userAgent);
  return isChrome && !isMobile;
}

export type ScreenShareResult =
  | { ok: true; stream: MediaStream }
  | { ok: false; reason: "not_entire_screen" | "denied" | "unsupported" };

/** Asks for the entire screen and refuses a tab or a window: Chrome reports what was picked as displaySurface. */
export async function requestEntireScreen(): Promise<ScreenShareResult> {
  if (!navigator.mediaDevices?.getDisplayMedia) return { ok: false, reason: "unsupported" };
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "monitor" },
      audio: false,
      // Chrome-only hints: offer the screen first, hide this tab, don't let the share switch surfaces later.
      selfBrowserSurface: "exclude",
      surfaceSwitching: "exclude",
      monitorTypeSurfaces: "include",
    } as DisplayMediaStreamOptions);
  } catch {
    return { ok: false, reason: "denied" };
  }
  const surface = (stream.getVideoTracks()[0]?.getSettings() as MediaTrackSettings & { displaySurface?: string })
    ?.displaySurface;
  if (surface !== "monitor") {
    stream.getTracks().forEach((t) => t.stop());
    return { ok: false, reason: "not_entire_screen" };
  }
  return { ok: true, stream };
}

/** The camera, video only (the microphone is checked and captured separately). Null when refused or missing. */
export async function requestCamera(): Promise<MediaStream | null> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { width: { max: 640 }, height: { max: 480 }, frameRate: { max: 15 }, facingMode: "user" },
      audio: false,
    });
  } catch {
    return null;
  }
}

/** What to tell the candidate when the screen share wasn't the entire screen, or didn't happen. */
export const SCREEN_SHARE_ERRORS: Record<Exclude<ScreenShareResult, { ok: true }>["reason"], string> = {
  not_entire_screen: "You shared a tab or a window. Share again and choose Entire screen in Chrome's prompt.",
  denied: "Screen sharing was cancelled. Share your entire screen to continue.",
  unsupported: "This browser can't share the screen. Open the link in Chrome on a computer.",
};

export const CAMERA_ERROR = "Chrome couldn't use your camera. Allow camera access in the address bar, then try again.";

export interface ProctoringSummary {
  camera: { stops: number; off_seconds: number };
  screen: { stops: number; off_seconds: number };
}

function duration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}

function times(n: number): string {
  return n === 1 ? "once" : n === 2 ? "twice" : `${n} times`;
}

/** One line for the assessor: whether the camera and screen share stayed on, or how often and how long they didn't. */
export function proctoringSummaryText({ camera, screen }: ProctoringSummary): string {
  if (camera.stops === 0 && screen.stops === 0) return "Camera and screen sharing stayed on throughout the interview.";
  const parts: string[] = [];
  if (camera.stops) parts.push(`the camera was off ${times(camera.stops)} (${duration(camera.off_seconds)} in total)`);
  if (screen.stops) parts.push(`screen sharing stopped ${times(screen.stops)} (${duration(screen.off_seconds)} in total)`);
  const line = parts.join("; ");
  return `${line.charAt(0).toUpperCase()}${line.slice(1)}. The interview paused each time until it was back.`;
}
