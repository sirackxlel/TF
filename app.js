const LAST_USER_KEY = "cowmarket-last-user";

const formView = document.querySelector("#formView");
const dashboardView = document.querySelector("#dashboardView");
const userForm = document.querySelector("#userForm");
const emailInput = document.querySelector("#email");
const fullNameInput = document.querySelector("#fullName");
const phoneInput = document.querySelector("#phone");
const countryInput = document.querySelector("#country");
const formError = document.querySelector("#formError");
const newUserButton = document.querySelector("#newUserButton");
const backendStatus = document.querySelector("#backendStatus");
const userCount = document.querySelector("#userCount");
const savedUserTitle = document.querySelector("#savedUserTitle");
const recentUsers = document.querySelector("#recentUsers");

function setSavedView(isSaved) {
  formView.classList.toggle("is-hidden", isSaved);
  dashboardView.classList.toggle("is-hidden", !isSaved);

  if (isSaved) {
    loadStats();
  }
}

function showError(message) {
  formError.textContent = message;
}

async function loadStats() {
  backendStatus.textContent = "Conectando";
  userCount.textContent = "...";
  recentUsers.textContent = "";

  try {
    const response = await fetch("/api/users");
    const data = await response.json();

    backendStatus.textContent = data.databaseConnected ? "OK + DB" : "Sin DB";
    userCount.textContent = data.databaseConnected ? String(data.totalUsers) : "Sin D1";

    if (data.users?.length) {
      recentUsers.innerHTML = data.users
        .map(
          (user) => `
            <div>
              <strong>${escapeHtml(user.fullName)}</strong>
              <span>${escapeHtml(user.email)} · ${escapeHtml(user.country)}</span>
            </div>
          `
        )
        .join("");
    }
  } catch (error) {
    backendStatus.textContent = "Sin API";
    userCount.textContent = "-";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  const fullName = fullNameInput.value.trim();
  const phone = phoneInput.value.trim();
  const country = countryInput.value;

  if (!email || !fullName || !phone || !country) {
    showError("Completa email, nombre completo, numero y pais.");
    return;
  }

  showError("");

  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, fullName, phone, country }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      showError(data.message || "No se pudo guardar el usuario.");
      return;
    }

    localStorage.setItem(LAST_USER_KEY, JSON.stringify(data.user));
    savedUserTitle.textContent = data.user.fullName;
    setSavedView(true);
  } catch (error) {
    showError("No se pudo conectar con el backend. Revisa el deploy de Cloudflare Pages.");
  }
});

newUserButton.addEventListener("click", () => {
  localStorage.removeItem(LAST_USER_KEY);
  userForm.reset();
  setSavedView(false);
  emailInput.focus();
});

const lastUser = localStorage.getItem(LAST_USER_KEY);

if (lastUser) {
  try {
    const user = JSON.parse(lastUser);
    savedUserTitle.textContent = user.fullName || "Registro creado";
    setSavedView(true);
  } catch (error) {
    localStorage.removeItem(LAST_USER_KEY);
    setSavedView(false);
  }
} else {
  setSavedView(false);
}
