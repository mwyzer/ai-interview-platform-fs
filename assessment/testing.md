# Testing: what exists and what's missing

The brief's baseline was "RSpec has no specs, web has no test runner, no CI". This page records what has been built
since, what each layer is for, and what's still missing, in priority order.

## The layers

| Layer | Question it answers | API | Web |
|---|---|---|---|
| **Unit** | Does this one piece behave, at its edges? | `api/spec/{services,models,lib,clients,auth,workers}` | `*.test.ts(x)` beside the source |
| **Integration** | Does it work against the real thing it connects to? | `api/spec/integration` (Postgres, Redis, Rack, Sidekiq) | `web/src/test/integration` (REST + WebSocket; live API contract) |
| **Functional** | Does a user's whole path work? | `api/spec/functional` (journeys over HTTP) | `web/src/test/functional` (whole app rendered at a URL) |

Shared rules (see [GUARDRAILS.md](../GUARDRAILS.md)): no test calls Gemini; the web fakes only the network, at the
HTTP level, and fails on any request it didn't expect; synthetic data only; test jobs never go to the real Redis.

## What exists

### API (RSpec): 195 examples, 0 failures, 17 pending

| Suite | Examples | Covers |
|---|---|---|
| Original harness | 78 (11 pending) | Coverage state engine, analyzer, map injector; portfolio generator; fit/gap engine; auth, tenancy and fit/gap requests; two models; portfolio worker |
| Functional | 14 (3 pending) | The PRD 02 journey from setup to export; model timeout and retry, non-JSON answer, failed narrative, invalid requests; known defects end to end |
| Unit | 75 (3 pending) | Prompt compiler; session start and end; JWT and request authorization; audio buffer; Gemini HTTP client through its real Faraday stack; PDF export; model validations; workers |
| Integration | 28 | Postgres constraints; the Redis coverage channel's exact messages; the Rack pipeline (tenant, CORS, rate limits, WebSocket paths); Sidekiq jobs inline with strict JSON args |

Run: `docker compose exec -e RAILS_ENV=test api bundle exec rspec` (setup in the [README](../README.md)).

### Web (Vitest, Testing Library, MSW): 96 tests, 74 passing, 22 expected to fail

| Suite | Tests | Covers |
|---|---|---|
| Unit | 57 (9 expected to fail) | `parseLevel` and labels; `cn`; browser and OS detection; the speed test offline; token storage; the axios client; `usePolling`; level badge, confidence, skill card, override panel, comparison table, timer, connection status, error boundary |
| Functional | 25 (11 expected to fail) | Sign-in and the route guard; assessment list; portfolio review, generating, failed and retry, overrides; fit/gap; the candidate page from a link |
| Integration | 14 (2 expected to fail) | Live monitor over REST + WebSocket (7); contract against the running API (7, opt-in) |

Run: `docker compose exec web npm test`, or `cd web && npm install --include=dev && npm test`. The contract test needs
`API_INTEGRATION_URL`, `API_INTEGRATION_EMAIL` and `API_INTEGRATION_PASSWORD`, and must run from the host.

Without the API, the run is 67 passing, 22 expected to fail, 7 skipped.

### How the tests were checked

- **Every known-defect test fails for its stated reason.** `pending` (RSpec) and `it.fails` (Vitest) accept *any*
  failure, so each one was run as a normal test and its failure message read. Two early web runs "passed" for the
  wrong reason; see AI verification moments 7 and 8 in the [work log](00-work-log.md).
- **Deliberate faults were caught in every suite.** Examples: flipping the fit/gap verdict, the audio buffer's
  eviction bound, the prompt's skill order, the end message's keys, the login rate limit (API); not saving the login
  token, the timer's warning threshold, the polling hook's ref, the coverage message type (web). Each was reverted
  straight away; the recorded seeded fault test is still to do (below).
- **Stable:** the web suite passed repeatedly on the host and in the Docker container.

## Known defects pinned by tests

These turn into ordinary passing tests when the defect is fixed; the marker is removed in the same commit as the fix.

| Finding ([Step 3](03-problem-and-gap.md)) | API (`pending`) | Web (`it.fails`) |
|---|---|---|
| P0-1 unassessed skill stored as L1 | generator; functional journey | `parseLevel`; portfolio page |
| P0-2 cross-tenant read/write | export, override, fit/gap read | |
| P1-1 fit/gap counts unreached skills as gaps | engine; functional journey | |
| P1-2 web reads `required_level`, API sends `expected_level` | | comparison table; fit/gap page |
| P1-3 omitted skills vanish | generator | |
| P1-4 non-atomic writes wipe overrides | generator (×2) | |
| P1-5 unverified evidence quotes | generator | |
| P1-6 duplicate fit/gap jobs | fit/gap request | fit/gap page |
| P1-7 passwords in logs | auth request | |
| P1-8 list only loads page 1 | | assessment list |
| P1-9 every ended session reads "completed" | | assessment list |
| P1-10 invite link ends a session as `all_covered` | functional journey | |
| P1-11 broken link says "recorded" | | candidate page |
| P1-12 hardware check calls third parties | | candidate page |
| P1-13 PDF export crashes on overrides and emoji | PDF generator (×2) | |
| P2-1 portfolio load error is a blank page | | portfolio page |
| P2-3 Gemini retries never fire | HTTP client | |
| P2-4 no notice before the interview | | candidate page |
| P2-5 fit/gap summary leaves out "not assessed" | | comparison table |
| P2-6 list shows error and empty state together | | assessment list |
| P2-11 null level crashes the portfolio page | | `parseLevel` |
| P2-12 monitor misses an end during reconnect | | live monitor |
| P2-13 monitor gives up reconnecting silently | | live monitor |
| P3 (override label, optional reason, Edge, Android, offline upload) | | override panel (×2), hardware utils (×2), speed test |

## What's missing, in priority order

| # | What | Why it matters | Required by the brief? | Effort |
|---|---|---|---|---|
| 1 | **CI** (GitHub Actions running both suites on every push and PR) | Today the tests only protect the code when someone remembers to run them. CI makes every test above a gate, and shows the reviewer a green check on the PR. | Yes: "no CI" is part of the baseline to fix | Small |
| 2 | **Recorded seeded fault test** | Proves the suite catches a regression, with the history visible: break the logic on a scratch branch, show the failing run, revert. Best done in Step 5 on the P0-1 fix, so the fault is a regression of that fix. | Yes, explicitly | Small |
| 3 | **End-to-end in a real browser** (Playwright: real web + real API) | Nothing yet runs both services together in a browser. It can also capture every state at desktop and 375px, which the submission needs as screenshots. | Screenshots are | Medium |
| 4 | **Accessibility checks** (axe on the existing page tests, plus keyboard paths) | Catches missing labels, roles and keyboard access (P2-8: assessment cards can't be opened with a keyboard). "Poor UI/UX" is a disqualifier. | Indirectly | Small |
| 5 | **Migration up/down test** | Step 5's migration must be reversible and safe for existing rows; a spec that migrates down and up with data in place proves it. | Yes, for Step 5 | Small |
| 6 | **Coverage reports** (SimpleCov, Vitest coverage) | Shows what no test touches. Known gaps: assessment new/edit and invite pages, vacancy pages, transcript page, `SkillPicker`, `CustomSkillForm`, `CoverageAnalyzerWorker#apply_updates`. | No | Small |
| 7 | **Security scans** (`brakeman`, `bundle audit`, `npm audit`) | Cheap static checks for known vulnerable patterns and dependencies; fits into CI. | No | Small |

**Not testable yet:** the audio WebSocket middleware, the Gemini Live client, and the interviewer's behaviour (the
failure modes in PRD 01 §7). They need a live model on a paid tier (constraint C1), and a paid tier is also a
requirement before any real candidate data is sent (Step 2, Pillar 5).

**Recommended next step:** CI (1), since it turns everything above into a gate for the rest of the work.
