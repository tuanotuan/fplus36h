# AI Usage

## Project Bootstrap and Implementation

Tool name, version, and platform: Codex / ChatGPT, OpenAI, local coding assistant in repository workspace.

Access time: June 29, 2026.

Prompts used:

* "tao muốn tạo một ứng dụng giống fplus cho fb để dùng cho mục đích cá nhân"
* "ok bắt đầu đi, tự tạo thư mục khác cho tao luôn nhá"
* "tao muốn ứng dụng chạy trên web và commit lên git giống dự án thực tế"
* "deploy giống đồ án NMCNPM trong ổ D á"
* "chuyển sang giao diện tiếng việt"
* "vô thư mục docs của đồ án NMCNPM trong ổ D và tìm các file markdow, sau đó tạo các file md tương tự cho đồ án hiện tại"

Purpose of use:

* Design and implement a personal Facebook Page publishing dashboard.
* Keep the implementation within official Meta Graph API boundaries.
* Add Docker, Render, GitHub Actions, and documentation similar to the NMCNPM coursework project.

Which content was generated with AI assistance:

* Node.js HTTP server in `src/server.js`.
* Plain HTML/CSS/JS dashboard in `public/`.
* Dockerfile, Docker Compose, Render Blueprint, GitHub Actions workflows.
* Vietnamese setup onboarding and UI text.
* Documentation files under `docs/`.

Human / operator validation:

* Local Docker Compose builds and health checks.
* Public Render health check at `https://fplus36h.onrender.com/health`.
* Git commits pushed to `https://github.com/tuanotuan/fplus36h`.

Limitations:

* OAuth and live Page publishing require real Meta app credentials and permissions.
* AI assistance did not replace Meta app review or production security review.
