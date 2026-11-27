import { db } from "./lib/db.js";
import { body, fail, json, parentToken, studentFromToken } from "./lib/http.js";
import { parentAnswer, statsText } from "./lib/ai.js";
import type { Activity, Post, Result, Student, Summary } from "../src/shared/types.js";
import { LEVEL_LABEL, levelOf } from "../src/shared/types.js";

// Ата-ана порталы: баланы таңдау + PIN, жарияланған жазбалар, нәтижелер және бот.
export async function POST(req: Request) {
  const d = db();
  const b = await body<Record<string, any>>(req);
  try {
    if (b.action === "students") {
      const list = await d.list<Student>("students");
      list.sort((a, c) => a.created_at.localeCompare(c.created_at));
      return json(list.map((s) => ({ id: s.id, name: s.name })));
    }
    if (b.action === "login") {
      const s = await d.get<Student>("students", String(b.student_id ?? ""));
      if (!s || String(b.pin ?? "").trim() !== s.pin) return fail("Код дұрыс емес. Апайдан кодты сұраңыз.", 401);
      return json({ token: parentToken(s.id), name: s.name });
    }

    const id = studentFromToken(String(b.token ?? ""));
    const s = id ? await d.get<Student>("students", id) : null;
    if (!s) return fail("Қайта кіріңіз", 401);
    const [results, posts, summary, activities] = await Promise.all([
      d.list<Result>("results", { student_id: s.id }),
      d.list<Post>("posts", { student_id: s.id, published: true }),
      d.get<Summary>("summaries", s.id, "student_id"),
      d.list<Activity>("activities", { student_id: s.id }),
    ]);
    const summaryText = summary?.text || statsText(s, results, activities);

    if (b.action === "feed") {
      for (const p of posts) p.photo_url = p.photo_path ? await d.fileUrl(p.photo_path) : null;
      return json({
        name: s.name,
        summary: summaryText,
        results: results.slice(0, 20).map((r) => ({ id: r.id, title: r.game_title, correct: r.correct, total: r.total, level: LEVEL_LABEL[levelOf(r)], created_at: r.created_at })),
        posts: posts.map(({ id, text, photo_url, created_at }) => ({ id, text, photo_url, created_at })),
      });
    }
    if (b.action === "chat") {
      const history = (Array.isArray(b.messages) ? b.messages : [])
        .filter((m: any) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
      if (!history.length || history[history.length - 1].role !== "user") return fail("Сұрақ жоқ");
      return json({ answer: await parentAnswer(s, summaryText, results, posts, history) });
    }
    return fail("Белгісіз әрекет");
  } catch (e) {
    console.error(e);
    return fail(e instanceof Error ? e.message : "Сервер қатесі", 500);
  }
}
