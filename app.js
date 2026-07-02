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
const calendarTitle = document.querySelector("#calendarTitle");
const calendarGrid = document.querySelector("#calendarGrid");
const previousMonthButton = document.querySelector("#previousMonthButton");
const nextMonthButton = document.querySelector("#nextMonthButton");
const noteForm = document.querySelector("#noteForm");
const noteText = document.querySelector("#noteText");
const notesList = document.querySelector("#notesList");
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
  document.body.classList.toggle("is-dashboard", isSaved);
  loginView.classList.toggle("is-hidden", isSaved);
  formView.classList.add("is-hidden");
  dashboardView.classList.toggle("is-hidden", !isSaved);

  if (isSaved) {
    renderCalendar();
  }
}

function setAuthView(view) {
  const isRegister = view === "register";

  document.body.classList.remove("is-dashboard");
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

function getDateNotes(notes, dateKey) {
  const saved = notes[dateKey];

  if (!saved) {
    return [];
  }

  if (Array.isArray(saved)) {
    return saved.filter((note) => note?.text);
  }

  if (saved.text) {
    return [saved];
  }

  return [];
}

function getDateColor(dayNotes) {
  const colors = dayNotes.map((note) => note.color);

  if (colors.includes("red")) {
    return "red";
  }

  if (colors.includes("yellow")) {
    return "yellow";
  }

  if (colors.includes("green")) {
    return "green";
  }

  return "green";
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
  const dayNotes = getDateNotes(notes, selectedDate);

  noteText.value = "";
  selectedDateLabel.textContent = formatDateLabel(selectedDate);
  selectNoteColor("green");
  renderNotesList(dayNotes);
}

function renderNotesList(dayNotes) {
  notesList.textContent = "";

  if (!dayNotes.length) {
    const emptyNote = document.createElement("p");
    emptyNote.className = "notes-empty";
    emptyNote.textContent = "Sin notas todavia.";
    notesList.append(emptyNote);
    return;
  }

  dayNotes.forEach((note, index) => {
    const item = document.createElement("div");
    const text = document.createElement("p");
    const button = document.createElement("button");

    item.className = `note-item note-${note.color || "green"}`;
    text.textContent = note.text;
    button.type = "button";
    button.className = "note-delete";
    button.dataset.noteIndex = String(index);
    button.textContent = "Borrar";

    item.append(text, button);
    notesList.append(item);
  });
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
    const dayNotes = getDateNotes(notes, dateKey);
    const button = document.createElement("button");

    button.className = "calendar-day";
    button.type = "button";
    button.textContent = String(day);
    button.dataset.date = dateKey;

    if (dateKey === selectedDate) {
      button.classList.add("is-selected");
    }

    if (dayNotes.length) {
      const dayColor = getDateColor(dayNotes);

      button.classList.add("has-note", `note-${dayColor}`);
      button.title = `${dayNotes.length} nota${dayNotes.length === 1 ? "" : "s"}`;
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
  const color = noteForm.querySelector('input[name="noteColor"]:checked')?.value || "green";

  if (!text) {
    noteText.focus();
    return;
  }

  notes[selectedDate] = [...getDateNotes(notes, selectedDate), { text, color }];
  saveStoredNotes(notes);
  renderCalendar();
  noteText.focus();
});

notesList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".note-delete");

  if (!deleteButton) {
    return;
  }

  const notes = getStoredNotes();
  const noteIndex = Number(deleteButton.dataset.noteIndex);
  const dayNotes = getDateNotes(notes, selectedDate);

  dayNotes.splice(noteIndex, 1);

  if (dayNotes.length) {
    notes[selectedDate] = dayNotes;
  } else {
    delete notes[selectedDate];
  }

  saveStoredNotes(notes);
  renderCalendar();
});

const lastUser = localStorage.getItem(LAST_USER_KEY);

if (lastUser) {
  try {
    JSON.parse(lastUser);
    setSavedView(true);
  } catch (error) {
    localStorage.removeItem(LAST_USER_KEY);
    setSavedView(false);
  }
} else {
  setAuthView("login");
}
