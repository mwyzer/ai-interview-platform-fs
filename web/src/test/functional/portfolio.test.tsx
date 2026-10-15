import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { API, server } from "../server";
import { renderApp } from "../render";
import { portfolio, sessionShow, vacancies } from "../fixtures";

const PAGE = "/assessments/7/sessions/42/portfolio";

function serve(portfolioResponse: () => Response) {
  server.use(
    http.get(`${API}/sessions/42/portfolio`, portfolioResponse),
    http.get(`${API}/sessions/42`, () => HttpResponse.json(sessionShow)),
    http.get(`${API}/vacancies`, () => HttpResponse.json(vacancies))
  );
}

function card(label: string) {
  return screen.getByText(label, { selector: "span.font-semibold" }).closest(".bg-card") as HTMLElement;
}

describe("Portfolio review", () => {
  it("shows each skill's level, confidence, evidence and summary, with discovered skills apart", async () => {
    serve(() => HttpResponse.json({ portfolio }));
    renderApp(PAGE);

    expect(await screen.findByText("Portfolio Results")).toBeInTheDocument();
    expect(await screen.findByText("Test Candidate")).toBeInTheDocument();

    const react = card("React");
    expect(within(react).getByText("L3")).toBeInTheDocument();
    expect(within(react).getByText("Confidence: HIGH")).toBeInTheDocument();
    expect(within(react).getByText(/We moved critical real-time data/)).toBeInTheDocument();
    expect(within(react).getByText("Handles complex state with clear trade-offs.")).toBeInTheDocument();

    expect(within(card("Communication")).getByText("L2")).toBeInTheDocument();
    expect(screen.getByText("Discovered Skills")).toBeInTheDocument();
    expect(within(card("Micro-frontend Architecture")).getByText(/Only briefly explored/)).toBeInTheDocument();
  });

  it("shows progress while the portfolio is generated, then the result", async () => {
    let ready = false;
    serve(() => (ready ? HttpResponse.json({ portfolio }) : HttpResponse.json({ status: "generating" }, { status: 202 })));
    renderApp(PAGE);

    expect(await screen.findByText("Generating portfolio...")).toBeInTheDocument();

    ready = true;
    expect(await screen.findByText("React", {}, { timeout: 7000 })).toBeInTheDocument();
    expect(screen.queryByText("Generating portfolio...")).not.toBeInTheDocument();
  }, 10_000);

  it("offers a retry when generation failed, and asks the API to regenerate", async () => {
    let regenerated = false;
    serve(() =>
      HttpResponse.json({
        portfolio: { ...portfolio, generation_status: "failed", generation_error: "Gemini API timeout", skills: [] },
        error: "Gemini API timeout",
      })
    );
    server.use(
      http.post(`${API}/sessions/42/portfolio/regenerate`, () => {
        regenerated = true;
        return HttpResponse.json({ message: "queued", portfolio: { ...portfolio, generation_status: "pending" } });
      })
    );
    const { user } = renderApp(PAGE);

    expect(await screen.findByText("Portfolio generation failed.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Retry/ }));

    expect(await screen.findByText("Generating portfolio...")).toBeInTheDocument();
    expect(regenerated).toBe(true);
  });

  it("saves an assessor's override with a note and shows it next to the AI's level", async () => {
    let sent: unknown;
    serve(() => HttpResponse.json({ portfolio }));
    server.use(
      http.post(`${API}/portfolio_skills/102/override`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(
          { override: { id: 1, portfolio_skill_id: 102, ai_level: 2, override_level: 3, assessor_notes: "Strong written follow-up.", overridden_by: 1 } },
          { status: 201 }
        );
      })
    );
    const { user } = renderApp(PAGE);
    await screen.findByText("Communication");

    const communication = card("Communication");
    await user.click(within(communication).getByRole("button", { name: /Override rating/ }));
    await user.click(within(communication).getByRole("radio", { name: /L3/ }));
    await user.type(within(communication).getByLabelText(/Notes/), "Strong written follow-up.");
    await user.click(within(communication).getByRole("button", { name: "Save override" }));

    await waitFor(() =>
      expect(sent).toEqual({ override: { override_level: 3, assessor_notes: "Strong written follow-up." } })
    );
    expect(await within(card("Communication")).findByRole("button", { name: /Edit override/ })).toBeInTheDocument();
  });

  it("keeps the override form open with a message when saving fails", async () => {
    serve(() => HttpResponse.json({ portfolio }));
    server.use(http.post(`${API}/portfolio_skills/101/override`, () => HttpResponse.json({}, { status: 500 })));
    const { user } = renderApp(PAGE);
    await screen.findByText("React");

    const react = card("React");
    await user.click(within(react).getByRole("button", { name: /Override rating/ }));
    await user.click(within(react).getByRole("button", { name: "Save override" }));

    expect(await within(react).findByText("Failed to save override. Please try again.")).toBeInTheDocument();
    expect(within(react).getByRole("button", { name: "Save override" })).toBeEnabled();
  });

  describe("known defects (assessment/03-problem-and-gap.md)", () => {
    // Today a null level doesn't render as L1 here: parseLevel(null) throws and the
    // whole page is replaced by "Something went wrong." The API fix alone would
    // break this screen, so both sides of the seam must ship together.
    it.fails("P0-1: never shows a level for a skill the AI could not rate", async () => {
      const unrated = { ...portfolio.skills[1], ai_level: null, ai_confidence: null, evidence: [], competency_summary: null };
      serve(() => HttpResponse.json({ portfolio: { ...portfolio, skills: [portfolio.skills[0], unrated] } }));
      renderApp(PAGE);
      await screen.findByText("Communication");

      const communication = card("Communication");
      expect(within(communication).queryByText(/^L[1-5]$/)).not.toBeInTheDocument();
      expect(within(communication).getByText(/not assessed/i)).toBeInTheDocument();
    });

    it.fails("P2-1: tells the assessor when the portfolio can't be loaded, instead of a blank page", async () => {
      serve(() => HttpResponse.json({ errors: [{ status: 500 }] }, { status: 500 }));
      renderApp(PAGE);

      expect(await screen.findByText("Portfolio Results")).toBeInTheDocument();
      expect(await screen.findByRole("alert")).toBeInTheDocument();
    });
  });
});
