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

### API (RSpec): 293 examples, 0 failures, 6 pending

| Suite | Examples | Covers |
|---|---|---|
| Original harness | 83 (6 pending) | Coverage state engine, analyzer, map injector; portfolio generator; fit/gap engine; auth, tenancy and fit/gap requests; two models; portfolio worker |
| Functional | 14 (3 pending) | The PRD 02 journey from setup to export; model timeout and retry, non-JSON answer, failed narrative, invalid requests; known defects end to end |
| Unit | 75 (3 pending) | Prompt compiler; session start and end; JWT and request authorization; audio buffer; Gemini HTTP client through its real Faraday stack; PDF export; model validations; workers |
| Gap fill | 30 | Skill library model and endpoints; tenant resolver (JWT, header, Referer order, unknown scheme); coverage analyzer worker (applying updates, discovered skills and their cap of ten, auto-advancing stale partials, publishing); keeping or deleting skills on assessment update |
| Integration | 28 | Postgres constraints; the Redis coverage channel's exact messages; the Rack pipeline (tenant, CORS, rate limits, WebSocket paths); Sidekiq jobs inline with strict JSON args |

Run: `docker compose exec -e RAILS_ENV=test api bundle exec rspec` (setup in the [README](../README.md)).

### Web (Vitest, Testing Library, MSW): 178 tests, 149 passing, 22 expected to fail, 7 opt-in

| Suite | Tests | Covers |
|---|---|---|
| Unit | 108 (7 expected to fail) | `LevelRadio` and `SkillPicker` (search, pick, anchors); `parseLevel` (strict: 28 inputs) and labels; `cn`; browser and OS detection; the speed test offline and under the production CSP; token storage; the axios client; `usePolling`; level badge, confidence, skill card (with the not-assessed reason) and override panel (including rating an unrated skill), `ExpandableText`, comparison table (reasons, `data-label`), timer, connection status, error boundary |
| Functional | 56 (13 expected to fail) | Sign-in and the route guard; assessment list; creating an assessment (library and custom skills, validation, API errors) and editing it; inviting candidates (session states, named and unnamed links, copying); vacancy list, create and edit; transcript (turns, download, empty, error); portfolio review, the not-assessed summary, generating, failed and retry, load error, overrides; fit/gap, including the two-minute timeout and a failed fetch; the candidate page from a link |
| Integration | 14 (2 expected to fail) | Live monitor over REST + WebSocket (7); contract against the running API (7, opt-in) |

Run: `docker compose exec web npm test`, or `cd web && npm install --include=dev && npm test`. The contract test needs
`API_INTEGRATION_URL`, `API_INTEGRATION_EMAIL` and `API_INTEGRATION_PASSWORD`, and must run from the host.

Without the API, the run is 149 passing, 22 expected to fail, 7 skipped.

### How the tests were checked

- **Every known-defect test fails for its stated reason.** `pending` (RSpec) and `it.fails` (Vitest) accept *any*
  failure, so each one was run as a normal test and its failure message read. Two early web runs "passed" for the
  wrong reason; see AI verification moments 7 and 8 in the [work log](00-work-log.md).
- **Deliberate faults were caught in every suite.** Examples: flipping the fit/gap verdict, the audio buffer's
  eviction bound, the prompt's skill order, the end message's keys, the login rate limit (API); not saving the login
  token, the timer's warning threshold, the polling hook's ref, the coverage message type (web). Each was reverted
  straight away. The recorded seeded fault test is on `scratch/seeded-fault-clamp` (see the work log, sub-PR 3).
- **Stable:** the web suite passed repeatedly on the host and in the Docker container.

## Known defects pinned by tests

These turn into ordinary passing tests when the defect is fixed; the marker is removed in the same commit as the fix.

| Finding ([Step 3](03-problem-and-gap.md)) | API (`pending`) | Web (`it.fails`) |
|---|---|---|
| ~~P0-1 unassessed skill stored as L1~~ **fixed** (web in sub-PR 2, API in sub-PR 3) | generator; functional journey now pass | `parseLevel`; portfolio page now pass |
| ~~P0-2 cross-tenant read/write~~ **fixed** in sub-PR 1 | export, override, fit/gap read and both fit/gap writes now pass | |
| ~~P1-1 fit/gap counts unreached skills as gaps~~ **fixed** in sub-PR 4 | engine; functional journey now pass | |
| ~~P1-2 web reads `required_level`, API sends `expected_level`~~ **fixed** in sub-PR 5 | | comparison table; fit/gap page now pass |
| ~~P1-3 omitted skills vanish~~ **fixed** in sub-PR 3 | generator now passes | |
| ~~P1-4 non-atomic writes wipe overrides~~ **fixed** in sub-PR 3 | generator (×2) now pass | |
| ~~P1-5 unverified evidence quotes~~ **fixed** in sub-PR 3 | generator now passes | |
| ~~P1-6 duplicate fit/gap jobs~~ **fixed** (web in sub-PR 5: one request per visit; server lock in sub-PR 7) | fit/gap request now passes | fit/gap page now passes |
| ~~P1-7 passwords in logs~~ **fixed** in sub-PR 6 | auth request; four request-log specs now pass | |
| P1-8 list only loads page 1 | | assessment list |
| P1-9 every ended session reads "completed" | | assessment list |
| P1-10 invite link ends a session as `all_covered` | functional journey | |
| P1-11 broken link says "recorded" | | candidate page |
| P1-12 hardware check calls third parties, and fails under the production CSP | | candidate page; speed test under CSP |
| P1-13 PDF export crashes on overrides and emoji | PDF generator (×2) | |
| P1-14 removing a skill on an edit form doesn't delete it | assessment update shows `_destroy` works (passing) | assessment form; vacancy form |
| ~~P2-1 portfolio load error is a blank page~~ **fixed** in sub-PR 5 | | portfolio page now passes |
| P2-3 Gemini retries never fire | HTTP client | |
| P2-4 no notice before the interview | | candidate page |
| ~~P2-5 fit/gap summary leaves out "not assessed"~~ **fixed** (discovered-skill level in sub-PR 2, summary in sub-PR 5) | | comparison table now passes |
| P2-6 list shows error and empty state together | | assessment list; vacancy list |
| ~~P2-11 null level crashes the portfolio page~~ **fixed** in sub-PR 2 | | `parseLevel` now passes |
| P2-12 monitor misses an end during reconnect | | live monitor |
| P2-13 monitor gives up reconnecting silently | | live monitor |
| P2-14 a level label on the second skill sets the first | | `LevelRadio` |
| P2-15 skill picker drops the taxonomy skill id | | `SkillPicker` |
| P2-16 required fields fail silently | | assessment form (custom skill); vacancy form (role title) |
| P2-17 edit and invite pages hide a load failure | | assessment form; invite page |
| P3 (override label, optional reason, Edge, Android, offline upload) | | override panel (×2), hardware utils (×2), speed test |

## What's missing, in priority order

| # | What | Why it matters | Required by the brief? | Effort |
|---|---|---|---|---|
| 1 | **CI** (GitHub Actions running both suites on every push and PR) | Today the tests only protect the code when someone remembers to run them. CI makes every test above a gate, and shows the reviewer a green check on the PR. | Yes: "no CI" is part of the baseline to fix | Small |
| 2 | ~~**Recorded seeded fault test**~~ **done** (sub-PR 3) | Proves the suite catches a regression, with the history visible: break the logic on a scratch branch, show the failing run, revert. Best done in Step 5 on the P0-1 fix, so the fault is a regression of that fix. | Yes, explicitly | Small |
| 3 | **End-to-end in a real browser** (Playwright: real web + real API) | Nothing yet runs both services together in a browser. It can also capture every state at desktop and 375px, which the submission needs as screenshots. | Screenshots are | Medium |
| 4 | **Accessibility checks** (axe on the existing page tests, plus keyboard paths) | Catches missing labels, roles and keyboard access (P2-8: assessment cards can't be opened with a keyboard). "Poor UI/UX" is a disqualifier. | Indirectly | Small |
| 5 | **Migration up/down test** | Step 5's migration must be reversible and safe for existing rows; a spec that migrates down and up with data in place proves it. | Yes, for Step 5 | Small |
| 6 | **Coverage reports in CI** (SimpleCov, `@vitest/coverage-v8`) | Measured once by hand (Ruby's `Coverage`, and the Vitest provider installed without saving): lines went from 69.7% to 71.6% (API) and 50.6% to 68.3% (web) with the gap-fill tests, which closed the gaps listed here before. What's left untouched is the audio path (below), `SignupPage` (unreachable, P3) and `StatusIndicator`/`VoiceBars`; on the API, `vacancies_controller` is at 76%. Adding the gems/packages would make it a CI report. | No | Small |
| 7 | **Security scans** (`brakeman`, `bundle audit`, `npm audit`) | Cheap static checks for known vulnerable patterns and dependencies; fits into CI. | No | Small |

**Not testable yet:** the audio WebSocket middleware, the Gemini Live client, and the interviewer's behaviour (the
failure modes in PRD 01 §7). They need a live model on a paid tier (constraint C1), and a paid tier is also a
requirement before any real candidate data is sent (Step 2, Pillar 5).

**Recommended next step:** CI (1), since it turns everything above into a gate for the rest of the work.
