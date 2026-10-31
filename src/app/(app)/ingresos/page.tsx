import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { createCashFlow, deleteCashFlow } from "./actions";

const CURRENCIES = ["EUR", "USD", "COP"];
const CATEGORIES = ["Apartamento", "Trabajo", "Vivienda", "Comida", "Transporte", "Ocio", "Otros"];
const inputClass =
  "mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15";

export default async function IngresosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cash_flows")
    .select("id, kind, name, amount, currency, notes, frequency, flow_date, category, property")
    .order("created_at", { ascending: true });
  const flows = data ?? [];
  const properties = [...new Set(flows.map((flow) => flow.property).filter(Boolean))] as string[];

  // Cuenta este mes: los mensuales siempre, los únicos solo si caen en el mes actual.
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthFlows = flows.filter(
    (flow) => flow.frequency !== "once" || flow.flow_date?.startsWith(thisMonth),
  );

  // ponytail: sin conversión EUR↔USD; cada moneda se calcula por separado. Agregar tasa si hace falta un total único.
  const summaries = CURRENCIES.map((currency) => {
    const inCurrency = monthFlows.filter((flow) => flow.currency === currency);
    const sum = (kind: string) =>
      inCurrency
        .filter((flow) => flow.kind === kind)
        .reduce((total, flow) => total + Number(flow.amount), 0);
    const income = sum("income");
    const expenses = sum("expense");
    return { currency, income, expenses, left: income - expenses };
  }).filter(({ currency, income, expenses }) => currency !== "COP" || income || expenses);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Ingresos y gastos</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Lo que ganas y gastas al mes, y lo que te queda en cada moneda.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {summaries.map(({ currency, income, expenses, left }) => (
          <div key={currency} className="card space-y-3 px-6 py-4">
            <p className="text-xs font-medium uppercase text-ink-soft">Mes en {currency}</p>
            <p className="tabular text-3xl font-bold tracking-tight text-ink">
              {formatMoney(left, currency)}
              <span className="ml-2 text-sm font-normal text-ink-soft">me queda</span>
            </p>
            <p className="tabular text-sm text-ink-soft">
              Ingresos {formatMoney(income, currency)} · Gastos {formatMoney(expenses, currency)}
              {income > 0 && ` · Ahorro ${Math.round((left / income) * 100)}%`}
            </p>
          </div>
        ))}
      </div>

      {properties.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Por apartamento (este mes)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {properties.map((property) => (
              <div key={property} className="card space-y-1 px-6 py-4">
                <p className="font-medium text-ink">{property}</p>
                {CURRENCIES.map((currency) => {
                  const rows = monthFlows.filter(
                    (flow) => flow.property === property && flow.currency === currency,
                  );
                  if (rows.length === 0) return null;
                  const net = rows.reduce(
                    (total, flow) =>
                      total + (flow.kind === "income" ? 1 : -1) * Number(flow.amount),
                    0,
                  );
                  return (
                    <p key={currency} className="tabular text-sm text-ink-soft">
                      Neto {formatMoney(net, currency)}
                    </p>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      <form action={createCashFlow} className="grid grid-cols-1 gap-4 card p-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink">Tipo</label>
          <select name="kind" className={inputClass}>
            <option value="income">Ingreso</option>
            <option value="expense">Gasto</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Nombre</label>
          <input
            name="name"
            required
            placeholder="Ej. Sueldo Trabajo 1, Arriendo, Gym"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Monto</label>
          <input name="amount" type="number" step="0.01" required className={`tabular ${inputClass}`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Moneda</label>
          <select name="currency" className={inputClass}>
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Frecuencia</label>
          <select name="frequency" className={inputClass}>
            <option value="monthly">Mensual</option>
            <option value="once">Único</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Fecha (día de cobro/pago)</label>
          <input name="flow_date" type="date" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Categoría</label>
          <select name="category" className={inputClass}>
            <option value="">—</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Apartamento</label>
          <input
            name="property"
            list="properties"
            placeholder="Opcional. Ej. Apto Madrid"
            className={inputClass}
          />
          <datalist id="properties">
            {properties.map((property) => (
              <option key={property} value={property} />
            ))}
          </datalist>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink">Notas</label>
          <input name="notes" placeholder="Opcional" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110"
          >
            Agregar
          </button>
        </div>
      </form>

      {[
        { kind: "income", title: "Ingresos" },
        { kind: "expense", title: "Gastos" },
      ].map(({ kind, title }) => {
        const rows = flows.filter((flow) => flow.kind === kind);
        return (
          <section key={kind} className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {rows.length === 0 ? (
              <p className="text-sm text-ink-soft">Nada registrado todavía.</p>
            ) : (
              <ul className="card divide-y divide-line overflow-hidden">
                {rows.map((flow) => (
                  <li key={flow.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{flow.name}</p>
                      <p className="text-xs text-ink-soft">
                        {[
                          flow.frequency === "once" ? "Único" : "Mensual",
                          flow.flow_date &&
                            (flow.frequency === "once"
                              ? flow.flow_date
                              : `día ${Number(flow.flow_date.slice(8, 10))}`),
                          flow.category,
                          flow.property,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {flow.notes && <p className="text-sm text-ink-soft">{flow.notes}</p>}
                    </div>
                    <span className="tabular text-base font-semibold text-ink">
                      {formatMoney(Number(flow.amount), flow.currency)}
                    </span>
                    <form
                      action={async () => {
                        "use server";
                        await deleteCashFlow(flow.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        label="Eliminar"
                        confirmMessage={`¿Eliminar "${flow.name}"?`}
                      />
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
