# Decisions

This file records architectural and operational decisions inferred from the current implementation.

## Documentation System

| Field | Decision |
| --- | --- |
| Status | Accepted |
| Context | The project needed documentation similar to the NMCNPM coursework repository. |
| Rationale | A small stable docs set helps future work continue without rediscovering the app shape. |
| Alternatives Considered | Keep only README; generate docs from code later. Both lose context for deployment and API behavior. |
| Decision | Maintain `docs/project_context.md`, `docs/architecture.md`, `docs/api.md`, `docs/database.md`, `docs/deployment.md`, `docs/changelog.md`, and `docs/decisions.md`. |
| Consequences | Significant implementation changes should update docs and changelog. |

## Official Meta Graph API Only

| Field | Decision |
| --- | --- |
| Status | Accepted |
| Context | The user wanted a personal app similar to FPlus for Facebook. |
| Rationale | Collecting passwords, browser automation, spam workflows, or checkpoint bypassing would be unsafe and unreliable. |
| Alternatives Considered | Username/password login; cookie-based browser automation. Both were rejected. |
| Decision | Use Facebook OAuth and Meta Graph API Page endpoints only. |
| Consequences | Some FPlus-like automation features are intentionally out of scope; Meta permissions and app review may apply. |

## Single Node.js Web Service

| Field | Decision |
| --- | --- |
| Status | Implemented |
| Context | The first workspace lacked local Node/npm, but Docker was available. |
| Rationale | A Node server with static frontend is easy to deploy to Render and can still run locally through Docker. |
| Alternatives Considered | Keep PowerShell server; build a split React/Express app. PowerShell is less production-like, while split frontend/backend is unnecessary for this MVP. |
| Decision | Serve static files and API routes from `src/server.js`. |
| Consequences | No frontend build step; simple deployment; limited separation for larger future features. |

## Local JSON Runtime Storage

| Field | Decision |
| --- | --- |
| Status | Implemented |
| Context | The personal MVP needs token, job, and log persistence without a database dependency. |
| Rationale | JSON files keep setup small and fit one-user usage. |
| Alternatives Considered | SQLite; PostgreSQL; MongoDB. These are better long-term but add setup work. |
| Decision | Store runtime data in `data/*.json`, ignored by Git. |
| Consequences | The app should run as one instance and needs a persistent Render disk for durable production data. |

## In-Process Scheduler

| Field | Decision |
| --- | --- |
| Status | Implemented |
| Context | Scheduled posts are part of the MVP. |
| Rationale | A 30-second interval is enough for a personal scheduler and avoids Redis/queue dependencies. |
| Alternatives Considered | BullMQ/Redis; external cron; database-backed queue. These were deferred. |
| Decision | The web process scans `jobs.json` and publishes due jobs. |
| Consequences | Jobs run only while the service is awake and running. |

## Render Blueprint Deployment

| Field | Decision |
| --- | --- |
| Status | Implemented |
| Context | The user asked to deploy like the NMCNPM coursework project. |
| Rationale | Render Blueprint plus Docker matches the existing project style and gives a public URL quickly. |
| Alternatives Considered | VPS; Railway; Vercel. Render was already familiar from the reference project. |
| Decision | Use `render.yaml`, Docker, `/health`, and optional GitHub Actions deploy trigger. |
| Consequences | Render service settings and secrets remain outside Git; Blueprint sync may need dashboard confirmation. |

## Vietnamese UI

| Field | Decision |
| --- | --- |
| Status | Implemented |
| Context | The user requested a Vietnamese interface. |
| Rationale | The operator workflow is clearer when setup guidance, toasts, and statuses are in Vietnamese. |
| Alternatives Considered | English-only UI; mixed UI. Mixed UI was already confusing. |
| Decision | Localize visible dashboard text and backend activity messages to Vietnamese. |
| Consequences | Future visible UI additions should use Vietnamese text by default. |
