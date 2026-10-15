# The Product
Please refer to https://github.com/rakamindev/ai-interview-platform/wiki for initial product specification

# The Platform

A two-service application used for the Product Engineer case study. It is provided as a single repository so the whole thing clones, runs, and releases as one unit.

```
.
├── api/    # Backend service (Ruby on Rails, PostgreSQL, Redis/Sidekiq)
└── web/    # Frontend web app (React 18 + TypeScript, Vite, Tailwind)
```

The two services run together: the web app talks to the API over REST and WebSocket.

## Running it locally

Each service has its own setup guide. Run the API first, then the web app pointed at it.

1. **API** — see [`api/README.md`](api/README.md). Rails app; needs Ruby (see `api/.ruby-version`), PostgreSQL, and Redis. It serves on `http://localhost:3001`.
2. **Web** — see [`web/README.md`](web/README.md). Vite app; `npm install`, copy `.env.example` to `.env`, point `VITE_API_BASE_URL` at the API, then `npm run dev`. It serves on `http://localhost:5173`.

## Running it with Docker

Runs Postgres, Redis, the API, Sidekiq and the web app together.

1. `cp api/config/application.yml.sample api/config/application.yml` and set `SECRET_KEY_BASE` and `GEMINI_API_KEY`. Database and Redis settings in that file are overridden by `docker-compose.yml`.
2. `docker compose up --build` — the API creates, migrates and seeds the database on startup.
3. Mint a dev JWT and put it in `web/.env` as `VITE_DEV_TOKEN`, then `docker compose restart web`:
   ```bash
   docker compose exec api bundle exec rails runner "puts JsonWebToken.encode({ user_id: 1, role: 'admin', scheme: 'test-corp' }, 30.days)"
   ```
4. Open http://localhost:5173 (API on http://localhost:3001).

Stop with `docker compose down`; add `-v` to also wipe the database.

### Running the API tests

```bash
docker compose exec -e RAILS_ENV=test api bundle exec rails db:create db:schema:load   # first time only
docker compose exec -e RAILS_ENV=test api bundle exec rspec
```

Specs never call Gemini; model responses are stubbed with `spec/support/fake_gemini.rb`. Examples marked
`pending` encode known defects from `assessment/03-problem-and-gap.md`: they are expected to fail until the
defect is fixed, at which point RSpec reports them and the `pending` marker must be removed.

## Notes for the case study

- This is the codebase you assess, harden, and release. Treat it as a version about to ship to a client.
- Work in the `/assessment` folder at the repo root for your written deliverables; code changes go in `api/` or `web/`.
- See the case-study brief you were given for what to produce and how it is evaluated.

### How the case study is worked through

Each step gives the reason for the next one: understand the product, find what's wrong, decide what to change,
then build it. Green steps are done.

```mermaid
flowchart TD
    S1["<b>Step 1 · Setup</b><br/>Run the API and web app locally<br/><i>assessment/00-work-log.md</i>"]
    S2["<b>Step 2 · Domain immersion</b><br/>What the product is for, who uses it,<br/>who it affects<br/><i>assessment/02-domain-immersion.md</i>"]
    S3["<b>Step 3 · Problem and gap</b><br/>What's broken or missing, ranked P0–P3<br/><i>assessment/03-problem-and-gap.md</i>"]
    S4["<b>Step 4 · Strategy</b><br/>Pick the focus, compare options,<br/>write acceptance criteria<br/><i>assessment/04-strategy.md</i>"]
    S5["<b>Step 5 · Implementation and PR</b><br/>Code, tests, PR"]
    S6["<b>Step 6 · Submission</b><br/>Report PDF and a 3–5 min video"]

    S1 -->|"the app runs"| S2
    S2 -->|"we know what matters"| S3
    S3 -->|"we know what's broken"| S4
    S4 -->|"we know what to build<br/>and when it's done"| S5
    S5 --> S6

    S2 -.- K2["A rating must be defensible.<br/>The candidate is harmed silently."]
    S3 -.- K3["P0-1: unassessed skills stored as L1<br/>P0-2: cross-tenant read and write"]
    S4 -.- K4["Option B: a real 'not assessed' state<br/>30 acceptance criteria, 4 sub-PRs"]

    classDef done fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef todo fill:#f1f5f9,stroke:#94a3b8,color:#334155
    classDef note fill:#fffbeb,stroke:#f59e0b,color:#78350f
    class S1,S2,S3,S4 done
    class S5,S6 todo
    class K2,K3,K4 note
```
