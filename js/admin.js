
let currentUser = null;
let currentProfile = null;
let selectedArticleId = null;

/* =========================
   ELEMENTS
========================= */
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
   SLUG
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
        <img src="${reader.result}">
        <button type="button" class="danger-btn" id="removeCoverBtn">Hapus</button>
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

  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabaseClient
    .storage
    .from("article-covers")
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabaseClient
    .storage
    .from("article-covers")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/* =========================
   MENU
========================= */
adminMenuButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.adminTab;

    adminMenuButtons.forEach(b => b.classList.remove("active"));
    adminTabs.forEach(t => t.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(target)?.classList.add("active");

    lucide.createIcons();
  });
});

quickAddArticle?.addEventListener("click", () => {
  document.querySelector('[data-admin-tab="articles"]')?.click();
});

/* =========================
   AUTH
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

  if (!profile || profile.role !== "admin") {
    showToast("Akses ditolak");
    window.location.href = "index.html";
    return false;
  }

  currentProfile = profile;

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
    .select("id,name");

  articleCategory.innerHTML = `<option value="">Pilih kategori</option>`;

  (data || []).forEach(c => {
    articleCategory.innerHTML += `<option value="${c.id}">${c.name}</option>`;
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

  const html = (data || []).map(a => `
    <div class="admin-list-item">
      <div>
        <strong>${a.title}</strong>
        <span>${a.categories?.name || "No kategori"} • ${a.status}</span>
      </div>

      <div>
        <a href="detail.html?slug=${a.slug}" class="outline-btn">Lihat</a>

        <button class="outline-btn"
          onclick="openActionModal('${a.id}', '${a.title}')">
          Aksi
        </button>
      </div>
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

  adminUserList.innerHTML = (data || []).map(u => `
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

  document.getElementById("totalUsers").textContent = data?.length || 0;
}

/* =========================
   SUBMISSIONS
========================= */
async function loadSubmissions() {
  const { data } = await supabaseClient
    .from("article_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  submissionList.innerHTML = (data || []).map(s => `
    <div class="admin-list-item">
      <div>
        <strong>${s.title}</strong>
        <span>${s.category} • ${s.status}</span>
        ${s.rejection_reason ? `<small style="color:red">${s.rejection_reason}</small>` : ""}
      </div>

      <div>
        <button onclick="approveSubmission(${s.id})">Approve</button>
        <button onclick="rejectSubmission(${s.id})">Reject</button>
      </div>
    </div>
  `).join("");
}

/* =========================
   APPROVE / REJECT (FIXED, NO DUPLICATE)
========================= */
async function approveSubmission(id) {
  const { data: sub } = await supabaseClient
    .from("article_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (!sub) return;

  const slug = `${generateSlug(sub.title)}-${Date.now()}`;

  const { data: cat } = await supabaseClient
    .from("categories")
    .select("id")
    .eq("name", sub.category)
    .single();

  await supabaseClient.from("articles").insert({
    title: sub.title,
    slug,
    excerpt: sub.excerpt,
    content: sub.content,
    cover_url: sub.cover_url,
    category_id: cat?.id || null,
    author_id: sub.user_id,
    writer_name: sub.writer_name,
    writer_email: sub.writer_email,
    status: "published"
  });

  await supabaseClient
    .from("article_submissions")
    .update({ status: "approved" })
    .eq("id", id);

  showToast("Disetujui");
  loadSubmissions();
  loadArticles();
}

async function rejectSubmission(id) {
  const reason = prompt("Alasan penolakan:");
  if (!reason) return;

  await supabaseClient
    .from("article_submissions")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", id);

  showToast("Ditolak");
  loadSubmissions();
}

/* =========================
   ACTION MODAL (REVIEW FEATURE)
========================= */
function openActionModal(id, title) {
  selectedArticleId = id;

  document.getElementById("modalArticleTitle").textContent = title;
  document.getElementById("actionModal").classList.remove("hidden");
}

document.getElementById("closeModal")?.addEventListener("click", () => {
  document.getElementById("actionModal").classList.add("hidden");
});

document.getElementById("btnApprove").onclick = async () => {
  await supabaseClient.from("articles")
    .update({ status: "published" })
    .eq("id", selectedArticleId);

  showToast("Disetujui");
  document.getElementById("actionModal").classList.add("hidden");
  loadArticles();
};

document.getElementById("btnReject").onclick = async () => {
  const reason = prompt("Alasan:");
  if (!reason) return;

  await supabaseClient.from("articles")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", selectedArticleId);

  showToast("Ditolak");
  document.getElementById("actionModal").classList.add("hidden");
  loadArticles();
};

document.getElementById("btnReview").onclick = () => {
  window.open(`detail.html?slug=${selectedArticleId}`, "_blank");
};

document.getElementById("btnDelete").onclick = async () => {
  if (!confirm("Hapus artikel?")) return;

  await supabaseClient
    .from("articles")
    .delete()
    .eq("id", selectedArticleId);

  showToast("Dihapus");
  document.getElementById("actionModal").classList.add("hidden");
  loadArticles();
};

/* =========================
   ARTICLE FORM
========================= */
articleForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("articleTitle").value;
  const excerpt = document.getElementById("articleExcerpt").value;
  const content = document.getElementById("articleContent").value;
  const categoryId = document.getElementById("articleCategory").value;

  const cover = await uploadCoverImage();
  const slug = `${generateSlug(title)}-${Date.now()}`;

  await supabaseClient.from("articles").insert({
    title,
    slug,
    excerpt,
    content,
    cover_url: cover,
    category_id: categoryId,
    author_id: currentUser.id,
    writer_name: "Tim Ranex",
    status: "published"
  });

  showToast("Berhasil");
  articleForm.reset();

  loadArticles();
});

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
