import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, EmptyState, Avatar, avatarFor, Notice } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import { SUBJECTS, subjectName, type Activity, type Subject } from "@/shared/types";

export const Route = createFileRoute("/lesson")({
  validateSearch: (q: Record<string, unknown>): { subject?: string } => ({ subject: typeof q.subject === "string" ? q.subject : undefined }),
  head: () => ({ meta: [{ title: "ҚМЖ бейімдеу — Өз қадамым" }] }),
  component: Lesson,
});

async function readFile(f: File): Promise<string> {
  if (f.name.toLowerCase().endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    return (await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value;
  }
  return f.text();
}

function Lesson() {
  const { s, call } = useStore();
  const search = Route.useSearch();
  const [subject, setSubject] = useState<Subject>(search.subject === "kaz" ? "kaz" : "math");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string[]>(s.students.map((x) => x.id));
  const [progress, setProgress] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onFile = async (f?: File) => {
    if (!f) return;
    setErr("");
    try { setText(await readFile(f)); setTitle(f.name.replace(/\.(txt|docx)$/i, "")); }
    catch { setErr("Файлды оқу мүмкін болмады. TXT немесе DOCX таңдаңыз."); }
  };

  const adapt = async () => {
    setBusy(true); setErr(""); setProgress([]);
    try {
      const lesson = await call<{ id: string }>("lesson.save", { subject, title: title || `${subjectName(subject)} ҚМЖ`, text });
      for (const id of picked) {
        const st = s.students.find((x) => x.id === id)!;
        setProgress((p) => [...p, `${st.name}: бейімделуде…`]);
        try {
          await call("adapt", { lesson_id: lesson.id, student_id: id });
          setProgress((p) => p.map((l) => (l.startsWith(st.name) ? `${st.name}: дайын ✓` : l)));
        } catch (e) {
          setProgress((p) => p.map((l) => (l.startsWith(st.name) ? `${st.name}: қате — ${e instanceof Error ? e.message : e}` : l)));
        }
      }
      setText(""); setTitle("");
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="ҚМЖ бейімдеу" desc="Кез келген ҚМЖ-ны жүктеңіз. Әр оқушының диагнозына қарай өте жеңіл 2–3 ойын жасалады: математикада пішіндер мен санау, қазақ тілінде дыбыс тыңдау, шашылған әріптер, бос орынды толтыру." />
      {!s.features.ai && <div className="mb-5"><Notice tone="amber">Жасанды интеллект кілті әлі қосылмаған, сондықтан қазір қарапайым үлгі ойындар жасалады.</Notice></div>}
      <section className="card grid gap-4" aria-label="Жаңа ҚМЖ">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="sb">Пән</label>
            <select id="sb" className="input" value={subject} onChange={(e) => setSubject(e.target.value as Subject)}>
              {SUBJECTS.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.grade}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tt">Тақырыбы</label>
            <input id="tt" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Мысалы: Геометриялық пішіндер" />
          </div>
        </div>
        <label className="btn cursor-pointer justify-self-start">
          ҚМЖ жүктеу (TXT/DOCX)
          <input type="file" accept=".txt,.docx" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        <div>
          <label className="label" htmlFor="tx">ҚМЖ мәтіні</label>
          <textarea id="tx" rows={8} className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Файлды жүктеңіз немесе мәтінді осында қойыңыз…" />
        </div>
        <fieldset>
          <legend className="label">Кімге бейімдейміз?</legend>
          <div className="flex flex-wrap gap-2">
            {s.students.map((st) => {
              const on = picked.includes(st.id);
              return (
                <label key={st.id} className={`btn cursor-pointer ${on ? "border-primary bg-teal-soft" : ""}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => setPicked(on ? picked.filter((x) => x !== st.id) : [...picked, st.id])} />
                  <Avatar {...avatarFor(st.color)} /> {st.name}
                </label>
              );
            })}
          </div>
        </fieldset>
        {err && <p className="chip chip-rose" role="alert">{err}</p>}
        <button className="btn btn-primary justify-self-start" disabled={busy || !text.trim() || !picked.length} onClick={adapt}>{busy ? "Бейімделуде… (бір оқушыға ~30 сек)" : "Оқушыларға бейімдеу"}</button>
        {progress.length > 0 && <ul className="grid gap-1 text-sm" aria-live="polite">{progress.map((l) => <li key={l}>{l}</li>)}</ul>}
      </section>

      <h2 className="mb-3 mt-8 text-2xl font-extrabold">Дайын ойындар</h2>
      {s.activities.length === 0 ? <EmptyState>Әзірге ойын жоқ. Жоғарыда ҚМЖ жүктеп, «Оқушыларға бейімдеу» басыңыз.</EmptyState> : (
        <div className="grid gap-4 md:grid-cols-2">{s.activities.map((a) => <ActivityCard key={a.id} a={a} />)}</div>
      )}
    </>
  );
}

function ActivityCard({ a }: { a: Activity }) {
  const { s, call } = useStore();
  const st = s.students.find((x) => x.id === a.student_id);
  const played = s.results.filter((r) => r.activity_id === a.id).length;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const link = `${location.origin}/play/${a.id}`;
  return (
    <article className="card flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {st && <Avatar {...avatarFor(st.color)} />}
        <div className="min-w-0">
          <p className="font-bold">{st?.name ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{subjectName(a.subject)} · {a.title} · {new Date(a.created_at).toLocaleDateString("kk-KZ")}</p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2">{a.games.map((g, i) => <li key={i} className="chip chip-muted">{g.title} · {g.items.length}</li>)}</ul>
      <div className="flex flex-wrap gap-2">
        {a.voiced ? <span className="chip chip-teal">🔊 Апайдың дауысы қосылған</span> : <span className="chip chip-amber">Дауыссыз</span>}
        {played > 0 && <span className="chip chip-sky">{played} рет ойналды</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/play/$id" params={{ id: a.id }} target="_blank" className="btn btn-primary">Ойынды ашу</Link>
        <button className="btn" onClick={() => { navigator.clipboard?.writeText(link); setMsg("Сілтеме көшірілді"); }}>Сілтемені көшіру</button>
        {s.features.voice && !a.voiced && (
          <button className="btn" disabled={busy} onClick={async () => { setBusy(true); setMsg(""); try { await call("voice", { id: a.id }); } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } }}>{busy ? "Дауыстауда…" : "🔊 Дауыстау"}</button>
        )}
        <button className="btn btn-ghost text-rose" onClick={async () => { if (confirm("Ойынды жою керек пе?")) await call("activity.delete", { id: a.id }); }}>Жою</button>
      </div>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </article>
  );
}
