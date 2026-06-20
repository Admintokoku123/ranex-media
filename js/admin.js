
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
}

initAdmin();
