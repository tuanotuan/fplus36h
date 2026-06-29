# API

## Conventions

Local base URL:

```text
http://localhost:8787
```

Production base URL:

```text
https://fplus36h.onrender.com
```

Responses are JSON unless the route serves static assets or redirects for OAuth. Errors use HTTP status codes and an `error` field when possible.

## Health

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/health` | No | `{ ok, service, at }` |

Example:

```json
{
  "ok": true,
  "service": "fb-page-manager",
  "at": "2026-06-29T04:36:22.281Z"
}
```

## Status and Config

| Method | Path | Body / Result | Purpose |
| --- | --- | --- | --- |
| GET | `/api/status` | `{ configured, connected, pageCount, graphVersion, redirectUri }` | Dashboard setup state |
| GET | `/api/config` | Masked App Secret | Populate Settings form |
| POST | `/api/config` | `{ facebookAppId, facebookAppSecret, graphVersion }` | Save local config |

`/api/config` stores secrets in `data/config.json` for local/personal usage. Production deployments should prefer Render environment variables.

## Pages

| Method | Path | Body / Result | Purpose |
| --- | --- | --- | --- |
| GET | `/api/pages` | `{ pages: [...] }` | List connected Pages |

Page access tokens are stripped from the response.

Response item:

```json
{
  "id": "123",
  "name": "Example Page",
  "category": "Community",
  "tasks": ["MANAGE", "CREATE_CONTENT"],
  "picture": "https://..."
}
```

## Publishing

| Method | Path | Body / Result | Purpose |
| --- | --- | --- | --- |
| POST | `/api/posts` | Post payload | Publish immediately to a Page |

Post payload:

```json
{
  "pageId": "123",
  "destinationType": "page",
  "postType": "status",
  "message": "Post text",
  "link": "https://example.com",
  "imageUrls": ["https://example.com/photo.jpg"],
  "videoUrl": "https://example.com/video.mp4",
  "product": {
    "name": "Product name",
    "price": "350.000đ",
    "location": "TP.HCM",
    "description": "Product condition and details"
  }
}
```

Supported `postType` values:

| Type | Behavior |
| --- | --- |
| `status` | Publishes a Page feed post with `message` |
| `link` | Publishes a Page feed post with `message` and `link` |
| `photos` | Publishes one photo or an attached-media multi-photo Page post from public `imageUrls` |
| `video` | Publishes a Page video from public `videoUrl` |
| `product` | Builds a product-style Page post from `product`, optional `link`, optional `imageUrls`, and `message` |

`destinationType` must be `page`. `group` and `marketplace` return validation errors because this app intentionally does not use unofficial browser automation and those destinations are not available through the required official API path for this personal app.

Success:

```json
{
  "ok": true,
  "postId": "page_post_id"
}
```

Validation:

* `pageId` must match a connected Page.
* Either `message` or `link` is required.
* Graph API errors are returned as `400` responses.

## Scheduled Jobs

| Method | Path | Body / Result | Purpose |
| --- | --- | --- | --- |
| GET | `/api/jobs` | `{ jobs: [...] }` | List local scheduled jobs |
| POST | `/api/jobs` | Post payload plus `{ publishAt }` | Create scheduled post |
| DELETE | `/api/jobs/:jobId` | `{ ok: true }` | Remove a job |
| POST | `/api/jobs/:jobId/run` | `{ ok, postId }` | Publish a job immediately |

Job status values:

| Status | Meaning |
| --- | --- |
| `scheduled` | Waiting for due time |
| `published` | Posted successfully |
| `failed` | Publish attempt failed; `error` contains details |

## Activity

| Method | Path | Body / Result | Purpose |
| --- | --- | --- | --- |
| GET | `/api/activity` | `{ activity: [...] }` | Read recent local activity |

Activity entries are capped to the most recent 200 records in storage and the API returns the latest 80.

## OAuth

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/auth/login` | Redirects to Facebook Login |
| GET | `/auth/callback` | Validates state, exchanges token, stores Pages, redirects to `/` |

Requested scopes:

```text
pages_show_list,pages_read_engagement,pages_manage_posts
```

The callback URL must be configured in Meta Facebook Login:

```text
https://fplus36h.onrender.com/auth/callback
```

## Not Implemented

| Area | Status |
| --- | --- |
| OpenAPI/Swagger specification | Not Found |
| Dashboard user authentication | Not Implemented |
| Direct Group publishing | Not Implemented |
| Direct Marketplace product publishing | Not Implemented |
| Webhook ingestion | Not Implemented |
| Messenger inbox APIs | Not Implemented |
| Bulk import CSV/API | Not Implemented |
