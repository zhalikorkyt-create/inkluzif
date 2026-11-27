import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { fileURLToPath } from "node:url";

/** `npm run dev` кезінде /api/* сұраныстарын server/ қалтасындағы өңдеушілерге жібереді (жергілікті тексеру үшін). */
function devApi(): Plugin {
  return {
    name: "dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = req.url?.match(/^\/api\/(teacher|play|parent)\b/);
        if (!m) return next();
        try {
          const mod = await server.ssrLoadModule(`/server/${m[1]}.ts`);
          const handler = mod[req.method ?? "GET"];
          if (!handler) { res.statusCode = 405; return res.end(); }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method, headers: req.headers as Record<string, string>,
            body: ["GET", "HEAD"].includes(req.method ?? "") ? undefined : Buffer.concat(chunks),
          });
          const out: Response = await handler(request);
          res.statusCode = out.status;
          out.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await out.arrayBuffer()));
        } catch (e) {
          console.error(e);
          res.statusCode = 500;
          res.end(String(e));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss(), devApi()],
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  };
});
