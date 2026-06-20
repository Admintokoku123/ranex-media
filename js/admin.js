let currentUser = null;
let currentProfile = null;

const adminMenuButtons = document.querySelectorAll(".admin-menu button");
const adminTabs = document.querySelectorAll(".admin-tab");

const articleForm = document.getElementById("articleForm");
const adminArticleList = document.getElementById("adminArticleList");
const latestArticles = document.getElementById("latestArticles");

const adminUserList = document.getElementById("adminUserList");
const quickAddArticle = document.getElementById("quickAddArticle");
const articleCategory = document.getElementById("articleCategory");

const submissionList = document.getElementById("submissionList");
const adminForumList = document.getElementById("adminForumList");
const adminCommentList = document.getElementById("adminCommentList");

const coverInput = document.getElementById("articleCover");
const coverPreviewArea = document.getElementById("coverPreviewArea");

/* =========================
   UTIL
========================= */
function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}

/* =========================
   COVER PREVIEW
========================= */
coverInput?.addEventListener("change", () => {
  const file = coverInput.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    coverPreviewArea.innerHTML = `
      <div class="cover-preview-simple">
        <img src="${reader.result}" alt="Preview Cover">
        <button type="button" class="danger-btn" id="removeCoverBtn">Hapus Gambar</button>
      </div>
    `;

    document.getElementById("removeCoverBtn")?.addEventListener("click", () => {
      coverInput.value = "";
      coverPreviewArea.innerHTML = "";
    });
  };

  reader.readAsDataURL(file);
});

/* =========================
   UPLOAD COVER
========================= */
async function uploadCoverImage() {
  const file = coverInput?.files[0];
  if (!file) return null;

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error } = await supabaseClient
    .storage
    .from("article-covers")
    .upload(fileName, file);

  if (error) throw new Error("Gagal upload cover");

  const { data } = supabaseClient
    .storage
    .from("article-covers")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/* =========================
   MENU SWITCH
========================= */
adminMenuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.adminTab;

    adminMenuButtons.forEach(b => b.classList.remove("active"));
    adminTabs.forEach(t => t.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(target)?.classList.add("active");

    lucide.createIcons();
  });
});

quickAddArticle?.addEventListener("click", () => {
  document.querySelector('[data-admin-tab="articles"]')?.click();
});

/* =========================
   AUTH CHECK
========================= */
async function checkAdminAccess() {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    showToast("Silakan login");
    window.location.href = "login.html";
    return false;
  }

  currentUser = data.session.user;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (!profile) {
    showToast("Profil tidak ditemukan");
    return false;
  }

  currentProfile = profile;

  if (profile.role !== "admin") {
    showToast("Akses ditolak");
    window.location.href = "index.html";
    return false;
  }

  document.getElementById("adminName").textContent = profile.name || "Admin";
  document.getElementById("adminRole").textContent = profile.role;

  return true;
}

/* =========================
   CATEGORIES
========================= */
async function loadCategories() {
  const { data } = await supabaseClient
    .from("categories")
    .select("id, name");

  articleCategory.innerHTML = `<option value="">Pilih kategori</option>`;

  data?.forEach(cat => {
    articleCategory.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
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

  const html = (data || []).map(article => `
    <div class="admin-list-item">
      <div>
        <strong>${article.title}</strong>
        <span>${article.categories?.name || "No kategori"} • ${article.status}</span>
      </div>
      <a href="detail.html?slug=${article.slug}" class="outline-btn">Lihat</a>
    </div>
  `).join("");

  adminArticleList.innerHTML = html;
  latestArticles.innerHTML = html;

  document.getElementById("totalArticles").textContent = data?.length || 0;
}

/* =========================
   USERS
========================= */
async function loadUsers() {
  const { data } = await supabaseClient
    .from("profiles")
    .select("name,email,role");

  adminUserList.innerHTML = (data || []).map(user => `
    <div class="admin-user-row">
      <div class="comment-avatar">
        ${(user.name || "U").charAt(0)}
      </div>
      <div>
        <strong>${user.name || "-"}</strong>
        <span>${user.email} • ${user.role}</span>
      </div>
    </div>
  `).join("");

  document.getElementById("totalUsers").textContent = data?.length || 0;
}

/* =========================
   SUBMISSIONS FIX (NO DUPLICATE FUNCTION)
========================= */
async function approveSubmission(id) {
  const { data: submission } = await supabaseClient
    .from("article_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (!submission) return;

  const slug = `${generateSlug(submission.title)}-${Date.now()}`;

  const { data: category } = await supabaseClient
    .from("categories")
    .select("id")
    .eq("name", submission.category)
    .single();

  await supabaseClient.from("articles").insert({
    title: submission.title,
    slug,
    excerpt: submission.excerpt,
    content: submission.content,
    cover_url: submission.cover_url,
    category_id: category?.id || null,
    author_id: submission.user_id,
    writer_name: submission.writer_name,
    writer_email: submission.writer_email,
    status: "published"
  });

  await supabaseClient
    .from("article_submissions")
    .update({ status: "approved" })
    .eq("id", id);

  showToast("Disetujui");
  loadSubmissions();
}

async function rejectSubmission(id) {
  const reason = prompt("Alasan penolakan:");
  if (!reason) return;

  await supabaseClient
    .from("article_submissions")
    .update({
      status: "rejected",
      rejection_reason: reason
    })
    .eq("id", id);

  showToast("Ditolak");
  loadSubmissions();
}

/* =========================
   SUBMISSION LIST
========================= */
async function loadSubmissions() {
  const { data } = await supabaseClient
    .from("article_submissions")
    .select("*");

  submissionList.innerHTML = (data || []).map(item => `
    <div class="admin-list-item">
      <div>
        <strong>${item.title}</strong>
        <span>${item.category} • ${item.status}</span>
        ${item.rejection_reason ? `<small style="color:red">${item.rejection_reason}</small>` : ""}
      </div>
      <div>
        <button onclick="approveSubmission(${item.id})">Approve</button>
        <button onclick="rejectSubmission(${item.id})">Reject</button>
      </div>
    </div>
  `).join("");
}

/* =========================
   INIT
========================= */
async function initAdmin() {
  const ok = await checkAdminAccess();
  if (!ok) return;

  await loadCategories();
  await loadArticles();
  await loadUsers();
  await loadSubmissions();

  lucide.createIcons();
}

initAdmin();
