// Node (Vite dev) мен Deno (Supabase Edge) екеуінде де жұмыс істейтін env оқу.
declare const Deno: { env: { get(k: string): string | undefined } } | undefined;
export function env(k: string): string | undefined {
  if (typeof Deno !== "undefined") return Deno.env.get(k) || undefined;
  return (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env[k] || undefined;
}
