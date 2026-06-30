const SESSION_KEY = "cowmarket-demo-session";

const loginView = document.querySelector("#loginView");
const dashboardView = document.querySelector("#dashboardView");
const loginForm = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const formError = document.querySelector("#formError");
const togglePassword = document.querySelector("#togglePassword");
const logoutButton = document.querySelector("#logoutButton");
const backendStatus = document.querySelector("#backendStatus");
const loginCount = document.querySelector("#loginCount");

function setLoggedIn(isLoggedIn) {
  loginView.classList.toggle("is-hidden", isLoggedIn);
  dashboardView.classList.toggle("is-hidden", !isLoggedIn);

  if (isLoggedIn) {
    loadStats();
  }
}

function showError(message) {
  formError.textContent = message;
}

async function loadStats() {
  backendStatus.textContent = "Conectando";
  loginCount.textContent = "...";

  try {
    const response = await fetch("/api/stats");
    const data = await response.json();

    backendStatus.textContent = data.databaseConnected ? "OK + DB" : "OK";
    loginCount.textContent = data.databaseConnected ? String(data.totalLogins) : "Sin D1";
  } catch (error) {
    backendStatus.textContent = "Sin API";
    loginCount.textContent = "-";
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!email || !password) {
    showError("Completa email y clave para entrar.");
    return;
  }

  showError("");

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      showError(data.message || "Credenciales incorrectas. Usa los datos de prueba.");
      return;
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ email, loggedAt: data.loggedAt }));
    setLoggedIn(true);
  } catch (error) {
    showError("No se pudo conectar con el backend. Publicalo en Cloudflare Pages o usa Wrangler local.");
  }
});

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.setAttribute("aria-label", isPassword ? "Ocultar clave" : "Mostrar clave");
  togglePassword.setAttribute("title", isPassword ? "Ocultar clave" : "Mostrar clave");
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  passwordInput.value = "";
  setLoggedIn(false);
  emailInput.focus();
});

setLoggedIn(Boolean(localStorage.getItem(SESSION_KEY)));
