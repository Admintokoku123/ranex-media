const forumList = document.getElementById("forumList");
const forumSearch = document.getElementById("forumSearch");
const forumSort = document.getElementById("forumSort");
const forumFilters = document.querySelectorAll(".forum-filter");

const openTopicModal = document.getElementById("openTopicModal");
const closeTopicModal = document.getElementById("closeTopicModal");
const topicModal = document.getElementById("topicModal");
const topicForm = document.getElementById("topicForm");

let allTopics = [];
let activeFilter = "all";

function formatForumDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getForumIcon(category) {
  const icons = {
    Bisnis: "briefcase-business",
    Teknologi: "cpu",
    Website: "globe-2",
    Marketplace: "shopping-cart",
    UMKM: "store",
    AI: "bot",
    Edukasi: "graduation-cap"
  };

  return icons[category] || "messages-square";
}

async function getCurrentUser() {
  const { data } = await supabaseClient.auth.getSession();
  return data.session?.user || null;
}

async function loadTopics() {
  const { data, error } = await supabaseClient
    .from("forum_topics")
    .select(`
      id,
      title,
      content,
      category,
      views,
      status,
      created_at,
     profiles(name, avatar_url)
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    forumList.innerHTML = `
      <div class="empty-state">Gagal memuat topik forum.</div>
    `;
    return;
  }

  allTopics = data || [];
  renderTopics();
}

function renderTopics() {
  const keyword = forumSearch.value.toLowerCase().trim();
  const sort = forumSort.value;

  let topics = [...allTopics];

  if (activeFilter !== "all") {
    topics = topics.filter(topic => topic.category === activeFilter);
  }

  if (keyword) {
    topics = topics.filter(topic =>
      topic.title.toLowerCase().includes(keyword) ||
      topic.content.toLowerCase().includes(keyword) ||
      (topic.category || "").toLowerCase().includes(keyword)
    );
  }

  if (sort === "popular") {
    topics.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else {
    topics.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  if (!topics.length) {
    forumList.innerHTML = `
      <div class="empty-state">Belum ada topik forum.</div>
    `;
    return;
  }

  forumList.innerHTML = topics.map(topic => `
    <article class="forum-topic-card">
     <div class="topic-icon">
  ${
    topic.profiles?.avatar_url
      ? `<img src="${topic.profiles.avatar_url}" alt="${topic.profiles?.name || "User"}">`
      : `<i data-lucide="${getForumIcon(topic.category)}"></i>`
  }
</div>

      <div>
        <div class="topic-meta">
          <span>${topic.category || "Diskusi"}</span>
          <small>${formatForumDate(topic.created_at)}</small>
          <small>oleh ${topic.profiles?.name || "Pengguna Ranex"}</small>
        </div>

        <h3>
          <a href="forum-detail.html?id=${topic.id}">
            ${topic.title}
          </a>
        </h3>

        <p>${topic.content.slice(0, 150)}${topic.content.length > 150 ? "..." : ""}</p>

        <div class="topic-footer">
          <span><i data-lucide="eye"></i> ${topic.views || 0} dilihat</span>
          <span><i data-lucide="message-circle"></i> Balasan</span>
        </div>
      </div>
    </article>
  `).join("");

  if (window.lucide) lucide.createIcons();
}

forumSearch?.addEventListener("input", renderTopics);
forumSort?.addEventListener("change", renderTopics);

forumFilters.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;

    forumFilters.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    renderTopics();
  });
});

openTopicModal?.addEventListener("click", async () => {
  const user = await getCurrentUser();

  if (!user) {
    showToast("Silakan login untuk membuat topik");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);

    return;
  }

  topicModal.classList.add("show");
  lucide.createIcons();
});

closeTopicModal?.addEventListener("click", () => {
  topicModal.classList.remove("show");
});

topicModal?.addEventListener("click", (e) => {
  if (e.target === topicModal) {
    topicModal.classList.remove("show");
  }
});

topicForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = await getCurrentUser();

  if (!user) {
    showToast("Silakan login terlebih dahulu");
    return;
  }

  const title = document.getElementById("topicTitle").value.trim();
  const category = document.getElementById("topicCategory").value;
  const content = document.getElementById("topicContent").value.trim();

  if (!title || !category || !content) {
    showToast("Semua kolom wajib diisi");
    return;
  }

  const submitBtn = topicForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Menyimpan...";

  const { error } = await supabaseClient
    .from("forum_topics")
    .insert({
      title,
      category,
      content,
      user_id: user.id,
      status: "published"
    });

  submitBtn.disabled = false;
  submitBtn.textContent = "Publikasikan Topik";

  if (error) {
    console.error(error);
    showToast("Gagal membuat topik");
    return;
  }

  showToast("Topik berhasil dipublikasikan");

  topicForm.reset();
  topicModal.classList.remove("show");

  await loadTopics();
});

loadTopics();