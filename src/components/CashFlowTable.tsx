"use client";

import { useRef, useState } from "react";
import { Check, ClipboardList, Loader2, Plus, Trash2 } from "lucide-react";
import { deleteCashFlow, saveCashFlow, saveCashFlows, type CashFlowInput } from "@/app/(app)/ingresos/actions";
import { CATEGORY_SUGGESTIONS, FREQUENCIES, monthlyAmount, type CashFlow } from "@/lib/cashflows";
import { CURRENCIES } from "@/lib/currencies";
import { formatMoney } from "@/lib/format";

type Draft = {
  key: string;
  id?: string;
  name: string;
  amount: string;
  currency: string;
  frequency: string;
  day: string; // mensual: día del mes
  date: string; // único: fecha exacta
  category: string;
  property: string;
};

const cell =
  "w-full min-w-0 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/40 hover:border-line focus:border-stamp focus:bg-paper-raised focus:ring-2 focus:ring-stamp/15";

let seq = 0;
const newKey = () => `k${++seq}`;

function toDraft(f: CashFlow): Draft {
  return {
    key: f.id,
    id: f.id,
    name: f.name,
    amount: String(f.amount),
    currency: f.currency,
    frequency: f.frequency,
    day: f.frequency === "monthly" && f.flow_date ? String(Number(f.flow_date.slice(8, 10))) : "",
    date: f.frequency === "once" ? (f.flow_date ?? "") : "",
    category: f.category ?? "",
    property: f.property ?? "",
  };
}

function toInput(d: Draft, kind: string): CashFlowInput {
  const day = Math.min(31, Math.max(1, Number(d.day) || 1));
  return {
    id: d.id,
    kind,
    name: d.name,
    amount: parseAmount(d.amount) ?? d.amount,
    currency: d.currency,
    frequency: d.frequency,
    // Mensual: solo importa el día; se guarda en enero de 2000 (tiene 31 días).
    flow_date:
      d.frequency === "monthly" ? (d.day ? `2000-01-${String(day).padStart(2, "0")}` : null) : d.frequency === "once" ? d.date || null : null,
    category: d.category,
    property: d.property,
  };
}

const asFlow = (d: Draft, kind: string) => ({ ...toInput(d, kind), amount: parseAmount(d.amount) ?? 0 });

/** "1.200,50" → 1200.5 · "112,67" → 112.67 · "400" → 400 */
function parseAmount(raw: string) {
  let s = raw.replace(/[€$\s]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return s && Number.isFinite(n) ? n : null;
}

/** Una línea por gasto: "Mercado 400", "Taco Seguro: 42", "Luz\t42,00 €". */
function parseList(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim().match(/^(.+?)[\s:;\t-]+([\d.,]+)\s*€?$/))
    .flatMap((m) => {
      const amount = m && parseAmount(m[2]);
      return m && amount != null ? [{ name: m[1].trim(), amount }] : [];
    });
}

function Fields({
  d,
  set,
  kind,
}: {
  d: Draft;
  set: (patch: Partial<Draft>) => void;
  kind: string;
}) {
  return (
    <>
      <td className="py-1 pl-3 pr-1">
        <input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Concepto" aria-label="Concepto" className={`${cell} font-medium`} />
      </td>
      <td className="px-1 py-1">
        <input value={d.category} onChange={(e) => set({ category: e.target.value })} list={`${kind}-cats`} placeholder="Categoría" aria-label="Categoría" className={cell} />
      </td>
      <td className="px-1 py-1">
        <select value={d.frequency} onChange={(e) => set({ frequency: e.target.value })} aria-label="Frecuencia" className={cell}>
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-1 py-1">
        {d.frequency === "monthly" ? (
          <input value={d.day} onChange={(e) => set({ day: e.target.value })} type="number" min={1} max={31} placeholder="Día" aria-label="Día del mes" className={`tabular ${cell}`} />
        ) : d.frequency === "once" ? (
          <input value={d.date} onChange={(e) => set({ date: e.target.value })} type="date" aria-label="Fecha" className={cell} />
        ) : (
          <span className="px-2 text-xs text-ink-soft">cada semana</span>
        )}
      </td>
      <td className="px-1 py-1">
        <input value={d.property} onChange={(e) => set({ property: e.target.value })} list={`${kind}-props`} placeholder="—" aria-label="Apartamento" className={cell} />
      </td>
      <td className="px-1 py-1">
        <select value={d.currency} onChange={(e) => set({ currency: e.target.value })} aria-label="Moneda" className={cell}>
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </td>
      <td className="px-1 py-1">
        <input value={d.amount} onChange={(e) => set({ amount: e.target.value })} inputMode="decimal" placeholder="0" aria-label="Importe" className={`tabular ${cell} text-right font-semibold`} />
      </td>
    </>
  );
}

function Row({
  initial,
  kind,
  month,
  onChange,
  onDelete,
}: {
  initial: Draft;
  kind: string;
  month: string;
  onChange: (d: Draft) => void;
  onDelete: (d: Draft) => void;
}) {
  const [d, setD] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const saved = useRef(JSON.stringify(initial));

  const set = (patch: Partial<Draft>) => {
    const next = { ...d, ...patch };
    setD(next);
    onChange(next);
  };

  async function save() {
    if (JSON.stringify(d) === saved.current) return;
    setStatus("saving");
    try {
      await saveCashFlow(toInput(d, kind));
      saved.current = JSON.stringify(d);
      setStatus("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
      setStatus("error");
    }
  }

  const perMonth = monthlyAmount(asFlow(d, kind), month);

  return (
    <tr
      className="group transition hover:bg-stamp-soft/40"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) save();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLElement).blur();
      }}
    >
      <Fields d={d} set={set} kind={kind} />
      <td className="tabular whitespace-nowrap px-2 py-1 text-right text-xs text-ink-soft">
        {d.frequency === "monthly" ? "" : formatMoney(perMonth, d.currency)}
      </td>
      <td className="py-1 pl-1 pr-3">
        <div className="flex items-center justify-end gap-1">
          {status === "saving" && <Loader2 className="h-4 w-4 animate-spin text-ink-soft" aria-label="Guardando" />}
          {status === "saved" && <Check className="h-4 w-4 text-teal" aria-label="Guardado" />}
          {status === "error" && (
            <span className="max-w-32 truncate text-xs font-medium text-mustard" title={error}>
              {error}
            </span>
          )}
          <button
            type="button"
            onClick={() => onDelete(d)}
            aria-label={`Eliminar ${d.name}`}
            className="rounded p-1.5 text-ink-soft/40 opacity-60 transition hover:bg-mustard-soft hover:text-mustard group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function CashFlowTable({
  kind,
  title,
  subtitle,
  initial,
  properties,
  month,
  defaultCurrency,
}: {
  kind: "income" | "expense";
  title: string;
  subtitle: string;
  initial: CashFlow[];
  properties: string[];
  month: string;
  defaultCurrency: string;
}) {
  const blank = (): Draft => ({
    key: newKey(),
    name: "",
    amount: "",
    currency: defaultCurrency,
    frequency: "monthly",
    day: "",
    date: "",
    category: "",
    property: "",
  });
  const [rows, setRows] = useState<Draft[]>(() => initial.map(toDraft));
  const [draft, setDraft] = useState<Draft>(blank);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const parsed = parseList(pasteText);

  async function add() {
    if (!draft.name.trim() || !draft.amount.trim() || adding) return;
    setAdding(true);
    setError("");
    try {
      const id = await saveCashFlow(toInput(draft, kind));
      setRows((r) => [...r, { ...draft, id, key: id }]);
      setDraft(blank());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo agregar");
    } finally {
      setAdding(false);
    }
  }

  async function addMany() {
    if (parsed.length === 0) return;
    setAdding(true);
    setError("");
    try {
      const saved = await saveCashFlows(
        parsed.map((p) => ({ kind, name: p.name, amount: p.amount, currency: defaultCurrency, frequency: "monthly", flow_date: null, category: null, property: null })),
      );
      setRows((r) => [...r, ...saved.map(toDraft)]);
      setPasteText("");
      setPasteOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo agregar la lista");
    } finally {
      setAdding(false);
    }
  }

  async function remove(d: Draft) {
    if (!d.id || !confirm(`¿Eliminar "${d.name}"?`)) return;
    try {
      await deleteCashFlow(d.id);
      setRows((r) => r.filter((x) => x.key !== d.key));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  }

  // Total del mes por moneda, en vivo mientras editas.
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(r.currency, (totals.get(r.currency) ?? 0) + monthlyAmount(asFlow(r, kind), month));

  return (
    <section id={kind === "income" ? "ingresos" : "gastos"} className="card scroll-mt-6 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-6">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="text-sm text-ink-soft">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setPasteOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-stamp-soft hover:text-stamp-dark"
        >
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Pegar una lista
        </button>
      </div>

      {pasteOpen && (
        <div className="mx-6 mt-4 space-y-3 rounded-2xl bg-stamp-soft/50 p-4">
          <p className="text-sm text-ink-soft">
            Una línea por {kind === "income" ? "ingreso" : "gasto"}: concepto y importe. Se agregan como mensuales en {defaultCurrency}; luego ajustas lo que quieras en la tabla.
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={6}
            placeholder={kind === "income" ? "Sueldo trabajo 1  2500\nSueldo trabajo 2  1800" : "Mercado 400\nLuz 42\nInternet 45\nAlquiler 1200"}
            className="tabular w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 text-sm text-ink outline-none focus:border-stamp focus:ring-2 focus:ring-stamp/15"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addMany}
              disabled={parsed.length === 0 || adding}
              className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-40"
            >
              Agregar {parsed.length || ""} {parsed.length === 1 ? "fila" : "filas"}
            </button>
            {pasteText && parsed.length === 0 && <span className="text-xs text-mustard">No reconozco ninguna línea con importe.</span>}
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-y border-line text-left text-[11px] uppercase tracking-wide text-ink-soft">
              <th className="py-2.5 pl-5 font-medium">Concepto</th>
              <th className="px-3 font-medium">Categoría</th>
              <th className="w-28 px-3 font-medium">Frecuencia</th>
              <th className="w-32 px-3 font-medium">Día / fecha</th>
              <th className="px-3 font-medium">Apartamento</th>
              <th className="w-20 px-3 font-medium">Moneda</th>
              <th className="w-28 px-3 text-right font-medium">Importe</th>
              <th className="w-24 px-2 text-right font-medium">Al mes</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <Row
                key={r.key}
                initial={r}
                kind={kind}
                month={month}
                onChange={(d) => setRows((all) => all.map((x) => (x.key === d.key ? d : x)))}
                onDelete={remove}
              />
            ))}
            <tr
              className="bg-paper/60"
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
            >
              <Fields d={draft} set={(p) => setDraft((d) => ({ ...d, ...p }))} kind={kind} />
              <td />
              <td className="py-1 pl-1 pr-3 text-right">
                <button
                  type="button"
                  onClick={add}
                  disabled={!draft.name.trim() || !draft.amount.trim() || adding}
                  aria-label="Agregar fila"
                  className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 p-1.5 text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-30"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                </button>
              </td>
            </tr>
          </tbody>
          {totals.size > 0 && (
            <tfoot>
              <tr className="border-t-2 border-line">
                <td colSpan={6} className="py-3 pl-5 text-sm font-semibold text-ink">
                  Total {kind === "income" ? "ingresos" : "gastos"} del mes
                </td>
                <td colSpan={2} className="tabular px-2 py-3 text-right text-base font-bold text-ink">
                  {[...totals].map(([c, t]) => (
                    <span key={c} className="block">
                      {formatMoney(t, c)}
                    </span>
                  ))}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {error && <p className="px-6 py-3 text-sm font-medium text-mustard">{error}</p>}
      <p className="px-6 pb-5 pt-2 text-xs text-ink-soft">
        Edita cualquier celda: se guarda sola al salir de la fila (o con Enter). Semanal se convierte al mes × 52/12.
      </p>

      <datalist id={`${kind}-cats`}>
        {CATEGORY_SUGGESTIONS[kind].map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id={`${kind}-props`}>
        {properties.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </section>
  );
}
