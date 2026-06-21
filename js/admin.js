// =============================
// ADMIN PANEL CORE (FIXED + REBUILD)
// =============================

const sb = supabase;

// =============================
// STATE
// =============================
let currentUser = null;
let currentRole = "member";
let currentArticle = null;

// =============================
// TOAST SYSTEM
// =============================
function toast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerText = message;

  document.body.appendChild(el);

  setTimeout(() => el.classList.add("show"), 100);

  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// =============================
// SLUG GENERATOR (SEO SAFE)
// =============================
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// =============================
// LOADING BUTTON
// =============================
function setLoading(btn, state) {
  if (!btn) return;

  if (state) {
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = "Loading...";
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.original;
    btn.disabled = false;
  }
}

// =============================
// INIT ADMIN USER
// =============================
async function initAdmin() {
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  currentUser = user;

  document.getElementById("adminName").innerText =
    user.user_metadata?.name || user.email;

  await loadDashboard();
  await loadAll();
}

// =============================
// DASHBOARD STATS
// =============================
async function loadDashboard() {
  const [articles, users, comments, forums, submissions] = await Promise.all([
    sb.from("articles").select("*", { count: "exact", head: true }),
    sb.from("profiles").select("*", { count: "exact", head: true }),
    sb.from("comments").eq("status", "pending").select("*", { count: "exact", head: true }),
    sb.from("forums").select("*", { count: "exact", head: true }),
    sb.from("submissions").eq("status", "pending").select("*", { count: "exact", head: true }),
  ]);

  document.getElementById("totalArticles").innerText = articles.count || 0;
  document.getElementById("totalUsers").innerText = users.count || 0;
  document.getElementById("totalComments").innerText = comments.count || 0;
  document.getElementById("totalTopics").innerText = forums.count || 0;
  document.getElementById("totalSubmissions").innerText = submissions.count || 0;
}

// =============================
// LOAD ALL DATA
// =============================
async function loadAll() {
  loadArticles();
  loadSubmissions();
  loadComments();
  loadUsers();
  loadLatestArticles();
}

// =============================
// ARTICLES
// =============================
async function loadArticles() {
  const { data } = await sb
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  const container = document.getElementById("adminArticleList");
  container.innerHTML = "";

  data?.forEach((a) => {
    const el = document.createElement("div");
    el.className = "admin-list-item";

    el.innerHTML = `
      <div>
        <strong>${a.title}</strong>
        <span>${a.status || "published"}</span>
      </div>
      <button onclick="openActionModal('article', '${a.id}', '${a.title}')">
        Aksi
      </button>
    `;

    container.appendChild(el);
  });
}

// =============================
// SUBMISSIONS
// =============================
async function loadSubmissions() {
  const { data } = await sb
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  const container = document.getElementById("submissionList");
  container.innerHTML = "";

  data?.forEach((s) => {
    const el = document.createElement("div");
    el.className = "admin-list-item";

    el.innerHTML = `
      <div>
        <strong>${s.title}</strong>
        <span>${s.status}</span>
      </div>
      <button onclick="openActionModal('submission', '${s.id}', '${s.title}')">
        Aksi
      </button>
    `;

    container.appendChild(el);
  });
}

// =============================
// COMMENTS
// =============================
async function loadComments() {
  const { data } = await sb
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });

  const container = document.getElementById("adminCommentList");
  container.innerHTML = "";

  data?.forEach((c) => {
    const el = document.createElement("div");
    el.className = "admin-list-item";

    el.innerHTML = `
      <div>
        <strong>${c.content}</strong>
        <span>${c.status}</span>
      </div>
    `;

    container.appendChild(el);
  });
}

// =============================
// USERS
// =============================
async function loadUsers() {
  const { data } = await sb.from("profiles").select("*");

  const container = document.getElementById("adminUserList");
  container.innerHTML = "";

  data?.forEach((u) => {
    const el = document.createElement("div");
    el.className = "admin-user-row";

    el.innerHTML = `
      <div class="comment-avatar">${u.name?.[0] || "U"}</div>
      <div>
        <strong>${u.name}</strong>
        <span>${u.email}</span>
      </div>
    `;

    container.appendChild(el);
  });
}

// =============================
// LATEST ARTICLES
// =============================
async function loadLatestArticles() {
  const { data } = await sb
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const container = document.getElementById("latestArticles");
  container.innerHTML = "";

  data?.forEach((a) => {
    const el = document.createElement("div");
    el.className = "admin-list-item";

    el.innerHTML = `
      <div>
        <strong>${a.title}</strong>
        <span>${new Date(a.created_at).toLocaleString()}</span>
      </div>
    `;

    container.appendChild(el);
  });
}

// =============================
// MODAL ACTION
// =============================
window.openActionModal = function (type, id, title) {
  currentArticle = { type, id };

  document.getElementById("modalArticleTitle").innerText = title;
  document.getElementById("actionModal").classList.remove("hidden");
};

// close modal
document.getElementById("closeModal").onclick = () => {
  document.getElementById("actionModal").classList.add("hidden");
};

// =============================
// ACTION HANDLER
// =============================
async function handleAction(action) {
  const btn = event.target;
  setLoading(btn, true);

  const table = currentArticle.type === "article" ? "articles" : "submissions";

  let status = "";

  if (action === "approve") status = "approved";
  if (action === "reject") status = "rejected";
  if (action === "review") status = "review";
  if (action === "delete") status = null;

  if (action === "delete") {
    await sb.from(table).delete().eq("id", currentArticle.id);
    toast("Data dihapus");
  } else {
    await sb.from(table).update({ status }).eq("id", currentArticle.id);
    toast(`Status: ${status}`);
  }

  // audit log
  await sb.from("audit_logs").insert([
    {
      user_id: currentUser.id,
      action,
      target_id: currentArticle.id,
      target_type: currentArticle.type,
    },
  ]);

  setLoading(btn, false);
  document.getElementById("actionModal").classList.add("hidden");

  loadAll();
}

// bind buttons
document.getElementById("btnApprove").onclick = () => handleAction("approve");
document.getElementById("btnReject").onclick = () => handleAction("reject");
document.getElementById("btnReview").onclick = () => handleAction("review");
document.getElementById("btnDelete").onclick = () => handleAction("delete");

// =============================
// REALTIME SUPABASE
// =============================
function initRealtime() {
  sb.channel("admin-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "articles" },
      () => loadAll()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "submissions" },
      () => loadAll()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "comments" },
      () => loadAll()
    )
    .subscribe();
}

// =============================
// INIT BUTTONS
// =============================
document.addEventListener("DOMContentLoaded", () => {
  initAdmin();
  initRealtime();
});
