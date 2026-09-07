// Chequeo de las reglas del spec: corte de día, ventana de edición, rachas y puntaje.
// npm run check
const path = require("path");
const OUT = path.join(__dirname, "..", ".tmp-check", "out");
const dates = require(path.join(OUT, "dates.js"));
const streaks = require(path.join(OUT, "streaks.js"));
const score = require(path.join(OUT, "score.js"));

let fails = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}  →  ${JSON.stringify(got)}${ok ? "" : ` (esperado ${JSON.stringify(want)})`}`);
}

// ── corte a las 4 AM en Buenos Aires (UTC-3) ──
eq("01:30 BA cuenta para el día anterior", dates.todayKey(new Date("2026-09-08T04:30:00Z")), "2026-09-07");
eq("03:59 BA todavía es el día anterior", dates.todayKey(new Date("2026-09-08T06:58:00Z")), "2026-09-07");
eq("04:01 BA ya es el día nuevo", dates.todayKey(new Date("2026-09-08T07:01:00Z")), "2026-09-08");
eq("21:00 BA es el mismo día", dates.todayKey(new Date("2026-09-09T00:00:00Z")), "2026-09-08");

// ── ventana de edición ──
const TODAY = "2026-09-07";
eq("hoy es editable", dates.isEditable(TODAY, TODAY), true);
eq("hace 6 días es editable", dates.isEditable("2026-09-01", TODAY), true);
eq("hace 7 días ya no", dates.isEditable("2026-08-31", TODAY), false);
eq("mañana no se carga", dates.isEditable("2026-09-08", TODAY), false);
eq("la ventana tiene 7 días", dates.editableWindow(TODAY).length, 7);
eq("la ventana termina hoy", dates.editableWindow(TODAY)[6], TODAY);

// ── semanas ISO ──
eq("la semana arranca lunes", dates.weekStartKey("2026-09-07"), "2026-09-07"); // lunes
eq("domingo pertenece a la semana previa", dates.weekStartKey("2026-09-13"), "2026-09-07");

// ── helpers ──
const day = (date, o = {}) => ({
  date, entryId: null, nutritionScore: null, nutritionNote: null, restDay: false, trainingTypeIds: [], ...o,
});
const mapOf = (list) => new Map(list.map((d) => [d.date, d]));

// ── racha de registro ──
{
  const days = mapOf([
    day("2026-09-05", { nutritionScore: 4, trainingTypeIds: ["gym"] }),
    day("2026-09-06", { nutritionScore: 3, restDay: true }),
    day("2026-09-07", { nutritionScore: 5, trainingTypeIds: ["yoga"] }),
  ]);
  eq("3 días seguidos cargados", streaks.registrationStreak(days, TODAY), 3);
  eq("descanso mantiene la racha", streaks.registrationStreak(mapOf([day("2026-09-07", { nutritionScore: 2, restDay: true })]), TODAY), 1);
  eq("score sin entreno ni descanso no cuenta", streaks.registrationStreak(mapOf([day("2026-09-07", { nutritionScore: 5 })]), TODAY), 0);
  // hoy sin cargar todavía no rompe nada: se ancla en ayer
  const pendingToday = mapOf([
    day("2026-09-05", { nutritionScore: 4, restDay: true }),
    day("2026-09-06", { nutritionScore: 4, restDay: true }),
  ]);
  eq("hoy sin cargar no rompe la racha", streaks.registrationStreak(pendingToday, TODAY), 2);
}

// ── racha de alimentación con comodín ──
{
  // lunes 7 al domingo 13 es una semana ISO; usamos la semana del 31/8 al 6/9 también
  const days = mapOf([
    day("2026-09-01", { nutritionScore: 5 }),
    day("2026-09-02", { nutritionScore: 4 }),
    day("2026-09-03", { nutritionScore: 2 }), // primer flojo de esa semana → comodín
    day("2026-09-04", { nutritionScore: 4 }),
    day("2026-09-05", { nutritionScore: 5 }),
    day("2026-09-06", { nutritionScore: 4 }),
    day("2026-09-07", { nutritionScore: 5 }),
  ]);
  const s = streaks.nutritionStreak(days, TODAY);
  eq("el comodín puentea el día flojo", s.days, 6);
  eq("comodín disponible en la semana nueva", s.wildcardAvailable, true);

  const twoBad = mapOf([
    day("2026-09-01", { nutritionScore: 5 }),
    day("2026-09-02", { nutritionScore: 2 }),
    day("2026-09-03", { nutritionScore: 2 }),
    day("2026-09-04", { nutritionScore: 5 }),
    day("2026-09-05", { nutritionScore: 5 }),
    day("2026-09-06", { nutritionScore: 5 }),
    day("2026-09-07", { nutritionScore: 5 }),
  ]);
  eq("el segundo flojo de la semana sí corta", streaks.nutritionStreak(twoBad, TODAY).days, 4);

  const badThisWeek = mapOf([day("2026-09-07", { nutritionScore: 2 })]);
  eq("comodín gastado esta semana", streaks.nutritionStreak(badThisWeek, TODAY).wildcardAvailable, false);
}

// ── racha de semanas ──
{
  const days = new Map();
  // 3 semanas completas antes de la actual, con 4 entrenos cada una
  for (const start of ["2026-08-17", "2026-08-24", "2026-08-31"]) {
    for (let i = 0; i < 4; i++) {
      const d = dates.shiftKey(start, i);
      days.set(d, day(d, { nutritionScore: 4, trainingTypeIds: ["gym"] }));
    }
  }
  eq("3 semanas seguidas con la meta", streaks.weeklyGoalStreak(days, 4, TODAY), 3);
  eq("la semana en curso incompleta no corta", streaks.weeklyGoalStreak(days, 4, "2026-09-08"), 3);
  eq("con meta 5 no llega ninguna", streaks.weeklyGoalStreak(days, 5, TODAY), 0);
}

// ── puntaje semanal ──
{
  const days = new Map();
  for (let i = 0; i < 7; i++) {
    const d = dates.shiftKey("2026-09-07", i);
    days.set(d, day(d, { nutritionScore: 5, trainingTypeIds: ["gym"] }));
  }
  const perfect = score.weekSummary(days, "2026-09-07", 4);
  eq("semana perfecta = 100", perfect.score, 100);
  eq("etiqueta Top", perfect.label, "Top");

  const empty = score.weekSummary(new Map(), "2026-09-07", 4);
  eq("semana vacía = 0", empty.score, 0);

  // 4 entrenos (50) + promedio 4 (32) + 4 días cargados (5.71) = 87.71 → 88
  const partial = new Map();
  for (let i = 0; i < 4; i++) {
    const d = dates.shiftKey("2026-09-07", i);
    partial.set(d, day(d, { nutritionScore: 4, trainingTypeIds: ["gym"] }));
  }
  eq("semana con meta cumplida y 4 días", score.weekSummary(partial, "2026-09-07", 4).score, 88);
}


// ── logros ──
const achievements = require(path.join(OUT, "achievements.js"));
{
  const days = new Map();
  for (let i = 0; i < 10; i++) {
    const d = dates.shiftKey(TODAY, -i);
    days.set(d, day(d, { nutritionScore: 5, trainingTypeIds: ["gym"] }));
  }
  const states = achievements.evaluateAchievements({ days, goal: 4, today: TODAY });
  const by = (k) => states.find((s) => s.def.key === k);

  eq("son 19 logros, no 18 como dice el encabezado del spec", states.length, 19);
  eq("primer día desbloqueado", by("primer_dia").unlocked, true);
  eq("semana completa con 10 días seguidos", by("semana_completa").unlocked, true);
  eq("un mes todavía no", by("un_mes").unlocked, false);
  eq("faltan 20 días para el mes", by("un_mes").target - by("un_mes").current, 20);
  eq("día redondo con un 5", by("dia_redondo").unlocked, true);
  eq("diez entrenos", by("arranque").unlocked, true);
  eq("cincuenta todavía no", by("cincuenta").unlocked, false);
  eq("sin equipo, los logros de equipo quedan cerrados", by("treinta_juntos").unlocked, false);

  // "te faltan N" con la unidad correcta
  eq("unidad de días", achievements.formatMissing("dias", 20), "20 días");
  eq("singular sin plural roto", achievements.formatMissing("semanas", 1), "1 semana");
  eq("desafíos, no veces", achievements.formatMissing("desafios", 7), "7 desafíos");
  eq("promedio con coma", achievements.formatMissing("promedio", 0.3), "0,3 de promedio");
}

// ── racha conjunta ──
{
  const mine = new Map();
  const theirs = new Map();
  for (let i = 0; i < 5; i++) {
    const d = dates.shiftKey(TODAY, -i);
    mine.set(d, day(d, { nutritionScore: 4, restDay: true }));
    if (i < 3) theirs.set(d, day(d, { nutritionScore: 4, restDay: true }));
  }
  eq("la racha conjunta la corta el que falta", achievements.jointStreak(mine, theirs, TODAY), 3);
}

// ── desafíos ──
const challenges = require(path.join(OUT, "challenges.js"));
{
  eq("la rotación es estable para una misma semana",
     challenges.rotatedChallenge("2026-09-07").key,
     challenges.rotatedChallenge("2026-09-07").key);
  eq("la semana siguiente cambia de desafío",
     challenges.rotatedChallenge("2026-09-07").key !== challenges.rotatedChallenge("2026-09-14").key, true);

  const mine = new Map();
  const theirs = new Map();
  for (let i = 0; i < 7; i++) {
    const d = dates.shiftKey("2026-09-07", i);
    mine.set(d, day(d, { nutritionScore: 4, trainingTypeIds: ["gym"] }));
    theirs.set(d, day(d, { nutritionScore: 4, trainingTypeIds: ["yoga"] }));
  }
  const sunday = "2026-09-13";
  eq("suma 8: 14 entrenos entre los dos", challenges.challengeProgress("suma_8", mine, theirs, "2026-09-07", sunday).achieved, true);
  eq("promedio 4 conjunto", challenges.challengeProgress("promedio_4", mine, theirs, "2026-09-07", sunday).achieved, true);
  eq("semana completa: los dos los 7 días", challenges.challengeProgress("semana_completa", mine, theirs, "2026-09-07", sunday).achieved, true);
  eq("sin baches con todos los días entrenados", challenges.challengeProgress("sin_baches", mine, theirs, "2026-09-07", sunday).achieved, true);
  eq("en sintonía", challenges.challengeProgress("en_sintonia", mine, theirs, "2026-09-07", sunday).achieved, true);

  // dos días seguidos sin entrenar de uno solo rompen el desafío de los dos
  const lazy = new Map(mine);
  for (const d of ["2026-09-09", "2026-09-10"]) lazy.set(d, day(d, { nutritionScore: 4, restDay: true }));
  eq("dos descansos seguidos son un bache", challenges.challengeProgress("sin_baches", lazy, theirs, "2026-09-07", sunday).achieved, false);
}

// ── insight cruzado ──
const series = require(path.join(OUT, "series.js"));
{
  eq("sin 8 semanas no hay insight", series.crossedInsight(new Map(), 4), null);

  const days = new Map();
  for (let w = 0; w < 12; w++) {
    const start = dates.shiftKey("2026-09-07", -7 * w);
    const strong = w % 2 === 0;
    for (let i = 0; i < 7; i++) {
      const d = dates.shiftKey(start, i);
      days.set(d, day(d, {
        nutritionScore: strong ? 5 : 3,
        trainingTypeIds: strong && i < 4 ? ["gym"] : [],
        restDay: !(strong && i < 4),
      }));
    }
  }
  const insight = series.crossedInsight(days, 4);
  eq("con 12 semanas y diferencia clara, hay insight", insight !== null, true);
  eq("la diferencia es de 2 puntos", Math.round((insight ? insight.difference : 0) * 10) / 10, 2);
}

console.log(fails === 0 ? "\nTodo bien." : `\n${fails} fallas.`);
process.exit(fails === 0 ? 0 : 1);
