# Agent Instructions

## Project

FB Page Manager is intended to become a personal daily-work automation dashboard for Facebook-related publishing workflows: preparing posts, managing content templates, scheduling repeat tasks, publishing to Pages, and reducing manual work for the operator.

Implementation boundary: use the official Meta Graph API and Facebook OAuth for any direct Facebook publishing action. Do not add username/password Facebook login, browser automation against Facebook, cookie harvesting, checkpoint bypass, scraping, or spam workflows. For Facebook surfaces that do not expose an official API path for this app, build preparation, queueing, reminders, export/copy helpers, or manual handoff flows instead of automated browser control.

## Startup Context

Before making non-trivial changes, read:

1. `docs/project_context.md`
2. `docs/changelog.md`
3. `docs/decisions.md`
4. Task-relevant docs/source files

## Runtime

| Area | Location |
| --- | --- |
| Backend | `src/server.js` |
| Frontend | `public/` |
| Runtime data | `data/` |
| Deployment | `Dockerfile`, `docker-compose.yml`, `render.yaml`, `.github/workflows/` |

## Development Rules

* Keep visible UI text Vietnamese unless the task explicitly asks otherwise.
* Keep secrets out of Git. Do not commit `.env` or `data/*.json`.
* Prefer official Meta Graph API behavior over automation shortcuts.
* Update docs when behavior, deployment, API, or storage contracts change.
* Run at least:

```bash
docker compose config
```

For runtime changes, also run:

```bash
docker compose up --build -d
```

Then check:

```text
http://localhost:8787/health
```

## Git

After completing requested file changes:

1. Review `git status --short`.
2. Stage only relevant files.
3. Commit with a concise message.
4. Push to `origin main`.

Do not stage unrelated user changes.
