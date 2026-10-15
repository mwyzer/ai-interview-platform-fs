import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { API, server } from "@/test/server";
import type { AssessorOverride, PortfolioSkill } from "@/types";
import LevelBadge from "./LevelBadge";
import ConfidenceIndicator from "./ConfidenceIndicator";
import SkillPortfolioCard from "./SkillPortfolioCard";
import OverridePanel from "./OverridePanel";

// The API sends ai_level as a number; the web type still says string (a seam
// mismatch noted in Step 4), hence the cast.
function skill(fields: Record<string, unknown> = {}): PortfolioSkill {
  return {
    id: 101,
    skill_label: "React",
    is_discovered: false,
    ai_level: 3,
    ai_confidence: "high",
    evidence: ["We moved critical real-time data into local component state with useRef."],
    competency_summary: "Handles complex state with clear trade-offs.",
    ...fields,
  } as unknown as PortfolioSkill;
}

const override: AssessorOverride = {
  id: 1, portfolio_skill_id: 101, ai_level: 3, override_level: 4, assessor_notes: "Led the migration.", overridden_by: 1,
};

describe("LevelBadge", () => {
  it("shows the level and what it means", () => {
    render(<LevelBadge level={3} />);

    expect(screen.getByText("L3")).toBeInTheDocument();
    expect(screen.getByText("Proficient")).toBeInTheDocument();
  });

  it("drops the description at the small size", () => {
    render(<LevelBadge level={5} size="sm" />);

    expect(screen.getByText("L5")).toBeInTheDocument();
    expect(screen.queryByText("Expert")).not.toBeInTheDocument();
  });
});

describe("ConfidenceIndicator", () => {
  it.each([
    ["high", "Confidence: HIGH"],
    ["MEDIUM", "Confidence: MEDIUM"],
    ["low", "Confidence: LOW"],
  ])("labels %s confidence", (confidence, label) => {
    render(<ConfidenceIndicator confidence={confidence} />);

    expect(screen.getByText(new RegExp(label.replace(":", ":\\s*")))).toBeInTheDocument();
  });
});

describe("SkillPortfolioCard", () => {
  it("shows the level, confidence, evidence and summary", () => {
    render(<SkillPortfolioCard skill={skill()} onOverrideSaved={() => {}} />);

    expect(screen.getByText("L3")).toBeInTheDocument();
    expect(screen.getByText(/Confidence:\s*HIGH/)).toBeInTheDocument();
    expect(screen.getByText(/We moved critical real-time data/)).toBeInTheDocument();
    expect(screen.getByText("Handles complex state with clear trade-offs.")).toBeInTheDocument();
  });

  it("shows the assessor's level instead of the AI's once overridden", () => {
    render(<SkillPortfolioCard skill={skill()} override={override} onOverrideSaved={() => {}} />);

    const [headerBadge] = screen.getAllByText("L4");
    expect(headerBadge).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Edit override/ })).toBeInTheDocument();
  });

  it("warns that a low-confidence rating only had brief evidence", () => {
    render(<SkillPortfolioCard skill={skill({ ai_confidence: "low" })} onOverrideSaved={() => {}} />);

    expect(screen.getByText(/Only briefly explored/)).toBeInTheDocument();
  });

  it("leaves out the evidence heading when there is no evidence", () => {
    render(<SkillPortfolioCard skill={skill({ evidence: [] })} onOverrideSaved={() => {}} />);

    expect(screen.queryByText(/Evidence from interview/i)).not.toBeInTheDocument();
  });

  it("marks a discovered skill", () => {
    render(<SkillPortfolioCard skill={skill({ is_discovered: true })} onOverrideSaved={() => {}} />);

    expect(screen.getByText("Discovered")).toBeInTheDocument();
  });
});

describe("OverridePanel", () => {
  it("saves the chosen level and note, then reports the saved override", async () => {
    let sent: unknown;
    server.use(
      http.post(`${API}/portfolio_skills/101/override`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ override }, { status: 201 });
      })
    );
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<OverridePanel skill={skill()} onSaved={onSaved} />);

    await user.click(screen.getByRole("button", { name: /Override rating/ }));
    expect(screen.getByRole("radio", { name: "L3" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "L4" }));
    await user.type(screen.getByLabelText(/Notes/), "Led the migration.");
    await user.click(screen.getByRole("button", { name: "Save override" }));

    await vi.waitFor(() => expect(onSaved).toHaveBeenCalledWith(override));
    expect(sent).toEqual({ override: { override_level: 4, assessor_notes: "Led the migration." } });
    expect(screen.queryByRole("button", { name: "Save override" })).not.toBeInTheDocument();
  });

  it("closes without saving on Cancel", async () => {
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<OverridePanel skill={skill()} onSaved={onSaved} />);

    await user.click(screen.getByRole("button", { name: /Override rating/ }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: /Override rating/ })).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("keeps the form open with a message when saving fails", async () => {
    server.use(http.post(`${API}/portfolio_skills/101/override`, () => HttpResponse.json({}, { status: 422 })));
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<OverridePanel skill={skill()} onSaved={onSaved} />);

    await user.click(screen.getByRole("button", { name: /Override rating/ }));
    await user.click(screen.getByRole("button", { name: "Save override" }));

    expect(await screen.findByText("Failed to save override. Please try again.")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("shows the AI's level next to the assessor's once overridden", () => {
    render(<OverridePanel skill={skill()} existingOverride={override} onSaved={() => {}} />);

    const summary = screen.getByText("AI").parentElement as HTMLElement;
    expect(within(summary).getByText("L3")).toBeInTheDocument();
    expect(within(summary).getByText("L4")).toBeInTheDocument();
  });

  it.fails("labels an override in plain English (known defect, P3: reads 'You Overridden')", () => {
    render(<OverridePanel skill={skill()} existingOverride={override} onSaved={() => {}} />);

    expect(screen.queryByText(/You Overridden/)).not.toBeInTheDocument();
  });

  it.fails("asks for a reason before saving an override (known defect, P3: the note is optional)", async () => {
    const user = userEvent.setup();
    render(<OverridePanel skill={skill()} onSaved={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Override rating/ }));

    expect(screen.getByRole("button", { name: "Save override" })).toBeDisabled();
  });
});
