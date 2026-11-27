const KEY = "oz-qadamym:teacher-key";
export const getKey = () => { try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; } };
export const setKey = (k: string) => { try { localStorage.setItem(KEY, k); } catch { /* ignore */ } };

export class ApiError extends Error { constructor(msg: string, public status: number) { super(msg); } }

async function handle<T>(r: Response): Promise<T> {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError((data as { error?: string }).error ?? `Қате ${r.status}`, r.status);
  return data as T;
}

export async function teacher<T = unknown>(action: string, payload: Record<string, unknown> = {}, key = getKey()): Promise<T> {
  return handle<T>(await fetch("/api/teacher", { method: "POST", headers: { "content-type": "application/json", "x-teacher-key": key }, body: JSON.stringify({ action, ...payload }) }));
}

export async function parent<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  return handle<T>(await fetch("/api/parent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...payload }) }));
}

export async function getPlay<T>(id: string): Promise<T> {
  return handle<T>(await fetch(`/api/play?id=${encodeURIComponent(id)}`));
}
export async function sendPlay(id: string, results: unknown[]) {
  return handle(await fetch("/api/play", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, results }) }));
}

/** Суретті кішірейтіп, JPEG data URL-ге айналдырады. */
export async function shrinkImage(file: File, max = 1280): Promise<string> {
  const img = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}
