const topicCategoryLabel = document.getElementById("topicCategoryLabel");
const topicTitle = document.getElementById("topicTitle");
const topicMeta = document.getElementById("topicMeta");
const topicAuthorAvatar = document.getElementById("topicAuthorAvatar");
const topicAuthor = document.getElementById("topicAuthor");
const topicDate = document.getElementById("topicDate");
const topicContent = document.getElementById("topicContent");

const replyForm = document.getElementById("replyForm");
const replyContent = document.getElementById("replyContent");
const replyList = document.getElementById("replyList");
const latestTopics = document.getElementById("latestTopics");

let currentTopic = null;

function getTopicId() {
  return new URLSearchParams(window.location.search).get("id");
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatText(text) {
  return text
    .split("\n")
    .filter(line => line.trim() !== "")
    .map(line => `<p>${line}</p>`)
    .join("");
}

async function getCurrentUser() {
  const { data } = await supabaseClient.auth.getSession();
  return data.session?.user || null;
}

async function loadTopicDetail() {
  const id = getTopicId();

  if (!id) {
    topicTitle.textContent = "Topik tidak ditemukan";
    topicMeta.textContent = "ID topik tidak tersedia.";
    return;
  }

  const { data, error } = await supabaseClient
    .from("forum_topics")
    .select(`
      id,
      title,
      content,
      category,
      views,
      created_at,
      profiles(name, avatar_url)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error(error);
    topicTitle.textContent = "Topik tidak ditemukan";
    topicMeta.textContent = "Topik mungkin sudah dihapus.";
    topicContent.innerHTML = "<p>Silakan kembali ke forum.</p>";
    return;
  }

  currentTopic = data;

  topicCategoryLabel.textContent = data.category || "Forum";
  topicTitle.textContent = data.title;
  topicMeta.textContent = `${data.category || "Diskusi"} • ${formatDate(data.created_at)} • ${data.views || 0} dilihat`;

  const authorName = data.profiles?.name || "Pengguna Ranex";
  topicAuthor.textContent = authorName;
  if (data.profiles?.avatar_url) {
  topicAuthorAvatar.innerHTML = `<img src="${data.profiles.avatar_url}" alt="${authorName}">`;
} else {
  topicAuthorAvatar.textContent = authorName.charAt(0).toUpperCase();
}
  topicDate.textContent = formatDate(data.created_at);
  topicContent.innerHTML = formatText(data.content || "");

  document.title = `${data.title} | Forum Ranex Media`;

  await supabaseClient
    .from("forum_topics")
    .update({ views: (data.views || 0) + 1 })
    .eq("id", id);

  loadReplies();
  loadLatestTopics(id);

  if (window.lucide) lucide.createIcons();
}

async function loadReplies() {
  const topicId = getTopicId();

  const { data, error } = await supabaseClient
    .from("forum_replies")
    .select(`
      id,
      content,
      created_at,
     profiles(name, avatar_url)
    `)
    .eq("topic_id", topicId)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    replyList.innerHTML = `<div class="empty-state">Gagal memuat balasan.</div>`;
    return;
  }

  if (!data.length) {
    replyList.innerHTML = `<div class="empty-state">Belum ada balasan. Jadilah yang pertama membalas.</div>`;
    return;
  }

  replyList.innerHTML = data.map(reply => {
    const name = reply.profiles?.name || "Pengguna Ranex";

    return `
      <div class="reply-item">
       <div class="comment-avatar">
  ${
    reply.profiles?.avatar_url
      ? `<img src="${reply.profiles.avatar_url}" alt="${name}">`
      : name.charAt(0).toUpperCase()
  }
</div>
        <div>
          <strong>${name}</strong>
          <small>${formatDate(reply.created_at)}</small>
          <p>${reply.content}</p>
        </div>
      </div>
    `;
  }).join("");
}

async function loadLatestTopics(currentId) {
  const { data, error } = await supabaseClient
    .from("forum_topics")
    .select("id, title, category, created_at")
    .eq("status", "published")
    .neq("id", currentId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !data?.length) {
    latestTopics.innerHTML = `<div class="empty-state">Belum ada topik terbaru.</div>`;
    return;
  }

  latestTopics.innerHTML = data.map(topic => `
    <a href="forum-detail.html?id=${topic.id}" class="latest-topic-item">
      <span>${topic.category || "Diskusi"}</span>
      <strong>${topic.title}</strong>
    </a>
  `).join("");
}

replyForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = await getCurrentUser();

  if (!user) {
    showToast("Silakan login untuk membalas topik");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);

    return;
  }

  const content = replyContent.value.trim();

  if (!content) {
    showToast("Balasan tidak boleh kosong");
    return;
  }

  const submitBtn = replyForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";

  const { error } = await supabaseClient
    .from("forum_replies")
    .insert({
      topic_id: getTopicId(),
      user_id: user.id,
      content,
      status: "published"
    });

  submitBtn.disabled = false;
  submitBtn.innerHTML = `<i data-lucide="send"></i> Kirim Balasan`;

  if (error) {
    console.error(error);
    showToast("Gagal mengirim balasan");
    return;
  }

  replyContent.value = "";
  showToast("Balasan berhasil dikirim");

  await loadReplies();

  if (window.lucide) lucide.createIcons();
});

loadTopicDetail();