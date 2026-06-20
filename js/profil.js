/* =========================
   STATE
========================= */
let currentUser = null;

/* =========================
   DOM ELEMENTS
========================= */
const profileMenuButtons = document.querySelectorAll(".profile-menu button");
const profileTabs = document.querySelectorAll(".profile-tab");

const logoutBtn = document.getElementById("logoutBtn");
const settingsForm = document.querySelector(".settings-form");
const avatarInput = document.getElementById("avatarInput");
const profileAvatarImg = document.getElementById("profileAvatarImg");
const editProfileBtn = document.getElementById("editProfileBtn");

/* NOTIF */
const notifBtn = document.getElementById("notifBtn");
const notifDropdown = document.getElementById("notifDropdown");
const notifList = document.getElementById("notifList");
const notifBadge = document.getElementById("notifBadge");

/* =========================
   NOTIFICATION SYSTEM
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

function renderNotifications(items = []) {
  if (!notifList) return;

  if (!items.length) {
    notifList.innerHTML = `<div class="notif-empty">Belum ada notifikasi</div>`;
    return;
  }

  notifList.innerHTML = items.map(n => `
    <div class="notif-item ${n.is_read ? "read" : "unread"}">
      <strong>${n.title}</strong>
      <p>${n.message}</p>
    </div>
  `).join("");
}

function updateNotifBadge(items = []) {
  const unread = items.filter(n => !n.is_read).length;

  if (!notifBadge) return;

  notifBadge.textContent = unread;
  notifBadge.style.display = unread > 0 ? "flex" : "none";
}

async function loadNotifications(userId) {
  const { data, error } = await supabaseClient
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return console.error(error);

  renderNotifications(data || []);
  updateNotifBadge(data || []);
}

function subscribeNotifications(userId) {
  supabaseClient
    .channel("notifications-channel")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const n = payload.new;

        // langsung masuk UI
        if (notifList) {
          const el = document.createElement("div");
          el.className = "notif-item unread";
          el.innerHTML = `
            <strong>${n.title}</strong>
            <p>${n.message}</p>
          `;
          notifList.prepend(el);
        }

        // update badge & data full sync
        loadNotifications(userId);

        // animasi kecil
        notifBtn?.classList.add("shake");
        setTimeout(() => notifBtn?.classList.remove("shake"), 500);
      }
    )
    .subscribe((status) => {
      console.log("Realtime status:", status);
    });
}
/* =========================
   TAB SYSTEM
========================= */
profileMenuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.tab;

    profileMenuButtons.forEach(btn => btn.classList.remove("active"));
    profileTabs.forEach(tab => tab.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(target)?.classList.add("active");

    lucide?.createIcons();
  });
});

/* =========================
   HELPERS
========================= */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* =========================
   STATS
========================= */
async function loadProfileStats(userId) {
  const [b, c, t] = await Promise.all([
    supabaseClient.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabaseClient.from("comments").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabaseClient.from("forum_topics").select("id", { count: "exact", head: true }).eq("user_id", userId)
  ]);

  setText("savedCount", b.count || 0);
  setText("commentCount", c.count || 0);
  setText("topicCount", t.count || 0);
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
    .eq("user_id", userId);

  if (error || !data?.length) {
    box.innerHTML = `<div class="empty-state">Belum ada artikel tersimpan.</div>`;
    return;
  }

  box.innerHTML = data.map(i => {
    const a = i.articles;
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
    .eq("user_id", userId);

  if (error || !data?.length) {
    box.innerHTML = `<div class="empty-state">Belum ada komentar.</div>`;
    return;
  }

  box.innerHTML = data.map(c => `
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
    .eq("user_id", userId);

  if (error || !data?.length) {
    box.innerHTML = `<div class="empty-state">Belum ada topik forum.</div>`;
    return;
  }

  box.innerHTML = data.map(t => `
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
   LOAD PROFILE
========================= */
async function loadProfile() {
  const { data: session } = await supabaseClient.auth.getSession();

  if (!session.session) {
    showNotify("Silakan login terlebih dahulu", "error");
    return setTimeout(() => (window.location.href = "login.html"), 800);
  }

  const user = session.session.user;
  currentUser = user;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const name = profile?.name || user.email;
  const email = profile?.email || user.email;
  const role = profile?.role || "member";

  document.querySelector(".profile-main h1").textContent = name;
  document.querySelector(".profile-main p").textContent = email;
  document.querySelector(".role-badge").textContent = role;

  if (profile?.avatar_url) profileAvatarImg.src = profile.avatar_url;

  await loadProfileStats(user.id);
  await loadSavedArticles(user.id);
  await loadMyComments(user.id);
  await loadMyForum(user.id);
  await loadNotifications(user.id);
  subscribeNotifications(user.id);
}

/* =========================
   EDIT PROFILE BUTTON
========================= */
editProfileBtn?.addEventListener("click", () => {
  document.querySelector('.profile-menu button[data-tab="settings"]')?.click();
});

/* =========================
   UPDATE PROFILE
========================= */
settingsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = settingsForm.querySelector('input[type="text"]').value.trim();
  const bio = settingsForm.querySelector("textarea").value.trim();

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
   AVATAR
========================= */
avatarInput?.addEventListener("change", async () => {
  const file = avatarInput.files[0];
  if (!file) return;

  const fileName = `${currentUser.id}-${Date.now()}.${file.name.split(".").pop()}`;

  showNotify("Upload foto...", "info");

  const { error } = await supabaseClient.storage
    .from("avatars")
    .upload(fileName, file);

  if (error) return showNotify("Upload gagal", "error");

  const { data } = supabaseClient.storage.from("avatars").getPublicUrl(fileName);

  await supabaseClient
    .from("profiles")
    .update({ avatar_url: data.publicUrl })
    .eq("id", currentUser.id);

  profileAvatarImg.src = data.publicUrl;

  showNotify("Foto profil berhasil diperbarui", "success");
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
   NOTIF TOGGLE
========================= */
notifBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  notifDropdown?.classList.toggle("show");
});

document.addEventListener("click", (e) => {
  if (!notifDropdown?.contains(e.target) && !notifBtn?.contains(e.target)) {
    notifDropdown?.classList.remove("show");
  }
});

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  lucide?.createIcons();
});

loadProfile();
