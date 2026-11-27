import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Draft, Entry, Profile, Report, State } from "./types";

const KEY = "oz-qadamym:v2";
export const uid = () => Math.random().toString(36).slice(2, 10);

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const SEED: State = {
  profiles: [
    { id: "p1", code: "Оқушы 01", goal: "3 қадамдық нұсқауды орындау", supports: ["визуалды кесте", "таймер"], selected: true },
    { id: "p2", code: "Оқушы 02", goal: "10-ға дейін санау және салыстыру", supports: ["санау таяқшалары"], selected: true },
    { id: "p3", code: "Оқушы 03", goal: "Сұраққа толық сөйлеммен жауап беру", supports: ["сурет-карточка", "үлгі сөйлем"], selected: false },
  ],
  drafts: [],
  entries: [
    { id: "e1", profileId: "p1", date: daysAgo(1), task: "Кітапты ал, ашып, бетті көрсет", level: "independent", note: "" },
    { id: "e2", profileId: "p1", date: daysAgo(3), task: "Қаламды ал, атыңды жаз", level: "assisted", note: "Екінші қадамда көмек керек болды" },
    { id: "e3", profileId: "p2", date: daysAgo(2), task: "5 затты санау", level: "independent", note: "" },
    { id: "e4", profileId: "p2", date: daysAgo(4), task: "Көп/аз салыстыру", level: "notyet", note: "" },
  ],
  reports: [],
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...SEED, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return SEED;
}

interface Api {
  s: State;
  updateProfile: (id: string, patch: Partial<Profile>) => void;
  addProfile: () => void;
  removeProfile: (id: string) => void;
  addDraft: (d: Omit<Draft, "id" | "createdAt" | "approved">) => void;
  updateDraft: (id: string, patch: Partial<Draft>) => void;
  removeDraft: (id: string) => void;
  addEntry: (e: Omit<Entry, "id">) => void;
  removeEntry: (id: string) => void;
  addReport: (r: Omit<Report, "id" | "createdAt" | "status">) => void;
  updateReport: (id: string, patch: Partial<Report>) => void;
  removeReport: (id: string) => void;
  reset: () => void;
}

const Ctx = createContext<Api | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<State>(load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, [s]);

  const api = useMemo<Api>(() => {
    const now = () => new Date().toISOString();
    return {
      s,
      updateProfile: (id, patch) => set((x) => ({ ...x, profiles: x.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      addProfile: () => set((x) => ({
        ...x,
        profiles: [...x.profiles, { id: uid(), code: `Оқушы ${String(x.profiles.length + 1).padStart(2, "0")}`, goal: "Жаңа мақсат", supports: [], selected: false }],
      })),
      removeProfile: (id) => set((x) => ({
        profiles: x.profiles.filter((p) => p.id !== id),
        drafts: x.drafts.filter((d) => d.profileId !== id),
        entries: x.entries.filter((e) => e.profileId !== id),
        reports: x.reports.filter((r) => r.profileId !== id),
      })),
      addDraft: (d) => set((x) => ({ ...x, drafts: [{ ...d, id: uid(), createdAt: now(), approved: false }, ...x.drafts] })),
      updateDraft: (id, patch) => set((x) => ({ ...x, drafts: x.drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      removeDraft: (id) => set((x) => ({ ...x, drafts: x.drafts.filter((d) => d.id !== id) })),
      addEntry: (e) => set((x) => ({ ...x, entries: [{ ...e, id: uid() }, ...x.entries] })),
      removeEntry: (id) => set((x) => ({ ...x, entries: x.entries.filter((e) => e.id !== id), reports: x.reports.filter((r) => r.entryId !== id) })),
      addReport: (r) => set((x) => ({ ...x, reports: [{ ...r, id: uid(), createdAt: now(), status: "draft" }, ...x.reports] })),
      updateReport: (id, patch) => set((x) => ({ ...x, reports: x.reports.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      removeReport: (id) => set((x) => ({ ...x, reports: x.reports.filter((r) => r.id !== id) })),
      reset: () => set(SEED),
    };
  }, [s]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
