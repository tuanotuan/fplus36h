# WebSocket Events

## Status

This project does not implement WebSocket or Socket.IO events.

The dashboard uses plain HTTP requests for all current workflows:

| Workflow | Transport |
| --- | --- |
| Load setup state | `GET /api/status` |
| Save config | `POST /api/config` |
| List Pages | `GET /api/pages` |
| Publish now | `POST /api/posts` |
| Schedule/list/delete jobs | `/api/jobs` |
| Read activity | `GET /api/activity` |
| Facebook OAuth | Browser redirects through `/auth/*` |

## Future Realtime Candidates

Realtime transport may become useful if the app grows beyond the current personal MVP.

| Candidate Event | Purpose |
| --- | --- |
| `job_due` | Notify browser when a scheduled post begins publishing |
| `job_published` | Update scheduled table immediately after publish |
| `job_failed` | Surface Graph API failure without manual refresh |
| `activity_created` | Append activity log entries live |

## Current Alternative

The current UI exposes manual refresh buttons and reloads relevant data after actions. This keeps the app simple and avoids maintaining socket state for a one-user workflow.
