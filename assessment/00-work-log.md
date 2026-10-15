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
| 2026-10-15 | 1/3 | RSpec harness + 67 passing specs + 11 pending specs that pin the Step 3 defects | `test/rspec-harness` · `b547005`, `e3189a9`, `d126db8` |
| 2026-10-15 | 1 | Gemini API key configured locally; default model IDs found retired | `test/rspec-harness` · `818e281` (log only; key never committed) |
| 2026-10-15 | 1 | `.gitattributes`: LF for `api/bin/*` and `db/schema.rb` | `test/rspec-harness` (see 1.5) |

**Branches** (all pushed to `origin` = `github.com/mwyzer/ai-interview-platform`, private). They're stacked, so each
contains the ones before it: `main` → `chore/docker-dev-setup` → `docs/step-3-gap-analysis` → `test/rspec-harness`.

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

---

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
