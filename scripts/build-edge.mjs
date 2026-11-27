// server/ кодын бір файлға жинап, Supabase Edge Function ретінде орналастыруға дайындайды.
import { build } from "esbuild";
import { readFileSync } from "node:fs";
const v = (n) => JSON.parse(readFileSync(`node_modules/${n}/package.json`, "utf8")).version;
const deps = {
  "@anthropic-ai/sdk": `npm:@anthropic-ai/sdk@${v("@anthropic-ai/sdk")}`,
  "@anthropic-ai/sdk/": `npm:/@anthropic-ai/sdk@${v("@anthropic-ai/sdk")}/`,
  "@supabase/supabase-js": `npm:@supabase/supabase-js@${v("@supabase/supabase-js")}`,
  zod: `npm:zod@${v("zod")}`,
};
await build({
  entryPoints: ["server/edge.ts"],
  outfile: "supabase/functions/api/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  packages: "external", // npm пакеттерін Deno өзі жүктейді (deno.json)
  legalComments: "none",
  charset: "utf8",
  banner: { js: "// Автоматты түрде жасалған: npm run build:edge (қолмен өзгертпеңіз)" },
});
await import("node:fs").then((fs) => fs.writeFileSync("supabase/functions/api/deno.json", JSON.stringify({ imports: deps }, null, 2) + "\n"));
console.log("supabase/functions/api/index.js дайын");
