import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Avatar, avatarFor, Notice } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Ата-анаға есеп — Өз қадамым" }] }),
  component: Reports,
});

function Reports() {
  const { s } = useStore();
  const link = `${location.origin}/parent`;
  const [copied, setCopied] = useState(false);
  return (
    <>
      <PageHeader title="Ата-анаға есеп" desc="Барлық ата-анаға бір ғана сілтеме жібересіз. Ата-ана бірінші кіргенде баласын таңдап, сіз берген PIN кодты енгізеді. Содан кейін тек өз баласының нәтижелерін, жарияланған суреттерді көреді және бот арқылы сұрақ қоя алады." />
      <section className="card grid gap-3">
        <p className="font-bold">Ата-аналарға арналған сілтеме</p>
        <div className="flex flex-wrap gap-2">
          <code className="input w-auto flex-1 break-all">{link}</code>
          <button className="btn btn-primary" onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); }}>{copied ? "Көшірілді ✓" : "Көшіру"}</button>
          <Link to="/parent" target="_blank" className="btn">Ата-ана көзімен қарау</Link>
        </div>
      </section>

      <h2 className="mb-3 mt-8 text-2xl font-extrabold">Ата-ана кодтары</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {s.students.map((st) => {
          const pub = s.posts.filter((p) => p.student_id === st.id && p.published).length;
          const games = s.results.filter((r) => r.student_id === st.id).length;
          return (
            <div key={st.id} className="card grid gap-2">
              <div className="flex items-center gap-3"><Avatar {...avatarFor(st.color)} /><span className="font-bold">{st.name}</span></div>
              <p className="text-sm text-muted-foreground">PIN код: <span className="font-mono text-lg font-bold text-foreground">{st.pin}</span></p>
              <p className="text-sm text-muted-foreground">{games} ойын нәтижесі · {pub} жарияланған жазба</p>
            </div>
          );
        })}
      </div>
      <div className="mt-6"><Notice>Бот тек сол баланың нәтижелері мен сіз жариялаған жазбаларға сүйеніп жауап береді, басқа балалар туралы ештеңе айтпайды. Диагноз ата-анаға көрсетілмейді.{!s.features.ai && " Боттың толық жауаптары жасанды интеллект кілті қосылғанда іске қосылады."}</Notice></div>
    </>
  );
}
