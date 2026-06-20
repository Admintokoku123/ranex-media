const authorAvatar = document.getElementById("authorAvatar");
const authorName = document.getElementById("authorName");
const authorBio = document.getElementById("authorBio");
const authorArticleCount = document.getElementById("authorArticleCount");
const authorReaderCount = document.getElementById("authorReaderCount");
const authorJoinYear = document.getElementById("authorJoinYear");
const authorArticleTitle = document.getElementById("authorArticleTitle");
const authorArticleGrid = document.getElementById("authorArticleGrid");

const params = new URLSearchParams(window.location.search);
const authorNameParam = params.get("name");

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

async function loadAdminAuthor() {

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("email", "ranex.support@gmail.com")
    .single();

  if (!profile) {
    authorName.textContent = "Penulis tidak ditemukan";
    return;
  }

  authorName.textContent =
    profile.name || "Tim Ranex Media";

  authorBio.textContent =
    profile.bio ||
    "Pengelola Ranex Media.";

  authorAvatar.src =
    profile.avatar_url ||
    "assets/logo-ranex-media.png";

  authorJoinYear.textContent =
    new Date(profile.created_at).getFullYear();

 const { data: articles } = await supabaseClient
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
  .or(`author_id.eq.${profile.id},writer_name.eq.Tim Ranex Media`)
  .eq("status", "published")
  .order("created_at", { ascending: false });
  
  authorArticleCount.textContent =
    articles?.length || 0;

  authorReaderCount.textContent = "0";

  authorArticleTitle.textContent =
    `Artikel dari ${authorName.textContent}`;

  authorArticleGrid.innerHTML =
    (articles || []).map(article => `
      <a href="detail.html?slug=${article.slug}" class="author-article-card">

        <img
          src="${article.cover_url || "assets/logo-ranex-media.png"}"
          alt="${article.title}"
          class="author-article-cover">

        <span>${article.categories?.name || "Artikel"}</span>

        <h3>${article.title}</h3>

        <p>${article.excerpt || ""}</p>

        <small>${formatDate(article.created_at)}</small>

      </a>
    `).join("");
}

async function loadContributorAuthor() {

  authorName.textContent =
    authorNameParam;

  authorBio.textContent =
    "Kontributor Ranex Media";

  authorAvatar.src =
    "assets/logo-ranex-media.png";

  authorJoinYear.textContent =
    "2026";

  const { data: articles, error } = await supabaseClient
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
    .eq("writer_name", authorNameParam)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  authorArticleCount.textContent =
    articles?.length || 0;

  authorReaderCount.textContent =
    "0";

  authorArticleTitle.textContent =
    `Artikel dari ${authorNameParam}`;

  authorArticleGrid.innerHTML =
    (articles || []).map(article => `
      <a href="detail.html?slug=${article.slug}" class="author-article-card">

        <img
          src="${article.cover_url || "assets/logo-ranex-media.png"}"
          alt="${article.title}"
          class="author-article-cover">

        <span>${article.categories?.name || "Artikel"}</span>

        <h3>${article.title}</h3>

        <p>${article.excerpt || ""}</p>

        <small>${formatDate(article.created_at)}</small>

      </a>
    `).join("");
}

async function loadAuthorPage() {

  if (
    !authorNameParam ||
    authorNameParam === "Tim Ranex Media"
  ) {
    await loadAdminAuthor();
  } else {
    await loadContributorAuthor();
  }
}

loadAuthorPage();
