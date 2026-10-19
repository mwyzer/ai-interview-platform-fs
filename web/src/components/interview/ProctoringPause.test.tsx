import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProctoringPause from "./ProctoringPause";

const props = { busy: false, error: null, onResumeCamera: vi.fn(), onResumeScreen: vi.fn() };

describe("ProctoringPause", () => {
  it("says the interview is paused, why, and that the timer keeps running", () => {
    render(<ProctoringPause {...props} camera={false} screen={true} />);

    expect(screen.getByRole("alertdialog", { name: "Interview paused" })).toBeInTheDocument();
    expect(screen.getByText(/Your screen sharing stopped/)).toHaveTextContent(/timer keeps running/);
    expect(screen.queryByRole("button", { name: /camera/i })).not.toBeInTheDocument();
  });

  it("offers one button per thing that stopped", async () => {
    const onResumeCamera = vi.fn();
    const onResumeScreen = vi.fn();
    const user = userEvent.setup();
    render(<ProctoringPause {...props} camera={true} screen={true} onResumeCamera={onResumeCamera} onResumeScreen={onResumeScreen} />);

    expect(screen.getByText(/Your camera and screen sharing stopped/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Turn camera back on" }));
    await user.click(screen.getByRole("button", { name: "Share your entire screen again" }));

    expect(onResumeCamera).toHaveBeenCalledOnce();
    expect(onResumeScreen).toHaveBeenCalledOnce();
  });

  it("shows why turning it back on failed", () => {
    render(<ProctoringPause {...props} camera={false} screen={true} error="You shared a tab or a window." />);

    expect(screen.getByRole("alert")).toHaveTextContent("You shared a tab or a window.");
  });
});
