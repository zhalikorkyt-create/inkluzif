import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Басты бет" },
  { to: "/profiles", label: "Оқушылар" },
  { to: "/lesson", label: "Сабақ жоспары" },
  { to: "/journal", label: "Журнал" },
  { to: "/reports", label: "Есептер" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 btn">Негізгі мазмұнға өту</a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold text-primary">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-soft text-teal" aria-hidden>ӨҚ</span>
            Өз қадамым
          </Link>
          <nav aria-label="Негізгі мәзір" className="flex flex-wrap gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-teal-soft !text-teal" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export function PageHeader({ title, desc, children }: { title: string; desc?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function DemoBadge({ text = "Демо" }: { text?: string }) {
  return <span className="chip chip-sky">{text}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="card text-center text-muted-foreground">{children}</p>;
}
