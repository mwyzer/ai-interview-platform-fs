# Step 3: Problem and gap to the ideal condition

## The core problem

The product exists to produce one thing: **a skill rating an assessor can trust and defend**. The rating changes a
real person's year. Everything else (the live interview, the coverage map, the fit/gap report) exists to produce
that rating or to act on it.

Today the pipeline that turns an interview into a rating **fabricates certainty it doesn't have**:

- A skill that was never discussed is stored as **L1**. Fit/gap then reports it as a **gap**, the same as a skill
  where the candidate was probed and fell short.
- Evidence quotes shown under "Evidence from interview" are not checked against the transcript.
- A skill the model leaves out simply disappears from the results.

The assessor can't tell any of these apart from a real, well-evidenced result. The candidate never finds out
either way. On top of that, **any admin from any other company can read and rewrite these ratings**.

The gap, in one line: the system doesn't separate "we measured this and it's low" from "we never measured this".
It also doesn't protect the result once it's produced.

## How I checked

- Read the product spec (wiki PRD 01 and PRD 02) and traced each node (N1–N14) to the code.
- Ran the stack locally (see [00-work-log.md](00-work-log.md)). No Gemini key was provided, so a live voice
  interview couldn't run (see constraint C1). Instead I reproduced the post-interview pipeline against the **real
  services and database**, with the model response stubbed:
  [evidence/repro_findings.rb](evidence/repro_findings.rb).
- Hit the API over HTTP with tokens for two separate organizations, and read the Sidekiq and Rails logs.

Scenario used: *Senior Frontend Engineer* with three skills (React L3, Communication L3, System Design L2). The
candidate's connection drops at minute 6, after only React was discussed. The model answers honestly with
`"level": null` for the two skills it has no evidence for.

```
== unassessed skills are stored as real ratings ==
  React / Frontend Development Core    coverage=partial  probes=2  -> stored ai_level=L3 (medium)
  Communication                        coverage=not_yet  probes=0  -> stored ai_level=L1 (low)
  System Design & Architecture         coverage=not_yet  probes=0  -> stored ai_level=L1 (low)

== fit/gap reports those fake ratings as skill gaps ==
  Communication                        expected=L3 candidate=L1 -> gap
  System Design & Architecture         expected=L2 candidate=L1 -> gap
  narrative fallback: Candidate shows 1 skill matches, 0 exceeds, and 2 gaps against role requirements.
```

## Findings

**Type** separates *missing specification* (never defined anywhere) from *defective implementation* (defined, but
broken). **Seam** marks findings that sit between the data computation and the frontend presentation.

### P0: wrong outcomes for candidates, or a breach

| # | Finding | Impact | Type | Where | Evidence |
|---|---|---|---|---|---|
| P0-1 | **Unassessed skills are stored as L1.** The prompt forces a level for every skill, `level.to_i.clamp(1, 5)` turns `null`/`"N/A"` into 1, the DB column is `NOT NULL 1..5`, and the web's `parseLevel` also falls back to 1. | A candidate whose interview ended early is rated at the lowest level for skills nobody asked about. | Missing spec (no "not assessed" state in the PRD output or the data model) + defect (clamp) | `api` generator, schema; `web` `parseLevel` (**seam**) | repro output above |
| P0-2 | **Cross-tenant read and write of portfolios.** `Portfolio`, `PortfolioSkill` and `FitGapReport` aren't tenant-scoped, and the controllers use `Portfolio.find(params[:id])`. | An admin at Company B can export Company A's candidate evidence and change their rating. That's a breach of personal data under UU PDP. | Defect | `api` portfolios and portfolio_skills controllers | Other Corp token: `GET sessions/1` → 404, but `GET portfolios/1/export` → 200 with the full portfolio, and `POST portfolio_skills/1/override` → **201, level set to L5** |

### P1: wrong or misleading results; data integrity

| # | Finding | Impact | Type | Where | Evidence |
|---|---|---|---|---|---|
| P1-1 | **Fit/gap treats fabricated and low-confidence levels as real.** Only a missing row becomes `not_assessed`; confidence is stored but never used in the verdict. | A hiring manager sees "Gap −2" for a skill never discussed, and may reject on it. | Missing spec | `api` `FitGap::Engine` | repro: Communication → `gap` |
| P1-2 | **The "Required" column is always blank, and the override marker never shows.** The API sends `expected_level`; the web reads `required_level`. The API never sends `is_override`, yet the legend says "✏ = human override applied". | The core table of the report can't be read as a comparison. | Defect | **seam** `ComparisonTable.tsx` / `FitGap::Engine` | payload keys: `delta, result, skill_id, confidence, skill_label, expected_level, candidate_level` |
| P1-3 | **Skills the model leaves out disappear.** The output isn't reconciled against the configured skills. | The portfolio shows 1 skill for a 3-skill assessment, with no sign that anything is missing. | Defect | `api` generator; `web` portfolio page | repro: configured 3, portfolio 1 |
| P1-4 | **Portfolio writes aren't atomic.** `destroy_all`, then `create!` per skill, outside a transaction. Regenerating also deletes assessor overrides (`dependent: :destroy`). | Bad model output (e.g. `"Low"`) leaves a half-written portfolio. A retry erases the assessor's judgement. | Defect | `api` generator | repro: `RecordInvalid`, status `failed`, 1 skill already written |
| P1-5 | **Evidence quotes aren't verified against the transcript.** | A made-up quote is shown as "Evidence from interview" and backs the rating. | Missing spec | `api` generator; `web` skill card | repro: invented quote stored, found in transcript = `false` |
| P1-6 | **Duplicate fit/gap jobs race.** No dedupe; the web re-triggers generation on every 404 while polling. | Concurrent jobs crash on `UniqueViolation`; wasted model calls and noisy retries. | Defect | `api` controller and worker; `web` `FitGapReportPage` | 3 POSTs → 3 jobs, 2 failed with `PG::UniqueViolation` |
| P1-7 | **Secrets and personal data in logs.** No `filter_parameters`. | Login passwords and assessor notes are written in plain text to the request log. | Defect | `api` config | `development.log` contains `"password"=>"password123"` 3×, and the override notes |

### P2: failure paths and trust signals

| # | Finding | Impact | Type | Where |
|---|---|---|---|---|
| P2-1 | **Failure states are dead ends.** Fit/gap has no `failed` status, so a failed job means an endless spinner. A portfolio load error is swallowed (`.catch(() => {})`), leaving a blank page. `generation_error` is never shown. | The assessor waits forever, or reloads, with no explanation. | Missing spec | `web` portfolio and fit/gap pages; `api` fit/gap |
| P2-2 | **Retry while Sidekiq is still retrying.** The generator marks `failed`, then re-raises (`retry: 3`), so the UI offers "Retry" while a retry is already scheduled. | Two generations run for one session. | Defect | `api` worker, generator |
| P2-3 | **Gemini HTTP retries never fire.** Faraday's retry middleware only retries idempotent methods (`delete, get, head, options, put`), and every Gemini call is a `POST`. | One 429 or 503 fails the step outright; the retry config is dead code. | Defect | `api` `Gemini::HttpClient` |
| P2-4 | **No notice or consent for the candidate.** The interview page tells the candidate "has been recorded" only *after* the interview; nothing before it explains AI assessment, purpose or retention. | Processing without informed consent; the candidate can't make a choice. | Missing spec (UU PDP) | `web` interview page |
| P2-5 | **Fit/gap discovered-skills list** shows a raw `3` instead of `L3`, labels anything not low as "confirmed", and the summary counts leave out `not_assessed`. | Inconsistent, overconfident wording. | Defect | `web` fit/gap page |

### P3: polish and hygiene

- The override can be saved without a reason. The label reads "You Overridden ✓".
- No path to delete a candidate's data (transcripts, portfolio). That's needed for the right to erasure under
  UU PDP; it's tracked as constraint C4.
- Dev setup issues are in [00-work-log.md](00-work-log.md): the Puma pid directory, no seeded user, CRLF line
  endings, the `.env.example` port, no lockfile.

## Constraint signal (what I'd escalate to a Tech Lead)

- **C1: No model access, and model IDs are probably outdated.** No Gemini key came with the repo, and the default
  model IDs are the `gemini-2.0-*` family. The live interview can't be tested end to end without a key and current
  model names. I'm proceeding with stubbed model clients, and tests won't call the network.
- **C2: Auth trusts JWT claims without a user lookup.** Any token signed with the shared `SECRET_KEY_BASE` (also
  used by `rakamin-api`), with `role: admin` and any `scheme`, is accepted. Tenant isolation therefore rests
  entirely on scoping each model, which is exactly what failed in P0-2.
- **C3: Shared database with `rakamin-api`.** Migrations run against a database another service owns
  (`public.organizations`). Schema changes need to be coordinated and reversible.
- **C4: No retention or erasure policy** for transcripts, audio-derived text or portfolios. That's a product and
  legal decision, not an engineering default.
- **C5: No tests, no web test runner, no CI.** Every change above is currently unprotected against regression.

## What this points to for Step 4

The highest-leverage change is the **post-interview result pipeline**: generation, storage, fit/gap and
presentation. It's where the candidate is harmed (P0-1, P1-1, P1-5), where the assessor's trust is decided
(P1-2, P1-3, P2-1), and where the breach sits (P0-2). The live interview layer (coverage, prompts, audio) is
comparatively well hardened, and it can't be verified without model access (C1).
