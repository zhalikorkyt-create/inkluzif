// Автоматты түрде жасалған: npm run build:edge (қолмен өзгертпеңіз)
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/teacher.ts
var teacher_exports = {};
__export(teacher_exports, {
  POST: () => POST
});
import { Buffer as Buffer4 } from "node:buffer";

// server/lib/db.ts
import { Buffer as Buffer2 } from "node:buffer";

// server/lib/env.ts
function env(k) {
  if (typeof Deno !== "undefined") return Deno.env.get(k) || void 0;
  return globalThis.process?.env[k] || void 0;
}

// server/lib/db.ts
import { createClient } from "@supabase/supabase-js";
var BUCKET = "media";
function supabaseDb(sb) {
  const ok = (r) => {
    if (r.error) throw new Error(r.error.message);
    return r.data;
  };
  return {
    real: true,
    async list(table, filter = {}) {
      let q = sb.from(table).select("*");
      for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
      return ok(await q.order("created_at", { ascending: false, nullsFirst: false }).limit(1e3));
    },
    async get(table, id, key = "id") {
      return ok(await sb.from(table).select("*").eq(key, id).maybeSingle());
    },
    async insert(table, row) {
      return ok(await sb.from(table).insert(row).select().single());
    },
    async update(table, id, patch, key = "id") {
      return ok(await sb.from(table).update(patch).eq(key, id).select().single());
    },
    async upsert(table, row, key) {
      ok(await sb.from(table).upsert(row, { onConflict: key }));
    },
    async remove(table, id) {
      ok(await sb.from(table).delete().eq("id", id));
    },
    async putFile(path, bytes, contentType) {
      ok(await sb.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: true }));
    },
    async fileUrl(path) {
      const r = await sb.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24);
      return r.data?.signedUrl ?? null;
    },
    async checkAdmin(user, pass) {
      const r = await sb.rpc("check_admin", { p_user: user, p_pass: pass });
      return r.data === true;
    }
  };
}
var mem = {};
var files = {};
var now = () => (/* @__PURE__ */ new Date()).toISOString();
function memoryDb() {
  const t = (n) => mem[n] ??= [];
  return {
    real: false,
    async list(table, filter = {}) {
      return t(table).filter((r) => Object.entries(filter).every(([k, v]) => r[k] === v)).sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
    },
    async get(table, id, key = "id") {
      return t(table).find((r) => r[key] === id) ?? null;
    },
    async insert(table, row) {
      const r = { id: crypto.randomUUID(), created_at: now(), ...row };
      t(table).push(r);
      return r;
    },
    async update(table, id, patch, key = "id") {
      const r = t(table).find((x) => x[key] === id);
      if (!r) throw new Error("not found");
      Object.assign(r, patch);
      return r;
    },
    async upsert(table, row, key) {
      const r = t(table).find((x) => x[key] === row[key]);
      if (r) Object.assign(r, row);
      else t(table).push({ created_at: now(), ...row });
    },
    async remove(table, id) {
      mem[table] = t(table).filter((r) => r.id !== id);
    },
    async putFile(path, bytes, contentType) {
      files[path] = `data:${contentType};base64,${Buffer2.from(bytes).toString("base64")}`;
    },
    async fileUrl(path) {
      return files[path] ?? null;
    },
    async checkAdmin(user, pass) {
      return user === "admin" && pass === (env("TEACHER_PASSWORD") ?? "demo");
    }
  };
}
var cached = null;
function db() {
  if (cached) return cached;
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (url && key) {
    cached = supabaseDb(createClient(url, key, { auth: { persistSession: false } }));
  } else {
    cached = memoryDb();
    seedMemory();
  }
  return cached;
}
function seedMemory() {
  const names = ["Оқушы 1", "Оқушы 2", "Оқушы 3"];
  mem.students = names.map((name, i) => ({
    id: crypto.randomUUID(),
    name,
    diagnosis: "",
    notes: "",
    pin: String(1111 * (i + 1)),
    color: i,
    created_at: new Date(Date.now() - (3 - i) * 1e3).toISOString()
  }));
}

// server/lib/http.ts
import { Buffer as Buffer3 } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";
var json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
var fail = (message, status = 400) => json({ error: message }, status);
async function body(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
var secret = () => env("APP_SECRET") || env("SUPABASE_SERVICE_ROLE_KEY") || "demo-secret";
async function teacherOk(req) {
  const raw = req.headers.get("x-teacher-key") ?? "";
  const k = raw.indexOf(":");
  if (k < 1) return false;
  return db().checkAdmin(decodeURIComponent(raw.slice(0, k)), decodeURIComponent(raw.slice(k + 1)));
}
function parentToken(studentId) {
  return `${studentId}.${createHmac("sha256", secret()).update(`parent:${studentId}`).digest("base64url").slice(0, 32)}`;
}
function studentFromToken(token) {
  const id = token.split(".")[0];
  if (!id) return null;
  const want = Buffer3.from(parentToken(id)), got = Buffer3.from(token);
  return want.length === got.length && timingSafeEqual(want, got) ? id : null;
}

// server/lib/ai.ts
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

// src/shared/types.ts
var SUBJECTS = [
  { id: "math", name: "Математика", grade: "5-сынып", tone: "mint" },
  { id: "kaz", name: "Қазақ тілі", grade: "5-сынып", tone: "peach" }
];
var subjectName = (id) => SUBJECTS.find((s) => s.id === id)?.name ?? id;
var LEVEL_LABEL = { independent: "Өз бетімен", assisted: "Көмекпен", notyet: "Әзірге қиын" };
function levelOf(r) {
  if (!r.total) return "notyet";
  const k = r.correct / r.total;
  return k >= 0.8 ? "independent" : k >= 0.4 ? "assisted" : "notyet";
}
var firstName = (full) => full.trim().split(/\s+/).slice(-1)[0] ?? full;

// server/lib/ai.ts
var MODEL = env("CLAUDE_MODEL") || "claude-opus-5-5";
var aiEnabled = () => Boolean(env("ANTHROPIC_API_KEY"));
var client = () => new Anthropic({ apiKey: env("ANTHROPIC_API_KEY") });
var ItemSchema = z.object({
  say: z.string().describe("Апайдың дауысымен оқылатын 1 қысқа сөйлем, қазақша"),
  question: z.string().describe("Экрандағы өте қысқа сұрақ, 2-6 сөз"),
  visual: z.object({
    kind: z.enum(["none", "shape", "count", "emoji"]),
    shape: z.enum(["none", "triangle", "square", "circle", "rectangle", "star"]),
    emoji: z.string(),
    count: z.number().int()
  }),
  options: z.array(z.string()).describe("choose/fill үшін 2-3 нұсқа; scramble үшін бос тізім"),
  answer: z.number().int().describe("Дұрыс нұсқаның индексі (0-ден); scramble үшін 0"),
  word: z.string().describe("scramble үшін жиналатын 3-5 әріпті сөз (бас әріппен емес); басқаларда бос")
});
var GamesSchema = z.object({
  title: z.string(),
  games: z.array(z.object({
    type: z.enum(["choose", "scramble", "fill"]),
    title: z.string(),
    instruction: z.string(),
    items: z.array(ItemSchema)
  }))
});
var SYSTEM = `Сен ерекше білім беру қажеттілігі бар балалармен жұмыс істейтін тәжірибелі дефектологсың.
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
async function generateGames(student, subject, lessonTitle, lessonText) {
  const user = `Оқушы: ${student.name}
Диагнозы / ерекшелігі: ${student.diagnosis || "көрсетілмеген"}
Мұғалімнің ескертпесі: ${student.notes || "жоқ"}
Пән: ${subjectName(subject)}, 5-сынып
ҚМЖ атауы: ${lessonTitle}
ҚМЖ мәтіні:
"""
${lessonText.slice(0, 2e4)}
"""
Осы оқушыға арналған өте жеңіл 2-3 ойын жаса.`;
  const res = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 16e3,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(GamesSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: user }]
  });
  if (res.stop_reason === "refusal") throw new Error("Жасанды интеллект бұл ҚМЖ-ны өңдей алмады.");
  const out = res.parsed_output;
  if (!out) throw new Error("Жауапты оқу мүмкін болмады, қайталап көріңіз.");
  return { title: out.title, games: sanitize(out.games) };
}
function sanitize(games) {
  return games.map((g) => ({
    ...g,
    items: g.items.filter((it) => g.type === "scramble" ? it.word.trim().length >= 2 : it.options.length >= 2).map((it) => ({ ...it, word: it.word.trim().toLowerCase(), answer: Math.min(Math.max(0, it.answer), Math.max(0, it.options.length - 1)) }))
  })).filter((g) => g.items.length > 0).slice(0, 3);
}
function statsText(student, results, activities) {
  if (!results.length) return `${student.name} әлі ойын ойнаған жоқ.`;
  const bySubject = /* @__PURE__ */ new Map();
  for (const r of results) {
    const a = activities.find((x) => x.id === r.activity_id);
    const k = a ? subjectName(a.subject) : "Басқа";
    bySubject.set(k, [...bySubject.get(k) ?? [], r]);
  }
  const lines = [`Барлығы ${results.length} ойын орындалды.`];
  for (const [k, rs] of bySubject) {
    const c = rs.reduce((a, r) => a + r.correct, 0), t = rs.reduce((a, r) => a + r.total, 0);
    lines.push(`${k}: ${t} тапсырманың ${c}-ін бірден дұрыс орындады (${t ? Math.round(c / t * 100) : 0}%).`);
  }
  const last = results[0];
  lines.push(`Соңғы ойын: «${last.game_title}» — ${LEVEL_LABEL[levelOf(last)].toLowerCase()}.`);
  return lines.join(" ");
}
async function summarize(student, results, activities) {
  const base = statsText(student, results, activities);
  if (!aiEnabled() || !results.length) return base;
  const rows = results.slice(0, 40).map((r) => `${r.created_at.slice(0, 10)} · ${r.game_title} (${r.game_type}) · ${r.correct}/${r.total} бірден дұрыс · қайталау ${r.retries}`).join("\n");
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 2e3,
    output_config: { effort: "low" },
    system: "Сен дефектологтың көмекшісісің. Оқушының ойын нәтижелері бойынша мұғалімге қазақ тілінде 3-4 сөйлемнен тұратын қысқа шолу жаз: не жақсы шықты, не қиын болды, келесі қадамға бір кеңес. Тек берілген деректерге сүйен, диагноз туралы жазба.",
    messages: [{ role: "user", content: `Оқушы: ${student.name}
Қысқа статистика: ${base}
Нәтижелер:
${rows}` }]
  });
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  return text || base;
}
async function parentAnswer(student, summary, results, posts, history) {
  const facts = [
    `Бала: ${student.name}`,
    `Мұғалімнің шолуы: ${summary || "әзірге жоқ"}`,
    `Соңғы нәтижелер:
${results.slice(0, 20).map((r) => `- ${r.created_at.slice(0, 10)}: «${r.game_title}» — ${r.total} тапсырманың ${r.correct}-і бірден дұрыс (${LEVEL_LABEL[levelOf(r)]})`).join("\n") || "әзірге жоқ"}`,
    `Мұғалімнің жарияланған жазбалары:
${posts.slice(0, 10).map((p) => `- ${p.created_at.slice(0, 10)}: ${p.text}`).join("\n") || "әзірге жоқ"}`
  ].join("\n\n");
  if (!aiEnabled()) {
    return `Қазіргі мәлімет: ${summary || "әзірге нәтиже жоқ."} (Толық жауап беретін бот жасанды интеллект кілті қосылғанда іске қосылады.)`;
  }
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 2e3,
    output_config: { effort: "low" },
    system: `Сен мектептегі дефектолог апайдың атынан ата-анаға жауап беретін мейірімді көмекшісің. Тек қазақ тілінде, қысқа (2-5 сөйлем), жылы және нақты жауап бер.
Тек төмендегі осы баланың деректеріне сүйен. Деректе жоқ нәрсені ойдан шығарма — "бұл туралы апайдан нақтылап сұраңыз" де. Басқа балалар туралы ешнәрсе айтпа. Медициналық кеңес берме.

${facts}`,
    messages: history.slice(-10)
  });
  return res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
}

// server/lib/fallback.ts
var item = (p) => ({
  say: "",
  question: "",
  visual: { kind: "none", shape: "none", emoji: "", count: 0 },
  options: [],
  answer: 0,
  word: "",
  ...p
});
var shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
function choose(correct, pool, n = 3) {
  const opts = shuffle([correct, ...shuffle(pool.filter((p) => p !== correct)).slice(0, n - 1)]);
  return { options: opts, answer: opts.indexOf(correct) };
}
function fallbackGames(subject, text) {
  if (subject === "math") {
    const shapes = [["triangle", "Үшбұрыш"], ["square", "Шаршы"], ["circle", "Дөңгелек"], ["rectangle", "Тіктөртбұрыш"]];
    const names = shapes.map((s) => s[1]);
    const emojis = ["🍎", "⭐", "🎈", "🐟"];
    return {
      title: "Пішіндер мен санау",
      games: [
        {
          type: "choose",
          title: "Пішінді тап",
          instruction: "Суретке қара. Бұл қандай пішін?",
          items: shuffle([...shapes]).slice(0, 3).map(([shape, name]) => item({ say: "Бұл қандай пішін? Дұрыс жауапты бас.", question: "Бұл қандай пішін?", visual: { kind: "shape", shape, emoji: "", count: 0 }, ...choose(name, names) }))
        },
        {
          type: "choose",
          title: "Санап көр",
          instruction: "Заттарды сана да, санды таңда.",
          items: [2, 4, 3].map((n, i) => item({ say: "Неше зат бар? Санап көр.", question: "Неше?", visual: { kind: "count", shape: "none", emoji: emojis[i], count: n }, ...choose(String(n), ["1", "2", "3", "4", "5"]) }))
        }
      ]
    };
  }
  const words = Array.from(new Set(text.toLowerCase().split(/[^а-яәғқңөұүһіё]+/u).filter((w) => w.length >= 3 && w.length <= 5 && !/^(және|бұл|осы|мен|сен|оның|үшін|туралы)$/u.test(w))));
  const pick = (words.length >= 3 ? words : ["ана", "ата", "алма", "мысық", "кітап"]).slice(0, 4);
  const letters = ["а", "ә", "о", "ө", "ұ", "ү", "ы", "і", "е"];
  return {
    title: "Дыбыстар мен сөздер",
    games: [
      {
        type: "choose",
        title: "Дыбысты тыңда",
        instruction: "Апайды тыңда да, дұрыс әріпті бас.",
        items: ["а", "ө", "ұ"].map((l) => item({ say: `«${l.toUpperCase()}» дыбысы. Осы әріпті тап.`, question: "Қай әріп айтылды?", ...choose(l.toUpperCase(), letters.map((x) => x.toUpperCase())) }))
      },
      {
        type: "scramble",
        title: "Сөзді құра",
        instruction: "Әріптерді дұрыс ретпен бас.",
        items: pick.slice(0, 3).map((w) => item({ say: `«${w}» сөзін құрастыр.`, question: "Сөзді құра", word: w }))
      }
    ]
  };
}

// server/lib/voice.ts
import { createHash } from "node:crypto";
var voiceEnabled = () => Boolean(env("ELEVENLABS_API_KEY") && env("ELEVENLABS_VOICE_ID"));
async function tts(text) {
  const voice = env("ELEVENLABS_VOICE_ID") ?? "";
  const model = env("ELEVENLABS_MODEL") || "eleven_v3";
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": env("ELEVENLABS_API_KEY") ?? "", "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: model, language_code: "kk" })
  });
  if (!r.ok) throw new Error(`ElevenLabs қатесі: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return new Uint8Array(await r.arrayBuffer());
}
async function audioFor(d, text) {
  const path = `audio/${createHash("sha1").update(`${env("ELEVENLABS_VOICE_ID")}:${text}`).digest("hex")}.mp3`;
  if (!await d.fileUrl(path).catch(() => null)) {
    await d.putFile(path, await tts(text), "audio/mpeg");
  }
  return path;
}
async function voiceGames(d, games) {
  const jobs = [];
  for (const g of games) {
    if (g.instruction) jobs.push(async () => {
      g.instruction_audio = await audioFor(d, g.instruction);
    });
    for (const it of g.items) if (it.say) jobs.push(async () => {
      it.audio = await audioFor(d, it.say);
    });
  }
  for (let i = 0; i < jobs.length; i += 4) await Promise.all(jobs.slice(i, i + 4).map((j) => j()));
  return games;
}
async function withAudioUrls(d, games) {
  const copy = JSON.parse(JSON.stringify(games));
  for (const g of copy) {
    if (g.instruction_audio) g.instruction_audio = await d.fileUrl(g.instruction_audio) ?? void 0;
    for (const it of g.items) if (it.audio) it.audio = await d.fileUrl(it.audio) ?? void 0;
  }
  return copy;
}

// server/teacher.ts
var randomPin = () => String(Math.floor(1e3 + Math.random() * 9e3));
async function refreshSummary(studentId) {
  const d = db();
  const student = await d.get("students", studentId);
  if (!student) return;
  const [results, activities] = await Promise.all([d.list("results", { student_id: studentId }), d.list("activities", { student_id: studentId })]);
  const text = await summarize(student, results, activities);
  await d.upsert("summaries", { student_id: studentId, text, updated_at: (/* @__PURE__ */ new Date()).toISOString() }, "student_id");
}
async function POST(req) {
  if (!await teacherOk(req)) return fail("Құпиясөз қате", 401);
  const d = db();
  const b = await body(req);
  try {
    switch (b.action) {
      case "ping":
        return json({ ok: true });
      case "state": {
        const [students, lessons, activities, results, posts, summaries] = await Promise.all([
          d.list("students"),
          d.list("lessons"),
          d.list("activities"),
          d.list("results"),
          d.list("posts"),
          d.list("summaries")
        ]);
        students.sort((a, b2) => a.created_at.localeCompare(b2.created_at));
        for (const p of posts) p.photo_url = p.photo_path ? await d.fileUrl(p.photo_path) : null;
        const state = { students, lessons, activities, results, posts, summaries, features: { ai: aiEnabled(), voice: voiceEnabled(), db: d.real } };
        return json(state);
      }
      case "student.save": {
        const row = { name: String(b.name ?? "").trim(), diagnosis: String(b.diagnosis ?? ""), notes: String(b.notes ?? ""), pin: String(b.pin || randomPin()).slice(0, 8) };
        if (!row.name) return fail("Аты-жөні керек");
        if (b.id) return json(await d.update("students", b.id, row));
        const count = (await d.list("students")).length;
        return json(await d.insert("students", { ...row, color: count }));
      }
      case "student.delete":
        await d.remove("students", b.id);
        return json({ ok: true });
      case "lesson.save": {
        const subject = b.subject === "kaz" ? "kaz" : "math";
        const text = String(b.text ?? "").trim();
        if (!text) return fail("ҚМЖ мәтіні бос");
        return json(await d.insert("lessons", { subject, title: String(b.title || "ҚМЖ").slice(0, 200), text: text.slice(0, 5e4) }));
      }
      case "lesson.delete":
        await d.remove("lessons", b.id);
        return json({ ok: true });
      case "adapt": {
        const [lesson, student] = await Promise.all([d.get("lessons", b.lesson_id), d.get("students", b.student_id)]);
        if (!lesson || !student) return fail("ҚМЖ немесе оқушы табылмады", 404);
        const gen = aiEnabled() ? await generateGames(student, lesson.subject, lesson.title, lesson.text) : fallbackGames(lesson.subject, lesson.text);
        if (!gen.games.length) return fail("Ойын құрастыру мүмкін болмады, қайталап көріңіз.");
        const activity = await d.insert("activities", { lesson_id: lesson.id, student_id: student.id, subject: lesson.subject, title: gen.title, games: gen.games, voiced: false });
        return json(activity);
      }
      case "voice": {
        if (!voiceEnabled()) return fail("ElevenLabs кілті мен дауыс ID-сі қосылмаған");
        const a = await d.get("activities", b.id);
        if (!a) return fail("Табылмады", 404);
        const games = await voiceGames(d, a.games);
        return json(await d.update("activities", a.id, { games, voiced: true }));
      }
      case "activity.delete":
        await d.remove("activities", b.id);
        return json({ ok: true });
      case "summary":
        await refreshSummary(b.student_id);
        return json(await d.get("summaries", b.student_id, "student_id"));
      case "post.save": {
        let photo_path = null;
        if (typeof b.photo === "string" && b.photo.startsWith("data:image/")) {
          const [meta, data] = b.photo.split(",", 2);
          const type = meta.slice(5, meta.indexOf(";"));
          const bytes = Buffer4.from(data, "base64");
          if (bytes.length > 4e6) return fail("Сурет тым үлкен");
          photo_path = `photos/${b.student_id}/${crypto.randomUUID()}.${type.split("/")[1] || "jpg"}`;
          await d.putFile(photo_path, bytes, type);
        }
        return json(await d.insert("posts", { student_id: b.student_id, text: String(b.text ?? ""), photo_path, published: Boolean(b.published) }));
      }
      case "post.publish":
        return json(await d.update("posts", b.id, { published: Boolean(b.published) }));
      case "post.delete":
        await d.remove("posts", b.id);
        return json({ ok: true });
      default:
        return fail("Белгісіз әрекет");
    }
  } catch (e) {
    console.error(e);
    return fail(e instanceof Error ? e.message : "Сервер қатесі", 500);
  }
}

// server/play.ts
var play_exports = {};
__export(play_exports, {
  GET: () => GET,
  POST: () => POST2
});
async function GET(req) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const d = db();
  const a = await d.get("activities", id).catch(() => null);
  if (!a) return fail("Ойын табылмады", 404);
  const s = await d.get("students", a.student_id);
  return json({ id: a.id, title: a.title, subject: a.subject, name: s ? firstName(s.name) : "", color: s?.color ?? 0, games: await withAudioUrls(d, a.games) });
}
async function POST2(req) {
  const b = await body(req);
  const d = db();
  const a = await d.get("activities", b.id).catch(() => null);
  if (!a || !Array.isArray(b.results)) return fail("Ойын табылмады", 404);
  for (const r of b.results.slice(0, 5)) {
    await d.insert("results", {
      activity_id: a.id,
      student_id: a.student_id,
      game_title: String(r.game_title).slice(0, 200),
      game_type: String(r.game_type).slice(0, 20),
      correct: Math.max(0, Math.min(50, r.correct | 0)),
      total: Math.max(0, Math.min(50, r.total | 0)),
      retries: Math.max(0, Math.min(500, r.retries | 0))
    });
  }
  try {
    const student = await d.get("students", a.student_id);
    if (student) {
      const [results, activities] = await Promise.all([d.list("results", { student_id: student.id }), d.list("activities", { student_id: student.id })]);
      const text = await summarize(student, results, activities);
      await d.upsert("summaries", { student_id: student.id, text, updated_at: (/* @__PURE__ */ new Date()).toISOString() }, "student_id");
    }
  } catch (e) {
    console.error("summary", e);
  }
  return json({ ok: true });
}

// server/parent.ts
var parent_exports = {};
__export(parent_exports, {
  POST: () => POST3
});
async function POST3(req) {
  const d = db();
  const b = await body(req);
  try {
    if (b.action === "students") {
      const list = await d.list("students");
      list.sort((a, c) => a.created_at.localeCompare(c.created_at));
      return json(list.map((s2) => ({ id: s2.id, name: s2.name })));
    }
    if (b.action === "login") {
      const s2 = await d.get("students", String(b.student_id ?? ""));
      if (!s2 || String(b.pin ?? "").trim() !== s2.pin) return fail("Код дұрыс емес. Апайдан кодты сұраңыз.", 401);
      return json({ token: parentToken(s2.id), name: s2.name });
    }
    const id = studentFromToken(String(b.token ?? ""));
    const s = id ? await d.get("students", id) : null;
    if (!s) return fail("Қайта кіріңіз", 401);
    const [results, posts, summary, activities] = await Promise.all([
      d.list("results", { student_id: s.id }),
      d.list("posts", { student_id: s.id, published: true }),
      d.get("summaries", s.id, "student_id"),
      d.list("activities", { student_id: s.id })
    ]);
    const summaryText = summary?.text || statsText(s, results, activities);
    if (b.action === "feed") {
      for (const p of posts) p.photo_url = p.photo_path ? await d.fileUrl(p.photo_path) : null;
      return json({
        name: s.name,
        summary: summaryText,
        results: results.slice(0, 20).map((r) => ({ id: r.id, title: r.game_title, correct: r.correct, total: r.total, level: LEVEL_LABEL[levelOf(r)], created_at: r.created_at })),
        posts: posts.map(({ id: id2, text, photo_url, created_at }) => ({ id: id2, text, photo_url, created_at }))
      });
    }
    if (b.action === "chat") {
      const history = (Array.isArray(b.messages) ? b.messages : []).filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map((m) => ({ role: m.role, content: String(m.content).slice(0, 2e3) }));
      if (!history.length || history[history.length - 1].role !== "user") return fail("Сұрақ жоқ");
      return json({ answer: await parentAnswer(s, summaryText, results, posts, history) });
    }
    return fail("Белгісіз әрекет");
  } catch (e) {
    console.error(e);
    return fail(e instanceof Error ? e.message : "Сервер қатесі", 500);
  }
}

// server/edge.ts
var routes = { teacher: teacher_exports, play: play_exports, parent: parent_exports };
var CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-teacher-key, authorization, apikey",
  "access-control-max-age": "86400"
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const name = new URL(req.url).pathname.split("/").filter(Boolean).pop() ?? "";
  const h = routes[name]?.[req.method];
  let res;
  try {
    res = h ? await h(req) : new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  } catch (e) {
    console.error(e);
    res = new Response(JSON.stringify({ error: "Сервер қатесі" }), { status: 500 });
  }
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
  return out;
});
