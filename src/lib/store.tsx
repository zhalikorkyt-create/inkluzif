import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { TeacherState } from "@/shared/types";
import { ApiError, getKey, setKey, teacher } from "./api";

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
  const [v, setV] = useState(getKey());
  const [err, setErr] = useState("");
  return (
    <form className="card mx-auto mt-10 grid max-w-sm gap-3" onSubmit={async (e) => {
      e.preventDefault();
      try { await teacher("ping", {}, v); setKey(v); onDone(); } catch { setErr("Құпиясөз қате"); }
    }}>
      <h1 className="text-2xl font-extrabold">Мұғалімге кіру</h1>
      <label className="label" htmlFor="pw">Құпиясөз</label>
      <input id="pw" type="password" className="input" value={v} onChange={(e) => setV(e.target.value)} autoFocus />
      {err && <p className="chip chip-rose" role="alert">{err}</p>}
      <button className="btn btn-primary">Кіру</button>
    </form>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside TeacherProvider");
  return v;
}
