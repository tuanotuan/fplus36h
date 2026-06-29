#### 3. Architectural Design

##### 1.1 Architecture Diagram

* **Written by**: Nguyen Ngoc Tuan / project owner
* **Edited by**: Codex
* **Reviewed by**:

## A. System Decomposition

FB Page Manager is designed as a small single-service web application:

1. **Browser UI Layer**: Plain HTML/CSS/JS dashboard for setup, Page selection, post composing, scheduling, and activity review.
2. **Application Server Layer**: Node.js HTTP server for static files, APIs, OAuth, Meta Graph API calls, and scheduled job processing.
3. **Runtime Storage Layer**: JSON files in `data/` for config, tokens, jobs, and activity logs.
4. **External Platform Layer**: Facebook Login and Meta Graph API for Page access and publishing.
5. **Deployment Layer**: Docker image deployed locally through Compose and publicly through Render.

## B. Overall System Architecture Diagram

```mermaid
graph TD
    subgraph BrowserLayer [Browser]
        UI[Vietnamese Dashboard]
        Preview[Post Preview]
    end

    subgraph ServerLayer [Node.js Web Service]
        Static[Static File Server]
        API[JSON API Routes]
        OAuth[Facebook OAuth Handler]
        Scheduler[Scheduled Job Loop]
    end

    subgraph StorageLayer [Local Runtime Storage]
        Config[(config.json)]
        Auth[(auth.json)]
        Jobs[(jobs.json)]
        Activity[(activity.json)]
    end

    subgraph MetaLayer [Meta Platform]
        Login[Facebook Login]
        Graph[Graph API]
    end

    BrowserLayer -->|HTTP| ServerLayer
    API --> StorageLayer
    OAuth --> Login
    OAuth --> Graph
    API --> Graph
    Scheduler --> Jobs
    Scheduler --> Graph
    Scheduler --> Activity
```

## C. Core Data Model

```mermaid
classDiagram
    class Config {
      facebookAppId
      facebookAppSecret
      graphVersion
      redirectUri
    }

    class AuthStore {
      userAccessToken
      connectedAt
      pages
    }

    class Page {
      id
      name
      category
      tasks
      access_token
      picture
    }

    class Job {
      id
      pageId
      pageName
      message
      link
      publishAt
      status
      facebookPostId
      error
    }

    class Activity {
      id
      at
      type
      message
      meta
    }

    AuthStore "1" --> "*" Page
    Job "*" --> "1" Page
```

## D. Key Design Notes

* The browser never receives Page access tokens.
* Facebook account password login is intentionally not implemented.
* The scheduler is in-process and suitable for one personal deployment.
* Runtime JSON data must be persisted outside the container if schedules/tokens must survive restarts.
* The current implementation is not a multi-tenant SaaS product.
