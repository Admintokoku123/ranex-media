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

function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}

coverInput?.addEventListener("change", () => {

  const file = coverInput.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {

    coverPreviewArea.innerHTML = `
      <div class="cover-preview-simple">

        <img
          src="${reader.result}"
          alt="Preview Cover"
        >

        <button
          type="button"
          class="danger-btn cover-delete-btn"
          id="removeCoverBtn"
        >
          Hapus Gambar
        </button>

      </div>
    `;

    document
      .getElementById("removeCoverBtn")
      ?.addEventListener("click", () => {

        coverInput.value = "";

        coverPreviewArea.innerHTML = "";

      });

  };

  reader.readAsDataURL(file);

});

async function uploadCoverImage() {
  const file = coverInput?.files[0];

  if (!file) return null;

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error } = await supabaseClient
    .storage
    .from("article-covers")
    .upload(fileName, file);

  if (error) {
    console.error(error);
    throw new Error("Gagal upload cover artikel");
  }

  const { data } = supabaseClient
    .storage
    .from("article-covers")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

adminMenuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.adminTab;

    adminMenuButtons.forEach((btn) => btn.classList.remove("active"));
    adminTabs.forEach((tab) => tab.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(target)?.classList.add("active");

    lucide.createIcons();
  });
});

quickAddArticle?.addEventListener("click", () => {
  document.querySelector('[data-admin-tab="articles"]')?.click();
});

async function checkAdminAccess() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
    showToast("Silakan login terlebih dahulu");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);

    return false;
  }

  currentUser = data.session.user;

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (profileError || !profile) {
    showToast("Profil tidak ditemukan");
    return false;
  }

  currentProfile = profile;

  if (profile.email !== "ranex.support@gmail.com" || profile.role !== "admin") {
    showToast("Akses admin ditolak");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);

    return false;
  }

  document.getElementById("adminName").textContent = profile.name || "Admin";
  document.getElementById("adminRole").textContent = profile.role || "admin";

  return true;
}

async function loadCategories() {
  const { data, error } = await supabaseClient
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    showToast("Gagal memuat kategori");
    return;
  }

  articleCategory.innerHTML = `<option value="">Pilih kategori</option>`;

  data.forEach((cat) => {
    articleCategory.innerHTML += `
      <option value="${cat.id}">${cat.name}</option>
    `;
  });
}

async function loadArticles() {
  const { data, error } = await supabaseClient
    .from("articles")
    .select(`
      id,
      title,
      slug,
      status,
      created_at,
      categories (
        name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("totalArticles").textContent = data.length;

  if (!data.length) {
    const empty = `
      <div class="admin-list-item">
        <div>
          <strong>Belum ada artikel</strong>
          <span>Artikel yang kamu buat akan muncul di sini</span>
        </div>
      </div>
    `;

    adminArticleList.innerHTML = empty;
    latestArticles.innerHTML = empty;
    return;
  }

  const html = data.map((article) => `
    <div class="admin-list-item">
      <div>
        <strong>${article.title}</strong>
        <span>${article.categories?.name || "Tanpa kategori"} • ${article.status}</span>
      </div>
      <a href="detail.html?slug=${article.slug}" class="outline-btn">Lihat</a>
    </div>
  `).join("");

  adminArticleList.innerHTML = html;
  latestArticles.innerHTML = html;
}

async function loadUsers() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("name, email, role")
    .order("created_at", { ascending: false })
    .limit(10);

    
  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("totalUsers").textContent = data.length;

  adminUserList.innerHTML = data.map((user) => `
    <div class="admin-user-row">
      <div class="comment-avatar">
        ${(user.name || user.email || "U").charAt(0).toUpperCase()}
      </div>

      <div>
        <strong>${user.name || "Tanpa nama"}</strong>
        <span>${user.email || "-"} • ${user.role || "member"}</span>
      </div>
    </div>
  `).join("");
}
async function loadSubmissions() {
  if (!submissionList) return;

  const { data, error } = await supabaseClient
    .from("article_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    submissionList.innerHTML = `
      <div class="admin-list-item">
        <div>
          <strong>Gagal memuat kiriman</strong>
          <span>Cek koneksi Supabase</span>
        </div>
      </div>
    `;
    return;
  }

  if (!data.length) {
    submissionList.innerHTML = `
      <div class="admin-list-item">
        <div>
          <strong>Belum ada kiriman artikel</strong>
          <span>Kiriman kontributor akan muncul di sini</span>
        </div>
      </div>
    `;
    return;
  }

  submissionList.innerHTML = data.map((item) => `
    <div class="admin-list-item">
      <img src="${item.cover_url || 'assets/logo-ranex-media.png'}" class="submission-cover-small">

      <div>
        <strong>${item.title}</strong>
        <span>${item.category || 'Tanpa kategori'} • ${item.status}</span>
        <small>${item.writer_name} • ${item.writer_email}</small>
      </div>

      <div class="submission-actions">
        ${
          item.status === "pending"
          ? `
            <button class="approve-btn" onclick="approveSubmission(${item.id})">
              Setujui
            </button>

            <button class="danger-btn" onclick="rejectSubmission(${item.id})">
              Tolak
            </button>
          `
          : `<span>${item.status}</span>`
        }
      </div>
    </div>
  `).join("");
}
async function approveSubmission(id) {
  const { data: submission, error: fetchError } = await supabaseClient
    .from("article_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !submission) {
    showToast("Kiriman tidak ditemukan");
    return;
  }

  const slug = `${generateSlug(submission.title)}-${Date.now()}`;

  const { data: categoryData } = await supabaseClient
    .from("categories")
    .select("id")
    .eq("name", submission.category)
    .single();

  const { error: insertError } = await supabaseClient
    .from("articles")
    .insert({
      title: submission.title,
      slug,
      excerpt: submission.excerpt,
      content: submission.content,
      cover_url: submission.cover_url,
      category_id: categoryData?.id || null,
      author_id: currentUser.id,
     writer_name: submission.writer_name,
  writer_email: submission.writer_email,
      status: "published"
    });

  if (insertError) {
    console.error(insertError);
    showToast("Gagal menyetujui artikel");
    return;
  }

  await supabaseClient
    .from("article_submissions")
    .update({ status: "approved" })
    .eq("id", id);

  showToast("Artikel disetujui dan dipublikasikan");

  await loadSubmissions();
  await loadArticles();
}

async function rejectSubmission(id) {
  const { error } = await supabaseClient
    .from("article_submissions")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    console.error(error);
    showToast("Gagal menolak artikel");
    return;
  }

  showToast("Artikel ditolak");
  await loadSubmissions();
}
articleForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("articleTitle").value.trim();
  const excerpt = document.getElementById("articleExcerpt").value.trim();
  const content = document.getElementById("articleContent").value.trim();
  const categoryId = document.getElementById("articleCategory").value;

  if (!title || !excerpt || !content) {
    showToast("Judul, ringkasan, dan isi artikel wajib diisi");
    return;
  }

  const submitBtn = articleForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Menyimpan...";

  try {
    const coverUrl = await uploadCoverImage();
    const slug = `${generateSlug(title)}-${Date.now()}`;

    const { error } = await supabaseClient.from("articles").insert({
      title,
      slug,
      excerpt,
      content,
      cover_url: coverUrl,
      category_id: categoryId || null,
      author_id: currentUser.id,
      status: "published"
    });

    if (error) throw error;

    showToast("Artikel berhasil dipublikasikan");
    articleForm.reset();

    if (coverPreviewArea) {
      coverPreviewArea.innerHTML = `
        <i data-lucide="image-plus"></i>
        <span>Upload Cover Artikel</span>
      `;
      lucide.createIcons();
    }

    await loadArticles();

  } catch (err) {
    console.error(err);
    showToast(err.message || "Gagal menyimpan artikel");
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Publikasikan";
});

const adminLogoutBtn = document.getElementById("adminLogoutBtn");


adminLogoutBtn?.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showToast("Admin berhasil logout");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 900);
});

async function loadDashboardStats() {
  const [
    articlesCount,
    usersCount,
    pendingCommentsCount,
    topicsCount,
    repliesCount,
    pendingSubmissionsCount
  ] = await Promise.all([
    supabaseClient.from("articles").select("id", { count: "exact", head: true }),
    supabaseClient.from("profiles").select("id", { count: "exact", head: true }),
    supabaseClient.from("comments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabaseClient.from("forum_topics").select("id", { count: "exact", head: true }),
    supabaseClient.from("forum_replies").select("id", { count: "exact", head: true }),
    supabaseClient.from("article_submissions").select("id", { count: "exact", head: true }).eq("status", "pending")
  ]);

  document.getElementById("totalArticles").textContent = articlesCount.count || 0;
  document.getElementById("totalUsers").textContent = usersCount.count || 0;
  document.getElementById("totalComments").textContent = pendingCommentsCount.count || 0;
  document.getElementById("totalTopics").textContent = topicsCount.count || 0;

  const statsBox = document.querySelector(".admin-stats");

  if (statsBox && !document.getElementById("totalReplies")) {
    statsBox.innerHTML += `
      <div>
        <i data-lucide="reply"></i>
        <strong id="totalReplies">${repliesCount.count || 0}</strong>
        <span>Balasan Forum</span>
      </div>

      <div>
        <i data-lucide="inbox"></i>
        <strong id="totalSubmissions">${pendingSubmissionsCount.count || 0}</strong>
        <span>Kiriman Pending</span>
      </div>
    `;
  } else {
    document.getElementById("totalReplies").textContent = repliesCount.count || 0;
    document.getElementById("totalSubmissions").textContent = pendingSubmissionsCount.count || 0;
  }

  lucide.createIcons();
}

async function initAdmin() {
  const allowed = await checkAdminAccess();

  if (!allowed) return;

  await loadCategories();
  await loadDashboardStats();
  await loadArticles();
  await loadUsers();
  await loadSubmissions();
  await loadForumModeration();
  await loadCommentModeration();

  lucide.createIcons();
}
initAdmin();
async function loadForumModeration() {
  if (!adminForumList) return;

  const { data, error } = await supabaseClient
    .from("forum_topics")
    .select("id, title, category, status, created_at, profiles(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    adminForumList.innerHTML = `<div class="empty-state">Gagal memuat forum.</div>`;
    return;
  }

  if (!data.length) {
    adminForumList.innerHTML = `<div class="empty-state">Belum ada topik forum.</div>`;
    return;
  }

  adminForumList.innerHTML = data.map(topic => `
    <div class="admin-list-item">
      <div>
        <strong>${topic.title}</strong>
        <span>${topic.category || "Forum"} • ${topic.status} • ${topic.profiles?.name || "User"}</span>
      </div>

      <div class="submission-actions">
        <a href="forum-detail.html?id=${topic.id}" class="outline-btn">Lihat</a>
        <button class="approve-btn" onclick="publishTopic(${topic.id})">Aktifkan</button>
        <button class="danger-btn" onclick="hideTopic(${topic.id})">Sembunyikan</button>
        <button class="danger-btn" onclick="deleteTopic(${topic.id})">Hapus</button>
      </div>
    </div>
  `).join("");
}

async function publishTopic(id) {
  await supabaseClient
    .from("forum_topics")
    .update({ status: "published" })
    .eq("id", id);

  showToast("Topik diaktifkan");
  await loadForumModeration();
}

async function hideTopic(id) {
  await supabaseClient
    .from("forum_topics")
    .update({ status: "hidden" })
    .eq("id", id);

  showToast("Topik disembunyikan");
  await loadForumModeration();
}
async function deleteTopic(id) {
  const confirmDelete = confirm("Yakin mau hapus topik forum ini? Semua balasan juga akan ikut terhapus.");

  if (!confirmDelete) return;

  const { error } = await supabaseClient
    .from("forum_topics")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    showToast("Gagal menghapus topik");
    return;
  }

  showToast("Topik forum berhasil dihapus");

  await loadForumModeration();
  await loadDashboardStats();
}
async function loadCommentModeration() {
  if (!adminCommentList) return;

  const { data, error } = await supabaseClient
    .from("comments")
    .select(`
      id,
      content,
      status,
      created_at,
      profiles(name,email),
      articles(title,slug)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    adminCommentList.innerHTML = `<div class="empty-state">Gagal memuat komentar.</div>`;
    return;
  }

  if (!data.length) {
    adminCommentList.innerHTML = `<div class="empty-state">Belum ada komentar.</div>`;
    return;
  }

  adminCommentList.innerHTML = data.map(comment => `
    <div class="admin-list-item">
      <div>
        <strong>${comment.profiles?.name || "User"}</strong>
        <span>${comment.articles?.title || "Artikel"} • ${comment.status}</span>
        <p>${comment.content}</p>
      </div>

      <div class="submission-actions">
        <a href="detail.html?slug=${comment.articles?.slug}" class="outline-btn">Lihat</a>
        <button class="approve-btn" onclick="publishComment(${comment.id})">Aktifkan</button>
        <button class="danger-btn" onclick="hideComment(${comment.id})">Sembunyikan</button>
        <button class="danger-btn" onclick="deleteComment(${comment.id})">Hapus</button>
      </div>
    </div>
  `).join("");
}

async function publishComment(id) {
  await supabaseClient.from("comments").update({ status: "published" }).eq("id", id);
  showToast("Komentar diaktifkan");
  await loadCommentModeration();
  await loadDashboardStats();
}

async function hideComment(id) {
  await supabaseClient.from("comments").update({ status: "hidden" }).eq("id", id);
  showToast("Komentar disembunyikan");
  await loadCommentModeration();
  await loadDashboardStats();
}

async function deleteComment(id) {
  if (!confirm("Yakin mau hapus komentar ini?")) return;

  const { error } = await supabaseClient
    .from("comments")
    .delete()
    .eq("id", id);

  if (error) {
    showToast("Gagal menghapus komentar");
    return;
  }

  showToast("Komentar berhasil dihapus");
  await loadCommentModeration();
  await loadDashboardStats();
}
