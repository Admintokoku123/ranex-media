const homeHeadline = document.getElementById("homeHeadline");
const homeLatestArticles = document.getElementById("homeLatestArticles");

function homeCover(article) {
  return article.cover_url || "assets/logo-ranex-media.png";
}

function homeDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

async function loadHomeArticles() {
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
    .order("created_at", { ascending: false })
    .limit(7);

  if (error) {
    console.error(error);

    homeHeadline.innerHTML = `<div class="empty-state">Gagal memuat headline.</div>`;
    homeLatestArticles.innerHTML = `<div class="empty-state">Gagal memuat artikel.</div>`;
    return;
  }

  if (!data || !data.length) {
    homeHeadline.innerHTML = `<div class="empty-state">Belum ada artikel.</div>`;
    homeLatestArticles.innerHTML = `<div class="empty-state">Belum ada artikel terbaru.</div>`;
    return;
  }

  const headline = data[0];
  const latest = data.slice(1, 7);

  homeHeadline.innerHTML = `
    <a href="detail.html?slug=${headline.slug}">
      <img src="${homeCover(headline)}" alt="${headline.title}">
    </a>

    <div class="home-hero-card-content">
      <span class="news-category">
        ${headline.categories?.name || "Artikel"}
      </span>

      <h3>
        <a href="detail.html?slug=${headline.slug}">
          ${headline.title}
        </a>
      </h3>

      <p>${headline.excerpt || ""}</p>

      <small>${homeDate(headline.created_at)}</small>
    </div>
  `;

  homeLatestArticles.innerHTML = latest.length
    ? latest.map((article) => `
      <article class="news-card">
        <a href="detail.html?slug=${article.slug}">
          <img src="${homeCover(article)}" alt="${article.title}">
        </a>

        <div class="news-card-content">
          <span class="news-category">
            ${article.categories?.name || "Artikel"}
          </span>

          <h3>
            <a href="detail.html?slug=${article.slug}">
              ${article.title}
            </a>
          </h3>

          <p>${article.excerpt || ""}</p>

          <small>${homeDate(article.created_at)}</small>
        </div>
      </article>
    `).join("")
    : `<div class="empty-state">Belum ada artikel terbaru.</div>`;

  if (window.lucide) lucide.createIcons();
}

loadHomeArticles();