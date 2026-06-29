# Database

## Overview

The project does not use a database server. Runtime data is stored as JSON files in `data/`, which is ignored by Git.

This is suitable for a single personal deployment, but it is not a multi-user or horizontally scalable storage design.

## Runtime Files

| File | Purpose | Committed |
| --- | --- | --- |
| `data/config.json` | Local Meta app config | No |
| `data/auth.json` | User/Page access tokens and connected Page metadata | No |
| `data/jobs.json` | Scheduled post queue and status history | No |
| `data/activity.json` | Recent local activity log | No |
| `data/oauth-state.txt` | Last OAuth state value | No |
| `data/.gitkeep` | Keeps empty data directory in Git | Yes |

## Config Store

`config.json` shape:

```json
{
  "facebookAppId": "",
  "facebookAppSecret": "",
  "graphVersion": "v23.0",
  "redirectUri": "https://fplus36h.onrender.com/auth/callback"
}
```

Production should prefer environment variables:

```text
FACEBOOK_APP_ID
FACEBOOK_APP_SECRET
GRAPH_VERSION
BASE_URL
```

## Auth Store

`auth.json` shape:

```json
{
  "userAccessToken": "...",
  "expiresAt": "",
  "connectedAt": "2026-06-29T00:00:00.000Z",
  "pages": [
    {
      "id": "123",
      "name": "Example Page",
      "category": "Community",
      "tasks": ["CREATE_CONTENT"],
      "access_token": "...",
      "picture": "https://..."
    }
  ]
}
```

Security note: `access_token` values must never be committed or shared.

## Jobs Store

`jobs.json` is an array.

```json
[
  {
    "id": "uuid",
    "pageId": "123",
    "pageName": "Example Page",
    "message": "Post text",
    "link": "https://example.com",
    "publishAt": "2026-06-29T10:00:00.000Z",
    "createdAt": "2026-06-29T09:00:00.000Z",
    "publishedAt": "",
    "facebookPostId": "",
    "status": "scheduled",
    "error": ""
  }
]
```

The in-process scheduler scans this file every 30 seconds. Jobs are rewritten after publish attempts.

## Activity Store

`activity.json` is an array capped to the latest 200 entries.

```json
[
  {
    "id": "uuid",
    "at": "2026-06-29T09:00:00.000Z",
    "type": "info",
    "message": "Server da khoi dong",
    "meta": { "port": 8787 }
  }
]
```

Types currently used:

| Type | Meaning |
| --- | --- |
| `info` | Normal local state changes |
| `success` | Successful publish/connect actions |
| `error` | Failed API/OAuth/publish actions |

## Persistence on Render

Render containers have ephemeral filesystems unless a persistent disk is configured. For production-like usage, mount a disk at:

```text
/usr/src/app/data
```

Without a persistent disk, connected tokens and schedules can disappear after redeploy/restart.

## Not Implemented

| Area | Status |
| --- | --- |
| SQL/NoSQL database | Not Found |
| Migrations | Not Found |
| Backup automation | Not Found |
| Token encryption at rest | Not Implemented |
| Multi-user data separation | Not Implemented |
| Distributed queue | Not Implemented |
