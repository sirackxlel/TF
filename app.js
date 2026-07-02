const LAST_USER_KEY = "cowmarket-last-user";
const CALENDAR_NOTES_KEY = "cowmarket-calendar-notes";

const loginView = document.querySelector("#loginView");
const formView = document.querySelector("#formView");
const dashboardView = document.querySelector("#dashboardView");
const loginForm = document.querySelector("#loginForm");
const loginEmailInput = document.querySelector("#loginEmail");
const loginError = document.querySelector("#loginError");
const showCreateUserButton = document.querySelector("#showCreateUserButton");
const showLoginButton = document.querySelector("#showLoginButton");
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
const calendarTitle = document.querySelector("#calendarTitle");
const calendarGrid = document.querySelector("#calendarGrid");
const previousMonthButton = document.querySelector("#previousMonthButton");
const nextMonthButton = document.querySelector("#nextMonthButton");
const noteForm = document.querySelector("#noteForm");
const noteText = document.querySelector("#noteText");
const selectedDateLabel = document.querySelector("#selectedDateLabel");

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

let visibleMonth = new Date();
let selectedDate = toDateKey(new Date());

function setSavedView(isSaved) {
  loginView.classList.toggle("is-hidden", isSaved);
  formView.classList.add("is-hidden");
  dashboardView.classList.toggle("is-hidden", !isSaved);

  if (isSaved) {
    renderCalendar();
  }
}

function setAuthView(view) {
  const isRegister = view === "register";

  loginView.classList.toggle("is-hidden", isRegister);
  formView.classList.toggle("is-hidden", !isRegister);
  dashboardView.classList.add("is-hidden");
  loginError.textContent = "";
  formError.textContent = "";

  if (isRegister) {
    emailInput.focus();
  } else {
    loginEmailInput.focus();
  }
}

function showError(message) {
  formError.textContent = message;
}

function showLoginError(message) {
  loginError.textContent = message;
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

function getStoredNotes() {
  try {
    return JSON.parse(localStorage.getItem(CALENDAR_NOTES_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function saveStoredNotes(notes) {
  localStorage.setItem(CALENDAR_NOTES_KEY, JSON.stringify(notes));
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateKey) {
  const [year, month, day] = dateKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return `${Number(day)} de ${monthNames[date.getMonth()]} de ${year}`;
}

function selectNoteColor(color) {
  const colorInput = noteForm.querySelector(`input[name="noteColor"][value="${color}"]`);

  if (colorInput) {
    colorInput.checked = true;
  }

  noteForm.classList.remove("note-yellow", "note-red", "note-green");
  noteForm.classList.add(`note-${color}`);
}

function loadSelectedNote() {
  const notes = getStoredNotes();
  const note = notes[selectedDate] || { text: "", color: "yellow" };

  noteText.value = note.text;
  selectedDateLabel.textContent = formatDateLabel(selectedDate);
  selectNoteColor(note.color || "yellow");
}

function renderCalendar() {
  if (!calendarGrid) {
    return;
  }

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const notes = getStoredNotes();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  calendarTitle.textContent = `${monthNames[month]} ${year}`;
  calendarGrid.textContent = "";

  for (let index = 0; index < startOffset; index += 1) {
    const emptyCell = document.createElement("span");
    emptyCell.className = "calendar-day is-empty";
    calendarGrid.append(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = toDateKey(date);
    const note = notes[dateKey];
    const button = document.createElement("button");

    button.className = "calendar-day";
    button.type = "button";
    button.textContent = String(day);
    button.dataset.date = dateKey;

    if (dateKey === selectedDate) {
      button.classList.add("is-selected");
    }

    if (note?.text) {
      button.classList.add("has-note", `note-${note.color || "yellow"}`);
      button.title = note.text;
    }

    calendarGrid.append(button);
  }

  loadSelectedNote();
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
      body: JSON.stringify({ action: "register", email, fullName, phone, country }),
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

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = loginEmailInput.value.trim().toLowerCase();

  if (!email) {
    showLoginError("Completa el email.");
    return;
  }

  showLoginError("");

  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "login", email }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      showLoginError(data.message || "No se pudo iniciar sesion.");
      return;
    }

    localStorage.setItem(LAST_USER_KEY, JSON.stringify(data.user));
    savedUserTitle.textContent = data.user.fullName;
    setSavedView(true);
  } catch (error) {
    showLoginError("No se pudo conectar con el backend.");
  }
});

showCreateUserButton.addEventListener("click", () => {
  setAuthView("register");
});

showLoginButton.addEventListener("click", () => {
  userForm.reset();
  setAuthView("login");
});

newUserButton.addEventListener("click", () => {
  localStorage.removeItem(LAST_USER_KEY);
  loginForm.reset();
  userForm.reset();
  setAuthView("login");
});

previousMonthButton.addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  renderCalendar();
});

calendarGrid.addEventListener("click", (event) => {
  const dayButton = event.target.closest(".calendar-day:not(.is-empty)");

  if (!dayButton) {
    return;
  }

  selectedDate = dayButton.dataset.date;
  visibleMonth = new Date(`${selectedDate}T00:00:00`);
  renderCalendar();
});

noteForm.addEventListener("change", (event) => {
  if (event.target.name === "noteColor") {
    selectNoteColor(event.target.value);
  }
});

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const notes = getStoredNotes();
  const text = noteText.value.trim();
  const color = noteForm.querySelector('input[name="noteColor"]:checked')?.value || "yellow";

  if (!text) {
    delete notes[selectedDate];
  } else {
    notes[selectedDate] = { text, color };
  }

  saveStoredNotes(notes);
  renderCalendar();
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
  setAuthView("login");
}
