"use client";

import { useState } from "react";
import { CURRENCIES } from "@/lib/currencies";

const CATEGORIES = ["Apartamento", "Trabajo", "Vivienda", "Comida", "Transporte", "Ocio", "Otros"];

type Values = {
  kind?: string;
  name?: string;
  amount?: number | string;
  currency?: string;
  frequency?: string;
  flow_date?: string | null;
  category?: string | null;
  property?: string | null;
  notes?: string | null;
};

const input =
  "mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  );
}

export function CashFlowFields({ v = {}, properties = [] }: { v?: Values; properties?: string[] }) {
  const [frequency, setFrequency] = useState(v.frequency ?? "monthly");
  const monthly = frequency === "monthly";

  return (
    <>
      <Field label="Tipo">
        <select name="kind" defaultValue={v.kind ?? "income"} className={input}>
          <option value="income">Ingreso</option>
          <option value="expense">Gasto</option>
        </select>
      </Field>
      <Field label="Nombre">
        <input
          name="name"
          required
          defaultValue={v.name}
          placeholder="Ej. Sueldo Trabajo 1, Arriendo, Gym"
          className={input}
        />
      </Field>
      <Field label="Monto">
        <input name="amount" type="number" step="0.01" required defaultValue={v.amount} className={`tabular ${input}`} />
      </Field>
      <Field label="Moneda">
        <select name="currency" defaultValue={v.currency ?? "EUR"} className={input}>
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Frecuencia">
        <select
          name="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className={input}
        >
          <option value="monthly">Mensual (se repite solo cada mes)</option>
          <option value="once">Único (una sola vez)</option>
        </select>
      </Field>
      {monthly ? (
        <Field label="Día del mes en que se cobra/paga (1-31)">
          <input
            name="day"
            type="number"
            min={1}
            max={31}
            defaultValue={v.flow_date ? Number(v.flow_date.slice(8, 10)) : ""}
            placeholder="Ej. 5"
            className={`tabular ${input}`}
          />
        </Field>
      ) : (
        <Field label="Fecha exacta">
          <input name="flow_date" type="date" required defaultValue={v.flow_date ?? ""} className={input} />
        </Field>
      )}
      <Field label="Categoría">
        <select name="category" defaultValue={v.category ?? ""} className={input}>
          <option value="">—</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Apartamento">
        <input
          name="property"
          list="properties"
          defaultValue={v.property ?? ""}
          placeholder="Opcional. Ej. Apto Madrid"
          className={input}
        />
        <datalist id="properties">
          {properties.map((property) => (
            <option key={property} value={property} />
          ))}
        </datalist>
      </Field>
      <Field label="Notas" className="sm:col-span-2">
        <input name="notes" defaultValue={v.notes ?? ""} placeholder="Opcional" className={input} />
      </Field>
    </>
  );
}
