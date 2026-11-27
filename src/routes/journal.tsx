import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, EmptyState } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import { LEVEL_LABEL, type Level } from "@/lib/types";
import { reportFromEntry } from "@/lib/templates";

export const Route = createFileRoute("/journal")({
  head: () => ({ meta: [{ title: "Журнал — Өз қадамым" }, { name: "description", content: "Сабақ нәтижесін жазу: өз бетімен / көмекпен / әзірге жоқ." }] }),
  component: Journal,
});

const LEVEL_CHIP: Record<Level, string> = { independent: "chip-teal", assisted: "chip-amber", notyet: "chip-rose" };
const today = () => new Date().toISOString().slice(0, 10);

function Journal() {
  const { s, addEntry, removeEntry, addReport } = useStore();
  const sel = s.profiles.filter((p) => p.selected);
  const list = sel.length ? sel : s.profiles;
  const [profileId, setProfileId] = useState(list[0]?.id ?? "");
  const [date, setDate] = useState(today());
  const [task, setTask] = useState("");
  const [level, setLevel] = useState<Level>("independent");
  const [note, setNote] = useState("");
  const approved = s.drafts.filter((d) => d.approved && d.profileId === profileId);
  const [draftId, setDraftId] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !task.trim()) return;
    addEntry({ profileId, date: new Date(date + "T12:00:00").toISOString(), task: task.trim(), level, note, draftId: draftId || undefined });
    setTask(""); setNote(""); setLevel("independent");
  };

  return (
    <>
      <PageHeader title="Журнал" desc="Әр тапсырманың нәтижесін белгілеңіз. Жазбадан бір басумен ата-анаға есеп жасауға болады." />
      <form onSubmit={submit} className="card grid gap-4 md:grid-cols-2" aria-label="Жаңа жазба">
        <div>
          <label className="label" htmlFor="jp">Оқушы</label>
          <select id="jp" className="input" value={profileId} onChange={(e) => { setProfileId(e.target.value); setDraftId(""); }}>
            {s.profiles.map((p) => <option key={p.id} value={p.id}>{p.code}{p.selected ? " (таңдалған)" : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="jd">Күні</label>
          <input id="jd" type="date" className="input" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="jt">Тапсырма</label>
          <input id="jt" className="input" required value={task} onChange={(e) => setTask(e.target.value)} placeholder="Мысалы: 5 затты санау" />
        </div>
        <div>
          <label className="label" htmlFor="jl">Бекітілген жоспар (міндетті емес)</label>
          <select id="jl" className="input" value={draftId} onChange={(e) => setDraftId(e.target.value)}>
            <option value="">—</option>
            {approved.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>
        <fieldset className="md:col-span-2">
          <legend className="label">Нәтиже</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => (
              <label key={l} className={`btn cursor-pointer ${level === l ? "btn-primary" : ""}`}>
                <input type="radio" name="level" className="sr-only" checked={level === l} onChange={() => setLevel(l)} />
                {LEVEL_LABEL[l]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="md:col-span-2">
          <label className="label" htmlFor="jn">Ескертпе</label>
          <textarea id="jn" rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn btn-primary justify-self-start" disabled={!task.trim()}>Жазбаны қосу</button>
      </form>

      <h2 className="mb-3 mt-8 text-xl font-bold">Жазбалар</h2>
      {s.entries.length === 0 ? <EmptyState>Әзірге жазба жоқ.</EmptyState> : (
        <ul className="grid gap-3">
          {[...s.entries].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
            const p = s.profiles.find((x) => x.id === e.profileId);
            const hasReport = s.reports.some((r) => r.entryId === e.id);
            return (
              <li key={e.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{p?.code} · {e.task}</p>
                  <p className="text-sm text-muted-foreground">{new Date(e.date).toLocaleDateString("kk-KZ")}{e.note && ` · ${e.note}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`chip ${LEVEL_CHIP[e.level]}`}>{LEVEL_LABEL[e.level]}</span>
                  {hasReport
                    ? <Link to="/reports" className="btn">Есепті ашу</Link>
                    : <button className="btn" onClick={() => addReport({ profileId: e.profileId, entryId: e.id, text: reportFromEntry(e, p) })}>Есеп жасау</button>}
                  <button className="btn btn-ghost text-rose" onClick={() => removeEntry(e.id)} aria-label="Жазбаны жою">Жою</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
