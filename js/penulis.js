const authorAvatar = document.getElementById("authorAvatar");
const authorName = document.getElementById("authorName");
const authorBio = document.getElementById("authorBio");
const authorArticleCount = document.getElementById("authorArticleCount");
const authorReaderCount = document.getElementById("authorReaderCount");
const authorJoinYear = document.getElementById("authorJoinYear");
const authorArticleTitle = document.getElementById("authorArticleTitle");
const authorArticleGrid = document.getElementById("authorArticleGrid");

const ADMIN_EMAIL = "ranex.support@gmail.com";

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

async function loadAuthorPage() {
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("email", ADMIN_EMAIL)
    .single();

  if (profileError || !profile) {
    console.error(profileError);
    authorName.textContent = "Penulis tidak ditemukan";
    authorBio.textContent = "Profil penulis belum tersedia.";
    authorArticleGrid.innerHTML = `<div class="empty-state">Belum ada data penulis.</div>`;
    return;
  }

  const name = profile.name || "Admin Ranex Media";
  const bio = profile.bio || "Pengelola Ranex Media yang menulis tentang bisnis digital, teknologi, UMKM, legalitas usaha, marketplace, dan perkembangan dunia digital.";
  const avatar = profile.avatar_url || "assets/logo-ranex-media.png";
  const joinYear = profile.created_at
    ? new Date(profile.created_at).getFullYear()
    : 2026;

  document.title = `${name} | Penulis Ranex Media`;

  authorName.textContent = name;
  authorBio.textContent = bio;
  authorAvatar.src = avatar;
  authorAvatar.alt = name;
  authorJoinYear.textContent = joinYear;
  authorArticleTitle.textContent = `Artikel dari ${name}`;

  const { data: articles, error: articleError } = await supabaseClient
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
    .eq("author_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (articleError) {
    console.error(articleError);
    authorArticleGrid.innerHTML = `<div class="empty-state">Gagal memuat artikel penulis.</div>`;
    return;
  }

  authorArticleCount.textContent = articles.length || 0;
  authorReaderCount.textContent = "0";

  if (!articles.length) {
    authorArticleGrid.innerHTML = `<div class="empty-state">Belum ada artikel dari penulis ini.</div>`;
    return;
  }

  authorArticleGrid.innerHTML = articles.map(article => `
    <a href="detail.html?slug=${article.slug}" class="author-article-card">

      <img
        src="${article.cover_url || "assets/logo-ranex-media.png"}"
        alt="${article.title}"
        class="author-article-cover"
      >

      <span>${article.categories?.name || "Artikel"}</span>

      <h3>${article.title}</h3>

      <p>${article.excerpt || ""}</p>

      <small>${formatDate(article.created_at)} • 6 menit baca</small>

    </a>
  `).join("");

  if (window.lucide) lucide.createIcons();
}

loadAuthorPage();
