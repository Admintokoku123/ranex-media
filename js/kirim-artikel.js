const submitArticleForm = document.getElementById("submitArticleForm");
const submissionCover = document.getElementById("submissionCover");
const submissionCoverPreview = document.getElementById("submissionCoverPreview");

submissionCover?.addEventListener("change", () => {
  const file = submissionCover.files[0];
  if (!file) return;

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

  const fileExt = file.name.split(".").pop();
  const fileName = `submission-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

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
  const category = document.getElementById("submitCategory").value;
  const excerpt = document.getElementById("submitExcerpt").value.trim();
  const content = document.getElementById("submitContent").value.trim();
  const agree = document.getElementById("submitAgree").checked;

  if (!writerName || !writerEmail || !title || !category || !excerpt || !content) {
    showToast("Semua data wajib diisi");
    return;
  }

  if (!agree) {
    showToast("Setujui ketentuan pengiriman artikel");
    return;
  }

  const submitBtn = submitArticleForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";

  try {
    const coverUrl = await uploadSubmissionCover();

    const { error } = await supabaseClient
      .from("article_submissions")
      .insert({
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

    showToast("Artikel berhasil dikirim ke redaksi");

    submitArticleForm.reset();
    submissionCoverPreview.innerHTML = "";

  } catch (err) {
    console.error(err);
    showToast(err.message || "Gagal mengirim artikel");
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = `
    <i data-lucide="send"></i>
    Kirim ke Redaksi
  `;

  if (window.lucide) lucide.createIcons();
});