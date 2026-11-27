import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Avatar, avatarFor } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import type { Student } from "@/shared/types";

export const Route = createFileRoute("/profiles")({
  head: () => ({ meta: [{ title: "Оқушылар — Өз қадамым" }] }),
  component: Profiles,
});

function Profiles() {
  const { s } = useStore();
  const [adding, setAdding] = useState(false);
  return (
    <>
      <PageHeader title="Оқушылар" desc="Әр оқушының диагнозы мен ерекшелігін жазыңыз: жасанды интеллект ҚМЖ-ны соған қарай бейімдейді. PIN кодты ата-анаға беріңіз.">
        <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Оқушы қосу</button>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        {adding && <StudentForm onDone={() => setAdding(false)} />}
        {s.students.map((p) => <StudentForm key={p.id} student={p} />)}
      </div>
    </>
  );
}

function StudentForm({ student, onDone }: { student?: Student; onDone?: () => void }) {
  const { call } = useStore();
  const [f, setF] = useState({ name: student?.name ?? "", diagnosis: student?.diagnosis ?? "", notes: student?.notes ?? "", pin: student?.pin ?? "" });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = !student || f.name !== student.name || f.diagnosis !== student.diagnosis || f.notes !== student.notes || f.pin !== student.pin;
  const id = student?.id ?? "new";
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => { setF({ ...f, [k]: e.target.value }); setSaved(false); };
  return (
    <form className="card grid gap-3" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      try { await call("student.save", { id: student?.id, ...f }); setSaved(true); onDone?.(); } finally { setBusy(false); }
    }}>
      <div className="flex items-center gap-3">
        <Avatar {...avatarFor(student?.color ?? 0)} />
        <input aria-label="Аты-жөні" required className="input font-bold" value={f.name} onChange={set("name")} placeholder="Аты-жөні" />
      </div>
      <div>
        <label className="label" htmlFor={`dg-${id}`}>Диагнозы / ерекшелігі</label>
        <textarea id={`dg-${id}`} rows={2} className="input" value={f.diagnosis} onChange={set("diagnosis")} placeholder="Мысалы: ЗПР, назар аудару қиын, оқу баяу" />
      </div>
      <div>
        <label className="label" htmlFor={`nt-${id}`}>Не көмектеседі / ескертпе</label>
        <textarea id={`nt-${id}`} rows={2} className="input" value={f.notes} onChange={set("notes")} placeholder="Мысалы: суретпен жақсы түсінеді, қысқа нұсқау керек" />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor={`pn-${id}`}>Ата-ана PIN коды</label>
          <input id={`pn-${id}`} className="input w-28 font-mono" inputMode="numeric" value={f.pin} onChange={set("pin")} placeholder="авто" />
        </div>
        <button className="btn btn-primary" disabled={busy || !dirty}>{busy ? "Сақталуда…" : "Сақтау"}</button>
        {saved && !dirty && <span className="chip chip-teal">Сақталды</span>}
        {student && <button type="button" className="btn btn-ghost ml-auto text-rose" onClick={async () => { if (confirm(`${student.name} және оның барлық нәтижелерін жою керек пе?`)) await call("student.delete", { id: student.id }); }}>Жою</button>}
        {!student && <button type="button" className="btn btn-ghost" onClick={onDone}>Болдырмау</button>}
      </div>
    </form>
  );
}
