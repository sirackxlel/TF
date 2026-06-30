# Backend y base de datos en Cloudflare

Esta demo ahora tiene tres partes:

- Frontend: `index.html`, `styles.css`, `app.js`
- Backend: `functions/api/login.js` y `functions/api/stats.js`
- Base de datos: Cloudflare D1, conectada con el binding `DB`

## Que hace

Cuando el usuario inicia sesion, el navegador llama a:

```txt
POST /api/login
```

El backend valida:

```txt
Usuario: demo@cowmarket.test
Clave: demo1234
```

Si existe una base D1 conectada como `DB`, guarda el intento en la tabla:

```txt
login_events
```

El panel llama a:

```txt
GET /api/stats
```

y muestra cuantos logins correctos quedaron guardados.

## Pasos en Cloudflare

1. Entra a Cloudflare.
2. Ve a Workers & Pages.
3. Entra al proyecto `tf`.
4. Ve a Storage & databases > D1 SQL Database.
5. Crea una base llamada:

```txt
tf_demo
```

6. Vuelve al proyecto `tf` en Workers & Pages.
7. Ve a Settings > Bindings.
8. Agrega un binding de D1.
9. Usa este nombre exacto:

```txt
DB
```

10. Selecciona la base:

```txt
tf_demo
```

11. Guarda.
12. Vuelve a Deployments.
13. Redeploy del ultimo deploy.

## Publicar cambios

Despues de modificar estos archivos, subi los cambios a GitHub:

```powershell
git add .
git commit -m "Agregar backend y D1"
git push
```

Cloudflare Pages deberia desplegar automaticamente.
