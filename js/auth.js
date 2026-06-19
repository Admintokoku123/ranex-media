// ===============================
// Ranex Media - Auth Supabase
// ===============================

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const toggleButtons = document.querySelectorAll(".toggle-pass");

// Toggle password
toggleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    const icon = btn.querySelector("i");

    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    icon.setAttribute("data-lucide", isPassword ? "eye-off" : "eye");
    lucide.createIcons();
  });
});

// REGISTER
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  const confirmPassword = document.getElementById("registerConfirmPassword").value.trim();
  const agreeTerms = document.getElementById("agreeTerms").checked;

  if (!name || !email || !password || !confirmPassword) {
    showToast("Semua data wajib diisi");
    return;
  }

  if (password.length < 6) {
    showToast("Password minimal 6 karakter");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Password tidak sama");
    return;
  }

  if (!agreeTerms) {
    showToast("Setujui kebijakan Ranex Media dulu");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name
      }
    }
  });

  if (error) {
    showToast(error.message);
    return;
  }

  const user = data.user;

  if (user) {
    await supabaseClient.from("profiles").insert({
      id: user.id,
      name: name,
      email: email,
      role: "member"
    });
  }

  showToast("Akun berhasil dibuat. Silakan login.");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1200);
});

// LOGIN
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    showToast("Email dan password wajib diisi");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showToast(error.message);
    return;
  }

  const user = data.user;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("role,email")
    .eq("id", user.id)
    .single();

  showToast("Login berhasil");

  setTimeout(() => {
    if (
      profile?.email === "ranex.support@gmail.com" &&
      profile?.role === "admin"
    ) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "profil.html";
    }
  }, 900);
});