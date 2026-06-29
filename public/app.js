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
  destinationType: document.querySelector("#destinationType"),
  unsupportedNotice: document.querySelector("#unsupportedNotice"),
  postType: document.querySelector("#postType"),
  messageInput: document.querySelector("#messageInput"),
  linkInput: document.querySelector("#linkInput"),
  imageUrlsInput: document.querySelector("#imageUrlsInput"),
  videoUrlInput: document.querySelector("#videoUrlInput"),
  productNameInput: document.querySelector("#productNameInput"),
  productPriceInput: document.querySelector("#productPriceInput"),
  productLocationInput: document.querySelector("#productLocationInput"),
  productDescriptionInput: document.querySelector("#productDescriptionInput"),
  contentFields: document.querySelectorAll(".content-field"),
  publishAtInput: document.querySelector("#publishAtInput"),
  composerForm: document.querySelector("#composerForm"),
  scheduleBtn: document.querySelector("#scheduleBtn"),
  previewPage: document.querySelector("#previewPage"),
  previewKind: document.querySelector("#previewKind"),
  previewMessage: document.querySelector("#previewMessage"),
  previewLink: document.querySelector("#previewLink"),
  previewMedia: document.querySelector("#previewMedia"),
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
    title: "Soạn bài",
    subtitle: "Đăng ngay hoặc lên lịch bài viết cho Page."
  },
  settings: {
    title: "Cài đặt",
    subtitle: "Cấu hình Meta App và OAuth redirect."
  },
  activity: {
    title: "Nhật ký",
    subtitle: "Theo dõi thao tác gần đây, kết quả đăng bài và lỗi Graph API."
  }
};

const postTypeLabels = {
  status: "Status",
  link: "Link",
  photos: "Ảnh/album",
  video: "Video",
  product: "Sản phẩm"
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
    throw new Error(data.error || `Yêu cầu thất bại: ${response.status}`);
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
  els.configuredState.textContent = status.configured ? "Sẵn sàng" : "Thiếu";
  els.connectedState.textContent = status.connected ? "Đã kết nối" : "Chưa kết nối";
  els.pageCount.textContent = status.pageCount;
  els.connectBtn.toggleAttribute("aria-disabled", !status.configured);
  els.connectBtn.classList.toggle("secondary", status.configured);
  els.connectBtn.classList.toggle("ghost", !status.configured);
  renderSetup(status);
}

function renderSetup(status) {
  const ready = status.configured && status.connected && status.pageCount > 0;
  els.setupPanel.hidden = ready;
  els.setupCallback.textContent = status.redirectUri || "Chưa lấy được callback URL.";

  els.stepConfig.classList.toggle("done", status.configured);
  els.stepCallback.classList.toggle("done", status.configured);
  els.stepConnect.classList.toggle("done", status.connected);

  if (!status.configured) {
    els.setupMessage.textContent = "Thêm Facebook App ID và App Secret trước khi kết nối Facebook.";
    return;
  }
  if (!status.connected) {
    els.setupMessage.textContent = "Thông tin Meta App đã sẵn sàng. Thêm callback URL trong Facebook Login, rồi kết nối Facebook.";
    return;
  }
  if (status.pageCount === 0) {
    els.setupMessage.textContent = "Facebook đã kết nối, nhưng chưa lấy được Page nào bạn quản lý.";
    return;
  }
  els.setupMessage.textContent = "Thiết lập xong. Chọn Page và bắt đầu đăng bài.";
}

function renderPages() {
  if (!state.pages.length) {
    els.pageSelect.innerHTML = `<option value="">Chưa kết nối Page</option>`;
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
    els.jobsTable.innerHTML = `<tr><td colspan="5" class="empty">Chưa có bài lên lịch.</td></tr>`;
    return;
  }

  els.jobsTable.innerHTML = state.jobs
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((job) => {
      const body = escapeHtml(summarizePayload(job)).slice(0, 140);
      const time = formatDate(job.publishAt);
      const actions =
        job.status === "scheduled"
          ? `<button class="button ghost" data-run="${job.id}">Đăng</button>
             <button class="button ghost" data-delete="${job.id}">Xóa</button>`
          : `<button class="button ghost" data-delete="${job.id}">Xóa</button>`;
      return `<tr>
        <td>${escapeHtml(job.pageName || job.pageId)}</td>
        <td>${time}</td>
        <td><span class="badge ${escapeHtml(job.status)}">${escapeHtml(formatStatus(job.status))}</span></td>
        <td title="${escapeHtml(job.error || "")}"><strong>${escapeHtml(formatPostType(job.postType))}</strong><br>${body}</td>
        <td>${actions}</td>
      </tr>`;
    })
    .join("");
}

function renderActivity() {
  if (!state.activity.length) {
    els.activityList.innerHTML = `<div class="empty">Chưa có nhật ký.</div>`;
    return;
  }

  els.activityList.innerHTML = state.activity
    .slice()
    .reverse()
    .map((item) => `<article class="activity-item">
      <div class="activity-type ${escapeHtml(item.type)}">${escapeHtml(formatActivityType(item.type))}</div>
      <div>${escapeHtml(item.message)}</div>
      <div class="activity-time">${formatDate(item.at)}</div>
    </article>`)
    .join("");
}

function getImageUrls() {
  return els.imageUrlsInput.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getProductPayload() {
  return {
    name: els.productNameInput.value.trim(),
    price: els.productPriceInput.value.trim(),
    location: els.productLocationInput.value.trim(),
    description: els.productDescriptionInput.value.trim()
  };
}

function buildProductMessage(payload) {
  const parts = [];
  if (payload.product.name) parts.push(payload.product.name);
  if (payload.product.price) parts.push(`Giá: ${payload.product.price}`);
  if (payload.product.location) parts.push(`Khu vực: ${payload.product.location}`);
  if (payload.product.description) parts.push(payload.product.description);
  if (payload.link) parts.push(payload.link);
  if (String(payload.message || "").trim()) parts.push(String(payload.message || "").trim());
  return parts.join("\n\n");
}

function buildPostPayload() {
  const postType = els.postType.value;
  return {
    pageId: els.pageSelect.value,
    destinationType: els.destinationType.value,
    postType,
    message: els.messageInput.value,
    link: ["link", "product"].includes(postType) ? els.linkInput.value : "",
    imageUrls: ["photos", "product"].includes(postType) ? getImageUrls() : [],
    videoUrl: postType === "video" ? els.videoUrlInput.value : "",
    product: postType === "product" ? getProductPayload() : {}
  };
}

function updateComposerFields() {
  const type = els.postType.value;
  const visible = new Set();
  if (type === "link") visible.add("link");
  if (type === "photos") visible.add("photos");
  if (type === "video") visible.add("video");
  if (type === "product") {
    visible.add("link");
    visible.add("photos");
    visible.add("product");
  }

  els.contentFields.forEach((field) => {
    field.hidden = !visible.has(field.dataset.field);
  });
  els.unsupportedNotice.hidden = els.destinationType.value === "page";
  updatePreview();
}

function summarizePayload(payload) {
  if (payload.postType === "photos") {
    return `${(payload.imageUrls || []).length} ảnh - ${payload.message || "Không có caption"}`;
  }
  if (payload.postType === "video") {
    return payload.videoUrl || payload.message || "Video";
  }
  if (payload.postType === "product") {
    return buildProductMessage({
      ...payload,
      product: payload.product || {}
    }) || "Sản phẩm";
  }
  return payload.message || payload.link || "(trống)";
}

function formatPostType(value) {
  return postTypeLabels[value || "status"] || value || "Status";
}

function resetComposer() {
  els.messageInput.value = "";
  els.linkInput.value = "";
  els.imageUrlsInput.value = "";
  els.videoUrlInput.value = "";
  els.productNameInput.value = "";
  els.productPriceInput.value = "";
  els.productLocationInput.value = "";
  els.productDescriptionInput.value = "";
  updatePreview();
}

function updatePreview() {
  const page = state.pages.find((item) => item.id === els.pageSelect.value);
  const payload = buildPostPayload();
  const message = payload.postType === "product" ? buildProductMessage(payload) : payload.message.trim();
  const link = payload.link.trim();

  els.previewPage.textContent = page ? page.name : "Chọn một Page";
  els.previewKind.textContent = `${formatPostType(payload.postType)} · ${payload.destinationType === "page" ? "Page" : "Không hỗ trợ đăng trực tiếp"}`;
  els.previewMessage.textContent = message || "Bản xem trước bài viết sẽ hiện ở đây.";
  els.previewLink.hidden = !link;
  els.previewLink.textContent = link;

  const media = [];
  if (payload.postType === "photos" || payload.postType === "product") {
    payload.imageUrls.forEach((url, index) => media.push(`Ảnh ${index + 1}: ${url}`));
  }
  if (payload.postType === "video" && payload.videoUrl.trim()) {
    media.push(`Video: ${payload.videoUrl.trim()}`);
  }
  els.previewMedia.hidden = media.length === 0;
  els.previewMedia.innerHTML = media.map((item) => `<div class="preview-media-item">${escapeHtml(item)}</div>`).join("");
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
  toast("Đã lưu cấu hình.");
  await refreshAll();
}

async function postNow(event) {
  event.preventDefault();
  if (els.destinationType.value !== "page") {
    toast("Chỉ hỗ trợ đăng trực tiếp lên Page qua Graph API chính thức.");
    return;
  }
  if (!els.pageSelect.value) {
    toast("Hãy kết nối và chọn Page trước.");
    return;
  }

  const payload = buildPostPayload();
  await api("/api/posts", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  toast("Đã đăng bài.");
  resetComposer();
  await Promise.all([loadJobs(), loadActivity()]);
}

async function schedulePost() {
  if (els.destinationType.value !== "page") {
    toast("Chỉ hỗ trợ lên lịch đăng trực tiếp lên Page qua Graph API chính thức.");
    return;
  }
  if (!els.pageSelect.value) {
    toast("Hãy kết nối và chọn Page trước.");
    return;
  }
  if (!els.publishAtInput.value) {
    toast("Hãy chọn thời gian lên lịch.");
    return;
  }

  const payload = buildPostPayload();
  await api("/api/jobs", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      publishAt: els.publishAtInput.value
    })
  });
  toast("Đã lên lịch bài viết.");
  await Promise.all([loadJobs(), loadActivity()]);
}

async function handleJobsClick(event) {
  const runId = event.target.dataset.run;
  const deleteId = event.target.dataset.delete;

  if (runId) {
    await api(`/api/jobs/${runId}/run`, { method: "POST", body: "{}" });
    toast("Đã đăng bài đã lên lịch.");
  }
  if (deleteId) {
    await api(`/api/jobs/${deleteId}`, { method: "DELETE" });
    toast("Đã xóa lịch đăng.");
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

function formatStatus(value) {
  return {
    scheduled: "Đã lên lịch",
    published: "Đã đăng",
    failed: "Lỗi"
  }[value] || value;
}

function formatActivityType(value) {
  return {
    success: "Thành công",
    error: "Lỗi",
    info: "Thông tin"
  }[value] || value;
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

els.refreshBtn.addEventListener("click", () => refreshAll().then(() => toast("Đã làm mới.")).catch((error) => toast(error.message)));
els.reloadJobsBtn.addEventListener("click", () => loadJobs().then(() => toast("Đã làm mới lịch đăng.")).catch((error) => toast(error.message)));
els.reloadActivityBtn.addEventListener("click", () => loadActivity().then(() => toast("Đã làm mới nhật ký.")).catch((error) => toast(error.message)));
els.configForm.addEventListener("submit", (event) => saveConfig(event).catch((error) => toast(error.message)));
els.composerForm.addEventListener("submit", (event) => postNow(event).catch((error) => toast(error.message)));
els.scheduleBtn.addEventListener("click", () => schedulePost().catch((error) => toast(error.message)));
els.jobsTable.addEventListener("click", (event) => handleJobsClick(event).catch((error) => toast(error.message)));
els.pageSelect.addEventListener("change", updatePreview);
els.destinationType.addEventListener("change", updateComposerFields);
els.postType.addEventListener("change", updateComposerFields);
els.messageInput.addEventListener("input", updatePreview);
els.linkInput.addEventListener("input", updatePreview);
els.imageUrlsInput.addEventListener("input", updatePreview);
els.videoUrlInput.addEventListener("input", updatePreview);
els.productNameInput.addEventListener("input", updatePreview);
els.productPriceInput.addEventListener("input", updatePreview);
els.productLocationInput.addEventListener("input", updatePreview);
els.productDescriptionInput.addEventListener("input", updatePreview);
els.copyRedirectBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(els.redirectUriValue.textContent);
  toast("Đã copy Redirect URI.");
});
els.copySetupCallbackBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(state.status?.redirectUri || els.redirectUriValue.textContent);
  toast("Đã copy callback URL.");
});
els.openSettingsBtn.addEventListener("click", () => switchView("settings"));
els.connectBtn.addEventListener("click", (event) => {
  if (!state.status?.configured) {
    event.preventDefault();
    switchView("settings");
    toast("Hãy lưu cấu hình Meta App trước.");
  }
});

updateComposerFields();
refreshAll().catch((error) => toast(error.message));
