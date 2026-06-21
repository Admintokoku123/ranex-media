const submitArticleForm = document.getElementById("submitArticleForm");
async function checkSubmissionLogin() {

  const { data } =
    await supabaseClient.auth.getSession();

  if (!data.session) {

    safeToast("Silakan login terlebih dahulu");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);

    return false;
  }

  return true;
}
const submissionCover = document.getElementById("submissionCover");
const submissionCoverPreview = document.getElementById("submissionCoverPreview");
const submitCategory = document.getElementById("submitCategory");

function safeToast(message) {
  if (typeof showToast === "function") {
    showToast(message);
  } else {
    alert(message);
  }
}

async function loadSubmitCategories() {
  if (!submitCategory || typeof supabaseClient === "undefined") return;

  submitCategory.innerHTML = `<option value="">Memuat kategori...</option>`;

  const { data, error } = await supabaseClient
    .from("categories")
    .select("name")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    submitCategory.innerHTML = `<option value="">Gagal memuat kategori</option>`;
    safeToast("Gagal memuat kategori");
    return;
  }

  if (!data || !data.length) {
    submitCategory.innerHTML = `<option value="">Belum ada kategori</option>`;
    return;
  }

  submitCategory.innerHTML = `
    <option value="">Pilih kategori</option>
    ${data.map((cat) => `
      <option value="${cat.name}">${cat.name}</option>
    `).join("")}
  `;
}

submissionCover?.addEventListener("change", () => {
  const file = submissionCover.files[0];

  if (!file) {
    submissionCoverPreview.innerHTML = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    safeToast("File cover harus berupa gambar");
    submissionCover.value = "";
    submissionCoverPreview.innerHTML = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    submissionCoverPreview.innerHTML = `
      <img src="${reader.result}" alt="Preview Cover">
    `;
  };

  reader.readAsDataURL(file);
});

async function uploadSubmissionCover() {
  const file = submissionCover?.files[0];

  if (!file) {
    throw new Error("Cover artikel wajib diupload");
  }

  const fileExt = file.name.split(".").pop().toLowerCase();

  const allowedExt = ["jpg", "jpeg", "png", "webp"];

  if (!allowedExt.includes(fileExt)) {
    throw new Error("Format cover harus JPG, PNG, atau WEBP");
  }

  const fileName = `submission-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  const { error } = await supabaseClient
    .storage
    .from("article-covers")
    .upload(fileName, file);

  if (error) {
    console.error(error);
    throw new Error("Gagal upload cover artikel");
  }

  const { data } = supabaseClient
    .storage
    .from("article-covers")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

submitArticleForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const writerName = document.getElementById("writerName").value.trim();
  const writerEmail = document.getElementById("writerEmail").value.trim();
  const title = document.getElementById("submitTitle").value.trim();
  const category = submitCategory.value;
  const excerpt = document.getElementById("submitExcerpt").value.trim();
  const content = document.getElementById("submitContent").value.trim();
  const agree = document.getElementById("submitAgree").checked;

  if (!writerName || !writerEmail || !title || !category || !excerpt || !content) {
    safeToast("Semua data wajib diisi");
    return;
  }

  if (!agree) {
    safeToast("Setujui ketentuan pengiriman artikel");
    return;
  }

  const submitBtn = submitArticleForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `Mengirim...`;

  try {
    const coverUrl = await uploadSubmissionCover();
    const { data: sessionData } =
  await supabaseClient.auth.getSession();

const authorId =
  sessionData.session.user.id;

    const { error } = await supabaseClient
      .from("article_submissions")
      .insert({
        author_id: authorId,
        writer_name: writerName,
        writer_email: writerEmail,
        title,
        category,
        excerpt,
        content,
        cover_url: coverUrl,
        status: "pending"
      });

    if (error) throw error;

    safeToast("Artikel berhasil dikirim ke redaksi");

    submitArticleForm.reset();
    submissionCoverPreview.innerHTML = "";

    await loadSubmitCategories();

  } catch (err) {
    console.error(err);
    safeToast(err.message || "Gagal mengirim artikel");
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = `
    <i data-lucide="send"></i>
    Kirim ke Redaksi
  `;

  if (window.lucide) lucide.createIcons();
});

loadSubmitCategories();

(async () => {

  const allowed =
    await checkSubmissionLogin();

  if (!allowed) return;

  loadSubmitCategories();

})();
