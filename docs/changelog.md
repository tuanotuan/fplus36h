# Changelog

## 2026-06-29

Added:

* Created the FB Page Manager web app in `D:\fb-page-manager`.
* Implemented a Node.js single-service runtime with static frontend, API routes, Facebook OAuth, Graph API Page listing, immediate publishing, scheduled publishing, and activity logs.
* Added Docker, Docker Compose, Render Blueprint, health check, and GitHub Actions CI/deploy workflow.
* Deployed the app publicly on Render at `https://fplus36h.onrender.com/`.
* Added Vietnamese setup onboarding for Meta App configuration and OAuth callback copy actions.
* Localized the dashboard UI and backend user-facing messages to Vietnamese.
* Added repository documentation modeled after the NMCNPM docs structure.

Changed:

* Replaced the initial PowerShell prototype with a Node.js web app suitable for Docker/Render deployment.
* Updated `render.yaml` to rely on the linked Render Blueprint repository instead of hard-coding a public repo URL.
* Configured Git credential storage so future commits can be pushed from the workspace.

Fixed:

* Added `/health` for Docker and Render health checks.
* Added `package-lock.json` so CI can use `npm ci`.
* Avoided committing runtime data, tokens, logs, and local `.env`.
* Improved Render `BASE_URL` behavior by deriving it from `RENDER_EXTERNAL_HOSTNAME` when available.

Removed:

* Removed the initial `server.ps1` runtime after replacing it with Node.js.

## Validation

Validated during implementation:

```bash
docker compose config
docker build .
docker compose up --build -d
```

Local health and page smoke checks passed:

```text
http://localhost:8787/health
http://localhost:8787/
```
