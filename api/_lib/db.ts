import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Кестелермен жұмыс: Supabase бар болса соны, жоқ болса жадтағы демо қойманы қолданады. */
export interface Db {
  real: boolean;
  list<T>(table: string, filter?: Record<string, unknown>): Promise<T[]>;
  get<T>(table: string, id: string, key?: string): Promise<T | null>;
  insert<T>(table: string, row: Record<string, unknown>): Promise<T>;
  update<T>(table: string, id: string, patch: Record<string, unknown>, key?: string): Promise<T>;
  upsert(table: string, row: Record<string, unknown>, key: string): Promise<void>;
  remove(table: string, id: string): Promise<void>;
  putFile(path: string, bytes: Uint8Array, contentType: string): Promise<void>;
  fileUrl(path: string): Promise<string | null>;
}

const BUCKET = "media";

function supabaseDb(sb: SupabaseClient): Db {
  const ok = <T>(r: { data: T; error: { message: string } | null }) => {
    if (r.error) throw new Error(r.error.message);
    return r.data;
  };
  return {
    real: true,
    async list(table, filter = {}) {
      let q = sb.from(table).select("*");
      for (const [k, v] of Object.entries(filter)) q = q.eq(k, v as string);
      return ok(await q.order("created_at", { ascending: false, nullsFirst: false }).limit(1000)) as never;
    },
    async get(table, id, key = "id") {
      return ok(await sb.from(table).select("*").eq(key, id).maybeSingle()) as never;
    },
    async insert(table, row) {
      return ok(await sb.from(table).insert(row).select().single()) as never;
    },
    async update(table, id, patch, key = "id") {
      return ok(await sb.from(table).update(patch).eq(key, id).select().single()) as never;
    },
    async upsert(table, row, key) {
      ok(await sb.from(table).upsert(row, { onConflict: key }));
    },
    async remove(table, id) {
      ok(await sb.from(table).delete().eq("id", id));
    },
    async putFile(path, bytes, contentType) {
      ok(await sb.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: true }));
    },
    async fileUrl(path) {
      const r = await sb.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24);
      return r.data?.signedUrl ?? null;
    },
  };
}

// ---- Жадтағы демо (кілттер қосылмаған кезде, сервер қайта қосылса өшеді) ----
const mem: Record<string, Record<string, unknown>[]> = {};
const files: Record<string, string> = {};
const now = () => new Date().toISOString();

function memoryDb(): Db {
  const t = (n: string) => (mem[n] ??= []);
  return {
    real: false,
    async list(table, filter = {}) {
      return t(table)
        .filter((r) => Object.entries(filter).every(([k, v]) => r[k] === v))
        .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))) as never;
    },
    async get(table, id, key = "id") {
      return (t(table).find((r) => r[key] === id) ?? null) as never;
    },
    async insert(table, row) {
      const r = { id: crypto.randomUUID(), created_at: now(), ...row };
      t(table).push(r);
      return r as never;
    },
    async update(table, id, patch, key = "id") {
      const r = t(table).find((x) => x[key] === id);
      if (!r) throw new Error("not found");
      Object.assign(r, patch);
      return r as never;
    },
    async upsert(table, row, key) {
      const r = t(table).find((x) => x[key] === row[key]);
      if (r) Object.assign(r, row);
      else t(table).push({ created_at: now(), ...row });
    },
    async remove(table, id) {
      mem[table] = t(table).filter((r) => r.id !== id);
    },
    async putFile(path, bytes, contentType) {
      files[path] = `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
    },
    async fileUrl(path) {
      return files[path] ?? null;
    },
  };
}

let cached: Db | null = null;
export function db(): Db {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    cached = supabaseDb(createClient(url, key, { auth: { persistSession: false } }));
  } else {
    cached = memoryDb();
    seedMemory();
  }
  return cached;
}

function seedMemory() {
  const names = ["Оқушы 1", "Оқушы 2", "Оқушы 3"];
  mem.students = names.map((name, i) => ({
    id: crypto.randomUUID(), name, diagnosis: "", notes: "", pin: String(1111 * (i + 1)), color: i, created_at: new Date(Date.now() - (3 - i) * 1000).toISOString(),
  }));
}
