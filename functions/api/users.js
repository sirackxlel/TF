async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        country TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    )
    .run();
}

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

async function getUserStats(db) {
  const countRow = await db.prepare("SELECT COUNT(*) AS total FROM users").first();
  const users = await db
    .prepare(
      `SELECT email, full_name AS fullName, phone, country, created_at AS createdAt
       FROM users
       ORDER BY id DESC
       LIMIT 3`
    )
    .all();

  return {
    totalUsers: countRow?.total || 0,
    users: users.results || [],
  };
}

function getDatabase(env) {
  return env.DB || env.tf_demo;
}

export async function onRequestGet(context) {
  const db = getDatabase(context.env);

  if (!db) {
    return json({
      ok: true,
      databaseConnected: false,
      totalUsers: 0,
      users: [],
    });
  }

  await ensureSchema(db);
  const stats = await getUserStats(db);

  return json({
    ok: true,
    databaseConnected: true,
    ...stats,
  });
}

export async function onRequestPost(context) {
  const db = getDatabase(context.env);

  if (!db) {
    return json(
      {
        ok: false,
        databaseConnected: false,
        message: "Falta conectar la base D1 con el binding DB o tf_demo.",
      },
      503
    );
  }

  let payload;

  try {
    payload = await context.request.json();
  } catch (error) {
    return json({ ok: false, message: "JSON invalido." }, 400);
  }

  const email = clean(payload.email).toLowerCase();
  const fullName = clean(payload.fullName);
  const phone = clean(payload.phone);
  const country = clean(payload.country);
  const createdAt = new Date().toISOString();

  if (!email || !fullName || !phone || !country) {
    return json(
      { ok: false, message: "Completa email, nombre completo, numero y pais." },
      400
    );
  }

  if (!isValidEmail(email)) {
    return json({ ok: false, message: "El email no parece valido." }, 400);
  }

  await ensureSchema(db);

  const existing = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first();

  if (existing) {
    return json({ ok: false, message: "Ese email ya esta registrado." }, 409);
  }

  await db
    .prepare(
      `INSERT INTO users (email, full_name, phone, country, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(email, fullName, phone, country, createdAt)
    .run();

  return json({
    ok: true,
    databaseConnected: true,
    user: {
      email,
      fullName,
      phone,
      country,
      createdAt,
    },
  });
}

export async function onRequest() {
  return json({ ok: false, message: "Usa GET o POST." }, 405);
}
