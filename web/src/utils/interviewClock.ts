import type { InterviewState } from "@/types";

/** Whether the interview timer counts down in this state. */
export function timerRuns(state: InterviewState): boolean {
  return state === "active";
}
