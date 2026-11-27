import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { TeacherState } from "@/shared/types";
import { ApiError, setKey, teacher, teacherKey } from "./api";

interface Api {
  s: TeacherState;
  refresh: () => Promise<void>;
  call: <T = unknown>(action: string, payload?: Record<string, unknown>) => Promise<T>;
}
const Ctx = createContext<Api | null>(null);

export function TeacherProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<TeacherState | null>(null);
  const [need, setNeed] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    try { setS(await teacher<TeacherState>("state")); setNeed(false); setErr(""); }
    catch (e) { if (e instanceof ApiError && e.status === 401) setNeed(true); else setErr(e instanceof Error ? e.message : String(e)); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const call = useCallback(async <T,>(action: string, payload: Record<string, unknown> = {}) => {
    const r = await teacher<T>(action, payload);
    await refresh();
    return r;
  }, [refresh]);

  if (need) return <Login onDone={refresh} />;
  if (err && !s) return <p className="card text-rose">Серверге қосылу мүмкін болмады: {err}</p>;
  if (!s) return <p className="text-muted-foreground">Жүктелуде…</p>;
  return <Ctx.Provider value={{ s, refresh, call }}>{children}</Ctx.Provider>;
}

function Login({ onDone }: { onDone: () => void }) {
  const [u, setU] = useState("admin");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form className="card mx-auto mt-10 grid max-w-sm gap-3" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr("");
      const k = teacherKey(u.trim(), p);
      try { await teacher("ping", {}, k); setKey(k); onDone(); } catch { setErr("Логин немесе құпиясөз қате"); } finally { setBusy(false); }
    }}>
      <h1 className="text-2xl font-extrabold">Мұғалімге кіру</h1>
      <div><label className="label" htmlFor="lg">Логин</label><input id="lg" className="input" autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} /></div>
      <div><label className="label" htmlFor="pw">Құпиясөз</label><input id="pw" type="password" className="input" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} autoFocus /></div>
      {err && <p className="chip chip-rose" role="alert">{err}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Тексерілуде…" : "Кіру"}</button>
    </form>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside TeacherProvider");
  return v;
}
