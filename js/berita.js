const newsContainer = document.getElementById("newsContainer");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const headlineArticle = document.getElementById("headlineArticle");
const sideArticles = document.getElementById("sideArticles");

let allArticles = [];

async function loadCategories() {
  if (!categoryFilter) return;

  const { data, error } = await supabaseClient
    .from("categories")
    .select("id,name")
    .order("name");

  if (error) {
    console.error(error);
    return;
  }

  categoryFilter.innerHTML = `
    <option value="">Semua Kategori</option>
    ${data.map(cat => `
      <option value="${cat.name}">${cat.name}</option>
    `).join("")}
  `;
}

async function loadArticles() {
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
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showEmptyAll("Gagal memuat artikel");
    return;
  }

  allArticles = data || [];

  renderHeadline(allArticles);
  renderArticles(allArticles);
}

function renderHeadline(articles) {
  if (!headlineArticle || !sideArticles) return;

  if (!articles.length) {
    headlineArticle.innerHTML = `<div class="empty-state">Belum ada headline.</div>`;
    sideArticles.innerHTML = `<div class="empty-state">Belum ada artikel.</div>`;
    return;
  }

  const main = articles[0];
  const side = articles.slice(1, 4);

  headlineArticle.innerHTML = `
    <a href="detail.html?slug=${main.slug}" class="headline-card-link">
      <img src="${main.cover_url || "assets/default-cover.jpg"}" alt="${main.title}">
      <div>
        <span class="news-category">${main.categories?.name || "Artikel"}</span>
        <h3>${main.title}</h3>
        <p>${main.excerpt || ""}</p>
        <span class="read-more-btn">Baca Selengkapnya →</span>
      </div>
    </a>
  `;

  sideArticles.innerHTML = side.length
    ? side.map(article => `
      <a href="detail.html?slug=${article.slug}" class="latest-sidebar-item">
        <span>${article.categories?.name || "Artikel"}</span>
        <strong>${article.title}</strong>
      </a>
    `).join("")
    : `<div class="empty-state">Belum ada artikel lainnya.</div>`;
}

function renderArticles(articles) {
  if (!newsContainer) return;

  if (!articles.length) {
    newsContainer.innerHTML = `<div class="empty-state">Tidak ada artikel ditemukan.</div>`;
    return;
  }

  newsContainer.innerHTML = articles.map(article => `
    <article class="news-card">
      <a href="detail.html?slug=${article.slug}" class="news-cover-link">
        <img
          src="${article.cover_url || "assets/default-cover.jpg"}"
          alt="${article.title}"
          class="news-cover"
        >
      </a>

      <div class="news-card-content">
        <span class="news-category">${article.categories?.name || "Artikel"}</span>

        <h3>
          <a href="detail.html?slug=${article.slug}">
            ${article.title}
          </a>
        </h3>

        <p>${article.excerpt || ""}</p>

        <a href="detail.html?slug=${article.slug}" class="read-more-btn">
          Baca Selengkapnya →
        </a>
      </div>
    </article>
  `).join("");
}

function filterArticles() {
  const keyword = searchInput?.value.toLowerCase() || "";
  const category = categoryFilter?.value || "";

  const filtered = allArticles.filter(article => {
    const matchKeyword =
      article.title.toLowerCase().includes(keyword) ||
      (article.excerpt || "").toLowerCase().includes(keyword);

    const matchCategory =
      !category || article.categories?.name === category;

    return matchKeyword && matchCategory;
  });

  renderArticles(filtered);
}

function showEmptyAll(message) {
  if (headlineArticle) headlineArticle.innerHTML = `<div class="empty-state">${message}</div>`;
  if (sideArticles) sideArticles.innerHTML = `<div class="empty-state">${message}</div>`;
  if (newsContainer) newsContainer.innerHTML = `<div class="empty-state">${message}</div>`;
}

searchInput?.addEventListener("input", filterArticles);
categoryFilter?.addEventListener("change", filterArticles);

loadCategories();
loadArticles();
