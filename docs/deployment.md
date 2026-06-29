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

The deploy workflow conditionally triggers a Render web service after successful CI on `main` using these GitHub repository secrets:

```text
RENDER_API_KEY
RENDER_SERVICE_ID
```

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
