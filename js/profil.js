/* =========================
   STATE
========================= */
const profileMenuButtons = document.querySelectorAll(".profile-menu button");
const profileTabs = document.querySelectorAll(".profile-tab");
const logoutBtn = document.getElementById("logoutBtn");
const settingsForm = document.querySelector(".settings-form");
const avatarInput = document.getElementById("avatarInput");
const profileAvatarImg = document.getElementById("profileAvatarImg");
const editProfileBtn = document.getElementById("editProfileBtn");

let currentUser = null;

/* =========================
   UI HELPERS (ANIMASI NOTIF)
========================= */
function showNotify(message, type = "success") {
  const el = document.createElement("div");
  el.className = `notify notify-${type}`;
  el.textContent = message;

  document.body.appendChild(el);

  setTimeout(() => el.classList.add("show"), 50);

  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* =========================
   TAB SYSTEM
========================= */
profileMenuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.tab;

    profileMenuButtons.forEach((btn) => btn.classList.remove("active"));
    profileTabs.forEach((tab) => tab.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(target)?.classList.add("active");

    if (window.lucide) lucide.createIcons();
  });
});

/* =========================
   STATS
========================= */
async function loadProfileStats(userId) {
  const [bookmarks, comments, topics] = await Promise.all([
    supabaseClient.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabaseClient.from("comments").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabaseClient.from("forum_topics").select("id", { count: "exact", head: true }).eq("user_id", userId)
  ]);

  setText("savedCount", bookmarks.count || 0);
  setText("commentCount", comments.count || 0);
  setText("topicCount", topics.count || 0);
}

/* =========================
   SAVED ARTICLES
========================= */
async function loadSavedArticles(userId) {
  const box = document.getElementById("savedArticlesList");
  if (!box) return;

  const { data, error } = await supabaseClient
    .from("bookmarks")
    .select(`
      id,
      articles (
        title,
        slug,
        excerpt,
        cover_url,
        created_at,
        categories(name)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    box.innerHTML = `<div class="empty-state">Belum ada artikel tersimpan.</div>`;
    return;
  }

  box.innerHTML = data.map((item) => {
    const a = item.articles;
    if (!a) return "";

    return `
      <a href="detail.html?slug=${a.slug}" class="article-row">
        <img src="${a.cover_url || "assets/logo-ranex-media.png"}">
        <div>
          <span>${a.categories?.name || "Artikel"}</span>
          <h3>${a.title}</h3>
          <p>${a.excerpt || ""}</p>
        </div>
      </a>
    `;
  }).join("");
}

/* =========================
   COMMENTS
========================= */
async function loadMyComments(userId) {
  const box = document.getElementById("myCommentsList");
  if (!box) return;

  const { data, error } = await supabaseClient
    .from("comments")
    .select(`
      id,
      content,
      created_at,
      articles(title, slug)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    box.innerHTML = `<div class="empty-state">Belum ada komentar.</div>`;
    return;
  }

  box.innerHTML = data.map((c) => `
    <div class="comment-item">
      <div class="comment-avatar">K</div>
      <div>
        <strong>${c.articles?.title || "Artikel"}</strong>
        <p>${c.content}</p>
        <a href="detail.html?slug=${c.articles?.slug}">Lihat</a>
      </div>
    </div>
  `).join("");
}

/* =========================
   FORUM
========================= */
async function loadMyForum(userId) {
  const box = document.getElementById("myForumList");
  if (!box) return;

  const { data, error } = await supabaseClient
    .from("forum_topics")
    .select("id, title, category, views")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    box.innerHTML = `<div class="empty-state">Belum ada topik forum.</div>`;
    return;
  }

  box.innerHTML = data.map((t) => `
    <a href="forum-detail.html?id=${t.id}" class="forum-mini-card">
      <i data-lucide="messages-square"></i>
      <div>
        <h3>${t.title}</h3>
        <p>${t.category || "Forum"} • ${t.views || 0}</p>
      </div>
    </a>
  `).join("");

  lucide?.createIcons();
}

/* =========================
   PROFILE LOAD
========================= */
async function loadProfile() {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    showNotify("Silakan login terlebih dahulu", "error");
    setTimeout(() => (window.location.href = "login.html"), 900);
    return;
  }

  const user = sessionData.session.user;
  currentUser = user;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const name = profile?.name || user.email;
  const email = profile?.email || user.email;
  const role = profile?.role || "member";
  const bio = profile?.bio || "Member Ranex Media";

  document.querySelector(".profile-main h1").textContent = name;
  document.querySelector(".profile-main p").textContent = email;
  document.querySelector(".role-badge").textContent = role;

  if (profile?.avatar_url) profileAvatarImg.src = profile.avatar_url;

  const nameInput = document.querySelector('.settings-form input[type="text"]');
  const emailInput = document.querySelector('.settings-form input[type="email"]');
  const bioInput = document.querySelector(".settings-form textarea");

  if (nameInput) nameInput.value = name;
  if (emailInput) emailInput.value = email;
  if (bioInput) bioInput.value = bio;

  await loadProfileStats(user.id);
  await loadSavedArticles(user.id);
  await loadMyComments(user.id);
  await loadMyForum(user.id);
}

/* =========================
   EDIT BUTTON
========================= */
editProfileBtn?.addEventListener("click", () => {
  document.querySelector('[data-tab="settings"]')?.click();
});

/* =========================
   UPDATE PROFILE
========================= */
settingsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.querySelector('.settings-form input[type="text"]').value.trim();
  const bio = document.querySelector(".settings-form textarea").value.trim();

  if (!name) return showNotify("Nama wajib diisi", "error");

  const { error } = await supabaseClient
    .from("profiles")
    .update({ name, bio })
    .eq("id", currentUser.id);

  if (error) return showNotify("Gagal update profil", "error");

  document.querySelector(".profile-main h1").textContent = name;
  showNotify("Profil berhasil diperbarui 🎉", "success");
});

/* =========================
   AVATAR UPLOAD
========================= */
avatarInput?.addEventListener("change", async () => {
  const file = avatarInput.files[0];
  if (!file) return;

  const fileName = `${currentUser.id}-${Date.now()}.${file.name.split(".").pop()}`;

  showNotify("Upload foto...", "info");

  const { error: uploadError } = await supabaseClient.storage
    .from("avatars")
    .upload(fileName, file);

  if (uploadError) return showNotify("Upload gagal", "error");

  const { data } = supabaseClient.storage.from("avatars").getPublicUrl(fileName);

  await supabaseClient
    .from("profiles")
    .update({ avatar_url: data.publicUrl })
    .eq("id", currentUser.id);

  profileAvatarImg.src = data.publicUrl;

  showNotify("Foto profil diperbarui", "success");
});

/* =========================
   LOGOUT
========================= */
logoutBtn?.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showNotify("Logout berhasil", "success");

  setTimeout(() => (window.location.href = "login.html"), 800);
});

/* =========================
   INIT
========================= */
loadProfile();
