import type { Shape as S } from "@/shared/types";

const FILL: Record<string, string> = { triangle: "#f2a65a", square: "#5cb8a6", circle: "#7aa7e0", rectangle: "#b39ddb", star: "#f4c84b" };

export function Shape({ shape, size = 160 }: { shape: S; size?: number }) {
  const f = FILL[shape] ?? "#5cb8a6";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="пішін">
      {shape === "triangle" && <polygon points="50,8 94,90 6,90" fill={f} stroke="#17302d" strokeWidth="3" strokeLinejoin="round" />}
      {shape === "square" && <rect x="12" y="12" width="76" height="76" rx="4" fill={f} stroke="#17302d" strokeWidth="3" />}
      {shape === "circle" && <circle cx="50" cy="50" r="40" fill={f} stroke="#17302d" strokeWidth="3" />}
      {shape === "rectangle" && <rect x="4" y="25" width="92" height="50" rx="4" fill={f} stroke="#17302d" strokeWidth="3" />}
      {shape === "star" && <polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38" fill={f} stroke="#17302d" strokeWidth="3" strokeLinejoin="round" />}
    </svg>
  );
}

const NAMES: [RegExp, S][] = [[/үшбұрыш/i, "triangle"], [/тіктөртбұрыш/i, "rectangle"], [/шаршы|квадрат/i, "square"], [/төртбұрыш/i, "square"], [/дөңгелек|шеңбер/i, "circle"], [/жұлдыз/i, "star"]];
export const shapeFromLabel = (label: string): S | null => NAMES.find(([re]) => re.test(label))?.[1] ?? null;
