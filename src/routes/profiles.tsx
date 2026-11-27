import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, DemoBadge } from "@/components/app/AppShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/profiles")({
  head: () => ({ meta: [{ title: "Оқушылар — Өз қадамым" }, { name: "description", content: "Оқушы кодтары, мақсаттар және қолдау түрлері." }] }),
  component: Profiles,
});

const SUPPORT_OPTIONS = ["визуалды кесте", "таймер", "сурет-карточка", "санау таяқшалары", "үлгі сөйлем", "үзіліс", "қысқа нұсқау"];

function Profiles() {
  const { s, updateProfile, addProfile, removeProfile } = useStore();
  return (
    <>
      <PageHeader title="Оқушылар" desc="Бүгін жұмыс істейтін оқушыларды таңдап, мақсаты мен қолдау түрлерін өңдеңіз. Нақты аты-жөн жазбаңыз — тек код.">
        <div className="flex items-center gap-2"><DemoBadge text="Ойдан шығарылған кодтар" /><button className="btn btn-primary" onClick={addProfile}>+ Оқушы қосу</button></div>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {s.profiles.map((p) => <ProfileCard key={p.id} id={p.id} onRemove={() => removeProfile(p.id)} update={updateProfile} />)}
      </div>
    </>
  );
}

function ProfileCard({ id, update, onRemove }: { id: string; update: ReturnType<typeof useStore>["updateProfile"]; onRemove: () => void }) {
  const { s } = useStore();
  const p = s.profiles.find((x) => x.id === id)!;
  const [custom, setCustom] = useState("");
  const toggle = (sup: string) => update(p.id, { supports: p.supports.includes(sup) ? p.supports.filter((x) => x !== sup) : [...p.supports, sup] });
  const options = Array.from(new Set([...SUPPORT_OPTIONS, ...p.supports]));
  return (
    <div className={`card flex flex-col gap-3 ${p.selected ? "border-primary" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <input aria-label="Оқушы коды" className="input max-w-32 font-bold" value={p.code} onChange={(e) => update(p.id, { code: e.target.value })} />
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" checked={p.selected} onChange={(e) => update(p.id, { selected: e.target.checked })} />
          Таңдалған
        </label>
      </div>
      <div>
        <label className="label" htmlFor={`goal-${p.id}`}>Мақсат</label>
        <textarea id={`goal-${p.id}`} rows={2} className="input" value={p.goal} onChange={(e) => update(p.id, { goal: e.target.value })} />
      </div>
      <fieldset>
        <legend className="label">Қолдау түрлері</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((sup) => (
            <button key={sup} type="button" aria-pressed={p.supports.includes(sup)} onClick={() => toggle(sup)} className={`chip cursor-pointer ${p.supports.includes(sup) ? "chip-teal" : "chip-muted"}`}>{sup}</button>
          ))}
        </div>
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = custom.trim(); if (v && !p.supports.includes(v)) update(p.id, { supports: [...p.supports, v] }); setCustom(""); }}>
          <input className="input" placeholder="Басқа қолдау…" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <button className="btn">Қосу</button>
        </form>
      </fieldset>
      <button className="btn btn-ghost self-end text-rose" onClick={() => { if (confirm(`${p.code} және оның барлық жазбаларын жою керек пе?`)) onRemove(); }}>Жою</button>
    </div>
  );
}
