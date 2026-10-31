"use client";

import { useState } from "react";
import { CATEGORIES, PLATFORMS } from "@/lib/investments";

type Values = {
  name?: string;
  amount?: number | string;
  currency?: string;
  notes?: string | null;
  category?: string;
  platform?: string | null;
  project_name?: string | null;
  credit_amount?: number | string | null;
  interest_rate?: number | string | null;
  credit_term_months?: number | null;
  payment_day?: number | null;
  ownership_pct?: number | string | null;
  purchase_price?: number | string | null;
  current_value?: number | string | null;
  start_date?: string | null;
  purchase_date?: string | null;
  maturity_date?: string | null;
};

const input =
  "mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  );
}

export function InvestmentFields({ v = {} }: { v?: Values }) {
  const [category, setCategory] = useState(v.category ?? "fondo");
  const vivienda = category === "vivienda";
  const cdt = category === "cdt";

  return (
    <>
      <Field label="Tipo">
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={input}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label={vivienda ? "Banco o entidad del crédito" : "Plataforma o fondo (Tyba, Nu, Happi…)"}>
        <input name="platform" list="platforms" defaultValue={v.platform ?? ""} className={input} />
        <datalist id="platforms">
          {PLATFORMS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </Field>
      <Field label={vivienda ? "Nombre del inmueble" : "Nombre"}>
        <input
          name="name"
          required
          defaultValue={v.name}
          placeholder={vivienda ? "Ej. Apto 502" : "Ej. Fondo S&P 500"}
          className={input}
        />
      </Field>
      <Field label={vivienda ? "Valor invertido total (cuota inicial + abonos)" : "Monto total"}>
        <input
          name="amount"
          type="number"
          step="0.01"
          required
          defaultValue={v.amount}
          className={`tabular ${input}`}
        />
      </Field>
      <Field label="Moneda">
        <select name="currency" defaultValue={v.currency ?? "COP"} className={input}>
          <option value="COP">COP</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </Field>
      <Field label="Mi porcentaje de la inversión (%)">
        <input
          name="ownership_pct"
          type="number"
          step="0.01"
          min={0.01}
          max={100}
          required
          defaultValue={v.ownership_pct ?? 100}
          className={`tabular ${input}`}
        />
      </Field>
      {!cdt && !vivienda && (
        <>
          <Field label="Fecha de ingreso (primer aporte)">
            <input name="start_date" type="date" defaultValue={v.start_date ?? ""} className={input} />
          </Field>
          <Field label="Tasa E.A. inicial (%) (opcional)">
            <input
              name="interest_rate"
              type="number"
              step="0.001"
              defaultValue={v.interest_rate ?? ""}
              className={`tabular ${input}`}
            />
          </Field>
        </>
      )}
      {!cdt && (
        <Field label={vivienda ? "Valor hoy del inmueble (total)" : "Valor actual real (opcional, reemplaza la estimación)"}>
          <input
            name="current_value"
            type="number"
            step="0.01"
            defaultValue={v.current_value ?? ""}
            className={`tabular ${input}`}
          />
        </Field>
      )}
      {cdt && (
        <>
          <Field label="Tasa E.A. (%)">
            <input
              name="interest_rate"
              type="number"
              step="0.001"
              defaultValue={v.interest_rate ?? ""}
              className={`tabular ${input}`}
            />
          </Field>
          <Field label="Fecha de inicio">
            <input name="start_date" type="date" defaultValue={v.start_date ?? ""} className={input} />
          </Field>
          <Field label="Fecha de vencimiento">
            <input name="maturity_date" type="date" defaultValue={v.maturity_date ?? ""} className={input} />
          </Field>
        </>
      )}
      <Field label="Notas">
        <input name="notes" defaultValue={v.notes ?? ""} placeholder="Opcional" className={input} />
      </Field>

      {vivienda && (
        <>
          <Field label="Proyecto de vivienda">
            <input name="project_name" defaultValue={v.project_name ?? ""} className={input} />
          </Field>
          <Field label="Precio de compra (total)">
            <input
              name="purchase_price"
              type="number"
              step="0.01"
              defaultValue={v.purchase_price ?? ""}
              className={`tabular ${input}`}
            />
          </Field>
          <Field label="Fecha de compra">
            <input name="purchase_date" type="date" defaultValue={v.purchase_date ?? ""} className={input} />
          </Field>
          <Field label="Fecha de desembolso del crédito">
            <input name="start_date" type="date" defaultValue={v.start_date ?? ""} className={input} />
          </Field>
          <Field label="Valor del crédito (total)">
            <input
              name="credit_amount"
              type="number"
              step="0.01"
              defaultValue={v.credit_amount ?? ""}
              className={`tabular ${input}`}
            />
          </Field>
          <Field label="Tasa de interés E.A. (%)">
            <input
              name="interest_rate"
              type="number"
              step="0.001"
              defaultValue={v.interest_rate ?? ""}
              className={`tabular ${input}`}
            />
          </Field>
          <Field label="Plazo (meses)">
            <input
              name="credit_term_months"
              type="number"
              defaultValue={v.credit_term_months ?? ""}
              className={`tabular ${input}`}
            />
          </Field>
          <Field label="Día de pago de la cuota (1-31)">
            <input
              name="payment_day"
              type="number"
              min={1}
              max={31}
              defaultValue={v.payment_day ?? ""}
              className={`tabular ${input}`}
            />
          </Field>
        </>
      )}
    </>
  );
}
