// Сервер мен клиентке ортақ типтер.

export type Subject = "math" | "kaz";
export const SUBJECTS: { id: Subject; name: string; grade: string; tone: "mint" | "peach" }[] = [
  { id: "math", name: "Математика", grade: "5-сынып", tone: "mint" },
  { id: "kaz", name: "Қазақ тілі", grade: "5-сынып", tone: "peach" },
];
export const subjectName = (id: string) => SUBJECTS.find((s) => s.id === id)?.name ?? id;

export type Shape = "none" | "triangle" | "square" | "circle" | "rectangle" | "star";

export interface GameItem {
  say: string; // апайдың дауысымен оқылатын мәтін
  question: string; // экрандағы қысқа сұрақ
  visual: { kind: "none" | "shape" | "count" | "emoji"; shape: Shape; emoji: string; count: number };
  options: string[]; // choose/fill үшін жауап нұсқалары
  answer: number; // дұрыс нұсқаның индексі
  word: string; // scramble үшін жиналатын сөз
  audio?: string; // сақталған дыбыс файлының жолы
}

export interface Game {
  type: "choose" | "scramble" | "fill";
  title: string;
  instruction: string;
  instruction_audio?: string;
  items: GameItem[];
}

export interface Student {
  id: string;
  name: string;
  diagnosis: string;
  notes: string;
  pin: string;
  color: number;
  created_at: string;
}

export interface Lesson { id: string; subject: Subject; title: string; text: string; created_at: string }

export interface Activity {
  id: string;
  lesson_id: string | null;
  student_id: string;
  subject: Subject;
  title: string;
  games: Game[];
  voiced: boolean;
  created_at: string;
}

export interface Result {
  id: string;
  activity_id: string;
  student_id: string;
  game_title: string;
  game_type: string;
  correct: number; // бірінші әрекеттен дұрыс
  total: number;
  retries: number;
  created_at: string;
}

export interface Post { id: string; student_id: string; text: string; photo_path: string | null; photo_url?: string | null; published: boolean; created_at: string }
export interface Summary { student_id: string; text: string; updated_at: string }

export interface TeacherState {
  students: Student[];
  lessons: Lesson[];
  activities: Activity[];
  results: Result[];
  posts: Post[];
  summaries: Summary[];
  features: { ai: boolean; voice: boolean; db: boolean };
}

export type Level = "independent" | "assisted" | "notyet";
export const LEVEL_LABEL: Record<Level, string> = { independent: "Өз бетімен", assisted: "Көмекпен", notyet: "Әзірге қиын" };
export function levelOf(r: Pick<Result, "correct" | "total">): Level {
  if (!r.total) return "notyet";
  const k = r.correct / r.total;
  return k >= 0.8 ? "independent" : k >= 0.4 ? "assisted" : "notyet";
}

const DAY = 86400000;
export function weekly(results: Result[], studentId: string, now = Date.now()) {
  const week = results.filter((r) => r.student_id === studentId && now - new Date(r.created_at).getTime() <= 7 * DAY);
  const correct = week.reduce((a, r) => a + r.correct, 0);
  const total = week.reduce((a, r) => a + r.total, 0);
  return { games: week.length, pct: total ? Math.round((correct / total) * 100) : 0 };
}

export const firstName = (full: string) => full.trim().split(/\s+/).slice(-1)[0] ?? full;
