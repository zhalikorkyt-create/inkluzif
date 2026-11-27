// Supabase Edge Function кіру нүктесі: /api/teacher, /api/play, /api/parent
import * as teacher from "./teacher.js";
import * as play from "./play.js";
import * as parent from "./parent.js";

declare const Deno: { serve(h: (req: Request) => Response | Promise<Response>): void };

const routes: Record<string, Record<string, (req: Request) => Promise<Response>>> = { teacher, play, parent } as never;
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-teacher-key, authorization, apikey",
  "access-control-max-age": "86400",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const name = new URL(req.url).pathname.split("/").filter(Boolean).pop() ?? "";
  const h = routes[name]?.[req.method];
  let res: Response;
  try {
    res = h ? await h(req) : new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  } catch (e) {
    console.error(e);
    res = new Response(JSON.stringify({ error: "Сервер қатесі" }), { status: 500 });
  }
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
  return out;
});
