
let currentUser = null;
let currentProfile = null;

/* ELEMENTS (SAFE CHECK) */
const el = (id) => document.getElementById(id);

/* =========================
   AUTH
========================= */
async function checkAdminAccess() {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    location.href = "login.html";
    return false;
  }

  currentUser = data.session.user;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (!profile || profile.role !== "admin") {
    location.href = "index.html";
    return false;
  }

  currentProfile = profile;

  if (el("adminName")) el("adminName").textContent = profile.name || "Admin";
  if (el("adminRole")) el("adminRole").textContent = profile.role;

  return true;
}

/* =========================
   ARTICLES
========================= */
async function loadArticles() {
  const { data } = await supabaseClient
    .from("articles")
    .select("id,title,slug,status,created_at,categories(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  const container = el("adminArticleList");
  const latest = el("latestArticles");

  if (!container || !latest) return;

  const html = (data || []).map(a => `
    <div class="admin-list-item">
      <div>
        <strong>${a.title}</strong>
        <span>${a.categories?.name || "-"} • ${a.status}</span>
      </div>
      <a href="detail.html?slug=${a.slug}" class="outline-btn">Lihat</a>
    </div>
  `).join("");

  container.innerHTML = html;
  latest.innerHTML = html;

  if (el("totalArticles")) {
    el("totalArticles").textContent = data?.length || 0;
  }
}

/* =========================
   USERS
========================= */
async function loadUsers() {
  const { data } = await supabaseClient
    .from("profiles")
    .select("name,email,role");

  const container = el("adminUserList");
  if (!container) return;

  container.innerHTML = (data || []).map(u => `
    <div class="admin-user-row">
      <div class="comment-avatar">
        ${(u.name || "U").charAt(0)}
      </div>
      <div>
        <strong>${u.name || "-"}</strong>
        <span>${u.email} • ${u.role}</span>
      </div>
    </div>
  `).join("");

  if (el("totalUsers")) {
    el("totalUsers").textContent = data?.length || 0;
  }
}

/* =========================
   SUBMISSIONS
========================= */
async function loadSubmissions() {
  const { data } = await supabaseClient
    .from("article_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  const container = el("submissionList");
  if (!container) return;

  container.innerHTML = (data || []).map(s => `
    <div class="admin-list-item">
      <div>
        <strong>${s.title}</strong>
        <span>${s.category || "-"} • ${s.status}</span>
      </div>
    </div>
  `).join("");
}

/* =========================
   COMMENTS
========================= */
async function loadComments() {
  const { data } = await supabaseClient
    .from("comments")
    .select("id,content,status")
    .order("created_at", { ascending: false });

  const container = el("adminCommentList");
  if (!container) return;

  container.innerHTML = (data || []).map(c => `
    <div class="admin-list-item">
      <div>
        <strong>${c.status}</strong>
        <span>${c.content}</span>
      </div>
    </div>
  `).join("");

  if (el("totalComments")) {
    const pending = (data || []).filter(c => c.status === "pending").length;
    el("totalComments").textContent = pending;
  }
}

/* =========================
   DASHBOARD STATS (SAFE)
========================= */
async function loadDashboardStats() {
  const [
    articles,
    users,
    comments,
    topics
  ] = await Promise.all([
    supabaseClient.from("articles").select("id", { count: "exact", head: true }),
    supabaseClient.from("profiles").select("id", { count: "exact", head: true }),
    supabaseClient.from("comments").select("id", { count: "exact", head: true }),
    supabaseClient.from("forum_topics").select("id", { count: "exact", head: true })
  ]);

  if (el("totalArticles")) el("totalArticles").textContent = articles.count || 0;
  if (el("totalUsers")) el("totalUsers").textContent = users.count || 0;
  if (el("totalComments")) el("totalComments").textContent = comments.count || 0;
  if (el("totalTopics")) el("totalTopics").textContent = topics.count || 0;
}

/* =========================
   ACTIVITY
========================= */
async function loadLatestActivity() {
  const { data } = await supabaseClient
    .from("articles")
    .select("title,status,created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const container = el("latestActivity");
  if (!container) return;

  container.innerHTML = (data || []).map(a => `
    <div class="admin-list-item">
      <div>
        <strong>${a.title}</strong>
        <span>${a.status}</span>
      </div>
    </div>
  `).join("");
}

/* =========================
   INIT (SAFE ORDER)
========================= */
async function initAdmin() {
  const ok = await checkAdminAccess();
  if (!ok) return;

  await loadDashboardStats();
  await loadArticles();
  await loadUsers();
  await loadSubmissions();
  await loadComments();
  await loadLatestActivity();
}

initAdmin();
