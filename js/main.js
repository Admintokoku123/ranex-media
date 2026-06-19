// ===============================
// Ranex Media - Main JavaScript
// ===============================

const html = document.documentElement;
const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");
const currentDate = document.getElementById("currentDate");

// ===============================
// Lucide Icons
// ===============================
if (window.lucide) {
  lucide.createIcons();
}

// ===============================
// Tanggal Indonesia
// ===============================
if (currentDate) {
  const now = new Date();
  currentDate.textContent = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ===============================
// Mobile Menu
// ===============================
if (menuBtn && navMenu) {
  menuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("show");

    const icon = menuBtn.querySelector("i");
    if (icon) {
      icon.setAttribute(
        "data-lucide",
        navMenu.classList.contains("show") ? "x" : "menu"
      );
      lucide.createIcons();
    }
  });

  document.addEventListener("click", (e) => {
    if (!menuBtn.contains(e.target) && !navMenu.contains(e.target)) {
      navMenu.classList.remove("show");

      const icon = menuBtn.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", "menu");
        lucide.createIcons();
      }
    }
  });
}

// ===============================
// Theme: light / dark / auto
// ===============================
const savedTheme = localStorage.getItem("ranexTheme") || "light";
const themeButtons = document.querySelectorAll("[data-theme-set]");

function applyTheme(theme) {
  if (theme === "auto") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    html.setAttribute("data-theme", theme);
  }

  localStorage.setItem("ranexTheme", theme);

  themeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.themeSet === theme);
  });
}

applyTheme(savedTheme);

themeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    applyTheme(btn.dataset.themeSet);
    showToast(`Tema ${btn.dataset.themeSet === "auto" ? "otomatis" : btn.dataset.themeSet} aktif`);
  });
});

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    if (localStorage.getItem("ranexTheme") === "auto") {
      applyTheme("auto");
    }
  });

// ===============================
// Scroll Animation
// ===============================
const revealElements = document.querySelectorAll(
  ".main-story, .side-stories article, .category-card, .article-row, .community-card, .section-title"
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("reveal-show");
        }, index * 80);
      }
    });
  },
  {
    threshold: 0.15,
  }
);

revealElements.forEach((el) => {
  el.classList.add("reveal");
  revealObserver.observe(el);
});

// ===============================
// Header Shadow Saat Scroll
// ===============================
const header = document.querySelector(".site-header");

window.addEventListener("scroll", () => {
  if (!header) return;

  if (window.scrollY > 20) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// ===============================
// Toast Notification
// ===============================
function showToast(message) {
  let toast = document.querySelector(".ranex-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "ranex-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// ===============================
// Cookie Consent
// ===============================
function createCookieConsent() {
  const accepted = localStorage.getItem("ranexCookieAccepted");

  if (accepted === "true") return;

  const cookieBox = document.createElement("div");
  cookieBox.className = "cookie-box";

  cookieBox.innerHTML = `
    <div class="cookie-icon">
      <i data-lucide="shield-check"></i>
    </div>

    <div class="cookie-content">
      <strong>Privasi & Cookie</strong>
      <p>
        Ranex Media menggunakan cookie untuk meningkatkan pengalaman membaca,
        menyimpan preferensi tema, dan membantu pengembangan layanan.
      </p>
    </div>

    <div class="cookie-actions">
      <button class="cookie-secondary" id="cookieLater">Nanti</button>
      <button class="cookie-primary" id="cookieAccept">Setuju</button>
    </div>
  `;

  document.body.appendChild(cookieBox);

  if (window.lucide) {
    lucide.createIcons();
  }

  setTimeout(() => {
    cookieBox.classList.add("show");
  }, 900);

  document.getElementById("cookieAccept").addEventListener("click", () => {
    localStorage.setItem("ranexCookieAccepted", "true");
    cookieBox.classList.remove("show");
    showToast("Preferensi cookie disimpan");
    setTimeout(() => cookieBox.remove(), 500);
  });

  document.getElementById("cookieLater").addEventListener("click", () => {
    cookieBox.classList.remove("show");
    showToast("Pengaturan cookie ditunda");
    setTimeout(() => cookieBox.remove(), 500);
  });
}

createCookieConsent();

// ===============================
// Breaking News Smooth Text
// ===============================
const breaking = document.querySelector(".breaking-marquee");

if (breaking) {
  breaking.addEventListener("mouseenter", () => {
    breaking.style.opacity = "0.75";
  });

  breaking.addEventListener("mouseleave", () => {
    breaking.style.opacity = "1";
  });
}

// ===============================
// Card Tilt Halus
// ===============================
const tiltCards = document.querySelectorAll(
  ".category-card, .side-stories article, .article-row"
);

tiltCards.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = (y / rect.height - 0.5) * -4;
    const rotateY = (x / rect.width - 0.5) * 4;

    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

// ===============================
// Loading Screen
// ===============================
window.addEventListener("load", () => {
  const loader = document.createElement("div");
  loader.className = "page-loaded-effect";
  document.body.appendChild(loader);

  setTimeout(() => {
    loader.classList.add("hide");
  }, 100);

  setTimeout(() => {
    loader.remove();
  }, 900);
});
// ===============================
// Global Search Overlay
// ===============================
const searchData = [
  {
    title: "Website resmi menjadi pondasi penting untuk kredibilitas bisnis digital",
    category: "Teknologi",
    url: "detail.html",
    desc: "Website perusahaan, kredibilitas digital, dan identitas brand."
  },
  {
    title: "Transformasi digital membuka peluang baru untuk UMKM Indonesia",
    category: "Teknologi",
    url: "detail.html",
    desc: "UMKM, aplikasi, website, dan perkembangan bisnis online."
  },
  {
    title: "Legalitas usaha membantu brand terlihat lebih dipercaya",
    category: "Bisnis",
    url: "detail.html",
    desc: "Perseroan perorangan, legalitas, NIB, OSS, dan kredibilitas."
  },
  {
    title: "Strategi membangun brand dari marketplace ke website sendiri",
    category: "Marketplace",
    url: "detail.html",
    desc: "Shopee, TikTok Shop, online shop, dan brand digital."
  },
  {
    title: "Forum komunitas Ranex Media",
    category: "Komunitas",
    url: "forum.html",
    desc: "Diskusi bisnis, teknologi, marketplace, dan website."
  },
  {
    title: "Kategori Ranex Media",
    category: "Kategori",
    url: "kategori.html",
    desc: "Teknologi, bisnis, UMKM, AI, website, aplikasi, dan lainnya."
  },
  {
    title: "Tentang Ranex Media",
    category: "Profil",
    url: "tentang.html",
    desc: "Media digital di bawah Ranex Group Indonesia."
  },
  {
    title: "Redaksi Ranex Media",
    category: "Legal",
    url: "redaksi.html",
    desc: "Susunan redaksi dan informasi pengelola media."
  }
];

function createSearchOverlay() {
  if (document.querySelector(".search-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "search-overlay";
  overlay.id = "searchOverlay";

  overlay.innerHTML = `
    <div class="search-modal">
      <div class="search-modal-head">
        <i data-lucide="search"></i>
        <input type="text" id="globalSearchInput" placeholder="Cari berita, kategori, forum, redaksi...">
        <button class="search-close" id="closeSearch">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="search-results" id="globalSearchResults">
        <div class="search-empty">Ketik kata kunci untuk mencari konten Ranex Media.</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  if (window.lucide) lucide.createIcons();

  const input = document.getElementById("globalSearchInput");
  const results = document.getElementById("globalSearchResults");
  const closeBtn = document.getElementById("closeSearch");

  function renderResults(keyword = "") {
    const q = keyword.toLowerCase().trim();

    if (!q) {
      results.innerHTML = `<div class="search-empty">Ketik kata kunci untuk mencari konten Ranex Media.</div>`;
      return;
    }

    const filtered = searchData.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
      );
    });

    if (!filtered.length) {
      results.innerHTML = `<div class="search-empty">Tidak ada hasil untuk "${keyword}".</div>`;
      return;
    }

    results.innerHTML = filtered.map((item) => `
      <a href="${item.url}" class="search-result-item">
        <span>${item.category}</span>
        <strong>${item.title}</strong>
        <small>${item.desc}</small>
      </a>
    `).join("");
  }

  input.addEventListener("input", () => {
    renderResults(input.value);
  });

  closeBtn.addEventListener("click", closeSearchOverlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSearchOverlay();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearchOverlay();
  });
}

function openSearchOverlay() {
  createSearchOverlay();

  const overlay = document.getElementById("searchOverlay");
  const input = document.getElementById("globalSearchInput");

  overlay.classList.add("show");

  setTimeout(() => {
    input?.focus();
  }, 80);
}

function closeSearchOverlay() {
  document.getElementById("searchOverlay")?.classList.remove("show");
}

document.querySelectorAll("#openSearch").forEach((btn) => {
  btn.addEventListener("click", openSearchOverlay);
});
// ===============================
// Back To Top Button
// ===============================
function createBackToTop() {
  if (document.querySelector(".back-to-top")) return;

  const btn = document.createElement("button");
  btn.className = "back-to-top";
  btn.id = "backToTop";
  btn.innerHTML = `<i data-lucide="arrow-up"></i>`;

  document.body.appendChild(btn);

  if (window.lucide) {
    lucide.createIcons();
  }

  window.addEventListener("scroll", () => {
    if (window.scrollY > 420) {
      btn.classList.add("show");
    } else {
      btn.classList.remove("show");
    }
  });

  btn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

createBackToTop();
// ==========================
// Newsletter Demo
// ==========================

const newsletterForm =
document.getElementById("newsletterForm");

newsletterForm?.addEventListener(
  "submit",
  (e) => {

    e.preventDefault();

    const email =
    document
    .getElementById("newsletterEmail")
    .value
    .trim();

    if (!email) return;

    let subscribers =
      JSON.parse(
        localStorage.getItem("ranex_newsletter")
      ) || [];

    if (!subscribers.includes(email)) {
      subscribers.push(email);

      localStorage.setItem(
        "ranex_newsletter",
        JSON.stringify(subscribers)
      );

      showToast(
        "Berhasil berlangganan newsletter"
      );
    } else {
      showToast(
        "Email sudah terdaftar"
      );
    }

    newsletterForm.reset();
  }
);
// ===============================
// Premium Breaking News Rotator
// ===============================
const breakingTexts = [
  "Ranex Media sedang dikembangkan sebagai portal berita dan komunitas digital.",
  "Fokus utama: teknologi, bisnis, UMKM, marketplace, AI, dan edukasi digital.",
  "Ranex Media berada di bawah Ranex Group Indonesia Perseroan Perorangan.",
  "Forum komunitas Ranex Media akan menjadi ruang diskusi digital untuk pengguna."
];

const breakingMarquee = document.querySelector(".breaking-marquee");

let breakingIndex = 0;

function updateBreakingNews() {
  if (!breakingMarquee) return;

  breakingMarquee.style.opacity = "0";
  breakingMarquee.style.transform = "translateY(8px)";

  setTimeout(() => {
    breakingMarquee.innerHTML = `
      <span>${breakingTexts[breakingIndex]}</span>
    `;

    breakingMarquee.style.opacity = "1";
    breakingMarquee.style.transform = "translateY(0)";

    breakingIndex = (breakingIndex + 1) % breakingTexts.length;
  }, 250);
}

updateBreakingNews();
setInterval(updateBreakingNews, 4500);
// ===============================
// Header Auth Status
// ===============================
async function updateHeaderAuth() {
  if (typeof supabaseClient === "undefined") return;

  const loginBtn = document.querySelector(".login-btn");
  if (!loginBtn) return;

  const { data } = await supabaseClient.auth.getSession();
  const session = data.session;

  if (session) {
  const { data: profile } = await supabaseClient
  .from("profiles")
  .select("role,email")
  .eq("id", session.user.id)
  .single();

if (
  profile?.email === "ranex.support@gmail.com" &&
  profile?.role === "admin"
) {
  loginBtn.textContent = "Admin";
  loginBtn.href = "admin.html";
} else {
  loginBtn.textContent = "Profil";
  loginBtn.href = "profil.html";
}
    loginBtn.classList.add("logged-in");
  } else {
    loginBtn.textContent = "Masuk";
    loginBtn.href = "login.html";
    loginBtn.classList.remove("logged-in");
  }
}

updateHeaderAuth();