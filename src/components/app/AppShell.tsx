import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Басты бет" },
  { to: "/profiles", label: "Оқушылар" },
  { to: "/lesson", label: "ҚМЖ бейімдеу" },
  { to: "/journal", label: "Ілгерілеу" },
  { to: "/reports", label: "Ата-анаға есеп" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 font-display text-2xl font-extrabold leading-tight text-foreground">
      <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden>
        <rect x="8" y="0" width="22" height="5" rx="2.5" fill="#e8b88f" />
        <rect x="0" y="8.5" width="22" height="5" rx="2.5" fill="#2f8f80" />
        <rect x="4" y="17" width="14" height="5" rx="2.5" fill="#0d5a52" />
      </svg>
      <span>Өз<br className="hidden lg:block" /> қадамым</span>
    </Link>
  );
}

function NavLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Негізгі мәзір" className={className}>
      {NAV.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          activeOptions={{ exact: n.to === "/" }}
          className="whitespace-nowrap rounded-xl px-3 py-3 text-[15px] font-medium text-foreground/80 hover:bg-muted"
          activeProps={{ className: "bg-teal-soft !font-bold !text-foreground" }}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="btn sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Негізгі мазмұнға өту</a>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-8 border-r border-border bg-sidebar px-4 py-8 lg:flex">
        <div className="px-1"><Logo /></div>
        <NavLinks className="flex flex-col gap-1" />
      </aside>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-sidebar px-4 pt-3 lg:hidden">
        <Logo />
        <NavLinks className="-mx-1 mt-2 flex gap-1 overflow-x-auto pb-2" />
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:px-14 lg:py-12">{children}</main>
    </div>
  );
}

export function PageHeader({ title, desc, children }: { title: string; desc?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-[42px] sm:leading-tight">{title}</h1>
        {desc && <p className="mt-2 max-w-2xl text-muted-foreground">{desc}</p>}
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

export function Avatar({ color, shape }: { color: string; shape: string }) {
  return <span aria-hidden className={`inline-block h-6 w-6 shrink-0 ${shape}`} style={{ background: color }} />;
}
