function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function clean(value) {
  return String(value || "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getDatabase(env) {
  return env.DB || env.tf_demo;
}

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS calendar_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        note_date TEXT NOT NULL,
        text TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    )
    .run();

  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_calendar_notes_user_date
       ON calendar_notes (user_email, note_date)`
    )
    .run();
}

function validateColor(color) {
  return ["green", "yellow", "red"].includes(color) ? color : "green";
}

function isValidDateKey(dateKey) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
}

function groupNotes(rows) {
  return rows.reduce((groups, row) => {
    const dateKey = row.date;

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }

    groups[dateKey].push({
      id: row.id,
      text: row.text,
      color: row.color,
      createdAt: row.createdAt,
    });

    return groups;
  }, {});
}

export async function onRequestGet(context) {
  const db = getDatabase(context.env);

  if (!db) {
    return json({ ok: false, message: "Falta conectar la base D1." }, 503);
  }

  const url = new URL(context.request.url);
  const email = clean(url.searchParams.get("email")).toLowerCase();

  if (!email || !isValidEmail(email)) {
    return json({ ok: false, message: "Email invalido." }, 400);
  }

  await ensureSchema(db);

  const notes = await db
    .prepare(
      `SELECT id, note_date AS date, text, color, created_at AS createdAt
       FROM calendar_notes
       WHERE user_email = ?
       ORDER BY note_date ASC, id ASC`
    )
    .bind(email)
    .all();

  return json({
    ok: true,
    notes: groupNotes(notes.results || []),
  });
}

export async function onRequestPost(context) {
  const db = getDatabase(context.env);

  if (!db) {
    return json({ ok: false, message: "Falta conectar la base D1." }, 503);
  }

  let payload;

  try {
    payload = await context.request.json();
  } catch (error) {
    return json({ ok: false, message: "JSON invalido." }, 400);
  }

  const email = clean(payload.email).toLowerCase();
  const date = clean(payload.date);
  const text = clean(payload.text);
  const color = validateColor(clean(payload.color));
  const createdAt = new Date().toISOString();

  if (!email || !isValidEmail(email)) {
    return json({ ok: false, message: "Email invalido." }, 400);
  }

  if (!isValidDateKey(date)) {
    return json({ ok: false, message: "Fecha invalida." }, 400);
  }

  if (!text) {
    return json({ ok: false, message: "Escribi una nota." }, 400);
  }

  await ensureSchema(db);

  const result = await db
    .prepare(
      `INSERT INTO calendar_notes (user_email, note_date, text, color, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(email, date, text, color, createdAt)
    .run();

  return json({
    ok: true,
    note: {
      id: result.meta.last_row_id,
      text,
      color,
      createdAt,
    },
  });
}

export async function onRequestDelete(context) {
  const db = getDatabase(context.env);

  if (!db) {
    return json({ ok: false, message: "Falta conectar la base D1." }, 503);
  }

  let payload;

  try {
    payload = await context.request.json();
  } catch (error) {
    return json({ ok: false, message: "JSON invalido." }, 400);
  }

  const email = clean(payload.email).toLowerCase();
  const noteId = Number(payload.id);

  if (!email || !isValidEmail(email) || !Number.isInteger(noteId)) {
    return json({ ok: false, message: "Datos invalidos." }, 400);
  }

  await ensureSchema(db);

  await db
    .prepare("DELETE FROM calendar_notes WHERE id = ? AND user_email = ?")
    .bind(noteId, email)
    .run();

  return json({ ok: true });
}

export async function onRequest() {
  return json({ ok: false, message: "Usa GET, POST o DELETE." }, 405);
}
