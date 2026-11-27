import type { Game, GameItem, Subject } from "../../src/shared/types.js";

// Жасанды интеллект кілті жоқ кезде ҚМЖ-дан қарапайым ойындар құрастыру.
const item = (p: Partial<GameItem>): GameItem => ({
  say: "", question: "", visual: { kind: "none", shape: "none", emoji: "", count: 0 }, options: [], answer: 0, word: "", ...p,
});
const shuffle = <T,>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((x) => x[1]);

function choose(correct: string, pool: string[], n = 3) {
  const opts = shuffle([correct, ...shuffle(pool.filter((p) => p !== correct)).slice(0, n - 1)]);
  return { options: opts, answer: opts.indexOf(correct) };
}

export function fallbackGames(subject: Subject, text: string): { title: string; games: Game[] } {
  if (subject === "math") {
    const shapes = [["triangle", "Үшбұрыш"], ["square", "Шаршы"], ["circle", "Дөңгелек"], ["rectangle", "Тіктөртбұрыш"]] as const;
    const names = shapes.map((s) => s[1]);
    const emojis = ["🍎", "⭐", "🎈", "🐟"];
    return {
      title: "Пішіндер мен санау",
      games: [
        {
          type: "choose", title: "Пішінді тап", instruction: "Суретке қара. Бұл қандай пішін?",
          items: shuffle([...shapes]).slice(0, 3).map(([shape, name]) => item({ say: "Бұл қандай пішін? Дұрыс жауапты бас.", question: "Бұл қандай пішін?", visual: { kind: "shape", shape, emoji: "", count: 0 }, ...choose(name, names) })),
        },
        {
          type: "choose", title: "Санап көр", instruction: "Заттарды сана да, санды таңда.",
          items: [2, 4, 3].map((n, i) => item({ say: "Неше зат бар? Санап көр.", question: "Неше?", visual: { kind: "count", shape: "none", emoji: emojis[i], count: n }, ...choose(String(n), ["1", "2", "3", "4", "5"]) })),
        },
      ],
    };
  }
  const words = Array.from(new Set(text.toLowerCase().split(/[^а-яәғқңөұүһіё]+/u).filter((w) => w.length >= 3 && w.length <= 5 && !/^(және|бұл|осы|мен|сен|оның|үшін|туралы)$/u.test(w))));
  const pick = (words.length >= 3 ? words : ["ана", "ата", "алма", "мысық", "кітап"]).slice(0, 4);
  const letters = ["а", "ә", "о", "ө", "ұ", "ү", "ы", "і", "е"];
  return {
    title: "Дыбыстар мен сөздер",
    games: [
      {
        type: "choose", title: "Дыбысты тыңда", instruction: "Апайды тыңда да, дұрыс әріпті бас.",
        items: ["а", "ө", "ұ"].map((l) => item({ say: `«${l.toUpperCase()}» дыбысы. Осы әріпті тап.`, question: "Қай әріп айтылды?", ...choose(l.toUpperCase(), letters.map((x) => x.toUpperCase())) })),
      },
      {
        type: "scramble", title: "Сөзді құра", instruction: "Әріптерді дұрыс ретпен бас.",
        items: pick.slice(0, 3).map((w) => item({ say: `«${w}» сөзін құрастыр.`, question: "Сөзді құра", word: w })),
      },
    ],
  };
}
