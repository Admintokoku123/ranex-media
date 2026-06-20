const detailCategory = document.getElementById("detailCategory");
const detailTitle = document.getElementById("detailTitle");
const detailExcerpt = document.getElementById("detailExcerpt");
const detailAuthor = document.getElementById("detailAuthor");
const detailDate = document.getElementById("detailDate");
const detailCover = document.getElementById("detailCover");
const detailContent = document.getElementById("detailContent");
const detailTags = document.getElementById("detailTags");
const relatedArticles = document.getElementById("relatedArticles");
const latestSidebarArticles = document.getElementById("latestSidebarArticles");

const copyLinkBtn = document.getElementById("copyLinkBtn");
const bookmarkBtn = document.getElementById("bookmarkBtn");
const shareWhatsApp = document.getElementById("shareWhatsApp");
const shareFacebook = document.getElementById("shareFacebook");
const shareNative = document.getElementById("shareNative");
const readingProgressBar = document.getElementById("readingProgressBar");

const commentInput = document.getElementById("commentInput");
const sendCommentBtn = document.getElementById("sendCommentBtn");
const commentList = document.getElementById("commentList");

let currentArticle = null;

function getSlug() {
  return new URLSearchParams(window.location.search).get("slug");
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatContent(text) {
  return (text || "")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => `<p>${line}</p>`)
    .join("");
}

function setMeta(selector, value) {
  const el = document.querySelector(selector);
  if (el && value) el.setAttribute("content", value);
}

function setCanonical(url) {
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute("href", url);
}

function updateArticleSEO(article) {
  const title = `${article.title} | Ranex Media`;
  const description = article.excerpt || "Baca artikel lengkap dari Ranex Media.";
  const image = article.cover_url || "https://media.ranexgroup.my.id/assets/logo-ranex-media.png";
  const url = `https://media.ranexgroup.my.id/detail.html?slug=${article.slug}`;

  document.title = title;

  setMeta('meta[name="description"]', description);

  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:image"]', image);
  setMeta('meta[property="og:url"]', url);

  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  setMeta('meta[name="twitter:image"]', image);

  setCanonical(url);

  addNewsArticleSchema(article, title, description, image, url);
}

function addNewsArticleSchema(article, title, description, image, url) {
  document.getElementById("newsArticleSchema")?.remove();

  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": description,
    "image": [image],
    "datePublished": article.created_at,
    "dateModified": article.created_at,
    "author": {
      "@type": "Person",
      "name": article.profiles?.name || "Redaksi Ranex"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Ranex Media",
      "logo": {
        "@type": "ImageObject",
        "url": "https://media.ranexgroup.my.id/assets/logo-ranex-media.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    }
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "newsArticleSchema";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

async function loadArticleDetail() {
  const slug = getSlug();

  if (!slug) {
    detailTitle.textContent = "Artikel tidak ditemukan";
    detailExcerpt.textContent = "Slug artikel tidak tersedia.";
    detailContent.innerHTML = `<p>Silakan kembali ke halaman berita.</p>`;
    return;
  }

  const { data, error } = await supabaseClient
    .from("articles")
    .select(`
  id,
  title,
  slug,
  excerpt,
  content,
  cover_url,
  writer_name,
  writer_email,
  created_at,
  categories(name),
  profiles(name)
`)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) {
    console.error(error);
    detailTitle.textContent = "Artikel tidak ditemukan";
    detailExcerpt.textContent = "Artikel mungkin sudah dihapus atau belum dipublikasikan.";
    detailContent.innerHTML = `<p>Silakan kembali ke halaman berita.</p>`;
    return;
  }

  currentArticle = data;

  updateArticleSEO(data);

  detailCategory.textContent = data.categories?.name || "Artikel";
  detailTitle.textContent = data.title;
  detailExcerpt.textContent = data.excerpt || "";
  detailAuthor.textContent =
  data.writer_name ||
  data.profiles?.name ||
  "Redaksi Ranex";
  const authorBoxName =
document.getElementById("authorBoxName");

const authorBoxBio =
document.getElementById("authorBoxBio");

const authorProfileLink =
document.getElementById("authorProfileLink");

const authorContactLink =
document.getElementById("authorContactLink");

const authorNameValue =
  data.writer_name ||
  data.profiles?.name ||
  "Tim Ranex Media";

if(authorBoxName){
  authorBoxName.textContent = authorNameValue;
}

if(authorBoxBio){

  if(data.writer_name){

    authorBoxBio.textContent =
      "Kontributor Ranex Media.";

  }else{

    authorBoxBio.textContent =
      "Pengelola Ranex Media dan Ranex Group Indonesia.";

  }

}

if(authorProfileLink){

  authorProfileLink.href =
    `penulis.html?name=${encodeURIComponent(authorNameValue)}`;

}

if(authorContactLink){

  if(data.writer_name){

    authorContactLink.href =
      `mailto:${data.writer_email || ""}`;

  }else{

    authorContactLink.href =
      "kontak.html";

  }

}
  const wordCount = (data.content || "").trim().split(/\s+/).length;
const readTime = Math.max(1, Math.ceil(wordCount / 200));

detailDate.textContent = `${formatDate(data.created_at)} • ${readTime} menit baca`;

  detailCover.src = data.cover_url || "assets/logo-ranex-media.png";
  detailCover.alt = data.title;

  detailContent.innerHTML = formatContent(data.content);

  detailTags.innerHTML = `
    <span>${data.categories?.name || "Artikel"}</span>
    <span>Ranex Media</span>
  `;

  await loadRelatedArticles(data.id);
  await loadLatestSidebar(data.id);
  await loadComments();

  if (window.lucide) lucide.createIcons();
}

async function loadRelatedArticles(currentId) {
  const { data, error } = await supabaseClient
    .from("articles")
    .select(`
      id,
      title,
      slug,
      excerpt,
      cover_url,
      created_at,
      categories(name)
    `)
    .eq("status", "published")
    .neq("id", currentId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error || !data?.length) {
    relatedArticles.innerHTML = `<div class="empty-state">Belum ada artikel terkait.</div>`;
    return;
  }

  relatedArticles.innerHTML = data.map((article) => `
    <a href="detail.html?slug=${article.slug}" class="related-card">
      <img
        src="${article.cover_url || "assets/logo-ranex-media.png"}"
        alt="${article.title}"
        class="related-cover"
      >

      <span>${article.categories?.name || "Artikel"}</span>
      <h3>${article.title}</h3>
      <small>${formatDate(article.created_at)}</small>
    </a>
  `).join("");
}

async function loadLatestSidebar(currentId) {
  const { data, error } = await supabaseClient
    .from("articles")
    .select(`
      id,
      title,
      slug,
      created_at,
      categories(name)
    `)
    .eq("status", "published")
    .neq("id", currentId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !data?.length) {
    latestSidebarArticles.innerHTML = `<div class="empty-state">Belum ada artikel terbaru.</div>`;
    return;
  }

  latestSidebarArticles.innerHTML = data.map((article) => `
    <a href="detail.html?slug=${article.slug}" class="latest-sidebar-item">
      <span>${article.categories?.name || "Artikel"}</span>
      <strong>${article.title}</strong>
    </a>
  `).join("");
}

async function loadComments() {
  if (!currentArticle || !commentList) return;

  const { data, error } = await supabaseClient
    .from("comments")
    .select(`
      id,
      content,
      created_at,
      profiles(name, avatar_url)
    `)
    .eq("article_id", currentArticle.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    commentList.innerHTML = `<div class="empty-state">Belum ada komentar.</div>`;
    return;
  }

  commentList.innerHTML = data.map((comment) => {
    const name = comment.profiles?.name || "Pengguna Ranex";

    return `
      <div class="comment-item">
        <div class="comment-avatar">
  ${
    comment.profiles?.avatar_url
      ? `<img src="${comment.profiles.avatar_url}" alt="${name}">`
      : name.charAt(0).toUpperCase()
  }
</div>
        <div>
          <strong>${name}</strong>
          <small>${formatDate(comment.created_at)}</small>
          <p>${comment.content}</p>
        </div>
      </div>
    `;
  }).join("");
}

sendCommentBtn?.addEventListener("click", async () => {
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if (!sessionData.session) {
    showToast("Silakan login untuk komentar");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);

    return;
  }

  if (!currentArticle) {
    showToast("Artikel belum dimuat");
    return;
  }

  const content = commentInput.value.trim();

  if (!content) {
    showToast("Komentar tidak boleh kosong");
    return;
  }

  sendCommentBtn.disabled = true;
  sendCommentBtn.textContent = "Mengirim...";

  const { error } = await supabaseClient
    .from("comments")
    .insert({
      article_id: currentArticle.id,
      user_id: sessionData.session.user.id,
      content,
      status: "published"
    });

  sendCommentBtn.disabled = false;
  sendCommentBtn.textContent = "Kirim Komentar";

  if (error) {
    console.error(error);
    showToast("Gagal mengirim komentar");
    return;
  }

  commentInput.value = "";
  showToast("Komentar berhasil dikirim");

  await loadComments();
});

copyLinkBtn?.addEventListener("click", async () => {
  await navigator.clipboard.writeText(window.location.href);
  showToast("Link artikel berhasil disalin");
});

bookmarkBtn?.addEventListener("click", () => {
  const key = `ranex_bookmark_${getSlug()}`;
  const saved = localStorage.getItem(key) === "true";

  localStorage.setItem(key, saved ? "false" : "true");

  bookmarkBtn.classList.toggle("bookmarked", !saved);

  const text = bookmarkBtn.querySelector("span");
  if (text) text.textContent = !saved ? "Tersimpan" : "Simpan";

  showToast(!saved ? "Artikel berhasil disimpan" : "Artikel dihapus dari simpanan");
});

shareWhatsApp?.addEventListener("click", () => {
  const url = `https://wa.me/?text=${encodeURIComponent(document.title + " - " + window.location.href)}`;
  window.open(url, "_blank");
});

shareFacebook?.addEventListener("click", () => {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
  window.open(url, "_blank");
});

shareNative?.addEventListener("click", async () => {
  if (navigator.share) {
    await navigator.share({
      title: document.title,
      text: currentArticle?.excerpt || "Baca artikel ini di Ranex Media",
      url: window.location.href
    });
  } else {
    await navigator.clipboard.writeText(window.location.href);
    showToast("Link artikel disalin");
  }
});

function updateReadingProgress() {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

  if (readingProgressBar) {
    readingProgressBar.style.width = progress + "%";
  }
}

window.addEventListener("scroll", updateReadingProgress);

loadArticleDetail();
updateReadingProgress();
