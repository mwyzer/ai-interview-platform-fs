import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, ws } from "msw";
import { API, server } from "../server";
import { renderApp } from "../render";
import { candidateInfo, notFound } from "../fixtures";
import { testInternetSpeed } from "@/utils/internetSpeedTest";

// How the candidate page ends: the server ends the interview, the connection breaks for good, or the page can't
// load the interview at all. The page, its hooks and its services run for real; the network is MSW (REST and the
// audio WebSocket), and jsdom's missing microphone and audio are faked below, as in HardwareCheck.test.tsx.

// The connection check is faked: it measures third-party hosts, which isn't what's under test here.
vi.mock("@/utils/internetSpeedTest", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/internetSpeedTest")>()),
  testInternetSpeed: vi.fn(),
}));

const audioSocket = ws.link(/^ws:\/\/api\.test\/ws\/sessions\/42\/audio/);

type FakeTrack = { kind: string; readyState: "live" | "ended"; stop: () => void };

// Every stream the page asks for, so a test can find the interview's own microphone: the hardware check asks for
// { audio: true }, the interview's capture for audio settings (16 kHz, echo cancellation).
let streams: { constraints: MediaStreamConstraints; track: FakeTrack }[] = [];

class FakeAudioContext {
  state = "running";
  destination = {};
  currentTime = 0;
  audioWorklet = { addModule: async () => {} };
  resume = async () => {};
  close = async () => {};
  createOscillator = () => ({ connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {} } });
  createGain = () => ({ connect() {}, gain: { setValueAtTime() {} } });
  createMediaStreamSource = () => ({ connect() {} });
  createAnalyser = () => ({ fftSize: 0, frequencyBinCount: 4, getByteFrequencyData() {} });
  createBuffer = () => ({ copyToChannel() {}, getChannelData: () => new Float32Array(0) });
  createBufferSource = () => ({ connect() {}, start() {}, buffer: null, onended: null });
}

class FakeAudioWorkletNode {
  port = { onmessage: null };
  connect() {}
  disconnect() {}
}

beforeEach(() => {
  streams = [];
  vi.mocked(testInternetSpeed).mockResolvedValue({
    download: 56, upload: 8, ping: 32, passed: true, downloadTests: [], uploadTests: [], pingTests: [],
  });
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal("AudioWorkletNode", FakeAudioWorkletNode);
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async (constraints: MediaStreamConstraints) => {
        const track: FakeTrack = { kind: "audio", readyState: "live", stop: () => { track.readyState = "ended"; } };
        streams.push({ constraints, track });
        return { getTracks: () => [track], getAudioTracks: () => [track] };
      }),
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(testInternetSpeed).mockReset();
});

type Client = { send: (data: string) => void; close: () => void };

/** Opens the invite link, passes the hardware check, starts, and returns the interview's microphone track. */
async function startInterview(onConnect: (client: Client) => void) {
  server.use(
    http.get(`${API}/sessions/tok-test-123/candidate`, () => HttpResponse.json(candidateInfo)),
    audioSocket.addEventListener("connection", ({ client }) => onConnect(client))
  );
  renderApp("/interview/tok-test-123", { token: null });

  const start = await screen.findByRole("button", { name: "Start Interview" });
  await waitFor(() => expect(start).toBeEnabled(), { timeout: 10000 });
  await userEvent.click(start);

  let mic: FakeTrack | undefined;
  await waitFor(() => {
    mic = streams.find(({ constraints }) => typeof constraints.audio === "object")?.track;
    expect(mic).toBeDefined();
  });
  return mic!;
}

const send = (client: Client, message: object) => client.send(JSON.stringify(message));

describe("The end of the candidate's interview", { timeout: 20000 }, () => {
  it.fails("turns the microphone off when the server ends the interview", async () => {
    const mic = await startInterview((client) => {
      send(client, { type: "session_started" });
      setTimeout(() => send(client, { type: "session_ended" }), 200);
    });

    expect(await screen.findByRole("heading", { name: "Interview Complete" })).toBeInTheDocument();
    expect(mic.readyState).toBe("ended");
  });

  it.fails("says the interview was interrupted, not complete, after an error it can't recover from", async () => {
    const mic = await startInterview((client) => {
      send(client, { type: "session_started" });
      setTimeout(() => send(client, { type: "error", code: "no_system_prompt", recoverable: false }), 200);
    });

    expect(await screen.findByRole("heading", { name: "The interview was interrupted" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Interview Complete" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rejoin the interview" })).toBeInTheDocument();
    expect(mic.readyState).toBe("ended");
  });

  it.fails("says a link that doesn't exist doesn't work, instead of thanking the candidate", async () => {
    server.use(
      http.get(`${API}/sessions/tok-wrong/candidate`, () =>
        HttpResponse.json(notFound("Invalid or expired invite token"), { status: 404 })
      )
    );
    renderApp("/interview/tok-wrong", { token: null });

    expect(await screen.findByRole("heading", { name: "This interview link doesn't work" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Interview Complete" })).not.toBeInTheDocument();
  });

  it.fails("offers Try again when the interview can't be loaded, and recovers", async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/sessions/tok-test-123/candidate`, () => {
        calls += 1;
        return calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(candidateInfo);
      })
    );
    renderApp("/interview/tok-test-123", { token: null });

    expect(await screen.findByRole("heading", { name: "We couldn't load your interview" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Interview Complete" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Senior Frontend Engineer" })).toBeInTheDocument();
  });
});
