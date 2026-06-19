const categoryContainer = document.getElementById("categoryContainer");

const categoryIcons = {
  "Teknologi": "cpu",
  "Bisnis": "briefcase-business",
  "UMKM": "store",
  "Marketplace": "shopping-cart",
  "Startup": "rocket",
  "AI": "bot",
  "Website": "globe-2",
  "Aplikasi": "smartphone",
  "Digital Marketing": "megaphone",
  "Edukasi": "graduation-cap",
  "Keuangan": "wallet",
  "Karier": "briefcase",
  "Komunitas": "messages-square",
  "Opini": "pen-line",
  "Nasional": "map",
  "Lifestyle Digital": "sparkles"
};

async function loadCategoriesPage() {
  const { data, error } = await supabaseClient
    .from("categories")
    .select("id, name, slug, description")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    categoryContainer.innerHTML = `
      <div class="empty-state">Gagal memuat kategori.</div>
    `;
    return;
  }

  if (!data || !data.length) {
    categoryContainer.innerHTML = `
      <div class="empty-state">Belum ada kategori.</div>
    `;
    return;
  }

  categoryContainer.innerHTML = data.map((cat) => {
    const icon = categoryIcons[cat.name] || "folder";

    return `
      <a href="berita.html?category=${encodeURIComponent(cat.name)}" class="category-page-card">
        <i data-lucide="${icon}"></i>

        <div>
          <h3>${cat.name}</h3>
          <p>${cat.description || "Kumpulan artikel pilihan dari Ranex Media."}</p>
          <span>Lihat Artikel</span>
        </div>
      </a>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

loadCategoriesPage();