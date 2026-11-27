import { env } from "./env.js";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Game, Result, Student, Subject, Post, Activity } from "../../src/shared/types.js";
import { LEVEL_LABEL, levelOf, subjectName } from "../../src/shared/types.js";

const MODEL = env("CLAUDE_MODEL") || "claude-opus-5-5";
export const aiEnabled = () => Boolean(env("ANTHROPIC_API_KEY"));
const client = () => {
  const ws = env("ANTHROPIC_WORKSPACE_ID")?.trim();
  return new Anthropic({ apiKey: env("ANTHROPIC_API_KEY")?.trim(), ...(ws ? { defaultHeaders: { "anthropic-workspace-id": ws } } : {}) });
};

const ItemSchema = z.object({
  say: z.string().describe("Апайдың дауысымен оқылатын 1 қысқа сөйлем, қазақша"),
  question: z.string().describe("Экрандағы өте қысқа сұрақ, 2-6 сөз"),
  visual: z.object({
    kind: z.enum(["none", "shape", "count", "emoji"]),
    shape: z.enum(["none", "triangle", "square", "circle", "rectangle", "star"]),
    emoji: z.string(),
    count: z.number().int(),
  }),
  options: z.array(z.string()).describe("choose/fill үшін 2-3 нұсқа; scramble үшін бос тізім"),
  answer: z.number().int().describe("Дұрыс нұсқаның индексі (0-ден); scramble үшін 0"),
  word: z.string().describe("scramble үшін жиналатын 3-5 әріпті сөз (бас әріппен емес); басқаларда бос"),
});
const GamesSchema = z.object({
  title: z.string(),
  games: z.array(z.object({
    type: z.enum(["choose", "scramble", "fill"]),
    title: z.string(),
    instruction: z.string(),
    items: z.array(ItemSchema),
  })),
});

const SYSTEM = `Сен ерекше білім беру қажеттілігі бар балалармен жұмыс істейтін тәжірибелі дефектологсың.
Мұғалімнің ҚМЖ-сын (қысқа мерзімді жоспар) нақты бір оқушыға бейімдеп, ӨТЕ ЖЕҢІЛ, қызықты, ойын түріндегі тапсырмалар жасайсың.
Ережелер:
- Барлық мәтін тек қазақ тілінде, қарапайым, қысқа сөйлемдер.
- 2 немесе 3 ойын, әр ойында 3-4 тапсырма. Әр тапсырма бір ғана қадамнан тұрады.
- Оқушының диагнозы мен ерекшелігіне сай қиындықты төмендет: нұсқалар саны 2-3, визуалды тірек көп, абстракция жоқ.
- Математика: пішіндер (үшбұрыш, төртбұрыш, шаршы, дөңгелек, жұлдыз), 1-10 санау, көп/аз, қарапайым қосу. type="choose", visual.kind="shape" немесе "count" (emoji + count).
- Қазақ тілі: дыбыс/әріпті тыңдап таңдау (choose), шашылған әріптерден сөз құрау (scramble, 3-5 әріпті таныс сөз), қысқа сөйлемдегі бос орынды толтыру (fill, сөйлемде "___" болсын).
- "say" өрісі балаға мейірімді апайдың дауысымен айтылады: нұсқау + сұрақ, 1-2 қысқа сөйлем.
- answer міндетті түрде options ішіндегі дұрыс индекс болсын. Тапсырмалар ҚМЖ тақырыбымен байланысты болсын.
- Пайдаланылмайтын өрістер: visual.kind="none", shape="none", emoji="", count=0, word="".`;

export async function generateGames(student: Student, subject: Subject, lessonTitle: string, lessonText: string): Promise<{ title: string; games: Game[] }> {
  const user = `Оқушы: ${student.name}
Диагнозы / ерекшелігі: ${student.diagnosis || "көрсетілмеген"}
Мұғалімнің ескертпесі: ${student.notes || "жоқ"}
Пән: ${subjectName(subject)}, 5-сынып
ҚМЖ атауы: ${lessonTitle}
ҚМЖ мәтіні:
"""
${lessonText.slice(0, 20000)}
"""
Осы оқушыға арналған өте жеңіл 2-3 ойын жаса.`;

  const res = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(GamesSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: user }],
  });
  if (res.stop_reason === "refusal") throw new Error("Жасанды интеллект бұл ҚМЖ-ны өңдей алмады.");
  const out = res.parsed_output;
  if (!out) throw new Error("Жауапты оқу мүмкін болмады, қайталап көріңіз.");
  return { title: out.title, games: sanitize(out.games as Game[]) };
}

function sanitize(games: Game[]): Game[] {
  return games
    .map((g) => ({
      ...g,
      items: g.items
        .filter((it) => (g.type === "scramble" ? it.word.trim().length >= 2 : it.options.length >= 2))
        .map((it) => ({ ...it, word: it.word.trim().toLowerCase(), answer: Math.min(Math.max(0, it.answer), Math.max(0, it.options.length - 1)) })),
    }))
    .filter((g) => g.items.length > 0)
    .slice(0, 3);
}

// ---------- Шолу (Ілгерілеу) ----------
export function statsText(student: Student, results: Result[], activities: Activity[]) {
  if (!results.length) return `${student.name} әлі ойын ойнаған жоқ.`;
  const bySubject = new Map<string, Result[]>();
  for (const r of results) {
    const a = activities.find((x) => x.id === r.activity_id);
    const k = a ? subjectName(a.subject) : "Басқа";
    bySubject.set(k, [...(bySubject.get(k) ?? []), r]);
  }
  const lines = [`Барлығы ${results.length} ойын орындалды.`];
  for (const [k, rs] of bySubject) {
    const c = rs.reduce((a, r) => a + r.correct, 0), t = rs.reduce((a, r) => a + r.total, 0);
    lines.push(`${k}: ${t} тапсырманың ${c}-ін бірден дұрыс орындады (${t ? Math.round((c / t) * 100) : 0}%).`);
  }
  const last = results[0];
  lines.push(`Соңғы ойын: «${last.game_title}» — ${LEVEL_LABEL[levelOf(last)].toLowerCase()}.`);
  return lines.join(" ");
}

export async function summarize(student: Student, results: Result[], activities: Activity[]): Promise<string> {
  const base = statsText(student, results, activities);
  if (!aiEnabled() || !results.length) return base;
  const rows = results.slice(0, 40).map((r) => `${r.created_at.slice(0, 10)} · ${r.game_title} (${r.game_type}) · ${r.correct}/${r.total} бірден дұрыс · қайталау ${r.retries}`).join("\n");
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low" },
    system: "Сен дефектологтың көмекшісісің. Оқушының ойын нәтижелері бойынша мұғалімге қазақ тілінде 3-4 сөйлемнен тұратын қысқа шолу жаз: не жақсы шықты, не қиын болды, келесі қадамға бір кеңес. Тек берілген деректерге сүйен, диагноз туралы жазба.",
    messages: [{ role: "user", content: `Оқушы: ${student.name}\nҚысқа статистика: ${base}\nНәтижелер:\n${rows}` }],
  });
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  return text || base;
}

// ---------- Ата-ана боты ----------
export async function parentAnswer(student: Student, summary: string, results: Result[], posts: Post[], history: { role: "user" | "assistant"; content: string }[]) {
  const facts = [
    `Бала: ${student.name}`,
    `Мұғалімнің шолуы: ${summary || "әзірге жоқ"}`,
    `Соңғы нәтижелер:\n${results.slice(0, 20).map((r) => `- ${r.created_at.slice(0, 10)}: «${r.game_title}» — ${r.total} тапсырманың ${r.correct}-і бірден дұрыс (${LEVEL_LABEL[levelOf(r)]})`).join("\n") || "әзірге жоқ"}`,
    `Мұғалімнің жарияланған жазбалары:\n${posts.slice(0, 10).map((p) => `- ${p.created_at.slice(0, 10)}: ${p.text}`).join("\n") || "әзірге жоқ"}`,
  ].join("\n\n");
  if (!aiEnabled()) {
    return `Қазіргі мәлімет: ${summary || "әзірге нәтиже жоқ."} (Толық жауап беретін бот жасанды интеллект кілті қосылғанда іске қосылады.)`;
  }
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low" },
    system: `Сен мектептегі дефектолог апайдың атынан ата-анаға жауап беретін мейірімді көмекшісің. Тек қазақ тілінде, қысқа (2-5 сөйлем), жылы және нақты жауап бер.
Тек төмендегі осы баланың деректеріне сүйен. Деректе жоқ нәрсені ойдан шығарма — "бұл туралы апайдан нақтылап сұраңыз" де. Басқа балалар туралы ешнәрсе айтпа. Медициналық кеңес берме.

${facts}`,
    messages: history.slice(-10),
  });
  return res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
}
