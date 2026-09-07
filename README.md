# Diario Fit

App personal de seguimiento diario de alimentación y entrenamiento, para dos personas.
Next.js 15 + Supabase + Tailwind v4, instalable como PWA desde Safari.

La especificación completa está en [spec-diario-fit.md](spec-diario-fit.md).

## Puesta en marcha

**1. Crear el proyecto en Supabase** (supabase.com, plan gratis alcanza). Elegí la región
South America (São Paulo).

**2. Cargar el esquema.** SQL Editor → New query → pegar `supabase/schema.sql` entero y
correrlo. Crea las tablas, las policies de RLS, la vista `day_entries_shared`, las
funciones de equipo y el trigger que siembra Yoga, Ludus, Gym y Running al crear un perfil.
Es idempotente: se puede volver a correr sin romper nada.

**3. Variables de entorno.**

```bash
cp .env.local.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`: Settings → Data API → *API URL*, **sin el `/rest/v1/` del
  final**. Tiene que quedar `https://xxxx.supabase.co` y nada más.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Settings → API Keys → *Publishable key*
  (empieza con `sb_publishable_`). Si el panel todavía muestra el sistema viejo, sirve
  igual la `anon public` en `NEXT_PUBLIC_SUPABASE_ANON_KEY`: el código acepta las dos.

La *Secret key* no va acá: es la de "puede todo" y sólo la usa el cron en producción.
Sin credenciales la app no rompe, muestra una pantalla que dice qué falta.

**4. Habilitar el ingreso por mail.**

- Authentication → URL Configuration → *Site URL*: `http://localhost:3000`
- *Redirect URLs*: agregar `http://localhost:3000/auth/callback` (y la URL de Vercel
  cuando despliegues).
**Sobre el código de 6 dígitos.** La app acepta entrar con el link o con un código. El
código sólo llega si la plantilla del mail lo incluye, y Supabase **no deja editar las
plantillas sin SMTP propio**. Con el mail por defecto llega sólo el link, que alcanza
para la compu.

Vale la pena configurar SMTP propio (Brevo, Gmail con contraseña de aplicación, Mailgun)
cuando pase cualquiera de estas dos:

- La app instalada en el iPhone te aparece deslogueada después de entrar por el link.
  Pasa porque iOS guarda la sesión de Safari aparte de la de la app en la pantalla de
  inicio. El código lo resuelve porque no salís de la app.
- Dejan de llegar los mails. El servicio por defecto de Supabase manda **2 mails por
  hora** y no es para producción.

Con SMTP propio, la plantilla **Magic link or OTP** se vuelve editable y hay que agregarle:

```html
<p>Tu código: <strong>{{ .Token }}</strong></p>
<p>O entrá con este <a href="{{ .ConfirmationURL }}">link</a>.</p>
```

**5. Levantar.**

```bash
npm run dev
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run check` | Verifica las reglas del spec: corte de día, ventana de edición, rachas, puntaje, logros y desafíos |
| `npm run typecheck` | TypeScript sin emitir |

## Instalar en el iPhone

Abrir la URL en Safari → Compartir → *Agregar a pantalla de inicio*. Queda a pantalla
completa con ícono propio. Entrá con el código de 6 dígitos, no con el link.

## Notificaciones (opcional)

El recordatorio diario funciona en producción, con la app instalada e iOS 16.4 o más.
Sin esto la app no se rompe: queda el punto en la tab Hoy cuando el día está sin cargar.

```bash
npx web-push generate-vapid-keys
```

Las claves van a `.env.local` y a Vercel, junto con `SUPABASE_SECRET_KEY`
(Settings → API Keys, sólo del lado del servidor) y un `CRON_SECRET` cualquiera.

`vercel.json` deja programado un cron **diario a las 00:00 UTC, o sea 21:00 en Buenos
Aires**, que es la hora por defecto del recordatorio. El plan Hobby de Vercel no admite
crons más seguidos que uno por día: con esa restricción, sólo se dispara el aviso de quien
tenga configurada esa hora.

Para que funcione cualquier hora hay dos caminos:

- Pasar el proyecto a Vercel Pro y volver el schedule a `0 * * * *` (cada hora).
- Dejar el plan gratis y usar un programador externo (cron-job.org es gratis) que pegue
  cada hora a `https://<tu-dominio>/api/cron/recordatorios` con el header
  `Authorization: Bearer <CRON_SECRET>`. La ruta ya compara la hora de Buenos Aires contra
  la de cada persona, así que avisa sólo a quien corresponde.

## Cómo está armado

```
app/
  (app)/            pantallas con tab bar: Hoy, Mes, Datos, Nosotros + Logros y Ajustes
  login/            ingreso por código de 6 dígitos o link
  bienvenida/       alta de perfil
  auth/             callback y cierre de sesión
  api/              exportar CSV, suscripción de push, cron de recordatorios
lib/
  config.ts         escala de alimentación, colores, metas, etiquetas de puntaje
  dates.ts          día lógico con corte a las 4 AM, ventana de 7 días, semanas ISO
  streaks.ts        las tres rachas, con el comodín semanal
  score.ts          puntaje semanal 0–100
  achievements.ts   los logros y su progreso
  challenges.ts     los desafíos semanales y su rotación
  series.ts         series por semana, distribución e insight cruzado
  queries.ts        lecturas del lado del servidor
  mutations.ts      autoguardado del día desde el cliente
supabase/schema.sql tablas, RLS y funciones
```

Las rachas, el puntaje y los logros se recalculan siempre del histórico, nunca de forma
incremental: por eso editar un día viejo corrige todo solo.

## Diferencias con el spec

- El spec dice **18 logros** y después lista **19**. Están implementados los 19 de la lista.
- El desafío semanal se resuelve **al abrir la pantalla Nosotros** después de que terminó
  la semana, no a las 23:59 del domingo. Sin un cron dedicado es lo más cerca de "solo"
  que se puede, y el resultado es el mismo.
- Los gráficos de Recharts van **sin animación de montaje**, para respetar la regla de que
  sólo hay dos momentos de motion orquestado.
