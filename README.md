# FB Page Manager

A personal Facebook Page publishing dashboard built as a small web app. It uses the official Meta Graph API flow instead of browser automation.

## Features

- Configure Meta app credentials through `.env` or the Settings screen.
- Connect Facebook with OAuth.
- Load Pages managed by the connected account.
- Publish a text/link post to a Page.
- Schedule local posts while the web server is running.
- Keep a local activity log.

## Quick Start

### Docker Compose

Create your local env file:

```powershell
cd D:\fb-page-manager
Copy-Item .env.example .env
```

Then run:

```powershell
docker compose up --build
```

Open:

```text
http://localhost:8787
```

Health check:

```text
http://localhost:8787/health
```

### Local Node.js

Install Node.js 24 first, then:

```powershell
cd D:\fb-page-manager
npm ci
npm run check
npm start
```

## Meta App Setup

1. Create an app in Meta for Developers.
2. Add Facebook Login.
3. Add this redirect URI:

```text
http://localhost:8787/auth/callback
```

4. Keep your own Facebook account as app admin, developer, or tester while in development mode.
5. Use these permissions:

```text
pages_show_list
pages_read_engagement
pages_manage_posts
```

## Project Structure

```text
public/        Frontend HTML/CSS/JS
src/           Node HTTP server and Graph API integration
data/          Local runtime data, ignored by Git
Dockerfile     Production container
docker-compose.yml
.env.example   Local environment template
.github/       CI and Render deploy trigger
docs/          Deployment notes
render.yaml    Render Blueprint
```

## Local Data

All runtime data is stored in `data/`:

- `config.json`: app ID, app secret, Graph API version.
- `auth.json`: user token and Page tokens.
- `jobs.json`: scheduled posts.
- `activity.json`: local logs.

Do not share the `data/` folder or `.env`.

## Deployment

See `docs/deployment.md`.

Render Blueprint link:

```text
https://dashboard.render.com/blueprint/new?repo=https://github.com/tuanotuan/fplus36h
```
