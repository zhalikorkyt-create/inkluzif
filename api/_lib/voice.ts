import { createHash } from "node:crypto";
import type { Db } from "./db.js";
import type { Game } from "../../src/shared/types.js";

export const voiceEnabled = () => Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);

async function tts(text: string): Promise<Uint8Array> {
  const voice = process.env.ELEVENLABS_VOICE_ID!;
  const model = process.env.ELEVENLABS_MODEL || "eleven_v3";
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: model, language_code: "kk" }),
  });
  if (!r.ok) throw new Error(`ElevenLabs қатесі: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return new Uint8Array(await r.arrayBuffer());
}

/** Мәтінге дыбыс файлын жасайды (бірдей мәтін бір рет қана). */
async function audioFor(d: Db, text: string): Promise<string> {
  const path = `audio/${createHash("sha1").update(`${process.env.ELEVENLABS_VOICE_ID}:${text}`).digest("hex")}.mp3`;
  if (!(await d.fileUrl(path).catch(() => null))) {
    await d.putFile(path, await tts(text), "audio/mpeg");
  }
  return path;
}

export async function voiceGames(d: Db, games: Game[]): Promise<Game[]> {
  const jobs: (() => Promise<void>)[] = [];
  for (const g of games) {
    if (g.instruction) jobs.push(async () => { g.instruction_audio = await audioFor(d, g.instruction); });
    for (const it of g.items) if (it.say) jobs.push(async () => { it.audio = await audioFor(d, it.say); });
  }
  // бір уақытта 4 сұраныстан артық емес
  for (let i = 0; i < jobs.length; i += 4) await Promise.all(jobs.slice(i, i + 4).map((j) => j()));
  return games;
}

/** Ойындағы дыбыс жолдарын ойнатуға болатын сілтемелерге айналдырады. */
export async function withAudioUrls(d: Db, games: Game[]): Promise<Game[]> {
  const copy: Game[] = JSON.parse(JSON.stringify(games));
  for (const g of copy) {
    if (g.instruction_audio) g.instruction_audio = (await d.fileUrl(g.instruction_audio)) ?? undefined;
    for (const it of g.items) if (it.audio) it.audio = (await d.fileUrl(it.audio)) ?? undefined;
  }
  return copy;
}
