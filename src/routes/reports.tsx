import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Есептер — Өз қадамым" }, { name: "description", content: "Журнал жазбасынан ата-анаға есеп жасау және бекіту." }] }),
  component: Reports,
});

function Reports() {
  const { s, updateReport, removeReport } = useStore();
  return (
    <>
      <PageHeader title="Ата-анаға есеп" desc="Есептер журнал жазбасынан жасалады. Мәтінді тексеріп, өңдеп, бекітіңіз — бекітілген есеп жіберу кезегіне түседі." />
      <p className="mb-6 rounded-2xl bg-sky-soft p-4 text-sm text-sky">Демо режимінде есеп ешкімге жіберілмейді: «Кезекте» күйі тек болашақ қауіпсіз жеткізуді көрсетеді.</p>
      {s.reports.length === 0 ? (
        <EmptyState>Әзірге есеп жоқ. <Link to="/journal" className="font-semibold text-primary underline">Журналдан</Link> жазбаны таңдап, «Есеп жасау» басыңыз.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {s.reports.map((r) => {
            const p = s.profiles.find((x) => x.id === r.profileId);
            const queued = r.status === "queued";
            return (
              <article key={r.id} className="card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{p?.code ?? "—"}</p>
                  {queued ? <span className="chip chip-teal">Кезекте</span> : <span className="chip chip-amber">Тексеруде</span>}
                </div>
                <textarea aria-label="Есеп мәтіні" rows={8} className="input" value={r.text} readOnly={queued} onChange={(e) => updateReport(r.id, { text: e.target.value })} />
                <div className="flex gap-2">
                  <button className={`btn ${queued ? "" : "btn-primary"}`} onClick={() => updateReport(r.id, { status: queued ? "draft" : "queued" })}>{queued ? "Кезектен алу" : "Бекіту"}</button>
                  <button className="btn" onClick={() => navigator.clipboard?.writeText(r.text)}>Көшіру</button>
                  <button className="btn btn-ghost text-rose" onClick={() => removeReport(r.id)}>Жою</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
