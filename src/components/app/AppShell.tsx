import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Басты бет", short: "Басты", icon: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" },
  { to: "/profiles", label: "Оқушылар", short: "Оқушылар", icon: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M22 21a5 5 0 0 0-4-4.9" },
  { to: "/lesson", label: "ҚМЖ бейімдеу", short: "ҚМЖ", icon: "M4 4h11l5 5v11H4zM14 4v6h6M8 14h8M8 17h5" },
  { to: "/journal", label: "Ілгерілеу", short: "Ілгерілеу", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { to: "/reports", label: "Ата-анаға есеп", short: "Ата-ана", icon: "M4 5h16v11H8l-4 4zM8 10h8" },
] as const;

function Icon({ d }: { d: string }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 font-display text-2xl font-extrabold leading-tight text-foreground">
      <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden>
        <rect x="8" y="0" width="22" height="5" rx="2.5" fill="#e8b88f" />
        <rect x="0" y="8.5" width="22" height="5" rx="2.5" fill="#2f8f80" />
        <rect x="4" y="17" width="14" height="5" rx="2.5" fill="#0d5a52" />
      </svg>
      <span className="text-xl lg:text-2xl">Өз<br className="hidden lg:block" /> қадамым</span>
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
      <header className="sticky top-0 z-10 border-b border-border bg-sidebar/95 px-4 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] backdrop-blur lg:hidden">
        <Logo />
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-8 lg:px-14 lg:py-12">{children}</main>
      {/* Mobile bottom tab bar */}
      <nav aria-label="Негізгі мәзір" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.to === "/" }}
            className="flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold text-muted-foreground"
            activeProps={{ className: "!text-primary [&>span:first-child]:bg-teal-soft" }}
          >
            <span className="grid h-8 w-12 place-items-center rounded-full transition"><Icon d={n.icon} /></span>
            <span className="leading-none">{n.short}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, desc, children }: { title: string; desc?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap sm:mb-8 items-start justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-extrabold leading-tight sm:text-[42px]">{title}</h1>
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

const AVATARS = [
  { color: "#8fcbb5", shape: "rounded-md" },
  { color: "#efb98a", shape: "rounded-full" },
  { color: "#b9b0db", shape: "rounded-lg rotate-12" },
  { color: "#9cc3e6", shape: "rounded-full" },
  { color: "#e9a3a8", shape: "rounded-md rotate-45" },
];
export const avatarFor = (i: number) => AVATARS[((i % AVATARS.length) + AVATARS.length) % AVATARS.length];

export function Notice({ children, tone = "sky" }: { children: ReactNode; tone?: "sky" | "amber" }) {
  return <p className={`rounded-2xl p-4 text-sm ${tone === "sky" ? "bg-sky-soft text-sky" : "bg-amber-soft text-amber"}`}>{children}</p>;
}
