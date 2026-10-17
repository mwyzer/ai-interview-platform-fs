# Work log

A running record of what was done, in order, so the report can tell the journey step by step. Each entry lists
what changed, why, how it was verified, and where it lives.

Findings use the brief's format: severity, a one-line impact, and whether it's a **missing specification** (never
defined) or a **defective implementation** (defined but broken).

| Date | Step | What | Branch / commit |
|---|---|---|---|
| 2026-10-15 | 1 | Docker Compose dev environment; Puma pid fix | `chore/docker-dev-setup` · `b4ec762` |
| 2026-10-15 | 1 | Seeded dev admin so `/login` works | `chore/docker-dev-setup` · `6ef652d` |
| 2026-10-15 | 1 | Setup findings written up | `chore/docker-dev-setup` · `52c36d6` |
| 2026-10-15 | 1 | Own repo created (`mwyzer/ai-interview-platform`, private); `upstream` kept for the final PR | n/a |
| 2026-10-15 | 3 | Product spec read, code traced, findings reproduced and written up | `docs/step-3-gap-analysis` · `076cca4` |
| 2026-10-15 | 3 | Setup log renamed to this work log; AI verification moments added | `docs/step-3-gap-analysis` · `5e19594` |
| 2026-10-15 | 1/3 | RSpec harness + 67 passing specs + 11 pending specs that pin the Step 3 defects | `test/rspec-harness` · `630ce38`, `23eeee8`, `172eaf8` |
| 2026-10-15 | 1 | Gemini API key configured locally; default model IDs found retired | `test/rspec-harness` · `3e644c7` (log only; key never committed) |
| 2026-10-15 | 1 | `.gitattributes`: LF for `api/bin/*` and `db/schema.rb` | `test/rspec-harness` (see 1.5) |
| 2026-10-15 | 3 | Assessment list findings added (P1-8, P1-9, P2-6..P2-9) | `docs/step-3-gap-analysis` · `4f746a8` |
| 2026-10-15 | 2 | Domain immersion: 5 pillars, UU PDP mapping, Gemini tier constraint | `docs/step-2-domain-immersion` · `b80a6de` |
| 2026-10-15 | 3 | Candidate-link findings (P1-10, P2-10, C6), reproduced over HTTP | `docs/step-3-gap-analysis` · `b32f1ec` |
| 2026-10-15 | 4 | Strategy: 30 acceptance criteria, options A/B/C compared, Option B chosen | `docs/step-4-strategy` · `4b363ec` |
| 2026-10-15 | 3 | Findings from the functional tests added (P1-11, P1-12, P2-11) | `docs/step-3-gap-analysis` · `1c36a91` |
| 2026-10-15 | 4 | Delivery plan: web null-level fix lands before the API change | `docs/step-4-strategy` · `814072d` |
| 2026-10-16 | 1/5 | Testing overview: layers, inventory, known-defect pins, and the gaps in priority order ([testing.md](testing.md)) | `test/integration-tests` |
| 2026-10-16 | 3 | Findings from the unit and integration tests added (P1-13, P2-12, P2-13, P3, C7) | `docs/step-3-gap-analysis` · `93101ac` |
| 2026-10-16 | 1/5 | Integration tests: Postgres, Redis channel, Rack pipeline, Sidekiq inline; live monitor REST + WebSocket; API contract | `test/integration-tests` · `164d12c`, `b0058f9` |
| 2026-10-16 | 1/5 | Unit tests: API services, clients, auth, models, workers; web utils, client, hooks, components | `test/unit-tests` · `f1aeec2`, `0a96f4d` |
| 2026-10-15 | 1/5 | Functional tests: API journeys over HTTP; web harness (Vitest, Testing Library, MSW) and page tests | `test/functional-tests` · `ad6c091`, `44474e3`, `d65e3e9` |
| 2026-10-16 | 1 | WebSocket middlewares eager-load correctly; CI runs both suites on every push and PR | `ci/github-actions` · `4c2e510`, `bd51d00` |
| 2026-10-16 | 6 | Report draft: print-styled HTML built to PDF, Mermaid diagrams, UU PDP privacy roadmap | `docs/report` · `304941a`, `5260958`, `bfb5f86` |
| 2026-10-16 | 3 | P1-12 widened: under the production CSP the hardware check can never pass; C8 escalated | `docs/report` · `1708513` |
| 2026-10-16 | 6 | Draft PR opened on `rakamindev` from the public fork `mwyzer/ai-interview-platform-fs` | [PR #160](https://github.com/rakamindev/ai-interview-platform/pull/160) |
| 2026-10-16 | 5 | Sub-PR 1: tenant scoping (P0-2), including two fit/gap write routes not pinned before | `fix/tenant-scoping` · `d7e58ac`, `ecd3124` |
| 2026-10-16 | 5 | Sub-PR 2: the web shows a skill with no level as not assessed (AC-23, P2-11, part of P2-5) | `fix/web-null-level` · `8292c0a`, `79328eb`, `9907398` |
| 2026-10-16 | 5 | Sub-PR 3: migration + generator: "not assessed" is stored, never a fabricated level (P0-1, P1-3, P1-4, P1-5; AC-1..12, 17..21) | `feat/not-assessed-generator` · `4a4f5ca`, `69aebe4`, `8cb0a9d`, `841fb35`, `5192358` |
| 2026-10-16 | 5 | Seeded fault test: the clamp put back on purpose, caught by 13 specs, reverted | `feat/not-assessed-generator` · `27f49f3`, `5b34128` |
| 2026-10-16 | 5 | Sub-PR 4: fit/gap reports not-assessed skills as unknowns, not gaps (P1-1, AC-13..16) | `feat/fitgap-not-assessed` · `bb4b797`, `dedee56`, `054c6b9` |
| 2026-10-16 | 5 | Sub-PR 5: portfolio and fit/gap screens show "not assessed" with the reason; error, retry, long-text and 375px states (P1-2, P2-1, P2-5; AC-20, 22, 24..30) | `feat/not-assessed-screens` · `5e30533`, `342adec`, `c40c78d`, `8e0a650` |
| 2026-10-16 | 6 | Report: Step 5 filled in, with screenshots of every state at 1280px and 375px | `feat/not-assessed-screens` |
| 2026-10-16 | 1 | No password in the repo: Postgres, Redis and the dev admin read theirs from a gitignored `.env` (`.env.example`); Postgres and Redis bind to 127.0.0.1; CI's throwaway database uses no password. Prompted by GitGuardian flagging the dev DB password on PR #160 | `feat/not-assessed-screens` · `ad82538`, `61735da` and the next commit |

Hashes are current as of the last rebase of the branch stack; a rebase changes the hashes of every branch above
the one that changed.

**Branches.** They're stacked, so each contains the ones before it: `main` → `chore/docker-dev-setup` →
`docs/step-3-gap-analysis` → `test/rspec-harness` → `docs/step-2-domain-immersion` → `docs/step-4-strategy` →
`test/functional-tests` → `test/unit-tests` → `test/integration-tests` → `ci/github-actions` → `docs/report` →
`fix/tenant-scoping`. Up to `ci/github-actions` they're on `origin` (`github.com/mwyzer/ai-interview-platform`,
private). The submission branch is `fullstack-case-study` on the public fork `mwyzer/ai-interview-platform-fs`,
the head of draft PR #160. The P1-12/C8 update was committed on `docs/report` rather than on
`docs/step-3-gap-analysis`, to avoid rebasing the whole stack.

**Local-only changes** (gitignored, never committed): `api/config/application.yml` (secret key base, Gemini key,
model IDs), `web/.env` (dev JWT), and synthetic test data in the local database.

---

## Step 1: Setup and local exploration

### 1.1 API server crashes on boot in a fresh checkout

- **Severity:** P1 (blocks local setup; no production impact)
- **Impact:** a new developer's API never comes up, so nobody can use the product locally until they find the cause.
- **Category:** defective implementation (dev environment)
- **Symptom:** migrations and seeds succeed, then Puma exits with
  `Errno::ENOENT: No such file or directory @ rb_sysopen - tmp/pids/server.pid`.
  `docker compose ps` still showed the container as "Up", which hid the failure.
- **Cause:** `config/puma.rb` writes its pid file to `tmp/pids/server.pid`. `tmp/*` is gitignored, so a fresh
  checkout has no `tmp/pids/` directory, and the `./api:/app` bind mount hides anything the image would have created.
- **Fix:** the API command in `docker-compose.yml` now runs `mkdir -p tmp/pids` before removing a stale pid file.
- **Verified:** Puma logs `Listening on http://0.0.0.0:3001`; an unauthenticated `GET /api/v1/assessments` returns 403
  and an authenticated one returns 200.

### 1.2 Nobody can log in: the seeds create no users

- **Severity:** P1 (the login screen is a dead end on any fresh environment)
- **Impact:** an assessor opening `/login` has no account to use. The only workaround is minting a JWT in the
  Rails console and pasting it into `web/.env`, which non-developers (product reviewers, QA) can't do.
- **Category:** missing specification. `POST /api/v1/auth/login` exists and accepts only `role == 'admin'`, but no
  part of the codebase or docs says how the first admin account comes to exist. The seeds only print instructions
  for minting tokens by hand.
- **Fix:** `api/db/seeds.rb` now creates a dev admin, `admin@example.com` / `password123`, only if it's missing
  (re-running the seeds never resets its password). The seed output prints the credentials.
- **Verified:** seeds ran twice, once with the user present (skipped) and once after deleting it (recreated).
  `POST /api/v1/auth/login` with these credentials returns 200.
- **Note:** this is a development credential only. Production still needs a defined way to create the first
  admin, for example an invite flow or a one-off task. Open question for the Tech Lead (constraint signal).

### 1.3 Smaller observations

- **Line endings:** on a Windows checkout, Ruby warns `shebang line ending with \r` for scripts in `api/bin/`, and
  `rails db:migrate` rewrites `db/schema.rb` with different line endings. A `.gitattributes` entry with `eol=lf`
  would stop both.
- **No lockfile:** `web/` has no `package-lock.json`, so dependency versions aren't pinned between installs.
- **Wrong default port:** `web/.env.example` points to the API on port 3000, but the API serves on 3001.
- **Empty Postgres is fine:** the seeds create `public.organizations` themselves, so the platform runs without the
  `rakamin-api` database it normally shares.

### 1.4 Gemini access: the default models no longer exist

- **Where the key lives:** `api/config/application.yml` (gitignored, loaded by Figaro). It's never committed and
  never printed in logs or scripts.
- **Severity:** P1 (constraint C1 confirmed). With the repo's defaults, every model call fails, so no interview,
  coverage analysis or portfolio can run.
- **Category:** defective implementation (configuration)
- **Found:** listing models with the key returned HTTP 200, but all three configured IDs are gone:
  `gemini-2.0-pro-001`, `gemini-2.0-flash-001` and `gemini-2.0-flash-live-001`. `gemini-2.5-*` is still listed,
  but `generateContent` answers 404 "no longer available to new users". Pro models (`gemini-3.1-pro-preview`,
  `gemini-4-argon`) answer 429: the key's tier has no Pro quota.
- **Local config now:** `GEMINI_PRO_MODEL` and `GEMINI_FLASH_MODEL` = `gemini-3.5-flash`; `GEMINI_LIVE_MODEL` =
  `gemini-3.1-flash-live-preview` (already the code default in `Gemini::LiveClient`, but overridden by the old value
  in the yml).
- **Assumption to state in the report:** in local development, the portfolio generator (N10) runs on a Flash model
  instead of Pro because of quota. Ratings produced locally aren't representative of Pro quality.
- **Verified:** through the app's own `Gemini::HttpClient`, the Pro slot call returned `{"ok"=>true}`. A second call
  to the same model seconds later returned **503 "high demand"** and was not retried. That's live confirmation of
  P2-3 (Faraday never retries POST).
- **Follow-up for the Tech Lead:** model IDs should come from configuration with a startup check, not hardcoded
  defaults that go stale; and which tier or quota production runs on.

### 1.5 Line endings fixed at the source

- **Problem** (first noted in 1.3): on a Windows checkout, `api/bin/*` had CRLF endings, so Ruby warned
  `shebang line ending with \r` on every command in the container. Every `rails db:migrate` also rewrote
  `db/schema.rb` with LF endings, leaving a permanent fake change in `git status`.
- **Category:** defective implementation (repo configuration). P3, developer friction only.
- **Fix:** a root `.gitattributes` pins `api/bin/*` and `api/db/schema.rb` to `eol=lf`, and the affected files were
  checked out again. Scoped to just these paths on purpose: a repo-wide rule would renormalize every file and
  bury real changes in a huge diff.
- **Verified:** `file` reports no CRLF in `api/bin/*` or `db/schema.rb`, and `git status` is clean after a migrate
  run.

---

## Step 3: Problem and gap analysis

Full write-up: [03-problem-and-gap.md](03-problem-and-gap.md).

- **Read:** the product spec in the wiki (PRD 01, AI interview behavior; PRD 02, end-to-end simulation), then traced
  nodes N1–N14 to the code.
- **Reproduced:** [evidence/repro_findings.rb](evidence/repro_findings.rb) runs the real `Portfolios::Generator` and
  `FitGap::Engine` against the local database, with the model response stubbed. It uses synthetic data only.
- **HTTP checks:** tokens for two organizations (`test-corp`, `other-corp`) confirmed the cross-tenant read and write.
  Sidekiq and Rails logs confirmed the duplicate-job race and the plaintext passwords.
- **Result:** 2 P0, 7 P1, 5 P2 findings, plus 5 constraint signals. The proposed Step 4 focus is the post-interview
  result pipeline.
- **Test data left in the local DB:** assessment 1, vacancy 1, sessions 1–4, organization "Other Corp". Wipe it with
  `docker compose down -v`.

---

## Test harness (API)

The brief's baseline: "RSpec currently has no specs written." The gems were already in the Gemfile, but there was
no `spec/` folder, no helpers and no factories.

**Added** (`api/spec/`):

- `rails_helper.rb` / `spec_helper.rb`: transactional fixtures, random order, `Sidekiq::Testing.fake!` (jobs are
  asserted, not run), and Rack::Attack disabled so throttling can't make specs order-dependent.
- `factories.rb`: synthetic data only (Faker names, `example.test` emails), never real candidate data.
- `support/fake_gemini.rb`: stands in for `Gemini::HttpClient`. It returns a canned response or raises a given
  error, and records prompts. **No spec calls the network.**
- `support/auth_helpers.rb`: signs a JWT for a given organization and role.

**What's covered** (78 examples, run in ~25 s):

| Area | What the specs pin down |
|---|---|
| `Coverage::StateEngine` | Forward-only transitions; the PRD hard rule (no advance past `initiated` with < 2 probes); jumps walked step by step |
| `Coverage::Analyzer` | No model call without transcript; probe increment capped at +1; covered skills frozen; unknown IDs ignored; prose instead of JSON handled; transcript marked untrusted in the prompt |
| `Coverage::MapInjector` | `all_covered?` rules; priority of the least-covered skill; pacing buckets; time never negative |
| `Portfolios::Generator` | Skills stored and status complete; discovered skills separate; evidence capped at 3; regeneration replaces skills; **model timeout → `failed` with the error, re-raised for Sidekiq** |
| `FitGap::Engine` | match / gap / exceed / not assessed with delta; override beats the AI level; match by skill ID then by label; **model failure → fallback narrative**; one report per portfolio and vacancy |
| Auth (requests) | Login: case-insensitive email, same error for a wrong password and an unknown email, non-admins refused; 401 for no token, a forged token or an expired token; 403 for the wrong role |
| Tenant isolation (requests) | The owner can read; another organization gets 404 for assessments, sessions, portfolios and vacancies; listings only show the caller's rows |
| Fit/gap (requests) | 202 + one job when missing; stored report returned without a new job; 422 when the portfolio isn't complete or the vacancy is missing |
| Models / worker | Invite token 64 hex characters and unique; tenant scoping and auto-assignment; level and confidence validation; worker skips missing sessions and marks `failed` once retries are exhausted |

**Known defects pinned as `pending`.** Each Step 3 finding that the backend can prove is written as a spec of the
*correct* behavior, marked `pending`. RSpec runs these and expects them to fail. When a fix lands, RSpec reports
"Expected pending ... to fail", and the marker is removed. That makes them the failing tests for Step 5.

| Spec | Fails today because |
|---|---|
| P0-1 unrated skill must not become L1 | `expected: nil, got: 1` |
| P0-1/P1-1 unreached skill is `not_assessed` in fit/gap | `expected: "not_assessed", got: "gap"` |
| P0-2 export of another org's portfolio → 404 | `but it was 200` |
| P0-2 override of another org's rating → 404 | `but it was 201` |
| P0-2 read another org's fit/gap → 404 | `but it was 200` |
| P1-3 every configured skill accounted for | `missing: ["Communication", "System Design"]` |
| P1-4 no half-written portfolio | 1 skill left behind after the failure |
| P1-4 overrides survive regeneration | `expected: 1, got: 0` |
| P1-5 invented quote dropped | quote kept |
| P1-6 one job while generating | `expected: 1, got: 2` |
| P1-7 passwords filtered from logs | `got: "correct-horse-battery"` |

Each pending failure was checked to fail **for the stated reason**, not because of a setup error (see AI
verification moment 5).

**Not covered yet:** the web app (no test runner; brief baseline), the audio WebSocket middleware and the Gemini Live
client (they need a live model; constraint C1), and the PDF export. The seeded fault test (break logic on a scratch
branch, show the suite catch it, revert) belongs to Step 5.

**Run:** see the "Running the API tests" section of the root `README.md`.

## Integration tests (API and web)

Unit tests check a piece alone; functional tests check a user's path with the network faked. Integration tests check
the joins to real infrastructure, and the contracts between the two services.

**API** (`api/spec/integration/`, 28 examples). Full suite: 195 examples, 0 failures, 17 pending.

| Spec | Runs against | What it pins down |
|---|---|---|
| `database_constraints_spec.rb` | Postgres | Levels kept in 1..5 and required even with validations skipped (no "not assessed" state: the schema side of P0-1); enum values; one portfolio per session, one override per skill, one report per portfolio and vacancy (why concurrent fit/gap jobs crash, P1-6), one coverage row per skill; unique invite tokens; cascading deletes |
| `coverage_channel_spec.rb` | Redis pub/sub | The exact `session_status` (start, end) and `coverage_update` messages on `coverage:<id>`, the contract the live monitor reads; nothing published on a second end |
| `request_pipeline_spec.rb` | Rack stack | Tenant from the signed token, not a header; no tenant leaking between requests; candidate link with no tenant; CORS preflight; WebSocket paths pass plain HTTP through; login and invite-link rate limits answer a JSON 429 |
| `job_pipeline_spec.rb` | Sidekiq inline, strict JSON args | One request carries through to the generated portfolio, the compiled prompt, or the rebuilt fit/gap report |

**Web** (`web/src/test/integration/`):

- `live-monitor.test.tsx` (5 passing, 2 `it.fails`): the real page, hook and services against REST and an MSW
  WebSocket sending the API's exact messages. Auth goes over the socket first; coverage and discovered skills
  update live; the end of the session shows with its reason; the transcript polls from the last turn; ending the
  session goes over REST and opens the portfolio.
- `api-contract.test.ts` (7 passing, opt-in): the web services against the running Rails API, with real HTTP and a
  real CORS preflight from the web origin. It checks the fields and types the screens read. It only creates an
  assessment without sessions and a vacancy, and deletes both; the API log shows the inserts and deletes, and none
  were left behind.

**Checked:** each new `it.fails` test was run as a normal test and fails on its final assertion. Deliberate faults
were caught: renaming a key in the end message and raising the login limit (API), and renaming the coverage
message type in the hook (web).

**Found by the integration tests** (added to Step 3 as P2-12, P2-13 and C7):

- **A session that ends while the monitor is reconnecting never shows as ended.** The end only reaches the monitor
  as the initial `coverage_update` (with `status: "ended"`) after it reconnects, and the hook only reacts to
  `session_status`. The assessor keeps watching a "live" interview that is over. P2.
- **The monitor gives up silently.** After three failed reconnects (1, 2 and 4 s) it stops trying, and the header
  says "Reconnecting..." forever, with no retry. P2.
- **CORS allows any origin.** `ALLOWED_ORIGINS` is `"*"` in the sample config, so any website can call the API
  from a signed-in assessor's browser if it gets a token. It has to be the web app's origin in production.
  Constraint signal.
- **Inside Docker, the web container can't reach the API by name**: Rails' development host check answers 403 for
  Host `api`. Only the contract test is affected; it runs from the host.

## Unit tests (API and web)

Unit tests check one piece on its own, with its edges spelled out. They're the fastest to run and the most precise
about *where* something broke.

**API** (75 new examples, 3 `pending`). Full suite: 167 examples, 0 failures, 17 pending.

| Area | What the specs pin down |
|---|---|
| `Assessments::SystemPromptCompiler` | Every skill and its five anchors in display order; scope lines only when written; the assessment's language, English when unset; PRD rules present; long multi-line anchors intact |
| `Sessions::EndHandler` | Reason, end time and duration recorded; one portfolio, one job; a second end changes nothing; `error` upgraded by a later manual end but never the reverse; unknown reason → `manual_assessor`; still ends when Redis is down |
| `Sessions::StartHandler` | Activates the session; one `not_yet` row per skill in order; a reconnect doesn't reset coverage |
| `JsonWebToken`, `AuthorizeApiRequest` | Round trip; default and caller-set expiry; expired, forged, `alg: none` and garbage tokens refused; role checks for `:assessor`, `:any` and exact roles |
| `AudioRingBuffer` | Order and size; evicts oldest past capacity; drops an oversized chunk; time slicing; stores a frozen copy |
| `Gemini::HttpClient` | Runs the real Faraday stack (retry included) with Faraday's test adapter: key in a header, not the URL; JSON, fenced JSON and prose answers; blocked prompt; 429, 500, timeout and connection errors mapped |
| `Exports::PdfGenerator` | Renders a PDF; fit/gap on its own page only when a report exists; empty portfolio; very long text flows over pages; Indonesian text and typed punctuation |
| Models, workers | Validations for every model with rules; an assessment with sessions can't be deleted; prompt and fit/gap workers skip missing records and re-raise real failures |

**Web** (57 new tests, 9 `it.fails`), next to their source files: `parseLevel` and labels, `cn`, browser and OS
detection, the speed test offline, token storage, the axios client (bearer token, envelope unwrapping, sign-out on
401 but not 500), `usePolling` with fake timers, and the level badge, confidence indicator, skill card, override
panel, comparison table, interview timer, connection status and error boundary. Full suite: 82 tests, 62 passing,
20 expected to fail.

**Checked:** every new `pending` and `it.fails` test was run as a normal test and fails on its assertion for the
stated reason. Deliberate faults were caught: the buffer's eviction bound and the prompt's skill order (API), the
timer's warning threshold and the polling hook's latest-function ref (web).

**Found by the unit tests** (added to Step 3 as P1-13 and two P3 notes):

- **The PDF export crashes for any portfolio with an override.** The generator's own text, `AI: L2 → Override: L4`,
  uses `→`, which Prawn's built-in fonts (Windows-1252 only) can't encode. Evidence quotes with emoji or non-Latin
  script crash it too. The assessor gets a 500 instead of the document they share with the hiring manager. Likely
  P1: overriding is the human-in-the-loop step, so the most-reviewed portfolios are the ones that can't be exported.
- **An offline connection is reported as 4 Mbps upload.** When every upload attempt fails, the speed test returns a
  "conservative fallback" of 0.5 MB/s, exactly the minimum, so the upload line shows green. P3: ping still fails the
  check overall.
- **Edge is shown as Chrome, Android as Linux** on the hardware check. P3: display only.


Unit and request specs check one piece at a time. Functional tests check a whole path the way a user takes it,
so they also catch breaks *between* pieces: the seam between `api/` and `web/`, and the hand-off between a request
and the background job it queues.

**API** (`api/spec/functional/`, 14 examples):

- `assessor_journey_spec.rb`: the PRD 02 journey in one example. Sign in through the real login endpoint, create
  an assessment, compile its prompt, invite, open the candidate link, run the interview, end it, generate the
  portfolio, review it, create a vacancy, run fit/gap, override a rating (the stale report is rebuilt with it),
  export JSON. The evidence quotes are verbatim candidate turns, so the journey stays valid once quotes are
  verified (P1-5).
- `failure_paths_spec.rb`: a model timeout marks the portfolio failed and a retry recovers it; a non-JSON answer
  fails cleanly; a failed narrative call still yields a report with the fallback text; an invalid time limit, an
  unknown end reason, a double end, a bad invite token and a missing auth token are all refused.
- `known_defects_journey_spec.rb` (`pending`): P0-1 and P1-1 through HTTP after a candidate ends at minute 6, and
  P1-10 (the invite link ends a never-started session as `all_covered`).
- Support: `scripted_gemini.rb` answers by what the prompt asks for (portfolio vs narrative), because each service
  builds its own client. `functional_helpers.rb` signs in, runs queued jobs, and stands in for the audio
  WebSocket by persisting what it would (start, turns, coverage).
- The live WebSocket interview itself is still out of reach (constraint C1).

**Web** (`web/src/test/`, 25 tests):

- Harness: Vitest 5, Testing Library, MSW 3, jsdom. `renderApp(url)` renders the whole app with the same error
  boundary as `main.tsx`. Only the network is faked. Fixtures mirror the Rails serializers' exact output.
- Tests: signing in and the route guard; the assessment list and its empty state; portfolio review (levels,
  evidence, discovered skills, generating then ready, failed then retry, saving an override, a failed save);
  fit/gap (comparison, narrative, discovered skills, generating then ready); the candidate page from an invite link.
- Known defects as `it.fails` (11): P0-1, P1-2, P1-6, P1-8, P1-9, P2-1, P2-4, P2-5, P2-6, plus two found by
  these tests (below).

**Checked:** every `pending` and `it.fails` test was run as a normal test and fails on its assertion for the
stated reason. A deliberate fault in each suite was caught: flipping the fit/gap verdict (API) and not saving the
login token (web). The web tests passed three runs in a row on the host and two inside the Docker container.

**Found by the functional tests** (added to Step 3 as P2-11, P1-11 and P1-12, in this order):

- **A null `ai_level` crashes the whole portfolio page.** `parseLevel(null)` calls `.replace` on `null`, and the
  page becomes "Something went wrong." So the API half of Option B can't ship before the web half.
- **A broken invite link says the interview "has been recorded".** `InterviewPage` treats any error loading the
  link as "interview complete".
- **The hardware check contacts third parties before the interview.** Unless `VITE_SPEED_TEST_*` is set, the
  candidate's browser fetches from google.com, cdn.jsdelivr.net and unpkg.com and uploads 0.5 MB to httpbin.org or
  postman-echo.com, several times (12 requests in the first 1.5 s in the test), with no notice. The API already
  has `/api/v1/speed_test`. That's a privacy issue (UU PDP Art. 5 and 21: the candidate isn't told who receives
  their data) and a reliability one (networks that block those hosts fail the check).
- **Under the production CSP, the same check blocks every candidate** (added 2026-10-16). `web/vercel.json`
  limits `connect-src` to our own origin and the API. Running the real module in headless Chrome with that header:
  all 30 third-party requests blocked, download 0 Mbps, ping 999 ms, `passed: false`, so Start stays disabled. With
  ping and upload pointed at our own origin it still fails, because the download test has no override. Pinned by
  an `it.fails` unit test; tracked as P1-12 (possibly P0) and constraint C8.

**Environment notes:** the dev image now uses Node 22 (Vitest 5, MSW 3 and jest-dom 7 need it; Node 20 is past end
of life). This machine's shell sets `NODE_ENV=production`, so `npm install` skips devDependencies unless given
`--include=dev`.

---

## Step 5: Implementation

### Sub-PR 1: tenant scoping (P0-2)

**What was wrong.** `Portfolio`, `PortfolioSkill` and `FitGapReport` have no `tenant_id`; they belong to a tenant
through their session. Five routes looked them up with a bare `find`: export, override, the fit/gap read, and two
that Step 3 hadn't pinned, `POST fitgap` and `POST regenerate_fitgap`. With its own vacancy, another company could
queue a fit/gap of someone else's candidate (202) and then read it, or delete and regenerate a report.

**Fix.** A `for_current_tenant` scope on `Portfolio` and `PortfolioSkill` that joins through the session and filters
on `sessions.tenant_id`; every controller lookup uses it. `Current.tenant_id` raises when no tenant is set, so a
lookup without one fails closed. No migration: adding and backfilling `tenant_id` on a database shared with
`rakamin-api` (C3) would be bigger and harder to reverse for the same guarantee. The fit/gap worker still uses
`Portfolio.find`; it runs outside a request, and its ids only come from the scoped controllers.

**Tests first.** Two new cross-tenant specs use company B's own vacancy, so the portfolio lookup is the only thing
that can stop them. Three owner specs make sure a fix that returns 404 for everyone can't pass. Against the unfixed
code (`d7e58ac`), the five cross-tenant examples failed on their status assertions (200, 201, 202, 202, 200) and the
owner's passed. After the fix (`ecd3124`): 11/11, and the full suite is 200 examples, 0 failures, 14 pending.

**Checked over HTTP** against the dev API, repeating the Step 3 reproduction with an Other Corp token:

| Request | Step 3 | Now |
|---|---|---|
| Other Corp `GET portfolios/1/export` | 200, full portfolio | 404 |
| Other Corp `POST portfolio_skills/1/override` | 201, level set to L5 | 404 |
| Other Corp `GET portfolios/1/fitgap/1` | 200 | 404 |
| Test Corp `GET portfolios/1/export` (owner) | 200 | 200 |

The L5 override still on skill 1 in the dev database is left over from the Step 3 reproduction (synthetic data).
Existing cross-tenant writes in a real database couldn't be told apart from legitimate ones: overrides store
`overridden_by` but not the tenant. That's worth raising if this ever ran with more than one real tenant.

### Sub-PR 2: the web tolerates a missing level (AC-23)

**Why before the API.** Sub-PR 3 lets the API send `ai_level: null`. Today the web would crash on it (P2-11), so
the screen has to survive a null level before one can arrive.

**What changed.** `parseLevel` returns a level only for a whole number from 1 to 5 (`3`, `"3"`, `"L3"`, `" l3 "`)
and `null` for anything else; it used to return 1 for anything unreadable and throw on `null`. Callers treat `null`
as not assessed:

- The skill card shows a neutral, dashed **Not assessed** badge (`NotAssessedBadge`), and no confidence line:
  confidence describes the AI's rating, so there's none without one.
- The override panel offers **Add rating** with no level preselected, and Save stays disabled until the assessor
  picks one. Once rated, the summary reads "Not assessed → L2".
- The fit/gap page's discovered skills read "L2 (low confidence)" or "not assessed", instead of a bare `2` or
  `null (confirmed)`.
- Types now match the API: `ai_level: number | string | null`; confidence and summary can be `null`.

The reasons ("not reached", "not enough evidence") and the summary line come with sub-PR 5, once the API sends
them.

**Tests first** (`8292c0a`): 20 unreadable inputs for `parseLevel`, 4 component tests, 1 fit/gap page test, all
as `it.fails`. Each was run as a normal test against the old code and failed for the stated reason (`expected 1 to
be null`, the `null.replace` crash, `(confirmed)`). After the fix (`9907398`) 29 markers come off, including the
older P0-1, P2-11 and P2-5 pins. Web: 104 passing, 19 expected to fail, 7 skipped without the API; `tsc` clean.
One of the new tests had a wrong expectation, fixed in its own commit (`79328eb`); see AI verification moment 9.

**Not yet checked in a browser.** The API can't store a null level until sub-PR 3, so the screenshot of this state
comes with sub-PR 3 or 5.

### Sub-PR 3: the generator stores "not assessed" (P0-1, AC-1..AC-12, AC-17..AC-21)

**Commits, in order.** Existing specs whose expectations the design changes, each with its reason (`4a4f5ca`);
new specs for every AC, pending (`69aebe4`); the migration (`8cb0a9d`); four more spec expectations, checked against
the old code with the implementation stashed (`841fb35`, 256 examples, 0 failures, 66 pending); the implementation
(`5192358`), where 46 pending specs flip to passing. API: 256 examples, 0 failures, 8 pending, all outside this change.

**How a skill is decided** (`Portfolios::SkillResolver`, pure Ruby): coverage first (never probed → `not_reached`,
whatever the model said); missing from the answer → `omitted_by_model`; only a whole level 1–5 counts, anything else
→ `insufficient_evidence`; quotes must be in the candidate's turns, and a rating left with none drops to low
confidence. The generator calls the model, then writes every row in one transaction, updating rows in place by
skill identity so overrides stay put. Failures get a category and a fixed message; the raw error is never stored,
sent or logged, and a non-JSON reply raises `InvalidResponse` because Sidekiq logs every failed job's message.

**Migration** (AC-17, AC-18): only relaxes `NOT NULL` and adds nullable columns, plus three check constraints that
keep "not assessed" whole. On the dev database a digest of every rating and override was identical before, after
`db:rollback` and after `db:migrate`. Rollback refuses, with counts, while any row has no level.

**Seeded fault** (`27f49f3`, reverted in `5b34128`, history kept on the branch): `value.to_i.clamp(1, 5)` put back
into the level parser. 13 specs failed, each on its assertion (`had attributes {:ai_level => 1}`): AC-1, AC-3 (`"L3"`,
`"l3"`), AC-4 (0, 6, -1, 2.5, `""`, `"N/A"`, `"high"`, `"L3.5"`), AC-12 and the discovered-skill case. The older P0-1
specs didn't fail: their unrated skill was also never probed, so the coverage rule caught it first. Two layers.

**Checked with the real model** (Gemini, dev database, synthetic session 1: the Step 3 scenario, React partial and
two skills never probed):

| | React | Communication | System Design |
|---|---|---|---|
| Stored by the old generator | L3, override L5 | **L1** (fabricated) | **L1** (fabricated) |
| What the model answered with the new prompt | 3, 2 quotes | `null` | `null` |
| Stored now | L3, 2 verified quotes, override L5 kept | not assessed, `not_reached` | not assessed, `not_reached` |

The model followed the new prompt, and the coverage rule reached the same answer. One attempt hit a real 503: the
portfolio was marked `failed`, category `model_unavailable`, message "The AI model was unavailable or rate-limited.",
and the previous skills stayed as they were.

**In the browser** (desktop): the two skills show the dashed "Not assessed" badge and "Add rating"; React shows
L3 → L5. At 375px the page overflows sideways (header, action buttons, the override panel): that predates this
change and is AC-29, in sub-PR 5.

**Not in this change:** `FitGap::Engine` still subtracts a nil level, so fit/gap fails for a portfolio with a
not-assessed skill until sub-PR 4. The two must land together.

### Sub-PR 4: fit/gap treats "not assessed" as an unknown (P1-1, AC-13..AC-16)

**What changed** (`FitGap::Engine`): no level means `not_assessed`, with no delta or confidence, and the reason
(the skill's own, or `not_in_assessment` when the vacancy asks for a skill the interview wasn't set up to assess).
An assessor's rating counts and is flagged `is_override`. Each comparison also sends `required_level` (same value
as `expected_level`) for the web until sub-PR 5. The fallback narrative counts not-assessed skills, the narrative
prompt says they are unknowns and not weaknesses, and an unreadable narrative reply is logged by class only.

**Tests:** specs first (`bb4b797`), most failing on the `nil - expected` crash; after the fix (`054c6b9`) 9 flip to
passing, including P1-1 in the engine and end to end. API: 263 examples, 0 failures, 6 pending.

**A privacy spec that couldn't fail** (`dedee56`, AI verification moment 11): the "no model text in logs" specs fed
a reply that didn't start with the personal data, and a JSON parser error only quotes the first token. A mutation
check (the parser message put back into the log) passed when it should have failed. Both specs now start the reply
with the name, and fail with the leak put back.

**Checked with the real model** (dev, synthetic session 1 against vacancy 1):

| | Step 3 (before) | Now |
|---|---|---|
| Communication (expected L3) | candidate L1, **gap** | not assessed, `not_reached` |
| System Design (expected L2) | candidate L1, **gap** | not assessed, `not_reached` |
| Narrative | "1 skill matches, 0 exceeds, and 2 gaps" | "…remain unassessed, the candidate should advance… The upcoming round should focus specifically on probing these open areas." |

(React shows an L5 override: that's the cross-tenant write left over from the Step 3 reproduction, synthetic data.)

### Sub-PR 5: the screens show "not assessed" as an unknown (AC-20, AC-22, AC-24..AC-30)

**What changed.** Portfolio: each unrated skill says why in plain language ("Not reached before the interview
ended", "Not enough evidence to rate", "Missing from the AI's output") and suggests probing it next; a summary
line counts them and says how the interview ended, without repeating `all_covered`, which anyone with the link can
send (P1-10). Rating an unrated skill asks where the rating comes from, as the API requires (AC-20). A load failure
shows an alert with Try again (P2-1); long quotes and summaries collapse behind Show more. Fit/gap: the Required
column reads `expected_level` (P1-2), unassessed rows say why, the summary counts them apart from gaps (P2-5),
generation is requested once per visit (P1-6, web side), and after two minutes of waiting an alert with Try again
replaces the spinner. At 375px cards, headers and comparison rows stack; the app header collapses to icons.

**Tests first** (`5e30533`): new `it.fails` tests for every AC above, each run as a normal test against the old code
and failing because the feature was missing. Two existing tests changed first, each in its own commit with the
reason: the add-rating test now types a note (`342adec`), and the comparison-row helper matches the start of the
skill cell, since the cell now also holds the reason (`c40c78d`). After the change (`8e0a650`) 29 markers come off.
Web: 146 tests, 126 passing, 13 expected to fail (all outside this change), 7 opt-in skipped; `tsc` clean. API
unchanged: 263 examples, 0 failures, 6 pending.

**In the browser** (dev stack, synthetic sessions 1 and 6 to 9, Playwright against Chrome): every state at 1280px,
and portfolio, fit/gap and long text at 375px. At 375px `scrollWidth` equals the viewport on all three pages, which
closes the check left open in `8e0a650` (the Docker daemon had stopped before the header change could be seen).
The screenshots are in `report/screenshots/`. The fit/gap "generating" state was captured with Sidekiq stopped,
then Sidekiq was started again.

**Seen, not changed:** a failed portfolio still offers PDF and JSON export. It predates this work; worth a look
with the export fixes (P1-13).

## AI verification moments

Moments where an AI assistant's claim or reading turned out wrong or misleading, and how it was caught. These are
the raw material for the report's "AI verification moment" section.

1. **Predicted a failure that didn't happen.** Before starting the stack, the assistant predicted that `db:migrate` /
   `db:seed` would probably fail on an empty Postgres, because `database.yml` says the schema is shared with
   `rakamin-api`. **Checked:** the API logs and the seeds file. The seeds create `public.organizations` themselves,
   so the prediction was wrong. It was the Puma pid file that actually broke boot.
2. **"Up" doesn't mean running.** After the first `docker compose up`, `docker compose ps` reported the API as "Up",
   which reads as success. **Checked:** the API logs showed Puma had already crashed (finding 1.1). Lesson: verify
   with a real request, not container status.
3. **An empty queue read as "no duplicate jobs".** Checking for duplicate fit/gap jobs, the Sidekiq queue count came
   back 0. That would wrongly suggest no duplicates. **Checked:** the Sidekiq logs. All three jobs had already run,
   and two crashed with `PG::UniqueViolation` (finding P1-6). The queue is empty because the jobs were already
   consumed.
4. **Retry configuration that looks right but does nothing.** `Gemini::HttpClient` has a careful retry block for
   429/5xx. Reading the code suggests it works. **Checked:** at runtime, `Faraday::Retry::Middleware::IDEMPOTENT_METHODS`
   excludes `POST`, and every Gemini call is a POST, so the retries never fire (finding P2-3).
5. **AI-generated spec that would have "proved" a bug for the wrong reason.** *(code generation)* While writing
   the tenant-isolation specs, the assistant generated `create(:fit_gap_report_record, ...)`, a factory that
   didn't exist. The example was marked `pending`, so its failure would have been *expected*. It would have shown
   as a passing proof of the cross-tenant fit/gap leak, while actually failing on `KeyError: Factory not
   registered`. **Why it's risky:** a pending spec accepts *any* failure, so a broken setup looks exactly like
   evidence. **Caught by:** reviewing the generated code before the first run, then checking that every pending
   example fails on its assertion line with the expected values (`but it was 200`, `got: 1`, ...). **Fixed:** added a
   real `:fit_gap_report` factory, and now read each pending spec's failure message, not just the pending count.
6. **AI-generated factories that broke under `build`.** *(code generation)* The first full run had 2 failures:
   `please set Current.tenant_id`. The generated factories derived `tenant_id` from an associated organization,
   but FactoryBot's default `build` strategy doesn't save associations, so the organization had no `id`.
   **Caught by:** running the suite. **Fixed:** `FactoryBot.use_parent_strategy = false`, so associations are always
   saved, with a comment explaining why.
7. **Known-defect tests that "passed" for the wrong reason.** *(code generation)* The first web run reported 3
   expected failures, which reads as "the 3 defects are pinned". In fact every render was failing with `act(...) is
   not supported in production builds of React`: the shell's `NODE_ENV=production` made React load its production
   build. `it.fails`, like `pending`, accepts any failure. **Caught by:** reading the failure output instead of the
   summary line. **Fixed:** the Vitest config pins `NODE_ENV=test`, and each `it.fails` test was then run as a
   normal test to check its failure message.
8. **A safety check written from memory of an older library.** *(code generation)* The assistant wrote
   `server.listen({ onUnhandledRequest: "error" })`, the MSW 2 option, so that a test fails on any request it
   doesn't handle. MSW 3 renamed it to `onUnhandledFrame` and ignores the old name, so the check was off. Even with
   the right name, MSW only turns an unhandled request into a network error, which a page that swallows errors
   hides. **Caught by:** `tsc` flagging the unknown option, then a probe test showing the request was seen as
   unhandled while the test still passed. **Fixed:** the right option, plus collecting unhandled requests and
   failing the test after it. Turning the check on immediately exposed the hardware check's third-party requests.
9. **A test whose wrong expectation was hidden by the bug it pinned.** *(code generation)* For sub-PR 2 the assistant
   wrote "saves the level the assessor picked" expecting the request body `{ override_level: 2 }`. The API client
   actually sends `{ override: { ... } }`, as the existing override test already asserted. Against the old code the
   test failed earlier, on the `null.replace` crash, so the wrong expectation looked like a correctly pinned defect.
   **Caught by:** running the suite after the fix: the only test still failing was this one, on
   `expected { override: ... } to match object { override_level: 2 }`. **Fixed:** in its own commit, with the reason,
   using the existing test's stricter shape (`toEqual` on the whole body). **Lesson:** a test that fails on a crash
   hasn't had its assertions checked yet; check them again once the crash is gone.
10. **A confident comment about a testing library that was false.** *(code generation)* For the P1-4 write-failure
    spec the assistant wrote "any_instance blocks receive the record itself before the call's own arguments", and
    built the stub on it. The stub still worked, by luck: the "record" was always `nil`, and
    `raise ActiveRecord::RecordInvalid, nil` is valid. **Caught by:** a second stub written on the same belief, a spy
    on the PDF's `text` calls, which recorded `nil` for every line. **Checked:** a throwaway probe spec showed RSpec
    yields only the call's own arguments (`save!` none, `text` its string). **Fixed:** both stubs and the comment, in
    their own commit with the reason. **Lesson:** a passing test built on a wrong belief is still a wrong belief;
    probe the library when two observations disagree.
11. **Privacy specs that passed for the wrong reason.** *(code generation)* The specs that check a model's reply never
    reaches the logs fed replies like "Sure! Here is the portfolio for Budi Santoso…" and checked "Budi" wasn't logged.
    A JSON parser error only quotes the reply's first token ("unexpected character: 'Sure!'"), so the name was never in
    the message: the specs would pass with the leak in place. **Caught by:** a mutation check (put `e.message` back into
    the log, expect the spec to fail); it passed. **Fixed:** the replies now start with the personal data, and both
    specs fail with the leak put back. **Lesson:** for a "never X" assertion, show the test can see X at all.
