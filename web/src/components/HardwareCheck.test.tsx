import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { testInternetSpeed, type InternetSpeedResult } from "@/utils/internetSpeedTest";
import HardwareCheck from "./HardwareCheck";

// The connection check is faked: what's under test is the order of the checks, not the measurement.
vi.mock("@/utils/internetSpeedTest", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/internetSpeedTest")>()),
  testInternetSpeed: vi.fn(),
}));

function speed(passed: boolean): InternetSpeedResult {
  return { download: 56, upload: passed ? 8 : 2, ping: 32, passed, downloadTests: [], uploadTests: [], pingTests: [] };
}

// A microphone and speakers that work: jsdom has neither.
class FakeAudioContext {
  state = "running";
  destination = {};
  currentTime = 0;
  resume = async () => {};
  createOscillator = () => ({ connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {} } });
  createGain = () => ({ connect() {}, gain: { setValueAtTime() {} } });
  createMediaStreamSource = () => ({ connect() {} });
  createAnalyser = () => ({ fftSize: 0, frequencyBinCount: 4, getByteFrequencyData() {} });
}

beforeEach(() => {
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal("requestAnimationFrame", () => 0);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }) },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(testInternetSpeed).mockReset();
});

/** The status shown on the row with this label ("Passed", "Failed", "Waiting", "Checking..."). */
async function statusOf(label: string, expected: string) {
  const row = screen.getByText(label).closest("div.px-4") as HTMLElement;
  return within(row).findByText(expected, {}, { timeout: 8000 });
}

// Each test waits through the real 800 ms OS step and the chain after it; the suite runs files in parallel.
describe("HardwareCheck", { timeout: 20000 }, () => {
  it("lets the candidate start once every check passes", async () => {
    vi.mocked(testInternetSpeed).mockResolvedValue(speed(true));
    render(<HardwareCheck />);

    await statusOf("Audio output", "Passed");
    // Start is enabled one render later: the component works out "all passed" in an effect.
    await waitFor(() => expect(screen.getByRole("button", { name: "Start Interview" })).toBeEnabled());
  });

  it("keeps Start disabled until the camera and screen share are ready, when the assessment requires them", async () => {
    vi.mocked(testInternetSpeed).mockResolvedValue(speed(true));
    render(<HardwareCheck extraReady={false} />);

    await statusOf("Audio output", "Passed");
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByRole("button", { name: "Start Interview" })).toBeDisabled();
  });

  it("checks the microphone and audio output even when the connection check fails (P2-21)", async () => {
    vi.mocked(testInternetSpeed).mockResolvedValue(speed(false));
    render(<HardwareCheck />);

    await statusOf("Internet", "Failed");
    await statusOf("Microphone", "Passed");
    await statusOf("Audio output", "Passed");
    expect(screen.getByRole("button", { name: "Start Interview" })).toBeDisabled();
  });

  it("checks the audio output even when the microphone is blocked (P2-21)", async () => {
    vi.mocked(testInternetSpeed).mockResolvedValue(speed(true));
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    render(<HardwareCheck />);

    await statusOf("Microphone", "Failed");
    await statusOf("Audio output", "Passed");
    expect(screen.getByRole("button", { name: "Start Interview" })).toBeDisabled();
  });
});
