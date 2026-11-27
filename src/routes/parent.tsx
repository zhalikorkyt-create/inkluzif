import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { parent, ApiError } from "@/lib/api";
import { Logo } from "@/components/app/AppShell";

export const Route = createFileRoute("/parent")({
  head: () => ({ meta: [{ title: "Ата-анаға — Өз қадамым" }] }),
  component: Parent,
});

const TKEY = "oz-qadamym:parent-token";
const load = () => { try { return localStorage.getItem(TKEY) ?? ""; } catch { return ""; } };
const save = (t: string) => { try { t ? localStorage.setItem(TKEY, t) : localStorage.removeItem(TKEY); } catch { /* ignore */ } };

interface Feed {
  name: string;
  summary: string;
  results: { id: string; title: string; correct: number; total: number; level: string; created_at: string }[];
  posts: { id: string; text: string; photo_url: string | null; created_at: string }[];
}

function Parent() {
  const [token, setToken] = useState(load);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-sidebar px-4 py-3"><div className="mx-auto flex max-w-2xl items-center justify-between"><Logo /><span className="text-sm text-muted-foreground">Ата-анаға</span></div></header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        {token ? <FeedView token={token} onLogout={() => { save(""); setToken(""); }} /> : <Login onDone={(t) => { save(t); setToken(t); }} />}
      </main>
    </div>
  );
}

function Login({ onDone }: { onDone: (t: string) => void }) {
  const [list, setList] = useState<{ id: string; name: string }[]>([]);
  const [pick, setPick] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { parent<{ id: string; name: string }[]>("students").then(setList).catch((e) => setErr(e.message)); }, []);
  return (
    <form className="card grid gap-4" onSubmit={async (e) => {
      e.preventDefault(); setErr("");
      try { onDone((await parent<{ token: string }>("login", { student_id: pick, pin })).token); } catch (e2) { setErr(e2 instanceof Error ? e2.message : String(e2)); }
    }}>
      <h1 className="text-2xl font-extrabold">Сәлеметсіз бе!</h1>
      <p className="text-muted-foreground">Сіз кімнің ата-анасысыз? Бұл сұрақ бір рет қана қойылады.</p>
      <div className="grid gap-2">
        {list.map((s) => (
          <label key={s.id} className={`btn cursor-pointer justify-start py-3 text-base ${pick === s.id ? "border-primary bg-teal-soft" : ""}`}>
            <input type="radio" name="child" className="sr-only" checked={pick === s.id} onChange={() => setPick(s.id)} />{s.name}
          </label>
        ))}
      </div>
      {pick && (
        <div>
          <label className="label" htmlFor="pin">Апай берген код</label>
          <input id="pin" className="input font-mono text-lg" inputMode="numeric" autoComplete="one-time-code" value={pin} onChange={(e) => setPin(e.target.value)} />
        </div>
      )}
      {err && <p className="chip chip-rose" role="alert">{err}</p>}
      <button className="btn btn-primary" disabled={!pick || !pin}>Кіру</button>
    </form>
  );
}

function FeedView({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    parent<Feed>("feed", { token }).then(setFeed).catch((e) => { if (e instanceof ApiError && e.status === 401) onLogout(); else setErr(e.message); });
  }, [token, onLogout]);
  if (err) return <p className="card">{err}</p>;
  if (!feed) return <p>Жүктелуде…</p>;
  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{feed.name}</h1>
        <button className="btn btn-ghost text-xs" onClick={onLogout}>Басқа бала</button>
      </div>
      <section className="rounded-2xl bg-teal-soft p-4">
        <p className="mb-1 text-sm font-bold text-teal">Апайдың қысқаша шолуы</p>
        <p className="whitespace-pre-line">{feed.summary}</p>
      </section>
      <Chat token={token} />
      {feed.posts.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-xl font-extrabold">Сабақтан сәттер</h2>
          {feed.posts.map((p) => (
            <article key={p.id} className="card overflow-hidden p-0">
              {p.photo_url && <img src={p.photo_url} alt="" className="w-full object-cover" />}
              <div className="p-4">
                {p.text && <p>{p.text}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("kk-KZ")}</p>
              </div>
            </article>
          ))}
        </section>
      )}
      {feed.results.length > 0 && (
        <section className="grid gap-2">
          <h2 className="text-xl font-extrabold">Орындаған тапсырмалары</h2>
          {feed.results.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center justify-between gap-2 py-3">
              <span><span className="font-semibold">{r.title}</span> <span className="text-sm text-muted-foreground">· {new Date(r.created_at).toLocaleDateString("kk-KZ")}</span></span>
              <span className="text-sm">{r.correct}/{r.total} · <span className="chip chip-muted">{r.level}</span></span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function Chat({ token }: { token: string }) {
  const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [msgs]);
  const ask = async (text: string) => {
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next); setQ(""); setBusy(true);
    try { const r = await parent<{ answer: string }>("chat", { token, messages: next }); setMsgs([...next, { role: "assistant", content: r.answer }]); }
    catch (e) { setMsgs([...next, { role: "assistant", content: `Кешіріңіз, қазір жауап бере алмадым (${e instanceof Error ? e.message : e}).` }]); }
    finally { setBusy(false); }
  };
  return (
    <section className="card grid gap-3" aria-label="Апайдың көмекшісі">
      <p className="font-bold">Балаңыз туралы сұраңыз</p>
      {msgs.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {["Бүгін не істеді?", "Немен қиналып жүр?", "Үйде қалай көмектесейін?"].map((x) => <button key={x} className="btn text-xs" onClick={() => ask(x)}>{x}</button>)}
        </div>
      )}
      <div className="grid gap-2" aria-live="polite">
        {msgs.map((m, i) => (
          <p key={i} className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2 ${m.role === "user" ? "justify-self-end bg-primary text-white" : "justify-self-start bg-muted"}`}>{m.content}</p>
        ))}
        {busy && <p className="justify-self-start rounded-2xl bg-muted px-4 py-2 text-muted-foreground">…</p>}
        <div ref={end} />
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim() && !busy) ask(q.trim()); }}>
        <input className="input" aria-label="Сұрақ" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Сұрағыңызды жазыңыз…" />
        <button className="btn btn-primary" disabled={busy || !q.trim()}>Жіберу</button>
      </form>
    </section>
  );
}
