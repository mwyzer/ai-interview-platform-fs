# Video script (about 4 minutes)

About 550 spoken words, at a calm pace. Each scene says what's on screen, then what to say. The timings are
targets; it's fine to land between 3:45 and 4:15.

## Before recording

1. Start the stack with `docker compose up -d`, then run `docker compose exec api bin/rails e2e:seed` (the synthetic
   candidates "E2E Mixed" and others).
2. **Stop Sidekiq** (`docker compose stop sidekiq`), so no click can queue a real model call.
3. In the browser, sign in as `admin@example.com`. Open these four tabs:
   - **Tab 1:** the portfolio of **E2E Mixed**
   - **Tab 2:** its fit/gap report
   - **Tab 3:** the assessment list
   - **Tab 4:** the PDF report (`assessment/report/report.pdf`) at the "Step 3" findings table
4. Keep DevTools ready with device mode at **375px** (Ctrl+Shift+M).
5. Have a terminal ready with the seeded fault, as recorded:
   ```sh
   git show 27f49f3
   ```
   It's the one-line change that put `value.to_i.clamp(1, 5)` back. Also open the work log at "Seeded fault"
   (sub-PR 3), which records the 13 specs that failed, each on its assertion. Showing the recorded run is honest and
   needs no live setup: the Docker API runs the main checkout, so a live run on the scratch branch would need the stack
   rebuilt from it.
6. Have the fork's PR list open (`mwyzer/ai-interview-platform-fs/pulls`) with green checks, and PR #160.

## Scenes

### 1. The problem (0:00–0:30)

**On screen:** the report, at the Step 3 findings table (P0-1, P1-1).

> This AI interviewer turns a voice conversation into a level per skill. When I used it end to end, I found its
> most important flaw: a skill nobody asked about was stored as **L1**, the lowest level, and the fit/gap report
> counted it as a **gap**. A candidate whose interview ended early looked weak at things they were never asked. And
> the people reading the report had no way to tell "measured low" from "never measured".

### 2. Why this, and not something else (0:30–0:55)

**On screen:** the report's Step 4 options table (A/B/C).

> Step 2 and 3 pointed the same way: everyone downstream acts on the portfolio, not on the interview, and a false
> low is silent. So I made "not assessed" a real state, end to end, from the database to the screen. I chose the
> option that makes every output honest without changing how ratings are computed, and left the bigger verdict
> change for a product decision.

### 3. The result, on screen (0:55–1:55)

**On screen:** Tab 1, the portfolio of E2E Mixed.

> Here's the same kind of interview now. At the top, a summary: two of three skills weren't assessed, and the
> interview ended after six minutes, ended by the candidate.

**Point at** the "Not assessed" badge and its reason.

> Each one says it in words, never as a level, with the reason: not reached before the interview ended, or not
> enough evidence to rate. And what to do next: probe it in the next interview.

**Click** "Add rating" on Communication. Don't save.

> An assessor can still add a rating, but with nothing from the AI underneath, they have to say where it comes
> from. Save stays disabled until they do.

**On screen:** Tab 2, the fit/gap report.

> Fit/gap now treats these as unknowns, not gaps: one match, two not assessed, zero gaps.

**Switch** to 375px.

> And on a phone, the table becomes stacked rows that still read without the header.

### 4. How it works (1:55–2:45)

**On screen:** `api/app/services/portfolios/skill_resolver.rb`, scrolled to `configured_row` and `strict_level`.

> In the API, every skill goes through one decision. Coverage comes first: if the interview never probed it, it's
> "not reached", whatever the model says. Then the level is parsed strictly: only a whole level from one to five
> counts. The old code clamped anything into range, which is how "null" became L1. Evidence quotes must appear word
> for word in what the candidate said, or confidence drops.

**On screen:** the migration's check constraints.

> The database enforces it too: a skill has a reason exactly when it has no level. And everything is written in one
> transaction, so an assessor's override survives a regeneration.

### 5. Proving it (2:45–3:25)

**On screen:** `git show 27f49f3`, then the work log's "Seeded fault" (sub-PR 3).

> To prove the tests guard this, I put the original bug back on a scratch branch: the clamp. Thirteen specs fail,
> each on its assertion. Then I reverted it, and both commits stay in the history.

**On screen:** the fork's PR list with green checks.

> It's delivered as an umbrella PR with fifteen focused sub-PRs. CI runs the API and web suites, the browser tests
> at desktop and phone width with an accessibility check on every page, and security scans.

> One AI moment worth showing: my first phone-width check couldn't fail, because the emulated phone zoomed out to
> fit. I caught it by planting a too-wide table first, and fixed the check.

### 6. What else, and what's open (3:25–4:00)

**On screen:** the report's "What I'd escalate" table.

> Along the way I closed the risks that needed no one's decision: one company could read another's candidates;
> passwords and candidate names went into the logs; fit/gap jobs ran twice; production didn't even boot. What's
> left is written down with my recommendation: linking users to their company, consent before the microphone opens
> under UU PDP, and the Rails upgrade. Each one comes with its next steps, ready to build.
>
> Thanks for watching.

## After recording

- Upload as **unlisted** (YouTube unlisted, Loom, or Drive with link sharing).
- Send me the link. I'll put it in the report and in PR #160, remove the blue review marker and the DRAFT banner,
  and rebuild the PDF.
