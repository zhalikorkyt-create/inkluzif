import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPlay, sendPlay } from "@/lib/api";
import type { Game, GameItem } from "@/shared/types";
import { Shape, shapeFromLabel } from "@/components/play/Shape";

export const Route = createFileRoute("/play/$id")({
  head: () => ({ meta: [{ title: "Ойын — Өз қадамым" }] }),
  component: Play,
});

interface PlayData { id: string; title: string; name: string; games: Game[] }
interface GameScore { game_title: string; game_type: string; correct: number; total: number; retries: number }

// ---- Дыбыс: апайдың жазылған дауысы, болмаса браузердің дауысы ----
let current: HTMLAudioElement | null = null;
function speak(text: string, url?: string) {
  current?.pause();
  speechSynthesis?.cancel();
  if (url) { current = new Audio(url); current.play().catch(() => {}); return; }
  if (!("speechSynthesis" in window) || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith("kk")) ?? speechSynthesis.getVoices().find((x) => x.lang.startsWith("ru"));
  if (v) u.voice = v;
  u.lang = v?.lang ?? "kk-KZ";
  u.rate = 0.9;
  speechSynthesis.speak(u);
}
const PRAISE = ["Жарайсың!", "Керемет!", "Өте жақсы!", "Дұрыс!"];

function Play() {
  const { id } = Route.useParams();
  const [data, setData] = useState<PlayData | null>(null);
  const [err, setErr] = useState("");
  const [started, setStarted] = useState(false);
  const [gi, setGi] = useState(0);
  const [scores, setScores] = useState<GameScore[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => { getPlay<PlayData>(id).then(setData).catch((e) => setErr(e.message)); }, [id]);

  const finishGame = (sc: GameScore) => {
    const all = [...scores, sc];
    setScores(all);
    if (gi + 1 < (data?.games.length ?? 0)) setGi(gi + 1);
    else { setDone(true); sendPlay(id, all).catch(() => {}); speak(`Жарайсың, ${data?.name ?? ""}! Барлығын орындадың!`); }
  };

  return (
    <div className="min-h-screen bg-[#fdf6ea] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        {err && <p className="card text-center text-lg">{err}</p>}
        {!data && !err && <p className="text-center text-lg">Жүктелуде…</p>}
        {data && !started && (
          <div className="card grid place-items-center gap-6 py-12 text-center">
            <p className="text-6xl" aria-hidden>🌟</p>
            <h1 className="text-3xl font-extrabold">Сәлем, {data.name}!</h1>
            <p className="text-lg text-muted-foreground">{data.title}</p>
            <button className="rounded-3xl bg-primary px-10 py-5 text-2xl font-extrabold text-white shadow-lg active:scale-95" onClick={() => { setStarted(true); }}>Бастау ▶</button>
          </div>
        )}
        {data && started && !done && <GameView key={gi} game={data.games[gi]} n={gi} of={data.games.length} onDone={finishGame} />}
        {data && done && (
          <div className="card grid place-items-center gap-5 py-12 text-center">
            <p className="text-7xl" aria-hidden>🏆</p>
            <h1 className="text-3xl font-extrabold">Жарайсың, {data.name}!</h1>
            <p className="text-2xl" aria-label={`${scores.reduce((a, s) => a + s.correct, 0)} жұлдыз`}>{"⭐".repeat(Math.max(1, Math.min(10, scores.reduce((a, s) => a + s.correct, 0))))}</p>
            <p className="text-lg text-muted-foreground">Барлық ойынды аяқтадың. Апайыңа айт!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GameView({ game, n, of, onDone }: { game: Game; n: number; of: number; onDone: (s: GameScore) => void }) {
  const [ii, setIi] = useState(-1); // -1 = нұсқау экраны
  const [correct, setCorrect] = useState(0);
  const [retries, setRetries] = useState(0);
  useEffect(() => { speak(game.instruction, game.instruction_audio); }, [game]);

  const next = (firstTry: boolean, tries: number) => {
    const c = correct + (firstTry ? 1 : 0), r = retries + tries;
    setCorrect(c); setRetries(r);
    if (ii + 1 < game.items.length) setIi(ii + 1);
    else onDone({ game_title: game.title, game_type: game.type, correct: c, total: game.items.length, retries: r });
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
        <span>Ойын {n + 1} / {of}</span>
        <span className="flex gap-1" aria-label={`${Math.max(0, ii)} / ${game.items.length}`}>
          {game.items.map((_, k) => <span key={k} className={`h-3 w-3 rounded-full ${k < ii ? "bg-primary" : k === ii ? "bg-tan" : "bg-border"}`} />)}
        </span>
      </div>
      {ii === -1 ? (
        <div className="card grid place-items-center gap-5 py-10 text-center">
          <h2 className="text-3xl font-extrabold">{game.title}</h2>
          <p className="text-xl">{game.instruction}</p>
          <div className="flex gap-3">
            <SpeakBtn onClick={() => speak(game.instruction, game.instruction_audio)} />
            <button className="rounded-3xl bg-primary px-8 py-4 text-xl font-extrabold text-white active:scale-95" onClick={() => setIi(0)}>Ойнаймыз ▶</button>
          </div>
        </div>
      ) : (
        <ItemView key={ii} type={game.type} item={game.items[ii]} onDone={next} />
      )}
    </div>
  );
}

function SpeakBtn({ onClick }: { onClick: () => void }) {
  return <button aria-label="Тағы тыңдау" className="grid h-16 w-16 place-items-center rounded-full bg-teal-soft text-3xl active:scale-95" onClick={onClick}>🔊</button>;
}

function ItemView({ type, item, onDone }: { type: Game["type"]; item: GameItem; onDone: (firstTry: boolean, tries: number) => void }) {
  const [tries, setTries] = useState(0);
  const [ok, setOk] = useState(false);
  const [shake, setShake] = useState(-1);
  const say = () => speak(item.say, item.audio);
  useEffect(() => { say(); }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  const win = () => {
    setOk(true);
    speak(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
    setTimeout(() => onDone(tries === 0, tries), 1100);
  };
  const miss = (k: number) => { setTries((t) => t + 1); setShake(k); setTimeout(() => setShake(-1), 500); };

  return (
    <div className={`card grid gap-6 py-8 text-center transition ${ok ? "border-primary bg-teal-soft" : ""}`}>
      <div className="flex items-center justify-center gap-3">
        <p className="text-2xl font-extrabold">{type === "fill" ? item.question.replace("___", " ____ ") : item.question}</p>
        <SpeakBtn onClick={say} />
      </div>
      <Visual item={item} />
      {type === "scramble" ? <Scramble word={item.word} onWin={win} onMiss={() => miss(0)} /> : (
        <>
          <div className={`grid gap-3 ${item.options.length > 2 ? "sm:grid-cols-3" : "grid-cols-2"}`}>
            {item.options.map((o, k) => {
              const shp = shapeFromLabel(o);
              const right = ok && k === item.answer;
              return (
                <button key={k} disabled={ok}
                  className={`grid min-h-24 place-items-center gap-1 rounded-3xl border-4 bg-card p-4 text-2xl font-extrabold transition active:scale-95 ${right ? "border-primary bg-teal-soft" : "border-border"} ${shake === k ? "animate-[shake_0.4s] border-rose" : ""}`}
                  onClick={() => (k === item.answer ? win() : miss(k))}>
                  {shp && item.visual.kind !== "shape" && <Shape shape={shp} size={56} />}
                  {o}
                </button>
              );
            })}
          </div>
        </>
      )}
      {ok && <p className="text-3xl" aria-live="polite">🎉 Дұрыс!</p>}
    </div>
  );
}

function Visual({ item }: { item: GameItem }) {
  const v = item.visual;
  if (v.kind === "shape" && v.shape !== "none") return <div className="grid place-items-center"><Shape shape={v.shape} /></div>;
  if (v.kind === "count" && v.count > 0) return <p className="flex flex-wrap justify-center gap-2 text-5xl" aria-label={`${v.count} ${v.emoji}`}>{Array.from({ length: Math.min(v.count, 12) }, (_, i) => <span key={i}>{v.emoji || "🍎"}</span>)}</p>;
  if (v.kind === "emoji" && v.emoji) return <p className="text-7xl">{v.emoji}</p>;
  return null;
}

function Scramble({ word, onWin, onMiss }: { word: string; onWin: () => void; onMiss: () => void }) {
  const letters = useMemo(() => {
    const arr = [...word];
    for (let k = 0; k < 8; k++) { arr.sort(() => Math.random() - 0.5); if (arr.join("") !== word) break; }
    return arr;
  }, [word]);
  const [usedTiles, setUsedTiles] = useState<number[]>([]);
  const [bad, setBad] = useState(-1);
  const won = useRef(false);
  const built = usedTiles.map((k) => letters[k]).join("");
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap justify-center gap-2" aria-label={`Құралған: ${built}`}>
        {[...word].map((_, k) => <span key={k} className="grid h-16 w-14 place-items-center rounded-2xl border-4 border-dashed border-border bg-card text-3xl font-extrabold uppercase">{built[k] ?? ""}</span>)}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {letters.map((ch, k) => {
          const isUsed = usedTiles.includes(k);
          return (
            <button key={k} disabled={isUsed}
              className={`h-20 w-20 rounded-3xl border-4 text-4xl font-extrabold uppercase transition active:scale-95 ${isUsed ? "border-transparent bg-muted text-muted-foreground" : "border-border bg-cream"} ${bad === k ? "animate-[shake_0.4s] border-rose" : ""}`}
              onClick={() => {
                if (ch === word[usedTiles.length]) {
                  const nu = [...usedTiles, k];
                  setUsedTiles(nu);
                  if (nu.length === word.length && !won.current) { won.current = true; onWin(); }
                } else { setBad(k); onMiss(); setTimeout(() => setBad(-1), 500); }
              }}>{ch}</button>
          );
        })}
      </div>
    </div>
  );
}
