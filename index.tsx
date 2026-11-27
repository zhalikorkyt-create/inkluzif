import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, DemoBadge } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import { weeklySummary } from "@/lib/templates";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Басты бет — Өз қадамым" },
    { name: "description", content: "Дефектологтың демо тақтасы: оқушылар, жоспарлар, журнал және есептер." },
    { property: "og:title", content: "Басты бет — Өз қадамым" },
    { property: "og:description", content: "Дефектологтың демо тақтасы." },
  ] }),
  component: Index,
});

const STEPS = [
  { to: "/profiles", n: 1, t: "Оқушыларды таңдаңыз", d: "Мақсат пен қолдау түрлерін өңдеңіз." },
  { to: "/lesson", n: 2, t: "Сабақ жоспарын қосыңыз", d: "TXT/DOCX жүктеңіз, мәтін қойыңыз немесе үлгіні алыңыз." },
  { to: "/journal", n: 3, t: "Журналға жазыңыз", d: "Өз бетімен / көмекпен / әзірге жоқ." },
  { to: "/reports", n: 4, t: "Ата-анаға есеп", d: "Журнал жазбасынан есеп жасап, бекітіңіз." },
] as const;

function Index() {
  const { s } = useStore();
  const sel = s.profiles.filter((p) => p.selected);
  const approved = s.drafts.filter((d) => d.approved).length;
  const queued = s.reports.filter((r) => r.status === "queued").length;
  return (
    <>
      <PageHeader title="Сәлеметсіз бе!" desc="Бүгінгі жұмысыңыз бір жерде. Барлық оқушылар — ойдан шығарылған кодтар.">
        <DemoBadge text="Жеке, жарияланбаған демо" />
      </PageHeader>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Қысқаша көрсеткіштер">
        {[["Таңдалған оқушы", sel.length], ["Бекітілген жоспар", approved], ["Журнал жазбасы", s.entries.length], ["Кезектегі есеп", queued]].map(([l, v]) => (
          <div key={l} className="card"><p className="text-sm text-muted-foreground">{l}</p><p className="font-display text-3xl font-bold text-primary">{v}</p></div>
        ))}
      </section>
      <h2 className="mb-3 mt-8 text-xl font-bold">Жұмыс барысы</h2>
      <ol className="grid gap-4 md:grid-cols-2">
        {STEPS.map((x) => (
          <li key={x.to}><Link to={x.to} className="card flex items-start gap-4 transition hover:border-primary">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-soft font-bold text-teal">{x.n}</span>
            <span><span className="block font-bold">{x.t}</span><span className="text-muted-foreground">{x.d}</span></span>
          </Link></li>
        ))}
      </ol>
      <h2 className="mb-3 mt-8 text-xl font-bold">Апталық шолу</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {s.profiles.map((p) => { const w = weeklySummary(s.entries, p.id, new Date()); return (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between"><p className="font-bold">{p.code}</p>{p.selected ? <span className="chip chip-teal">Таңдалған</span> : <span className="chip chip-muted">Таңдалмаған</span>}</div>
            <p className="mt-1 text-sm text-muted-foreground">{p.goal}</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Өз бетімен: ${w.pct}%`}><div className="h-full bg-primary" style={{ width: `${w.pct}%` }} /></div>
            <p className="mt-1 text-sm">Өз бетімен {w.pct}% · {w.total} жазба</p>
          </div>); })}
      </div>
      <p className="mt-8 rounded-2xl bg-sky-soft p-4 text-sm text-sky">Болашақ интеграциялар (әзірге жоқ): ElevenLabs арқылы мұғалімнің расталған дауысы және ата-анаға қауіпсіз автоматты жеткізу.</p>
    </>
  );
}
