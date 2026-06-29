# Deployment

## Requirements

| Component | Requirement |
| --- | --- |
| Node.js | `>=24 <25` |
| Containers | Docker + Compose |
| External services | Meta Graph API app with Facebook Login |

## Local Development

```bash
npm ci
npm run check
npm start
```

The web app listens on `${PORT:-8787}` and serves both the HTML dashboard and API from the same service.

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

| Service | Port | Health |
| --- | --- | --- |
| `app` | `${PORT:-8787}` | `/health` |

Runtime data is mounted at `./data:/usr/src/app/data`.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | HTTP port, default `8787` |
| `BASE_URL` | Production | Public app origin used for OAuth callbacks |
| `GRAPH_VERSION` | No | Meta Graph API version, default `v23.0` |
| `FACEBOOK_APP_ID` | Yes | Meta app ID |
| `FACEBOOK_APP_SECRET` | Yes | Meta app secret |

For production, set `BASE_URL` to the public HTTPS origin, then add this callback URL in Meta Facebook Login:

```text
https://your-domain.example/auth/callback
```

## CI

`.github/workflows/test.yml` runs on pushes, pull requests, and manual dispatch:

| Step | Purpose |
| --- | --- |
| `npm ci` | Install locked dependencies |
| `npm run check` | Validate server JavaScript syntax |
| `docker compose config` | Validate Compose configuration |
| `docker build .` | Build the production image |

## Production

### Render Blueprint

This repo includes `render.yaml`, so it can be deployed from the Render Dashboard as a Blueprint:

```text
https://dashboard.render.com/blueprint/new?repo=https://github.com/tuanotuan/fplus36h
```

The Blueprint creates one Docker web service named `fplus36h`, uses `/health`, and prompts for:

```text
FACEBOOK_APP_ID
FACEBOOK_APP_SECRET
```

The Blueprint intentionally omits a `repo` field. Render should use the GitHub repository connected when the Blueprint is created, which keeps commit-based auto deploys wired to that GitHub connection.

When running on Render, the app derives `BASE_URL` from `RENDER_EXTERNAL_HOSTNAME` if `BASE_URL` is not set manually. The public app URL should be:

```text
https://fplus36h.onrender.com
```

After the first successful deploy, add this callback URL in Meta Facebook Login:

```text
https://fplus36h.onrender.com/auth/callback
```

### Render Deploy Hook

The deploy workflow triggers Render after successful CI on `main`.

Recommended one-secret setup:

1. Open the Render service.
2. Go to **Settings** and copy the service **Deploy Hook** URL.
3. In GitHub, add repository secret:

```text
RENDER_DEPLOY_HOOK_URL
```

The workflow will call that hook after CI passes.

Alternative API setup:

```text
RENDER_API_KEY
RENDER_SERVICE_ID
```

If `RENDER_DEPLOY_HOOK_URL` is set, it is used first. Otherwise, both API secrets are required.

Render service settings:

| Setting | Value |
| --- | --- |
| Environment | Docker |
| Dockerfile path | `./Dockerfile` |
| Health check path | `/health` |
| Persistent disk | Mount to `/usr/src/app/data` if local scheduled jobs/tokens must survive restarts |

## Operational Gaps

* Local JSON storage is simple and single-instance only.
* Scheduled posts run only while the service is alive.
* No secret rotation, metrics, tracing, or central log sink.
