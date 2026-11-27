import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, EmptyState } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import { lessonTemplate } from "@/lib/templates";

export const Route = createFileRoute("/lesson")({
  head: () => ({ meta: [{ title: "Сабақ жоспары — Өз қадамым" }, { name: "description", content: "TXT/DOCX жүктеу, мәтін қою немесе үлгі алу." }] }),
  component: Lesson,
});

async function readFile(f: File): Promise<string> {
  if (f.name.toLowerCase().endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const { value } = await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() });
    return value;
  }
  return f.text();
}

function Lesson() {
  const { s, addDraft, updateDraft, removeDraft } = useStore();
  const sel = s.profiles.filter((p) => p.selected);
  const [profileId, setProfileId] = useState(sel[0]?.id ?? s.profiles[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [source, setSource] = useState<"upload" | "paste" | "template">("paste");
  const [err, setErr] = useState("");
  const profile = s.profiles.find((p) => p.id === profileId);

  const onFile = async (f?: File) => {
    if (!f) return;
    setErr("");
    try { setText(await readFile(f)); setTitle(f.name.replace(/\.(txt|docx)$/i, "")); setSource("upload"); }
    catch { setErr("Файлды оқу мүмкін болмады. TXT немесе DOCX файлын таңдаңыз."); }
  };

  const save = () => {
    if (!profile || !text.trim()) return;
    addDraft({ profileId, title: title.trim() || `${profile.code} — сабақ`, text, source });
    setTitle(""); setText(""); setSource("paste");
  };

  return (
    <>
      <PageHeader title="Сабақ жоспары" desc="Жоспарды файлдан жүктеңіз, мәтінді қойыңыз немесе оқушының мақсатына сай үлгіні алыңыз. Содан кейін бекітіңіз." />
      <section className="card grid gap-4" aria-label="Жаңа жоспар">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="pr">Оқушы</label>
            <select id="pr" className="input" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
              {s.profiles.map((p) => <option key={p.id} value={p.id}>{p.code}{p.selected ? " (таңдалған)" : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tt">Атауы</label>
            <input id="tt" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Мысалы: Санау, 1-сабақ" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="btn cursor-pointer">
            TXT/DOCX жүктеу
            <input type="file" accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          <button className="btn" disabled={!profile} onClick={() => { if (profile) { setText(lessonTemplate(profile)); setTitle(`${profile.code} — үлгі сабақ`); setSource("template"); } }}>Үлгіні алу</button>
        </div>
        {err && <p className="chip chip-rose" role="alert">{err}</p>}
        <div>
          <label className="label" htmlFor="tx">Жоспар мәтіні</label>
          <textarea id="tx" rows={9} className="input font-mono" value={text} onChange={(e) => { setText(e.target.value); if (source !== "upload") setSource("paste"); }} placeholder="Мәтінді осында қойыңыз…" />
        </div>
        <button className="btn btn-primary justify-self-start" disabled={!text.trim() || !profile} onClick={save}>Жоспарды сақтау</button>
      </section>

      <h2 className="mb-3 mt-8 text-xl font-bold">Сақталған жоспарлар</h2>
      {s.drafts.length === 0 ? <EmptyState>Әзірге жоспар жоқ.</EmptyState> : (
        <div className="grid gap-4 md:grid-cols-2">
          {s.drafts.map((d) => {
            const p = s.profiles.find((x) => x.id === d.profileId);
            return (
              <article key={d.id} className="card flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{d.title}</p>
                  {d.approved ? <span className="chip chip-teal">Бекітілген</span> : <span className="chip chip-amber">Жоба</span>}
                </div>
                <p className="text-sm text-muted-foreground">{p?.code} · {new Date(d.createdAt).toLocaleDateString("kk-KZ")}</p>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-sm">{d.text}</pre>
                <div className="flex gap-2">
                  <button className={`btn ${d.approved ? "" : "btn-primary"}`} onClick={() => updateDraft(d.id, { approved: !d.approved })}>{d.approved ? "Бекітуді алу" : "Бекіту"}</button>
                  <button className="btn btn-ghost text-rose" onClick={() => removeDraft(d.id)}>Жою</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
