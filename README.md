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

## Notes for the case study

- This is the codebase you assess, harden, and release. Treat it as a version about to ship to a client.
- Work in the `/assessment` folder at the repo root for your written deliverables; code changes go in `api/` or `web/`.
- See the case-study brief you were given for what to produce and how it is evaluated.
