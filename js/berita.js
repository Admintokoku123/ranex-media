const newsContainer =
document.getElementById("newsContainer");

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
      categories(
        name
      )
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

  if(!data.length){

    newsContainer.innerHTML = `
      <div class="empty-state">
        Belum ada artikel
      </div>
    `;

    return;
  }

  newsContainer.innerHTML =
  data.map(article => `

    <article class="news-card">

      <a
        href="detail.html?slug=${article.slug}"
      >

        <img
          src="${
            article.cover_url ||
            'assets/default-cover.jpg'
          }"
          alt="${article.title}"
        >

      </a>

      <div class="news-card-content">

        <span class="news-category">
          ${
            article.categories?.name ||
            'Artikel'
          }
        </span>

        <h3>
          <a
            href="detail.html?slug=${article.slug}"
          >
            ${article.title}
          </a>
        </h3>

        <p>
          ${article.excerpt || ''}
        </p>

      </div>

    </article>

  `).join("");

}

loadArticles();