const state = {
  status: null,
  pages: [],
  jobs: [],
  activity: []
};

const els = {
  configuredState: document.querySelector("#configuredState"),
  connectedState: document.querySelector("#connectedState"),
  pageCount: document.querySelector("#pageCount"),
  viewTitle: document.querySelector("#viewTitle"),
  viewSubtitle: document.querySelector("#viewSubtitle"),
  connectBtn: document.querySelector("#connectBtn"),
  refreshBtn: document.querySelector("#refreshBtn"),
  setupPanel: document.querySelector("#setupPanel"),
  setupMessage: document.querySelector("#setupMessage"),
  setupCallback: document.querySelector("#setupCallback"),
  stepConfig: document.querySelector("#stepConfig"),
  stepCallback: document.querySelector("#stepCallback"),
  stepConnect: document.querySelector("#stepConnect"),
  openSettingsBtn: document.querySelector("#openSettingsBtn"),
  copySetupCallbackBtn: document.querySelector("#copySetupCallbackBtn"),
  navItems: document.querySelectorAll(".nav-item"),
  views: {
    compose: document.querySelector("#composeView"),
    settings: document.querySelector("#settingsView"),
    activity: document.querySelector("#activityView")
  },
  pageSelect: document.querySelector("#pageSelect"),
  messageInput: document.querySelector("#messageInput"),
  linkInput: document.querySelector("#linkInput"),
  publishAtInput: document.querySelector("#publishAtInput"),
  composerForm: document.querySelector("#composerForm"),
  scheduleBtn: document.querySelector("#scheduleBtn"),
  previewPage: document.querySelector("#previewPage"),
  previewMessage: document.querySelector("#previewMessage"),
  previewLink: document.querySelector("#previewLink"),
  jobsTable: document.querySelector("#jobsTable"),
  reloadJobsBtn: document.querySelector("#reloadJobsBtn"),
  configForm: document.querySelector("#configForm"),
  appIdInput: document.querySelector("#appIdInput"),
  appSecretInput: document.querySelector("#appSecretInput"),
  graphVersionInput: document.querySelector("#graphVersionInput"),
  redirectUriValue: document.querySelector("#redirectUriValue"),
  copyRedirectBtn: document.querySelector("#copyRedirectBtn"),
  activityList: document.querySelector("#activityList"),
  reloadActivityBtn: document.querySelector("#reloadActivityBtn"),
  toast: document.querySelector("#toast")
};

const viewMeta = {
  compose: {
    title: "Compose",
    subtitle: "Post now or schedule a Page post from your local machine."
  },
  settings: {
    title: "Settings",
    subtitle: "Configure your Meta app and OAuth redirect."
  },
  activity: {
    title: "Activity",
    subtitle: "Recent local actions, publish results, and Graph API errors."
  }
};

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => els.toast.classList.remove("visible"), 3200);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

function switchView(name) {
  for (const [key, node] of Object.entries(els.views)) {
    node.classList.toggle("active", key === name);
  }
  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.tab === name));
  els.viewTitle.textContent = viewMeta[name].title;
  els.viewSubtitle.textContent = viewMeta[name].subtitle;
}

function renderStatus(status) {
  state.status = status;
  els.configuredState.textContent = status.configured ? "Ready" : "Missing";
  els.connectedState.textContent = status.connected ? "Connected" : "Not connected";
  els.pageCount.textContent = status.pageCount;
  els.connectBtn.toggleAttribute("aria-disabled", !status.configured);
  els.connectBtn.classList.toggle("secondary", status.configured);
  els.connectBtn.classList.toggle("ghost", !status.configured);
  renderSetup(status);
}

function renderSetup(status) {
  const ready = status.configured && status.connected && status.pageCount > 0;
  els.setupPanel.hidden = ready;
  els.setupCallback.textContent = status.redirectUri || "Callback URL unavailable.";

  els.stepConfig.classList.toggle("done", status.configured);
  els.stepCallback.classList.toggle("done", status.configured);
  els.stepConnect.classList.toggle("done", status.connected);

  if (!status.configured) {
    els.setupMessage.textContent = "Add Facebook App ID and Secret before connecting Facebook.";
    return;
  }
  if (!status.connected) {
    els.setupMessage.textContent = "Meta credentials are ready. Add the callback URL in Facebook Login, then connect Facebook.";
    return;
  }
  if (status.pageCount === 0) {
    els.setupMessage.textContent = "Facebook is connected, but no manageable Pages were returned.";
    return;
  }
  els.setupMessage.textContent = "Setup complete. Choose a Page and publish.";
}

function renderPages() {
  if (!state.pages.length) {
    els.pageSelect.innerHTML = `<option value="">No Page connected</option>`;
    updatePreview();
    return;
  }

  els.pageSelect.innerHTML = state.pages
    .map((page) => `<option value="${escapeHtml(page.id)}">${escapeHtml(page.name)}</option>`)
    .join("");
  updatePreview();
}

function renderJobs() {
  if (!state.jobs.length) {
    els.jobsTable.innerHTML = `<tr><td colspan="5" class="empty">No scheduled posts yet.</td></tr>`;
    return;
  }

  els.jobsTable.innerHTML = state.jobs
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((job) => {
      const body = escapeHtml(job.message || job.link || "(empty)").slice(0, 140);
      const time = formatDate(job.publishAt);
      const actions =
        job.status === "scheduled"
          ? `<button class="button ghost" data-run="${job.id}">Run</button>
             <button class="button ghost" data-delete="${job.id}">Delete</button>`
          : `<button class="button ghost" data-delete="${job.id}">Delete</button>`;
      return `<tr>
        <td>${escapeHtml(job.pageName || job.pageId)}</td>
        <td>${time}</td>
        <td><span class="badge ${escapeHtml(job.status)}">${escapeHtml(job.status)}</span></td>
        <td title="${escapeHtml(job.error || "")}">${body}</td>
        <td>${actions}</td>
      </tr>`;
    })
    .join("");
}

function renderActivity() {
  if (!state.activity.length) {
    els.activityList.innerHTML = `<div class="empty">No activity yet.</div>`;
    return;
  }

  els.activityList.innerHTML = state.activity
    .slice()
    .reverse()
    .map((item) => `<article class="activity-item">
      <div class="activity-type ${escapeHtml(item.type)}">${escapeHtml(item.type)}</div>
      <div>${escapeHtml(item.message)}</div>
      <div class="activity-time">${formatDate(item.at)}</div>
    </article>`)
    .join("");
}

function updatePreview() {
  const page = state.pages.find((item) => item.id === els.pageSelect.value);
  const message = els.messageInput.value.trim();
  const link = els.linkInput.value.trim();

  els.previewPage.textContent = page ? page.name : "Select a Page";
  els.previewMessage.textContent = message || "Your post preview will appear here.";
  els.previewLink.hidden = !link;
  els.previewLink.textContent = link;
}

async function loadStatus() {
  const status = await api("/api/status");
  renderStatus(status);
}

async function loadConfig() {
  const config = await api("/api/config");
  els.appIdInput.value = config.facebookAppId || "";
  els.appSecretInput.value = config.facebookAppSecret || "";
  els.graphVersionInput.value = config.graphVersion || "v23.0";
  els.redirectUriValue.textContent = config.redirectUri;
}

async function loadPages() {
  const data = await api("/api/pages");
  state.pages = data.pages || [];
  renderPages();
}

async function loadJobs() {
  const data = await api("/api/jobs");
  state.jobs = data.jobs || [];
  renderJobs();
}

async function loadActivity() {
  const data = await api("/api/activity");
  state.activity = data.activity || [];
  renderActivity();
}

async function refreshAll() {
  await Promise.all([loadStatus(), loadConfig(), loadPages(), loadJobs(), loadActivity()]);
}

async function saveConfig(event) {
  event.preventDefault();
  await api("/api/config", {
    method: "POST",
    body: JSON.stringify({
      facebookAppId: els.appIdInput.value,
      facebookAppSecret: els.appSecretInput.value,
      graphVersion: els.graphVersionInput.value
    })
  });
  toast("Config saved.");
  await refreshAll();
}

async function postNow(event) {
  event.preventDefault();
  if (!els.pageSelect.value) {
    toast("Connect and select a Page first.");
    return;
  }

  await api("/api/posts", {
    method: "POST",
    body: JSON.stringify({
      pageId: els.pageSelect.value,
      message: els.messageInput.value,
      link: els.linkInput.value
    })
  });
  toast("Post published.");
  els.messageInput.value = "";
  els.linkInput.value = "";
  updatePreview();
  await Promise.all([loadJobs(), loadActivity()]);
}

async function schedulePost() {
  if (!els.pageSelect.value) {
    toast("Connect and select a Page first.");
    return;
  }
  if (!els.publishAtInput.value) {
    toast("Pick a schedule time.");
    return;
  }

  await api("/api/jobs", {
    method: "POST",
    body: JSON.stringify({
      pageId: els.pageSelect.value,
      message: els.messageInput.value,
      link: els.linkInput.value,
      publishAt: els.publishAtInput.value
    })
  });
  toast("Post scheduled.");
  await Promise.all([loadJobs(), loadActivity()]);
}

async function handleJobsClick(event) {
  const runId = event.target.dataset.run;
  const deleteId = event.target.dataset.delete;

  if (runId) {
    await api(`/api/jobs/${runId}/run`, { method: "POST", body: "{}" });
    toast("Job published.");
  }
  if (deleteId) {
    await api(`/api/jobs/${deleteId}`, { method: "DELETE" });
    toast("Job removed.");
  }

  if (runId || deleteId) {
    await Promise.all([loadJobs(), loadActivity()]);
  }
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.navItems.forEach((item) => {
  item.addEventListener("click", () => switchView(item.dataset.tab));
});

els.refreshBtn.addEventListener("click", () => refreshAll().then(() => toast("Refreshed.")).catch((error) => toast(error.message)));
els.reloadJobsBtn.addEventListener("click", () => loadJobs().then(() => toast("Jobs refreshed.")).catch((error) => toast(error.message)));
els.reloadActivityBtn.addEventListener("click", () => loadActivity().then(() => toast("Activity refreshed.")).catch((error) => toast(error.message)));
els.configForm.addEventListener("submit", (event) => saveConfig(event).catch((error) => toast(error.message)));
els.composerForm.addEventListener("submit", (event) => postNow(event).catch((error) => toast(error.message)));
els.scheduleBtn.addEventListener("click", () => schedulePost().catch((error) => toast(error.message)));
els.jobsTable.addEventListener("click", (event) => handleJobsClick(event).catch((error) => toast(error.message)));
els.pageSelect.addEventListener("change", updatePreview);
els.messageInput.addEventListener("input", updatePreview);
els.linkInput.addEventListener("input", updatePreview);
els.copyRedirectBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(els.redirectUriValue.textContent);
  toast("Redirect URI copied.");
});
els.copySetupCallbackBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(state.status?.redirectUri || els.redirectUriValue.textContent);
  toast("Callback URL copied.");
});
els.openSettingsBtn.addEventListener("click", () => switchView("settings"));
els.connectBtn.addEventListener("click", (event) => {
  if (!state.status?.configured) {
    event.preventDefault();
    switchView("settings");
    toast("Save your Meta App config first.");
  }
});

refreshAll().catch((error) => toast(error.message));
