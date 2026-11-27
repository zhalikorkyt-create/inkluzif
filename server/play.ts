import { db } from "./lib/db.js";
import { body, fail, json } from "./lib/http.js";
import { withAudioUrls } from "./lib/voice.js";
import { summarize } from "./lib/ai.js";
import type { Activity, Result, Student } from "../src/shared/types.js";
import { firstName } from "../src/shared/types.js";

// Оқушының ойын беті: ойынды алу (GET) және нәтижені жіберу (POST).
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const d = db();
  const a = await d.get<Activity>("activities", id).catch(() => null);
  if (!a) return fail("Ойын табылмады", 404);
  const s = await d.get<Student>("students", a.student_id);
  return json({ id: a.id, title: a.title, subject: a.subject, name: s ? firstName(s.name) : "", color: s?.color ?? 0, games: await withAudioUrls(d, a.games) });
}

export async function POST(req: Request) {
  const b = await body<{ id: string; results: { game_title: string; game_type: string; correct: number; total: number; retries: number }[] }>(req);
  const d = db();
  const a = await d.get<Activity>("activities", b.id).catch(() => null);
  if (!a || !Array.isArray(b.results)) return fail("Ойын табылмады", 404);
  for (const r of b.results.slice(0, 5)) {
    await d.insert("results", {
      activity_id: a.id, student_id: a.student_id, game_title: String(r.game_title).slice(0, 200), game_type: String(r.game_type).slice(0, 20),
      correct: Math.max(0, Math.min(50, r.correct | 0)), total: Math.max(0, Math.min(50, r.total | 0)), retries: Math.max(0, Math.min(500, r.retries | 0)),
    });
  }
  // Ілгерілеу шолуын автоматты жаңарту
  try {
    const student = await d.get<Student>("students", a.student_id);
    if (student) {
      const [results, activities] = await Promise.all([d.list<Result>("results", { student_id: student.id }), d.list<Activity>("activities", { student_id: student.id })]);
      const text = await summarize(student, results, activities);
      await d.upsert("summaries", { student_id: student.id, text, updated_at: new Date().toISOString() }, "student_id");
    }
  } catch (e) { console.error("summary", e); }
  return json({ ok: true });
}
