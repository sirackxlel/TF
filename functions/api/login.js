const VALID_EMAIL = "demo@cowmarket.test";
const VALID_PASSWORD = "demo1234";

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS login_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        success INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )`
    )
    .run();
}

async function recordLogin(db, email, success, createdAt) {
  await db
    .prepare(
      "INSERT INTO login_events (email, success, created_at) VALUES (?, ?, ?)"
    )
    .bind(email, success ? 1 : 0, createdAt)
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

export async function onRequestPost(context) {
  let payload;

  try {
    payload = await context.request.json();
  } catch (error) {
    return json({ ok: false, message: "JSON invalido." }, 400);
  }

  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  const success = email === VALID_EMAIL && password === VALID_PASSWORD;
  const loggedAt = new Date().toISOString();
  const databaseConnected = Boolean(context.env.DB);

  if (databaseConnected) {
    await ensureSchema(context.env.DB);
    await recordLogin(context.env.DB, email || "sin-email", success, loggedAt);
  }

  if (!success) {
    return json(
      {
        ok: false,
        databaseConnected,
        message: "Credenciales incorrectas. Usa los datos de prueba.",
      },
      401
    );
  }

  return json({
    ok: true,
    email,
    loggedAt,
    databaseConnected,
  });
}

export async function onRequest() {
  return json({ ok: false, message: "Usa POST para iniciar sesion." }, 405);
}
