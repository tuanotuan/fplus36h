#### Stakeholders

* **Written by**: Nguyen Ngoc Tuan / project owner
* **Edited by**: Codex
* **Reviewed by**:

Based on the current FB Page Manager implementation, the main stakeholders are:

| STT | Stakeholder | Description |
| --- | --- | --- |
| 1 | Personal operator | The person who owns the deployment, configures the Meta app, connects Facebook, and publishes/schedules Page posts. |
| 2 | Facebook Page audience | People who see posts published by the connected Page. They do not interact directly with this app. |
| 3 | Meta Platform | Provides Facebook Login, Page permissions, Page access tokens, and Graph API publishing endpoints. |
| 4 | Deployment operator | The person maintaining Render, GitHub, environment variables, persistent disk, and deployment status. |

## Functional Requirements

| ID | Requirement | Status |
| --- | --- | --- |
| FR-01 | The app shall serve a web dashboard from a public URL. | Implemented |
| FR-02 | The app shall show setup state for Meta App configuration and Facebook connection. | Implemented |
| FR-03 | The app shall support Facebook OAuth login. | Implemented |
| FR-04 | The app shall load Pages managed by the connected Facebook account. | Implemented |
| FR-05 | The app shall publish text/link posts to a selected Page. | Implemented |
| FR-06 | The app shall schedule posts locally. | Implemented |
| FR-07 | The app shall show activity logs for success and failure events. | Implemented |
| FR-08 | The app shall expose a health endpoint for deployment monitoring. | Implemented |

## Non-Functional Requirements

| ID | Requirement | Handling |
| --- | --- | --- |
| NFR-01 | The app must not collect Facebook passwords. | Uses OAuth only. |
| NFR-02 | Secrets must not be committed to Git. | `.env` and `data/*.json` are ignored. |
| NFR-03 | The app should deploy as a Docker web service. | Dockerfile, Compose, and Render Blueprint are included. |
| NFR-04 | The UI should be usable in Vietnamese. | Dashboard text is localized. |
| NFR-05 | The system should be simple to operate for personal use. | Single service and JSON storage. |

## Assumptions

* The operator has or can create a Meta for Developers app.
* Page publishing is limited to Pages the connected account is allowed to manage.
* The service runs as a single instance.
* Meta permission review may be required for non-admin/tester production users.

## Out of Scope

* Facebook username/password login.
* Browser automation, cookie harvesting, checkpoint bypass, UID scraping, or spam workflows.
* Multi-tenant SaaS authentication.
* Messenger automation.
* Photo/video publishing.
