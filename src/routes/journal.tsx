import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Avatar, avatarFor, EmptyState } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import { shrinkImage } from "@/lib/api";
import { LEVEL_LABEL, levelOf, subjectName, type Level, type Student } from "@/shared/types";

export const Route = createFileRoute("/journal")({
  head: () => ({ meta: [{ title: "Ілгерілеу — Өз қадамым" }] }),
  component: Journal,
});

const LEVEL_CHIP: Record<Level, string> = { independent: "chip-teal", assisted: "chip-amber", notyet: "chip-rose" };

function Journal() {
  const { s } = useStore();
  return (
    <>
      <PageHeader title="Ілгерілеу" desc="Оқушы ойынды аяқтаған сайын нәтиже осында өзі түседі және шолу автоматты түрде жаңарады. Сурет пен жазба қосып, ата-анаға жариялай аласыз." />
      {s.students.length === 0 ? <EmptyState>Алдымен оқушы қосыңыз.</EmptyState> : (
        <div className="grid gap-6">{s.students.map((st) => <StudentProgress key={st.id} st={st} />)}</div>
      )}
    </>
  );
}

function StudentProgress({ st }: { st: Student }) {
  const { s, call } = useStore();
  const results = s.results.filter((r) => r.student_id === st.id);
  const posts = s.posts.filter((p) => p.student_id === st.id);
  const summary = s.summaries.find((x) => x.student_id === st.id);
  const [busy, setBusy] = useState(false);
  return (
    <section id={st.id} className="card grid gap-5 scroll-mt-24" aria-labelledby={`h-${st.id}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar {...avatarFor(st.color)} />
        <h2 id={`h-${st.id}`} className="text-xl font-extrabold">{st.name}</h2>
        <span className="chip chip-muted">{results.length} ойын</span>
      </div>

      <div className="rounded-2xl bg-teal-soft p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-teal">Автоматты шолу</p>
          <button className="btn btn-ghost px-2 py-1 text-xs" disabled={busy} onClick={async () => { setBusy(true); try { await call("summary", { student_id: st.id }); } finally { setBusy(false); } }}>{busy ? "Жаңартылуда…" : "Жаңарту"}</button>
        </div>
        <p className="whitespace-pre-line text-[15px]">{summary?.text || "Әзірге нәтиже жоқ. Оқушы ойын ойнағаннан кейін шолу өзі пайда болады."}</p>
        {summary && <p className="mt-1 text-xs text-muted-foreground">Жаңартылды: {new Date(summary.updated_at).toLocaleString("kk-KZ")}</p>}
      </div>

      {results.length > 0 && (
        <div>
          <h3 className="mb-2 font-bold">Орындаған тапсырмалары</h3>
          <ul className="grid gap-2">
            {results.slice(0, 8).map((r) => {
              const a = s.activities.find((x) => x.id === r.activity_id);
              const lv = levelOf(r);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
                  <span><span className="font-semibold">{r.game_title}</span> <span className="text-sm text-muted-foreground">· {a ? subjectName(a.subject) : ""} · {new Date(r.created_at).toLocaleDateString("kk-KZ")}</span></span>
                  <span className="flex items-center gap-2 text-sm">{r.correct}/{r.total} бірден <span className={`chip ${LEVEL_CHIP[lv]}`}>{LEVEL_LABEL[lv]}</span></span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <PostForm studentId={st.id} />
      {posts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-2xl border border-border">
              {p.photo_url && <img src={p.photo_url} alt="" className="aspect-[4/3] w-full object-cover" />}
              <div className="grid gap-2 p-3">
                {p.text && <p className="text-sm">{p.text}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  {p.published ? <span className="chip chip-teal">Ата-анаға жарияланды</span> : <span className="chip chip-muted">Жарияланбаған</span>}
                  <button className="btn px-3 py-1 text-xs" onClick={() => call("post.publish", { id: p.id, published: !p.published })}>{p.published ? "Жасыру" : "Жариялау"}</button>
                  <button className="btn btn-ghost px-2 py-1 text-xs text-rose" onClick={async () => { if (confirm("Жою керек пе?")) await call("post.delete", { id: p.id }); }}>Жою</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PostForm({ studentId }: { studentId: string }) {
  const { call } = useStore();
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  return (
    <form className="grid gap-2 rounded-2xl border border-dashed border-border p-3" onSubmit={async (e) => {
      e.preventDefault(); if (!text.trim() && !photo) return;
      setBusy(true);
      try { await call("post.save", { student_id: studentId, text, photo, published: publish }); setText(""); setPhoto(null); } finally { setBusy(false); }
    }}>
      <p className="text-sm font-bold">Сурет немесе жазба қосу</p>
      <textarea rows={2} className="input" aria-label="Жазба" value={text} onChange={(e) => setText(e.target.value)} placeholder="Мысалы: Бүгін үшбұрышты өзі тапты!" />
      <div className="flex flex-wrap items-center gap-2">
        <label className="btn cursor-pointer">
          📷 Сурет
          <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await shrinkImage(f)); e.target.value = ""; }} />
        </label>
        {photo && <img src={photo} alt="Таңдалған сурет" className="h-10 w-10 rounded-lg object-cover" />}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Ата-анаға бірден жариялау</label>
        <button className="btn btn-primary ml-auto" disabled={busy || (!text.trim() && !photo)}>{busy ? "Жүктелуде…" : "Қосу"}</button>
      </div>
    </form>
  );
}
