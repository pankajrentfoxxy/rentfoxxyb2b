"use client";

import { useEffect, useState } from "react";

type Insp = { id: string; name: string; type: string; cityZones: string[]; user: { email: string } };

export default function AdminInspectorsPage() {
  const [rows, setRows] = useState<Insp[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"INHOUSE" | "OUTSOURCED">("INHOUSE");
  const [zones, setZones] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/admin/inspectors");
    const d = await r.json();
    if (r.ok) setRows(d.inspectors ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const cityZones = zones
      .split(",")
      .map((z) => z.trim())
      .filter(Boolean);
    const r = await fetch("/api/admin/inspectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, type, cityZones }),
    });
    const d = await r.json();
    if (!r.ok) {
      setErr(d.error ?? "Failed");
      return;
    }
    setEmail("");
    setPassword("");
    setName("");
    setZones("");
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Inspectors</h1>
      <p className="mt-1 text-sm text-muted">Create field inspector accounts</p>

      <form onSubmit={submit} className="mt-8 max-w-md space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-800">New inspector</p>
        {err ? <p className="text-sm text-red-700">{err}</p> : null}
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          type="password"
          placeholder="Initial password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as "INHOUSE" | "OUTSOURCED")}
        >
          <option value="INHOUSE">In-house</option>
          <option value="OUTSOURCED">Outsourced</option>
        </select>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="City zones (comma-separated)"
          value={zones}
          onChange={(e) => setZones(e.target.value)}
        />
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
          Create
        </button>
      </form>

      <ul className="mt-8 space-y-2">
        {rows.map((i) => (
          <li key={i.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
            <strong>{i.name}</strong> · {i.user.email} · {i.type}
            {i.cityZones.length ? ` · ${i.cityZones.join(", ")}` : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
