const profileMenuButtons = document.querySelectorAll(".profile-menu button");
const profileTabs = document.querySelectorAll(".profile-tab");
const logoutBtn = document.getElementById("logoutBtn");
const settingsForm = document.querySelector(".settings-form");
const avatarInput = document.getElementById("avatarInput");
const profileAvatarImg = document.getElementById("profileAvatarImg");
const editProfileBtn = document.getElementById("editProfileBtn");

let currentUser = null;

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

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

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

  if (error || !data || !data.length) {
    box.innerHTML = `<div class="empty-state">Belum ada artikel tersimpan.</div>`;
    return;
  }

  box.innerHTML = data.map((item) => {
    const article = item.articles;
    if (!article) return "";

    return `
      <a href="detail.html?slug=${article.slug}" class="article-row">
        <img src="${article.cover_url || "assets/logo-ranex-media.png"}" class="submission-cover-small">
        <div>
          <span class="category-label">${article.categories?.name || "Artikel"}</span>
          <h3>${article.title}</h3>
          <p>${article.excerpt || ""}</p>
        </div>
      </a>
    `;
  }).join("");
}

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

  if (error || !data || !data.length) {
    box.innerHTML = `<div class="empty-state">Belum ada komentar.</div>`;
    return;
  }

  box.innerHTML = data.map((comment) => `
    <div class="comment-item">
      <div class="comment-avatar">K</div>
      <div>
        <strong>${comment.articles?.title || "Artikel"}</strong>
        <p>${comment.content}</p>
        <a href="detail.html?slug=${comment.articles?.slug}">Lihat artikel</a>
      </div>
    </div>
  `).join("");
}

async function loadMyForum(userId) {
  const box = document.getElementById("myForumList");
  if (!box) return;

  const { data, error } = await supabaseClient
    .from("forum_topics")
    .select("id, title, content, category, views, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data || !data.length) {
    box.innerHTML = `<div class="empty-state">Belum ada topik forum.</div>`;
    return;
  }

  box.innerHTML = data.map((topic) => `
    <a href="forum-detail.html?id=${topic.id}" class="forum-mini-card">
      <i data-lucide="messages-square"></i>
      <div>
        <h3>${topic.title}</h3>
        <p>${topic.category || "Forum"} • ${topic.views || 0} dilihat</p>
      </div>
    </a>
  `).join("");

  if (window.lucide) lucide.createIcons();
}

async function loadProfile() {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    showToast("Silakan login terlebih dahulu");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);

    return;
  }

  const user = sessionData.session.user;
  currentUser = user;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error(error);
    showToast("Gagal memuat profil");
    return;
  }

  const name = profile?.name || user.email;
  const email = profile?.email || user.email;
  const role = profile?.role || "member";
  const bio = profile?.bio || "Member komunitas Ranex Media.";

  document.querySelector(".profile-main h1").textContent = name;
  document.querySelector(".profile-main p").textContent = email;
  document.querySelector(".role-badge").textContent = role;

  if (profile?.avatar_url && profileAvatarImg) {
    profileAvatarImg.src = profile.avatar_url;
  }

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

editProfileBtn?.addEventListener("click", () => {
  document.querySelector('[data-tab="settings"]')?.click();

  setTimeout(() => {
    document.querySelector('.settings-form input[type="text"]')?.focus();
  }, 200);
});

settingsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    showToast("Silakan login terlebih dahulu");
    return;
  }

  const nameInput = document.querySelector('.settings-form input[type="text"]');
  const bioInput = document.querySelector(".settings-form textarea");

  const name = nameInput.value.trim();
  const bio = bioInput.value.trim();

  if (!name) {
    showToast("Nama tidak boleh kosong");
    return;
  }

  const submitBtn = settingsForm.querySelector("button");
  submitBtn.disabled = true;
  submitBtn.textContent = "Menyimpan...";

  const { error } = await supabaseClient
    .from("profiles")
    .update({ name, bio })
    .eq("id", currentUser.id);

  submitBtn.disabled = false;
  submitBtn.textContent = "Simpan Perubahan";

  if (error) {
    console.error(error);
    showToast("Gagal menyimpan profil");
    return;
  }

  document.querySelector(".profile-main h1").textContent = name;
  showToast("Profil berhasil diperbarui");
});

avatarInput?.addEventListener("change", async () => {
  const file = avatarInput.files[0];
  if (!file) return;

  if (!currentUser) {
    showToast("Silakan login terlebih dahulu");
    return;
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;

  showToast("Mengupload foto...");

  const { error: uploadError } = await supabaseClient
    .storage
    .from("avatars")
    .upload(fileName, file);

  if (uploadError) {
    console.error(uploadError);
    showToast("Gagal upload foto");
    return;
  }

  const { data } = supabaseClient
    .storage
    .from("avatars")
    .getPublicUrl(fileName);

  const avatarUrl = data.publicUrl;

  const { error: updateError } = await supabaseClient
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", currentUser.id);

  if (updateError) {
    console.error(updateError);
    showToast("Gagal menyimpan foto");
    return;
  }

  if (profileAvatarImg) {
    profileAvatarImg.src = avatarUrl;
  }

  showToast("Foto profil berhasil diganti");
});

logoutBtn?.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();

  showToast("Berhasil keluar dari akun");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 900);
});

loadProfile();