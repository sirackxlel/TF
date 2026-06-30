const VALID_EMAIL = "demo@cowmarket.test";
const VALID_PASSWORD = "demo1234";
const SESSION_KEY = "cowmarket-demo-session";

const loginView = document.querySelector("#loginView");
const dashboardView = document.querySelector("#dashboardView");
const loginForm = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const formError = document.querySelector("#formError");
const togglePassword = document.querySelector("#togglePassword");
const logoutButton = document.querySelector("#logoutButton");

function setLoggedIn(isLoggedIn) {
  loginView.classList.toggle("is-hidden", isLoggedIn);
  dashboardView.classList.toggle("is-hidden", !isLoggedIn);
}

function showError(message) {
  formError.textContent = message;
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!email || !password) {
    showError("Completa email y clave para entrar.");
    return;
  }

  if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
    showError("Credenciales incorrectas. Usa los datos de prueba.");
    return;
  }

  localStorage.setItem(SESSION_KEY, "active");
  showError("");
  setLoggedIn(true);
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

setLoggedIn(localStorage.getItem(SESSION_KEY) === "active");
