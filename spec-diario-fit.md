# Diario Fit — Spec de producto

App personal de seguimiento diario de alimentación y entrenamiento, para dos personas.
Documento de especificación para construir con Claude Code.

> **Diario Fit** es el nombre definitivo: es el que va en el `manifest.json` de la PWA y el
> que se ve bajo el ícono en la pantalla de inicio.

---

## 1. Objetivo

Registrar el día en menos de 10 segundos y, a cambio, ver de forma clara y visual cómo
viene la semana y el mes. El propósito no es medir, es **sostener la constancia**.

Tres principios que atraviesan todo el producto:

1. **El registro tiene que costar cero.** Dos toques y listo. Si cargar el día es un
   trámite, la app se abandona en tres semanas.
2. **Refuerzo por consistencia, no castigo por perfección.** La racha que se rompe de
   golpe por un día flojo es el mecanismo que produce abandono. Por eso hay comodines.
3. **Individual primero, equipo después.** Cada uno tiene sus metas, sus rachas y sus
   logros. La capa de pareja suma, no reemplaza ni compite.

**Fuera de alcance, explícitamente:** peso corporal, calorías, macros, medidas, fotos de
comida. La alimentación se registra sólo como una valoración cualitativa propia del día.

---

## 2. Stack y decisiones técnicas

| Área | Decisión |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Estilos | Tailwind CSS v4 con tokens propios (ver §7) |
| Backend | Supabase (Postgres + Auth + Row Level Security) |
| Gráficos | Recharts |
| Fechas | date-fns + date-fns-tz |
| Deploy | Vercel |
| Distribución | PWA instalable ("Agregar a pantalla de inicio" en iPhone) |

**Sin App Store.** Ambos usan iPhone: se instala como PWA desde Safari y queda con ícono
propio en la home, a pantalla completa.

### Reglas de tiempo

- Timezone fija: `America/Argentina/Buenos_Aires`.
- **El día cierra a las 04:00**, no a medianoche. Si cargás a la 1 AM, cuenta para el día
  anterior. Regla: `dia_actual = (ahora_en_BA - 4 horas).toDateString()`.
- Se pueden editar **hasta 7 días hacia atrás**. Más viejo que eso queda en sólo lectura.
- No se puede cargar el futuro.

### Auth y vinculación

Login con email + magic link de Supabase (sin contraseñas). La vinculación de pareja es
por código de invitación de 6 caracteres que uno genera en Ajustes y el otro ingresa.
Un usuario pertenece a lo sumo a un equipo.

---

## 3. Modelo de datos

```sql
create table profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  display_name         text not null,
  emoji                text not null default '🙂',
  accent_color         text not null default '#7C5CFF',
  weekly_training_goal int  not null default 4,
  reminder_hour        int  default 21,          -- null = sin recordatorio
  share_notes          boolean not null default false,
  created_at           timestamptz default now()
);

create table teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Nosotros',
  invite_code text unique not null,
  created_at timestamptz default now()
);

create table team_members (
  team_id   uuid references teams(id) on delete cascade,
  user_id   uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (team_id, user_id)
);

-- Tipos de entrenamiento: propios de cada usuario, editables desde Ajustes
create table training_types (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  key        text not null,
  label      text not null,
  color      text not null,
  icon       text not null,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  unique (user_id, key)
);

create table day_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade,
  date            date not null,
  nutrition_score int check (nutrition_score between 1 and 5),
  nutrition_note  text,
  rest_day        boolean not null default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (user_id, date)
);

create table entry_trainings (
  id               uuid primary key default gen_random_uuid(),
  entry_id         uuid references day_entries(id) on delete cascade,
  training_type_id uuid references training_types(id),
  created_at       timestamptz default now()
);

create table achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  key         text not null,
  unlocked_at timestamptz default now(),
  unique (user_id, key)
);

create table team_challenges (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid references teams(id) on delete cascade,
  week_start date not null,
  key        text not null,
  target     numeric not null,
  status     text not null default 'active',   -- active | won | missed
  unique (team_id, week_start)
);
```

**Semilla de `training_types` al crear un perfil:** Yoga, Ludus, Gym, Running.
"Descanso" no es un tipo: es el flag `rest_day` en el día.

### Row Level Security

- Cada usuario **escribe únicamente sus propias filas**. Nadie edita el día del otro.
- Cada usuario **lee todo lo de los miembros de su equipo**, con una excepción:
  `nutrition_note` sólo es visible para el dueño, salvo que tenga `share_notes = true`.
  Resolverlo con una vista `day_entries_shared` que enmascare la nota según ese flag.

---

## 4. Reglas de negocio

### 4.1 Escala de alimentación

Valoración de 1 a 5, con anclajes en lenguaje neutro (deliberadamente no moral: nada de
"pésimo", "descontrol" o "fracaso"). Definidos en `lib/config.ts` para poder editarlos:

| Valor | Etiqueta |
|---|---|
| 5 | Muy bien |
| 4 | Bien |
| 3 | Ni bien ni mal |
| 2 | Flojo |
| 1 | Lejos de lo que quería |

Nota de texto opcional, máximo 280 caracteres.

### 4.2 Entrenamiento

Un día puede tener **varios entrenamientos** (Gym + Running el mismo día es válido y
frecuente). O puede marcarse como Descanso, que es un registro legítimo y completo, no un
hueco.

Un día se considera **cargado** cuando tiene `nutrition_score` no nulo **y** además
`rest_day = true` o al menos un entrenamiento asociado.

**No hay ningún premio por variar de disciplina.** Quince minutos de yoga en un día que no
daba para más valen lo mismo que una sesión completa de gym: los dos son "hoy me moví".
Ningún logro, desafío ni puntaje puede depender de la cantidad de tipos distintos.

### 4.3 Rachas

Tres rachas independientes, todas recalculadas del histórico (no incrementales, así la
edición retroactiva de 7 días las corrige sola):

**Racha de registro** — días consecutivos con el día cargado. Es la más importante:
mide el hábito de usar la app. Sin comodín.

**Racha de alimentación** — días consecutivos con `nutrition_score >= 4`.
Con **un comodín por semana ISO**: el primer día de la semana con score ≤ 3 no corta la
racha, la marca como "comodín usado". El segundo sí la corta. La UI muestra el comodín
disponible como un pequeño escudo al lado de la racha.

**Racha de semanas** — semanas ISO consecutivas alcanzando la meta de entrenamientos.

### 4.4 Puntaje semanal (0–100)

```
entrenamiento = min(entrenos_semana / meta_semanal, 1) * 50
alimentacion  = (promedio_score_dias_cargados / 5) * 40
registro      = (dias_cargados / 7) * 10
puntaje       = round(entrenamiento + alimentacion + registro)
```

Etiquetas: `85–100` Top · `70–84` Muy buena · `50–69` Buena · `0–49` Floja.

La semana empieza el lunes.

### 4.5 Logros

18 en total, todos calculados server-side y desbloqueados con una animación breve.

**Registro:** Primer día · Semana completa (7 seguidos) · Un mes (30) · Cien días · Un año
**Alimentación:** Día redondo (primer 5) · Semana verde (7 seguidos ≥4) · Mes parejo
(promedio mensual ≥4) · Finde firme (sábado y domingo ≥4 durante 4 semanas seguidas)
**Entrenamiento:** Arranque (10 entrenos) · Cincuenta · Cien · Doble jornada (2 en un día)
· Nunca dos seguidos (un mes sin pasar 2 días sin moverte) · Mes completo (4 semanas
seguidas con meta)
**Equipo:** Los dos en línea (primera semana con ambos cumpliendo meta) · Treinta juntos
(racha conjunta de 30 días) · Primer desafío ganado · Diez desafíos ganados

### 4.6 Desafíos semanales (equipo)

Cada lunes se propone uno automáticamente, rotando; cualquiera de los dos puede cambiarlo
por otro de la lista durante el lunes. Se resuelve solo el domingo a las 23:59.

- **Suma 8** — 8 entrenamientos entre los dos
- **Promedio 4** — promedio de alimentación conjunto ≥ 4
- **Semana completa** — los dos cargan los 7 días
- **Sin baches** — ninguno pasa 2 días seguidos sin entrenar
- **En sintonía** — 3 días de la semana en que los dos entrenaron, cada uno lo suyo

Sin ganador ni ranking entre ellos: el desafío se gana o se pierde de a dos.

---

## 5. Pantallas

Navegación por tab bar inferior de cuatro ítems: **Hoy · Mes · Datos · Nosotros**.
Ajustes vive en el ícono de perfil del header.

### 5.1 Hoy (home)

```
┌─────────────────────────────┐
│  jueves 3            ⚙︎     │
│  septiembre                 │
│                             │
│  ¿Cómo comiste?             │
│  ( 1 )( 2 )( 3 )( 4 )( 5 )  │  ← 5 círculos, ramp de luz
│  Bien                       │  ← etiqueta del elegido
│  + agregar nota             │
│                             │
│  ¿Entrenaste?               │
│  [ Yoga ] [ Ludus ]         │  ← chips multi-select
│  [ Gym  ] [ Running ]       │
│  [ Descanso           ]     │  ← exclusivo con el resto
│                             │
│  ─────────────────────────  │
│  12 días seguidos  🛡        │  ← racha de registro + comodín
│  Semana  ███████░░░  3/4    │
└─────────────────────────────┘
```

- Autoguardado en cada toque, sin botón "Guardar". Feedback háptico.
- Cuando el día queda completo, la celda de hoy en el calendario se enciende: es uno de
  los dos únicos momentos de motion orquestado de toda la app (el otro es ganar un
  desafío).
- Un swipe lateral navega a los días anteriores dentro de la ventana de 7 días.
- Estado vacío del primer día: "Arrancá marcando cómo comiste hoy."

### 5.2 Mes

Calendario heatmap. Cada día es una celda cuadrada de esquinas suaves, **partida
horizontalmente**: la mitad superior toma el color de la alimentación (ramp cálido de
5 pasos), la mitad inferior el del entrenamiento (colores categóricos fríos, gris tenue
si fue descanso). Día sin cargar: sólo el contorno.

```
 L  M  M  J  V  S  D
 ▣  ▣  ▣  ▣  ▣  ▤  ▤
 ▣  ▣  ▤  ▣  ▣  ▣  ▢
 ▣  ▣  ▣  ▢  ▢  ▢  ▢
```

- Tap en un día → hoja inferior con el detalle; editable si está dentro de los 7 días.
- Switch arriba: **Yo / Nosotros**. En "Nosotros", los dos calendarios se muestran
  compactos, uno arriba del otro, con el nombre y color de cada uno.
- Debajo: resumen del mes (promedio de alimentación, total de entrenos, días cargados).

### 5.3 Datos

Selector de período: Semana · Mes · Año.

- **Puntaje de la semana** como número grande con su etiqueta, y el delta contra la
  semana anterior.
- **Línea**: promedio de alimentación por semana.
- **Barras**: entrenamientos por semana, con una línea punteada en la meta.
- **Distribución por tipo** de entrenamiento (barras horizontales, no torta: se comparan
  mejor y escalan si agrega tipos nuevos).
- **Mejor semana histórica**, con fecha y puntaje.
- **Un insight cruzado**, sólo cuando hay al menos 8 semanas de datos:
  "En las semanas que entrenaste 4 veces o más, tu promedio de alimentación fue 4,1.
  En las demás, 3,2." Si la diferencia es menor a 0,3, no se muestra nada.

### 5.4 Nosotros

- Racha conjunta en el header: días seguidos en que **los dos** cargaron.
- Desafío de la semana con su progreso.
- Las dos semanas lado a lado: puntaje, entrenos y promedio de cada uno. Mismo peso
  visual para ambos, sin flecha de "quién gana".
- Historial de desafíos ganados.
- Al ganarse un desafío, un único frame de celebración. Es el segundo y último momento de
  motion orquestado de la app.
- El nombre por defecto del equipo es "Nosotros", editable.

### 5.5 Logros

Grilla de badges. Los bloqueados se ven en gris con el criterio visible ("Cien días —
te faltan 34"), porque un logro oculto no motiva a nadie.

### 5.6 Ajustes

Nombre, emoji, color propio · tipos de entrenamiento (agregar, renombrar, recolorear,
desactivar) · meta semanal de entrenamientos · hora del recordatorio · compartir notas
(on/off) · vincular pareja por código · exportar todo a CSV.

---

## 6. Notificaciones

Un push diario a la hora configurada, sólo si el día no está cargado. Copy directo y sin
culpa: "Te falta cargar el jueves."

**Restricción de iOS a tener en cuenta:** el push en PWA requiere iOS 16.4+ y que la app
esté instalada en la pantalla de inicio. Implementar con Web Push + VAPID y service
worker. Si el permiso no está disponible, degradar a un recordatorio in-app (badge en el
ícono de la tab Hoy) sin romper nada.

---

## 7. Sistema de diseño

La app se abre de noche, casi siempre en la cama, una vez por día. El tema es oscuro por
defecto, y la lógica cromática es la que hace legible el calendario de un vistazo:
**la alimentación vive en la familia cálida, el entrenamiento en la fría.** En la celda
partida, no hace falta leyenda para saber qué mitad es cuál.

### Color

```
--bg          #151329   fondo, índigo profundo
--surface     #1E1B3A   tarjetas
--line        #2E2A52   bordes y divisores
--text        #EDEAFF   texto principal
--text-dim    #9A94C4   texto secundario
```

**Alimentación** — un solo tono ámbar que gana luz del 1 al 5. Un solo matiz, no un
semáforo rojo→verde: la escala mide un día propio, no aprobado/reprobado.

```
1 #4A3B2A   2 #7A5A2E   3 #A8802F   4 #D4A62A   5 #FFD24A
```

**Entrenamiento** — categóricos fríos, distinguibles entre sí y de la escala cálida:

```
Yoga #3DDC97   Ludus #8B6BFF   Gym #4A9BFF   Running #2FD8D2   Descanso #3A3660
```

Colores de persona para las vistas de equipo: violeta `#7C5CFF` y verde `#3DDC97` por
defecto, editables.

### Tipografía

- **Bricolage Grotesque** (variable) para números y títulos. Los números son los
  protagonistas de esta app y necesitan carácter propio.
- **Instrument Sans** para toda la UI y el texto corrido.
- Escala: 48 / 32 / 24 / 17 / 15 / 13. Sentence case en todo, sin versalitas ni
  etiquetas en mayúsculas.

### Movimiento

Dos piezas de motion orquestado en toda la app: el encendido de la celda del día cuando se
completa el registro, y el frame de celebración al ganar un desafío semanal. El resto son
transiciones de respuesta directa (abrir hoja, cambiar tab). Respetar
`prefers-reduced-motion`.

### Voz

Rioplatense, voseo, frases cortas. Sin exclamaciones de coach. Un día flojo se nombra sin
dramatizarlo; un día bueno se reconoce sin inflarlo.

---

## 8. Fases de construcción

**Fase 1 — MVP usable** (la app sirve sola desde acá)
Auth + perfil · pantalla Hoy con carga completa · calendario mensual propio · las tres
rachas · PWA instalable.

**Fase 2 — Devolución**
Pantalla Datos con los gráficos · puntaje semanal · logros.

**Fase 3 — Equipo**
Vinculación por código · vista Nosotros · racha conjunta · desafíos semanales · push.

**Fase 4 — Pulido**
Exportar CSV · insight cruzado · animación de desbloqueo de logros.

---

## 9. Decisiones tomadas por default

Las siguientes las resolví yo para no frenar el spec. Todas son fáciles de invertir:

1. **Las notas de alimentación son privadas por defecto**, con un switch para
   compartirlas. Todo lo demás es transparente entre los dos.
2. **Nadie edita ni borra el día del otro**, aunque lo vea completo.
3. La meta semanal de entrenamientos arranca en **4** y es configurable por persona.
4. Los tipos de entrenamiento son **por usuario**: ella puede tener Danza o Pilates sin
   que aparezcan en la lista de él.
5. El día cierra a las **4 AM** y la ventana de edición es de **7 días**.
6. **Descanso es un registro válido**, no un día perdido: mantiene la racha de registro y
   no penaliza el puntaje más allá de no sumar entrenamiento.
