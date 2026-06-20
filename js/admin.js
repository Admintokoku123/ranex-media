
let currentUser = null;
let currentProfile = null;

/* SAFE GET */
const $ = (id) => document.getElementById(id);

/* =========================
   AUTH
========================= */
async function checkAdminAccess() {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    window.location.href = "login.html";
    return false;
  }

  currentUser = data.session.user;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (!profile || profile.role !== "admin") {
    window.location.href = "index.html";
    return false;
  }

  currentProfile = profile;

  if ($("adminName")) $("adminName").textContent = profile.name || "Admin";
  if ($("adminRole")) $("adminRole").textContent = profile.role;

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

  const list = $("adminArticleList");
  const latest = $("latestArticles");

  if (!list || !latest) return;

  const html = (data || []).map(a => `
    <div class="admin-list-item">
      <div>
        <strong>${a.title}</strong>
        <span>${a.categories?.name || "-"} • ${a.status}</span>
      </div>
      <a href="detail.html?slug=${a.slug}" class="outline-btn">Lihat</a>
    </div>
  `).join("");

  list.innerHTML = html;
  latest.innerHTML = html;

  if ($("totalArticles")) {
    $("totalArticles").textContent = data?.length || 0;
  }
}

/* =========================
   USERS
========================= */
async function loadUsers() {
  const { data } = await supabaseClient
    .from("profiles")
    .select("name,email,role");

  const list = $("adminUserList");
  if (!list) return;

  list.innerHTML = (data || []).map(u => `
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

  if ($("totalUsers")) {
    $("totalUsers").textContent = data?.length || 0;
  }
}

/* =========================
   SUBMISSIONS (KIRIMAN ARTIKEL)
========================= */
async function loadSubmissions() {
  const { data } = await supabaseClient
    .from("article_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  const list = $("submissionList");
  if (!list) return;

  list.innerHTML = (data || []).map(s => `
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
    .select("content,status");

  const list = $("adminCommentList");
  if (!list) return;

  list.innerHTML = (data || []).map(c => `
    <div class="admin-list-item">
      <div>
        <strong>${c.status}</strong>
        <span>${c.content}</span>
      </div>
    </div>
  `).join("");

  const pending = (data || []).filter(c => c.status === "pending").length;
  if ($("totalComments")) {
    $("totalComments").textContent = pending;
  }
}

/* =========================
   FORUM COUNT
========================= */
async function loadForum() {
  const { data } = await supabaseClient
    .from("forum_topics")
    .select("id");

  if ($("totalTopics")) {
    $("totalTopics").textContent = data?.length || 0;
  }
}

/* =========================
   DASHBOARD STATS (SAFE)
========================= */
async function loadStats() {
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

  if ($("totalArticles")) $("totalArticles").textContent = articles.count || 0;
  if ($("totalUsers")) $("totalUsers").textContent = users.count || 0;
  if ($("totalComments")) $("totalComments").textContent = comments.count || 0;
  if ($("totalTopics")) $("totalTopics").textContent = topics.count || 0;
}

/* =========================
   INIT (SAFE ORDER FIX)
========================= */
async function initAdmin() {
  const ok = await checkAdminAccess();
  if (!ok) return;

  await loadStats();
  await loadArticles();
  await loadUsers();
  await loadSubmissions();
  await loadComments();
  await loadForum();
}

initAdmin();
