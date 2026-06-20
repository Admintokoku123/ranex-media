const homeHeadline = document.getElementById("homeHeadline");
const homeLatestArticles = document.getElementById("homeLatestArticles");
const popularTopics = document.getElementById("popularTopics");

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

function getCategoryName(article) {
  return article.categories?.name || "Artikel";
}

function getTopicIcon(category) {
  const name = category.toLowerCase();

  if (name.includes("breaking")) return "radio";
  if (name.includes("nasional")) return "landmark";
  if (name.includes("ekonomi")) return "trending-up";
  if (name.includes("sport")) return "trophy";
  if (name.includes("selebriti")) return "star";
  if (name.includes("hukum")) return "scale";
  if (name.includes("sorotan")) return "flame";
  if (name.includes("tech")) return "cpu";

  return "newspaper";
}

function getTopicDesc(category, count) {
  const name = category.toLowerCase();

  if (name.includes("breaking")) return `${count} artikel terbaru`;
  if (name.includes("nasional")) return `${count} artikel nasional`;
  if (name.includes("ekonomi")) return `${count} artikel ekonomi`;
  if (name.includes("sport")) return `${count} artikel olahraga`;
  if (name.includes("selebriti")) return `${count} artikel hiburan`;
  if (name.includes("hukum")) return `${count} artikel hukum`;
  if (name.includes("sorotan")) return `${count} isu publik`;
  if (name.includes("tech")) return `${count} artikel teknologi`;

  return `${count} artikel`;
}

async function loadPopularTopics() {
  if (!popularTopics) return;

  const { data, error } = await supabaseClient
    .from("articles")
    .select(`
      id,
      created_at,
      categories(name)
    `)
    .eq("status", "published");

  if (error) {
    console.error(error);
    popularTopics.innerHTML = `<div class="empty-state">Gagal memuat topik pilihan.</div>`;
    return;
  }

  if (!data || !data.length) {
    popularTopics.innerHTML = `<div class="empty-state">Belum ada topik pilihan.</div>`;
    return;
  }

  const counts = {};

  data.forEach((article) => {
    const category = article.categories?.name || "Artikel";
    counts[category] = (counts[category] || 0) + 1;
  });

  const sortedTopics = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  popularTopics.innerHTML = sortedTopics.map(([category, count]) => {
    return `
      <a href="berita.html?kategori=${encodeURIComponent(category)}" class="home-category-card">
        <i data-lucide="${getTopicIcon(category)}"></i>
        <strong>${category}</strong>
        <span>${getTopicDesc(category, count)}</span>
      </a>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
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
        ${getCategoryName(headline)}
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
            ${getCategoryName(article)}
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

loadPopularTopics();
loadHomeArticles();
