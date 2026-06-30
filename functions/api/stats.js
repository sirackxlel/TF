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

export async function onRequestGet(context) {
  if (!context.env.DB) {
    return Response.json(
      {
        ok: true,
        databaseConnected: false,
        totalLogins: 0,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  await ensureSchema(context.env.DB);

  const row = await context.env.DB
    .prepare("SELECT COUNT(*) AS total FROM login_events WHERE success = 1")
    .first();

  return Response.json(
    {
      ok: true,
      databaseConnected: true,
      totalLogins: row?.total || 0,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function onRequest() {
  return Response.json({ ok: false, message: "Usa GET para ver estadisticas." }, { status: 405 });
}
