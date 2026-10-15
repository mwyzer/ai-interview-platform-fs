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
