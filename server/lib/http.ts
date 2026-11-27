import { Buffer } from "node:buffer";
import { env } from "./env.js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "./db.js";

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export const fail = (message: string, status = 400) => json({ error: message }, status);

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { return {} as T; }
}

const secret = () => env("APP_SECRET") || env("SUPABASE_SERVICE_ROLE_KEY") || "demo-secret";

/** Мұғалімді тексереді: заголовок "логин:құпиясөз", дерекқордағы bcrypt хэшпен салыстырылады. */
export async function teacherOk(req: Request): Promise<boolean> {
  const raw = req.headers.get("x-teacher-key") ?? "";
  const k = raw.indexOf(":");
  if (k < 1) return false;
  return db().checkAdmin(decodeURIComponent(raw.slice(0, k)), decodeURIComponent(raw.slice(k + 1)));
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
