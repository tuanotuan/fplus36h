const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");

const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const dataDir = path.join(root, "data");

const port = Number(process.env.PORT || 8787);
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

const paths = {
  config: path.join(dataDir, "config.json"),
  auth: path.join(dataDir, "auth.json"),
  jobs: path.join(dataDir, "jobs.json"),
  activity: path.join(dataDir, "activity.json"),
  state: path.join(dataDir, "oauth-state.txt")
};

const defaultConfig = () => ({
  facebookAppId: process.env.FACEBOOK_APP_ID || "",
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET || "",
  graphVersion: process.env.GRAPH_VERSION || "v23.0",
  redirectUri: `${baseUrl}/auth/callback`
});

async function ensureStores() {
  await fs.mkdir(dataDir, { recursive: true });
  await ensureJson(paths.config, defaultConfig());
  await ensureJson(paths.auth, { userAccessToken: "", expiresAt: "", pages: [] });
  await ensureJson(paths.jobs, []);
  await ensureJson(paths.activity, []);
}

async function ensureJson(file, fallback) {
  try {
    await fs.access(file);
  } catch {
    await writeJson(file, fallback);
  }
}

async function readJson(file, fallback) {
  try {
    const text = await fs.readFile(file, "utf8");
    return text.trim() ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function getConfig() {
  const config = await readJson(paths.config, defaultConfig());
  return {
    ...config,
    graphVersion: config.graphVersion || "v23.0",
    redirectUri: `${baseUrl}/auth/callback`
  };
}

async function addActivity(type, message, meta = {}) {
  const activity = await readJson(paths.activity, []);
  activity.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    type,
    message,
    meta
  });
  await writeJson(paths.activity, activity.slice(-200));
}

function send(res, statusCode, body, contentType = "text/plain; charset=utf-8") {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(statusCode, {
    "content-type": contentType,
    "content-length": payload.length
  });
  res.end(payload);
}

function json(res, statusCode, value) {
  send(res, statusCode, JSON.stringify(value), "application/json; charset=utf-8");
}

function redirect(res, location) {
  res.writeHead(302, { location });
  res.end();
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text.trim() ? JSON.parse(text) : {};
}

async function graphGet(route, params) {
  const config = await getConfig();
  const url = new URL(`https://graph.facebook.com/${config.graphVersion}/${route}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return graphFetch(url, { method: "GET" });
}

async function graphPost(route, body) {
  const config = await getConfig();
  const response = await graphFetch(`https://graph.facebook.com/${config.graphVersion}/${route}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body)
  });
  return response;
}

async function graphFetch(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = data.error?.message || `Graph API failed with HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

async function getPageById(pageId) {
  const auth = await readJson(paths.auth, { pages: [] });
  return (auth.pages || []).find((page) => String(page.id) === String(pageId));
}

async function publishPagePost(pageId, message, link) {
  const page = await getPageById(pageId);
  if (!page) throw new Error("Page token not found. Connect Facebook again.");
  if (!String(message || "").trim() && !String(link || "").trim()) {
    throw new Error("Message or link is required.");
  }

  const body = { access_token: page.access_token };
  if (String(message || "").trim()) body.message = message;
  if (String(link || "").trim()) body.link = link;
  return graphPost(`${pageId}/feed`, body);
}

async function processDueJobs() {
  const jobs = await readJson(paths.jobs, []);
  let changed = false;
  const now = Date.now();

  for (const job of jobs) {
    if (job.status !== "scheduled") continue;
    if (new Date(job.publishAt).getTime() > now) continue;

    try {
      const result = await publishPagePost(job.pageId, job.message, job.link);
      job.status = "published";
      job.publishedAt = new Date().toISOString();
      job.facebookPostId = result.id;
      job.error = "";
      await addActivity("success", "Scheduled post published", {
        pageId: job.pageId,
        postId: result.id
      });
    } catch (error) {
      job.status = "failed";
      job.error = error.message;
      await addActivity("error", "Scheduled post failed", {
        pageId: job.pageId,
        error: error.message
      });
    }
    changed = true;
  }

  if (changed) await writeJson(paths.jobs, jobs);
}

async function handleApi(req, res, url) {
  const route = url.pathname;

  if (req.method === "GET" && route === "/api/status") {
    const config = await getConfig();
    const auth = await readJson(paths.auth, { userAccessToken: "", pages: [] });
    return json(res, 200, {
      configured: Boolean(config.facebookAppId && config.facebookAppSecret),
      connected: Boolean(auth.userAccessToken),
      pageCount: (auth.pages || []).length,
      graphVersion: config.graphVersion,
      redirectUri: config.redirectUri
    });
  }

  if (req.method === "GET" && route === "/api/config") {
    const config = await getConfig();
    return json(res, 200, {
      facebookAppId: config.facebookAppId,
      facebookAppSecret: config.facebookAppSecret ? "********" : "",
      graphVersion: config.graphVersion,
      redirectUri: config.redirectUri
    });
  }

  if (req.method === "POST" && route === "/api/config") {
    const body = await readBody(req);
    const current = await getConfig();
    const secret = body.facebookAppSecret === "********" ? current.facebookAppSecret : body.facebookAppSecret;
    const config = {
      facebookAppId: String(body.facebookAppId || "").trim(),
      facebookAppSecret: String(secret || "").trim(),
      graphVersion: String(body.graphVersion || "v23.0").trim(),
      redirectUri: `${baseUrl}/auth/callback`
    };
    await writeJson(paths.config, config);
    await addActivity("info", "Config updated", { graphVersion: config.graphVersion });
    return json(res, 200, { ok: true, redirectUri: config.redirectUri });
  }

  if (req.method === "GET" && route === "/api/pages") {
    const auth = await readJson(paths.auth, { pages: [] });
    const pages = (auth.pages || []).map(({ access_token, ...page }) => page);
    return json(res, 200, { pages });
  }

  if (req.method === "POST" && route === "/api/posts") {
    const body = await readBody(req);
    try {
      const result = await publishPagePost(body.pageId, body.message, body.link);
      await addActivity("success", "Post published", { pageId: body.pageId, postId: result.id });
      return json(res, 200, { ok: true, postId: result.id });
    } catch (error) {
      await addActivity("error", "Post failed", { pageId: body.pageId, error: error.message });
      return json(res, 400, { error: error.message });
    }
  }

  if (req.method === "GET" && route === "/api/jobs") {
    return json(res, 200, { jobs: await readJson(paths.jobs, []) });
  }

  if (req.method === "POST" && route === "/api/jobs") {
    const body = await readBody(req);
    const page = await getPageById(body.pageId);
    if (!page) return json(res, 400, { error: "Page not found. Connect Facebook again." });
    if (!body.publishAt) return json(res, 400, { error: "Publish time is required." });

    const jobs = await readJson(paths.jobs, []);
    const job = {
      id: crypto.randomUUID(),
      pageId: String(page.id),
      pageName: String(page.name),
      message: String(body.message || ""),
      link: String(body.link || ""),
      publishAt: new Date(body.publishAt).toISOString(),
      createdAt: new Date().toISOString(),
      publishedAt: "",
      facebookPostId: "",
      status: "scheduled",
      error: ""
    };
    jobs.push(job);
    await writeJson(paths.jobs, jobs);
    await addActivity("info", "Post scheduled", { pageId: job.pageId, publishAt: job.publishAt });
    return json(res, 200, { ok: true, job });
  }

  const deleteMatch = route.match(/^\/api\/jobs\/([^/]+)$/);
  if (req.method === "DELETE" && deleteMatch) {
    const jobId = deleteMatch[1];
    const jobs = await readJson(paths.jobs, []);
    await writeJson(paths.jobs, jobs.filter((job) => job.id !== jobId));
    await addActivity("info", "Scheduled job removed", { jobId });
    return json(res, 200, { ok: true });
  }

  const runMatch = route.match(/^\/api\/jobs\/([^/]+)\/run$/);
  if (req.method === "POST" && runMatch) {
    const jobId = runMatch[1];
    const jobs = await readJson(paths.jobs, []);
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return json(res, 404, { error: "Job not found" });

    try {
      const result = await publishPagePost(job.pageId, job.message, job.link);
      job.status = "published";
      job.publishedAt = new Date().toISOString();
      job.facebookPostId = result.id;
      job.error = "";
      await writeJson(paths.jobs, jobs);
      await addActivity("success", "Scheduled job published manually", { jobId, postId: result.id });
      return json(res, 200, { ok: true, postId: result.id });
    } catch (error) {
      job.status = "failed";
      job.error = error.message;
      await writeJson(paths.jobs, jobs);
      await addActivity("error", "Manual publish failed", { jobId, error: error.message });
      return json(res, 400, { error: error.message });
    }
  }

  if (req.method === "GET" && route === "/api/activity") {
    const activity = await readJson(paths.activity, []);
    return json(res, 200, { activity: activity.slice(-80) });
  }

  return json(res, 404, { error: "API route not found" });
}

async function handleAuth(req, res, url) {
  const config = await getConfig();
  if (!config.facebookAppId || !config.facebookAppSecret) {
    return send(res, 400, "Configure Facebook App ID and App Secret first.");
  }

  if (url.pathname === "/auth/login") {
    const state = crypto.randomBytes(24).toString("hex");
    await fs.writeFile(paths.state, state, "utf8");

    const loginUrl = new URL(`https://www.facebook.com/${config.graphVersion}/dialog/oauth`);
    loginUrl.searchParams.set("client_id", config.facebookAppId);
    loginUrl.searchParams.set("redirect_uri", config.redirectUri);
    loginUrl.searchParams.set("state", state);
    loginUrl.searchParams.set("scope", "pages_show_list,pages_read_engagement,pages_manage_posts");
    loginUrl.searchParams.set("response_type", "code");
    return redirect(res, loginUrl.toString());
  }

  if (url.pathname === "/auth/callback") {
    const expectedState = await fs.readFile(paths.state, "utf8").catch(() => "");
    const actualState = url.searchParams.get("state") || "";
    const code = url.searchParams.get("code") || "";
    const denied = url.searchParams.get("error_reason") || "";

    if (denied) {
      await addActivity("error", "Facebook login denied", { reason: denied });
      return send(res, 400, `Facebook login denied: ${denied}`);
    }
    if (!code || actualState !== expectedState.trim()) {
      return send(res, 400, "Invalid OAuth callback.");
    }

    try {
      const token = await graphGet("oauth/access_token", {
        client_id: config.facebookAppId,
        redirect_uri: config.redirectUri,
        client_secret: config.facebookAppSecret,
        code
      });

      const longToken = await graphGet("oauth/access_token", {
        grant_type: "fb_exchange_token",
        client_id: config.facebookAppId,
        client_secret: config.facebookAppSecret,
        fb_exchange_token: token.access_token
      });

      const userAccessToken = longToken.access_token || token.access_token;
      const pagesResult = await graphGet("me/accounts", {
        fields: "id,name,category,tasks,access_token,picture{url}",
        access_token: userAccessToken
      });

      const pages = (pagesResult.data || []).map((page) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        tasks: page.tasks || [],
        access_token: page.access_token,
        picture: page.picture?.data?.url || ""
      }));

      await writeJson(paths.auth, {
        userAccessToken,
        expiresAt: "",
        pages,
        connectedAt: new Date().toISOString()
      });
      await addActivity("success", "Facebook connected", { pageCount: pages.length });
      return redirect(res, "/?connected=1");
    } catch (error) {
      await addActivity("error", "Facebook connection failed", { error: error.message });
      return send(res, 500, `Facebook connection failed: ${error.message}`);
    }
  }

  return json(res, 404, { error: "Auth route not found" });
}

async function serveStatic(res, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(publicDir, `.${decodeURIComponent(requested)}`);
  if (!filePath.startsWith(publicDir)) return json(res, 403, { error: "Forbidden" });

  try {
    const data = await fs.readFile(filePath);
    return send(res, 200, data, mime(filePath));
  } catch {
    return json(res, 404, { error: "Not found" });
  }
}

function mime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg"
  }[ext] || "application/octet-stream";
}

async function handle(req, res) {
  const url = new URL(req.url, baseUrl);
  try {
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    if (url.pathname.startsWith("/auth/")) return await handleAuth(req, res, url);
    return await serveStatic(res, url.pathname);
  } catch (error) {
    await addActivity("error", "Request failed", { path: url.pathname, error: error.message });
    return json(res, 500, { error: error.message });
  }
}

async function main() {
  await ensureStores();
  await addActivity("info", "Server started", { port });

  setInterval(() => {
    processDueJobs().catch((error) => {
      addActivity("error", "Scheduler failed", { error: error.message }).catch(() => {});
    });
  }, 30_000).unref();

  http.createServer(handle).listen(port, "0.0.0.0", () => {
    console.log(`FB Page Manager running at ${baseUrl}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
