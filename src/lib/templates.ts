import { LEVEL_LABEL, type Entry, type Profile } from "./types";

const DAY = 24 * 60 * 60 * 1000;

/** Соңғы 7 күндегі жазбалар бойынша «өз бетімен» үлесі. */
export function weeklySummary(entries: Entry[], profileId: string, now: Date) {
  const from = now.getTime() - 7 * DAY;
  const week = entries.filter(
    (e) => e.profileId === profileId && new Date(e.date).getTime() >= from && new Date(e.date).getTime() <= now.getTime(),
  );
  const independent = week.filter((e) => e.level === "independent").length;
  const assisted = week.filter((e) => e.level === "assisted").length;
  const total = week.length;
  return { total, independent, assisted, notyet: total - independent - assisted, pct: total ? Math.round((independent / total) * 100) : 0 };
}

export function lessonTemplate(p: Profile) {
  const supports = p.supports.length ? p.supports.join(", ") : "көрнекі тірек";
  return [
    `Оқушы: ${p.code}`,
    `Мақсат: ${p.goal}`,
    "",
    "1. Амандасу және көңіл-күй (3 мин) — суретті карточкамен.",
    `2. Негізгі тапсырма (15 мин) — қолдау: ${supports}.`,
    "3. Қайталау және бекіту (7 мин) — ойын түрінде.",
    "4. Қорытынды (5 мин) — оқушы өзі бағалайды (смайлик).",
  ].join("\n");
}

export function reportFromEntry(e: Entry, p: Profile | undefined) {
  const date = new Date(e.date).toLocaleDateString("kk-KZ");
  const lines = [
    "Құрметті ата-ана!",
    "",
    `${date} күнгі сабақта (${p?.code ?? "оқушы"}) «${e.task}» тапсырмасымен жұмыс істеді.`,
    `Нәтиже: ${LEVEL_LABEL[e.level].toLowerCase()}.`,
  ];
  if (e.note.trim()) lines.push(`Мұғалімнің ескертпесі: ${e.note.trim()}`);
  if (e.level !== "independent") lines.push("Үйде осы тапсырманы қысқа ойын түрінде қайталауды ұсынамыз.");
  lines.push("", "Құрметпен, дефектолог");
  return lines.join("\n");
}
