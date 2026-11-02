import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatMoneyShort } from "@/lib/format";
import { CashFlowTable } from "@/components/CashFlowTable";
import { byCategory, monthTotals, propertyTotals, type CashFlow } from "@/lib/cashflows";

const PALETTE = ["bg-indigo-500", "bg-teal", "bg-amber-500", "bg-pink-500", "bg-sky-500", "bg-violet-500", "bg-slate-400"];

function CategoryPanel({
  title,
  subtitle,
  data,
  currency,
}: {
  title: string;
  subtitle: string;
  data: { name: string; value: number }[];
  currency: string;
}) {
  const total = data.reduce((s, c) => s + c.value, 0);
  return (
    <div className="card space-y-4 p-6">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="text-xs text-ink-soft">{subtitle}</p>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-ink-soft">Nada este mes. Ponle categoría a tus filas para verlo aquí.</p>
      ) : (
        <>
          <div className="flex h-3 overflow-hidden rounded-full">
            {data.map((c, i) => (
              <div key={c.name} className={PALETTE[i % PALETTE.length]} style={{ width: `${(c.value / total) * 100}%` }} />
            ))}
          </div>
          <ul className="space-y-2">
            {data.map((c, i) => (
              <li key={c.name} className="flex items-center gap-3 text-sm">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${PALETTE[i % PALETTE.length]}`} />
                <span className="flex-1 truncate text-ink">{c.name}</span>
                <span className="tabular text-xs text-ink-soft">{Math.round((c.value / total) * 100)} %</span>
                <span className="tabular w-28 text-right font-medium text-ink">{formatMoney(c.value, currency)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default async function IngresosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cash_flows")
    .select("id, kind, name, amount, currency, frequency, flow_date, category, property")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const flows = (data ?? []) as CashFlow[];
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthName = now.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const properties = [...new Set(flows.map((f) => f.property).filter(Boolean))] as string[];

  // ponytail: sin conversión EUR↔USD↔COP; cada moneda va por separado. Agregar tasa si hace falta un total único.
  const totals = monthTotals(flows, month);
  // Moneda principal = la que más gasto tiene (normalmente EUR).
  const main = [...totals].sort((a, b) => b.expenses - a.expenses)[0]?.currency ?? "EUR";
  const incomeMain = [...totals].sort((a, b) => b.income - a.income)[0]?.currency ?? main;
  const incomeCategories = byCategory(flows, month, incomeMain, "income");
  const expenseCategories = byCategory(flows, month, main, "expense");
  // Cada apartamento en la moneda de sus propias filas (Génova en COP, el alquiler de aquí en EUR…).
  const byProperty = propertyTotals(flows, month);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Ingresos y gastos</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Lo que entra y lo que sale en <span className="capitalize">{monthName}</span>. Los mensuales y semanales se repiten solos.
        </p>
      </div>

      {totals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line px-5 py-10 text-center text-sm text-ink-soft">
          Aún no hay nada este mes. Agrega tus ingresos y gastos en las tablas de abajo o pega una lista.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {totals.map(({ currency, income, expenses, left }) => {
            const spent = income > 0 ? Math.min(1, expenses / income) : 1;
            return (
              <div key={currency} className="card space-y-5 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Me queda este mes · {currency}</p>
                    <p className={`tabular mt-1 text-4xl font-bold tracking-tight ${left >= 0 ? "text-ink" : "text-mustard"}`}>
                      {formatMoney(left, currency)}
                    </p>
                  </div>
                  {income > 0 && (
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        left >= 0 ? "bg-teal-soft text-teal" : "bg-mustard-soft text-mustard"
                      }`}
                    >
                      Ahorro {Math.round((left / income) * 100)} %
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <a href="#ingresos" className="rounded-2xl bg-teal-soft/60 px-4 py-3 transition hover:bg-teal-soft">
                    <p className="flex items-center gap-1 text-xs font-medium text-teal">
                      <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" /> Entra
                    </p>
                    <p className="tabular mt-0.5 text-xl font-semibold text-ink">{formatMoney(income, currency)}</p>
                  </a>
                  <a href="#gastos" className="rounded-2xl bg-mustard-soft/60 px-4 py-3 transition hover:bg-mustard-soft">
                    <p className="flex items-center gap-1 text-xs font-medium text-mustard">
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> Sale
                    </p>
                    <p className="tabular mt-0.5 text-xl font-semibold text-ink">{formatMoney(expenses, currency)}</p>
                  </a>
                </div>
                <div className="space-y-1.5">
                  <div className="flex h-3 overflow-hidden rounded-full bg-teal-soft">
                    <div className="bg-mustard" style={{ width: `${spent * 100}%` }} />
                  </div>
                  <p className="tabular text-xs text-ink-soft">
                    {income > 0 ? `Gastas el ${Math.round((expenses / income) * 100)} % de lo que entra` : "Sin ingresos registrados en esta moneda"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totals.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CategoryPanel
            title="De dónde entra el dinero"
            subtitle={`Ingresos de este mes por categoría, en ${incomeMain}`}
            data={incomeCategories}
            currency={incomeMain}
          />
          <CategoryPanel
            title="En qué se va el dinero"
            subtitle={`Gastos de este mes por categoría, en ${main}`}
            data={expenseCategories}
            currency={main}
          />
        </div>
      )}

      {byProperty.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Por apartamento</h2>
            <p className="text-xs text-ink-soft">Lo que entra menos lo que sale de cada inmueble este mes</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byProperty.map(({ property, totals: t }) => (
              <div key={property} className="card space-y-3 p-5">
                <p className="font-semibold text-ink">{property}</p>
                {t.length === 0 ? (
                  <p className="text-sm text-ink-soft">Sin movimientos este mes</p>
                ) : (
                  t.map(({ currency, income, expenses, left }) => (
                    <div key={currency} className="space-y-1.5">
                      <p className={`tabular text-2xl font-bold tracking-tight ${left >= 0 ? "text-teal" : "text-mustard"}`}>
                        {left >= 0 ? "+" : ""}
                        {formatMoneyShort(left, currency)}
                      </p>
                      <div className="flex gap-2 text-xs">
                        <span className="tabular rounded-full bg-teal-soft px-2 py-0.5 text-teal">↓ {formatMoneyShort(income, currency)}</span>
                        <span className="tabular rounded-full bg-mustard-soft px-2 py-0.5 text-mustard">↑ {formatMoneyShort(expenses, currency)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <CashFlowTable
        kind="income"
        title="Ingresos"
        subtitle="Sueldos, arriendos que recibes, otros ingresos."
        initial={flows.filter((f) => f.kind === "income")}
        properties={properties}
        month={month}
        defaultCurrency={main}
      />
      <CashFlowTable
        kind="expense"
        title="Gastos"
        subtitle="Alquiler donde vives, mercado, servicios, seguros… todo lo que sale."
        initial={flows.filter((f) => f.kind === "expense")}
        properties={properties}
        month={month}
        defaultCurrency={main}
      />
    </div>
  );
}
