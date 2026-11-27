import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppShell";
import { Avatar } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";
import { weeklySummary } from "@/lib/templates";
import { SUBJECTS, avatarFor } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Дефектолог кабинеті — Өз қадамым" },
    { name: "description", content: "Дефектологтың демо тақтасы: оқушылар, ҚМЖ бейімдеу, ілгерілеу және ата-анаға есеп." },
    { property: "og:title", content: "Дефектолог кабинеті — Өз қадамым" },
    { property: "og:description", content: "Дефектологтың демо тақтасы." },
  ] }),
  component: Index,
});

function BookArt() {
  return (
    <svg viewBox="0 0 280 200" className="h-40 w-auto sm:h-48" aria-hidden>
      <g transform="rotate(-10 120 120)">
        <path d="M40 60 L120 52 L200 60 L206 170 L120 162 L34 170 Z" fill="#0b0b0b" />
        <path d="M50 66 L118 60 L118 152 L46 160 Z" fill="#3b82c4" />
        <path d="M122 60 L190 66 L194 160 L122 152 Z" fill="#3b82c4" />
        <path d="M56 62 Q88 50 118 64 L118 148 Q88 136 52 150 Z" fill="#e6ecef" />
        <path d="M122 64 Q152 50 186 62 L190 150 Q154 136 122 148 Z" fill="#cfd8dc" />
        <path d="M118 64 L122 64 L122 148 L118 148 Z" fill="#9aa5aa" />
      </g>
      <g transform="rotate(6 240 40)">
        <rect x="200" y="0" width="76" height="76" rx="14" fill="#d5b998" />
        <path d="M238 24 V52 M224 38 H252" stroke="#17302d" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Index() {
  const { s } = useStore();
  const sel = s.profiles.filter((p) => p.selected);
  const approved = s.drafts.filter((d) => d.approved).length;
  const queued = s.reports.filter((r) => r.status === "queued").length;
  return (
    <>
      <PageHeader title="Дефектолог кабинеті" />

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f6359] to-[#0a4842] p-8 text-white sm:p-10" aria-labelledby="hero-t">
        <div className="relative z-10 max-w-md">
          <h2 id="hero-t" className="text-3xl font-extrabold sm:text-[40px]">ҚМЖ бейімдеу</h2>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-white/90">Сабақ жоспарын жүктеп, оқушыға қажетті қолдауды таңдаңыз.</p>
          <Link to="/lesson" className="mt-6 inline-flex rounded-xl bg-cream px-5 py-3 text-sm font-bold text-foreground hover:opacity-90">ҚМЖ жүктеу</Link>
        </div>
        <div className="pointer-events-none absolute bottom-6 right-6 hidden sm:block"><BookArt /></div>
      </section>

      <section className="mt-5 grid gap-5 sm:grid-cols-2" aria-label="Пәндер">
        {SUBJECTS.map((x) => (
          <Link key={x.id} to="/lesson" search={{ subject: x.id }} className={`rounded-2xl p-5 transition hover:brightness-[0.98] ${x.tone === "mint" ? "bg-teal-soft" : "bg-peach-soft"}`}>
            <p className="text-lg font-extrabold">{x.name}</p>
            <p className="mt-1 text-xs font-bold">{x.grade}</p>
          </Link>
        ))}
      </section>

      <h2 className="mb-4 mt-8 text-2xl font-extrabold">Оқушылар</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {s.profiles.map((p, i) => {
          const w = weeklySummary(s.entries, p.id, new Date());
          return (
            <Link key={p.id} to="/profiles" className="card flex flex-col gap-3 transition hover:border-primary">
              <div className="flex items-center gap-3">
                <Avatar {...avatarFor(i)} />
                <span className="font-bold">{p.code}</span>
                {p.selected && <span className="chip chip-teal ml-auto">Таңдалған</span>}
              </div>
              <p className="text-sm text-muted-foreground">{p.goal}</p>
              <div>
                <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Өз бетімен: ${w.pct}%`}><div className="h-full rounded-full bg-primary" style={{ width: `${w.pct}%` }} /></div>
                <p className="mt-1 text-xs text-muted-foreground">Аптада өз бетімен {w.pct}% · {w.total} жазба</p>
              </div>
            </Link>
          );
        })}
      </div>

      <section className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Қысқаша көрсеткіштер">
        {([["Таңдалған оқушы", sel.length, "/profiles"], ["Бекітілген ҚМЖ", approved, "/lesson"], ["Ілгерілеу жазбасы", s.entries.length, "/journal"], ["Кезектегі есеп", queued, "/reports"]] as const).map(([l, v, to]) => (
          <Link key={l} to={to} className="card transition hover:border-primary">
            <p className="text-sm text-muted-foreground">{l}</p>
            <p className="font-display text-3xl font-extrabold text-primary">{v}</p>
          </Link>
        ))}
      </section>

      <p className="mt-8 rounded-2xl bg-sky-soft p-4 text-sm text-sky">Барлық оқушылар — ойдан шығарылған кодтар. Болашақта: ElevenLabs арқылы мұғалімнің расталған дауысы және ата-анаға қауіпсіз автоматты жеткізу.</p>
    </>
  );
}
