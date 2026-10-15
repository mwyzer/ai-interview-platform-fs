import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { SkillComparison } from "@/types";
import ComparisonTable from "./ComparisonTable";

// Rows in the shape FitGap::Engine stores them (expected_level, not required_level).
const rows = [
  { skill_label: "React", candidate_level: 3, expected_level: 3, result: "match", delta: 0 },
  { skill_label: "Communication", candidate_level: 2, expected_level: 3, result: "gap", delta: -1 },
  { skill_label: "System Design", candidate_level: 3, expected_level: 2, result: "exceed", delta: 1, is_override: true },
  { skill_label: "Testing", candidate_level: null, expected_level: 2, result: "not_assessed", delta: null },
] as unknown as SkillComparison[];

function cells(label: string) {
  return within(screen.getByRole("cell", { name: label }).closest("tr") as HTMLElement).getAllByRole("cell");
}

describe("ComparisonTable", () => {
  it("shows the candidate's level and the result with its delta for each skill", () => {
    render(<ComparisonTable comparisons={rows} />);

    expect(cells("React")[3]).toHaveTextContent("Match");
    expect(cells("Communication")[2]).toHaveTextContent("L2");
    expect(cells("Communication")[3]).toHaveTextContent("Gap -1");
    expect(cells("System Design")[3]).toHaveTextContent("Exceeds +1");
  });

  it("marks a level the assessor overrode", () => {
    render(<ComparisonTable comparisons={rows} />);

    expect(cells("System Design")[2]).toHaveTextContent("✏");
    expect(cells("React")[2]).not.toHaveTextContent("✏");
  });

  it("shows a dash, not a level, for a skill that wasn't assessed", () => {
    render(<ComparisonTable comparisons={rows} />);

    expect(cells("Testing")[2]).toHaveTextContent("—");
    expect(cells("Testing")[3]).toHaveTextContent("Not assessed");
  });

  it("summarises how many skills match, fall short and exceed", () => {
    render(<ComparisonTable comparisons={rows} />);

    expect(screen.getByText(/Match: 1 skill$/)).toBeInTheDocument();
    expect(screen.getByText(/Gap: 1 skill$/)).toBeInTheDocument();
    expect(screen.getByText(/Exceeds: 1 skill$/)).toBeInTheDocument();
  });

  it("renders an empty table without failing", () => {
    render(<ComparisonTable comparisons={[]} />);

    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  describe("known defects", () => {
    it.fails("P1-2: shows the level the vacancy requires", () => {
      render(<ComparisonTable comparisons={rows} />);

      expect(cells("Communication")[1]).toHaveTextContent("L3");
    });

    it.fails("P2-5: counts skills that weren't assessed in the summary", () => {
      render(<ComparisonTable comparisons={rows} />);

      expect(screen.getByText(/Not assessed: 1 skill/)).toBeInTheDocument();
    });
  });
});
