import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { API, server } from "../server";
import { renderApp } from "../render";
import { candidateInfo, notFound } from "../fixtures";

// The candidate has no account: the invite token in the link is all they have.
// Only the screens before and after the interview are covered here; the live
// interview needs a microphone and the Gemini Live WebSocket (constraint C1).

// The hardware check on the first screen measures the connection against
// third-party hosts (src/utils/internetSpeedTest.ts) unless VITE_SPEED_TEST_*
// is set. Those requests are answered here and recorded, so they're visible
// instead of leaking into whichever test runs next.
let thirdParty: string[] = [];

beforeEach(() => {
  thirdParty = [];
  server.use(
    http.all(/^https?:\/\/(?!api\.test\/)/, ({ request }) => {
      thirdParty.push(`${request.method} ${new URL(request.url).host}`);
      return new HttpResponse(null, { status: 200 });
    })
  );
});

describe("Candidate interview page", () => {
  it("opens from the invite link without signing in and explains what to expect", async () => {
    server.use(http.get(`${API}/sessions/tok-test-123/candidate`, () => HttpResponse.json(candidateInfo)));
    renderApp("/interview/tok-test-123", { token: null });

    expect(await screen.findByRole("heading", { name: "Senior Frontend Engineer" })).toBeInTheDocument();
    expect(screen.getAllByText(/45 minutes/).length).toBeGreaterThan(0);
    expect(screen.getByText(/This is a voice interview/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("shows the closing screen when the interview has already ended", async () => {
    server.use(
      http.get(`${API}/sessions/tok-test-123/candidate`, () =>
        HttpResponse.json({ ...candidateInfo, session_status: "ended" })
      )
    );
    renderApp("/interview/tok-test-123", { token: null });

    expect(await screen.findByText("Interview Complete")).toBeInTheDocument();
  });

  describe("known defects", () => {
    it.fails("does not send the candidate's connection to third-party hosts before the interview", async () => {
      server.use(http.get(`${API}/sessions/tok-test-123/candidate`, () => HttpResponse.json(candidateInfo)));
      renderApp("/interview/tok-test-123", { token: null });
      await screen.findByRole("heading", { name: "Senior Frontend Engineer" });

      // Give the hardware check time to start its measurements, then expect none went out.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      expect(thirdParty).toEqual([]);
    });

    it.fails("does not tell someone with a broken link that their interview was recorded", async () => {
      server.use(
        http.get(`${API}/sessions/not-a-token/candidate`, () =>
          HttpResponse.json(notFound("Invalid or expired invite token"), { status: 404 })
        )
      );
      renderApp("/interview/not-a-token", { token: null });

      await waitFor(() => expect(screen.getByText(/invalid|expired|not found/i)).toBeInTheDocument());
      expect(screen.queryByText(/has been recorded/)).not.toBeInTheDocument();
    });

    it.fails("P2-4: says before the interview starts that it is recorded and assessed by AI", async () => {
      server.use(http.get(`${API}/sessions/tok-test-123/candidate`, () => HttpResponse.json(candidateInfo)));
      renderApp("/interview/tok-test-123", { token: null });

      await screen.findByRole("heading", { name: "Senior Frontend Engineer" });
      expect(screen.getByText(/recorded/i)).toBeInTheDocument();
    });
  });
});
