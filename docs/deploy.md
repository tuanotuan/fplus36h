# Deployment Guide

The maintained deployment documentation is [`docs/deployment.md`](deployment.md).

Quick local start:

```bash
cp .env.example .env
docker compose up --build
```

Open:

```text
http://localhost:8787
```

Health:

```text
http://localhost:8787/health
```

Production Render URL:

```text
https://fplus36h.onrender.com/
```

Before connecting Facebook in production, set `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` in Render and add this callback URL in Meta Facebook Login:

```text
https://fplus36h.onrender.com/auth/callback
```
