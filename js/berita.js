const newsContainer = document.getElementById("newsContainer");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");

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
      <option value="${cat.name}">
        ${cat.name}
      </option>
    `).join("")}
  `;
}

async function loadArticles() {

  const { data, error } =
  await supabaseClient
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
    .eq("status","published")
    .order("created_at", {
      ascending:false
    });

  if(error){

    console.error(error);

    newsContainer.innerHTML = `
      <div class="empty-state">
        Gagal memuat artikel
      </div>
    `;

    return;
  }

  allArticles = data || [];

  renderArticles(allArticles);
}

function renderArticles(articles){

  if(!articles.length){

    newsContainer.innerHTML = `
      <div class="empty-state">
        Tidak ada artikel ditemukan
      </div>
    `;

    return;
  }

  newsContainer.innerHTML = articles.map(article => `

    <article class="news-card">

      <a
        href="detail.html?slug=${article.slug}"
        class="news-cover-link"
      >
        <img
          src="${article.cover_url || 'assets/default-cover.jpg'}"
          alt="${article.title}"
          class="news-cover"
        >
      </a>

      <div class="news-card-content">

        <span class="news-category">
          ${article.categories?.name || 'Artikel'}
        </span>

        <h3>
          <a href="detail.html?slug=${article.slug}">
            ${article.title}
          </a>
        </h3>

        <p>
          ${article.excerpt || ''}
        </p>

        <a
          href="detail.html?slug=${article.slug}"
          class="read-more-btn"
        >
          Baca Selengkapnya →
        </a>

      </div>

    </article>

  `).join("");
}

function filterArticles(){

  const keyword =
  searchInput?.value.toLowerCase() || "";

  const category =
  categoryFilter?.value || "";

  const filtered =
  allArticles.filter(article => {

    const matchKeyword =
      article.title.toLowerCase().includes(keyword) ||
      (article.excerpt || "")
      .toLowerCase()
      .includes(keyword);

    const matchCategory =
      !category ||
      article.categories?.name === category;

    return matchKeyword && matchCategory;
  });

  renderArticles(filtered);
}

searchInput?.addEventListener(
  "input",
  filterArticles
);

categoryFilter?.addEventListener(
  "change",
  filterArticles
);

loadCategories();
loadArticles();
