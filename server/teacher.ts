import { Buffer } from "node:buffer";
import { db } from "./lib/db.js";
import { body, fail, json, teacherOk } from "./lib/http.js";
import { aiEnabled, generateGames, summarize } from "./lib/ai.js";
import { fallbackGames } from "./lib/fallback.js";
import { voiceEnabled, voiceGames } from "./lib/voice.js";
import type { Activity, Lesson, Post, Result, Student, Summary, Subject, TeacherState } from "../src/shared/types.js";

const randomPin = () => String(Math.floor(1000 + Math.random() * 9000));

async function refreshSummary(studentId: string) {
  const d = db();
  const student = await d.get<Student>("students", studentId);
  if (!student) return;
  const [results, activities] = await Promise.all([d.list<Result>("results", { student_id: studentId }), d.list<Activity>("activities", { student_id: studentId })]);
  const text = await summarize(student, results, activities);
  await d.upsert("summaries", { student_id: studentId, text, updated_at: new Date().toISOString() }, "student_id");
}

export async function POST(req: Request) {
  if (!(await teacherOk(req))) return fail("Құпиясөз қате", 401);
  const d = db();
  const b = await body<Record<string, any>>(req);
  try {
    switch (b.action) {
      case "ping":
        return json({ ok: true });

      case "state": {
        const [students, lessons, activities, results, posts, summaries] = await Promise.all([
          d.list<Student>("students"), d.list<Lesson>("lessons"), d.list<Activity>("activities"), d.list<Result>("results"), d.list<Post>("posts"), d.list<Summary>("summaries"),
        ]);
        students.sort((a, b) => a.created_at.localeCompare(b.created_at));
        for (const p of posts) p.photo_url = p.photo_path ? await d.fileUrl(p.photo_path) : null;
        const state: TeacherState = { students, lessons, activities, results, posts, summaries, features: { ai: aiEnabled(), voice: voiceEnabled(), db: d.real } };
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
        const subject: Subject = b.subject === "kaz" ? "kaz" : "math";
        const text = String(b.text ?? "").trim();
        if (!text) return fail("ҚМЖ мәтіні бос");
        return json(await d.insert("lessons", { subject, title: String(b.title || "ҚМЖ").slice(0, 200), text: text.slice(0, 50000) }));
      }
      case "lesson.delete":
        await d.remove("lessons", b.id);
        return json({ ok: true });

      case "adapt": {
        const [lesson, student] = await Promise.all([d.get<Lesson>("lessons", b.lesson_id), d.get<Student>("students", b.student_id)]);
        if (!lesson || !student) return fail("ҚМЖ немесе оқушы табылмады", 404);
        const gen = aiEnabled() ? await generateGames(student, lesson.subject, lesson.title, lesson.text) : fallbackGames(lesson.subject, lesson.text);
        if (!gen.games.length) return fail("Ойын құрастыру мүмкін болмады, қайталап көріңіз.");
        const activity = await d.insert<Activity>("activities", { lesson_id: lesson.id, student_id: student.id, subject: lesson.subject, title: gen.title, games: gen.games, voiced: false });
        return json(activity);
      }
      case "voice": {
        if (!voiceEnabled()) return fail("ElevenLabs кілті мен дауыс ID-сі қосылмаған");
        const a = await d.get<Activity>("activities", b.id);
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
        let photo_path: string | null = null;
        if (typeof b.photo === "string" && b.photo.startsWith("data:image/")) {
          const [meta, data] = b.photo.split(",", 2);
          const type = meta.slice(5, meta.indexOf(";"));
          const bytes = Buffer.from(data, "base64");
          if (bytes.length > 4_000_000) return fail("Сурет тым үлкен");
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

