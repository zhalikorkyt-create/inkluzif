import { createHmac, timingSafeEqual } from "node:crypto";

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export const fail = (message: string, status = 400) => json({ error: message }, status);

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { return {} as T; }
}

const secret = () => process.env.APP_SECRET || process.env.TEACHER_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY || "demo-secret";

/** Мұғалім құпиясөзін тексереді. Дерекқор қосылмаған демо режимде құпиясөз қойылмаса ашық. */
export function teacherOk(req: Request): boolean {
  const pass = process.env.TEACHER_PASSWORD;
  if (!pass) return !process.env.SUPABASE_URL;
  const got = req.headers.get("x-teacher-key") ?? "";
  const a = Buffer.from(got), b = Buffer.from(pass);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parentToken(studentId: string) {
  return `${studentId}.${createHmac("sha256", secret()).update(`parent:${studentId}`).digest("base64url").slice(0, 32)}`;
}

export function studentFromToken(token: string): string | null {
  const id = token.split(".")[0];
  if (!id) return null;
  const want = Buffer.from(parentToken(id)), got = Buffer.from(token);
  return want.length === got.length && timingSafeEqual(want, got) ? id : null;
}
