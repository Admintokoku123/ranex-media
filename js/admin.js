
let currentUser = null;
let currentProfile = null;

/* SAFE GET ELEMENT */
const $ = (id) => document.getElementById(id);

/* =========================
   AUTH CHECK
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

  if ($("totalArticles")) $("totalArticles").textContent = articles.count || 0;
  if ($("totalUsers")) $("totalUsers").textContent = users.count || 0;
  if ($("totalComments")) $("totalComments").textContent = comments.count || 0;
  if ($("totalTopics")) $("totalTopics").textContent = topics.count || 0;
}

/* =========================
   INIT PART 1
========================= */

async function initAdmin() {
  const ok = await checkAdminAccess();
  if (!ok) return;

  await loadDashboardStats();
  await loadArticles();
  await loadLatestActivity();
}

initAdmin();

async function loadArticles() {
  const { data } = await supabaseClient
    .from("articles")
    .select("id,title,slug,status,created_at,categories(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  const el = document.getElementById("latestArticles");

  if (!el) return;

  if (!data || data.length === 0) {
    el.innerHTML = `
      <div class="admin-list-item">
        <div>
          <strong>Belum ada data artikel</strong>
          <span>Artikel dari Supabase akan muncul di sini</span>
        </div>
      </div>
    `;
  } else {
    el.innerHTML = data.map(a => `
      <div class="admin-list-item">
        <div>
          <strong>${a.title}</strong>
          <span>${a.categories?.name || "-"} • ${a.status}</span>
        </div>
        <a href="detail.html?slug=${a.slug}" class="outline-btn">Lihat</a>
      </div>
    `).join("");
  }
}

/* =========================
   AKTIVITAS TERBARU (FIX)
========================= */
async function loadLatestActivity() {
  const { data } = await supabaseClient
    .from("articles")
    .select("title,status,created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  const container = document.querySelector(".activity-item")?.parentElement;

  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="activity-item">
        <i data-lucide="newspaper"></i>
        <p>Belum ada aktivitas</p>
      </div>
    `;
    return;
  }

  container.innerHTML = data.map(a => `
    <div class="activity-item">
      <i data-lucide="newspaper"></i>
      <p>${a.title} • ${a.status}</p>
    </div>
  `).join("");

  if (window.lucide) lucide.createIcons();
}
