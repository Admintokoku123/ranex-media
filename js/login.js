const loginForm = document.getElementById("loginForm");
const toggleButtons = document.querySelectorAll(".toggle-pass");

toggleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    const icon = btn.querySelector("i");

    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    icon.setAttribute("data-lucide", isPassword ? "eye-off" : "eye");
    lucide.createIcons();
  });
});

loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    showToast("Email dan password wajib diisi");
    return;
  }

  showToast("Login demo berhasil");

  setTimeout(() => {
    window.location.href = "profil.html";
  }, 900);
});