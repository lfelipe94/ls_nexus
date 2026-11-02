import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Home, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatMoneyCompact, formatMoneyShort } from "@/lib/format";
import { sumByCurrency, groupSum } from "@/lib/aggregations";
import { categoryLabel, creditProgress, currentValue, monthlyPayment, myShare, nextPaymentDate, withMovements, type Movement } from "@/lib/investments";
import { byCategory, monthTotals, type CashFlow } from "@/lib/cashflows";
import { AllocationChart } from "@/components/DashboardCharts";

const PALETTE = ["bg-indigo-500", "bg-teal", "bg-amber-500", "bg-pink-500", "bg-sky-500", "bg-violet-500", "bg-slate-400"];

function Tile({
  href,
  icon,
  label,
  tone,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="card group flex flex-col gap-4 p-6 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5 text-sm font-semibold text-ink">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
          {label}
        </span>
        <ArrowRight className="h-4 w-4 text-ink-soft/50 transition group-hover:translate-x-0.5 group-hover:text-stamp-dark" aria-hidden="true" />
      </div>
      {children}
    </Link>
  );
}

const Big = ({ children }: { children: React.ReactNode }) => (
  <p className="tabular truncate text-4xl font-bold tracking-tight text-ink">{children}</p>
);
const Chip = ({ children, tone = "bg-stamp-soft text-stamp-dark" }: { children: React.ReactNode; tone?: string }) => (
  <span className={`tabular rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{children}</span>
);
const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-ink-soft">{children}</p>;

/** Barra apilada + leyenda corta (3 primeras y "Otros"). */
function Breakdown({ data, currency }: { data: { name: string; value: number }[]; currency: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;
  const rest = data.slice(3).reduce((s, d) => s + d.value, 0);
  const legend = data.slice(0, 3).map((d, i) => ({ ...d, color: PALETTE[i] }));
  if (rest) legend.push({ name: "Otros", value: rest, color: "bg-slate-400" });
  return (
    <div className="space-y-2.5">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-stamp-soft">
        {data.map((d, i) => (
          <div key={d.name} className={i < 3 ? PALETTE[i] : "bg-slate-400"} style={{ width: `${(d.value / total) * 100}%` }} />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {legend.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 shrink-0 rounded-full ${d.color}`} />
            <span className="flex-1 truncate text-ink-soft">{d.name}</span>
            <span className="tabular font-medium text-ink">{formatMoneyCompact(d.value, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: investments, error }, { data: payments }, { data: movements }, { data: flowRows }] = await Promise.all([
    supabase
      .from("investments")
      .select("id, created_at, name, amount, currency, category, platform, project_name, credit_amount, interest_rate, credit_term_months, payment_day, ownership_pct, purchase_price, current_value, start_date, maturity_date"),
    supabase.from("recurring_payments").select("id, name, amount, currency, due_date, category"),
    supabase.from("investment_movements").select("id, investment_id, kind, movement_date, amount, ea_rate"),
    supabase.from("cash_flows").select("id, kind, name, amount, currency, frequency, flow_date, category, property"),
  ]);
  if (error) throw new Error(error.message);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Ingresos y gastos del mes (cada moneda por separado).
  const flows = (flowRows ?? []) as CashFlow[];
  const flowTotals = monthTotals(flows, month);
  const flowMain = [...flowTotals].sort((a, b) => b.expenses - a.expenses)[0]?.currency ?? "EUR";
  const incomeMain = [...flowTotals].sort((a, b) => b.income - a.income)[0]?.currency ?? flowMain;
  const spending = byCategory(flows, month, flowMain, "expense");
  const earning = byCategory(flows, month, incomeMain, "income");
  const mainSpend = flowTotals.find((t) => t.currency === flowMain);
  const mainIncome = flowTotals.find((t) => t.currency === incomeMain);

  // Inversiones: solo tu parte (ownership_pct); lo financiero va separado de la vivienda.
  const mine = (investments ?? []).map((i) => myShare(withMovements(i, (movements ?? []) as Movement[])));
  const financial = mine.filter((i) => i.category !== "vivienda");
  const invested = sumByCurrency(financial);
  const todayValue = sumByCurrency(financial.map((i) => ({ amount: currentValue(i), currency: i.currency })));
  const allHomes = mine.filter((i) => i.category === "vivienda");
  const equity = sumByCurrency(allHomes.map((h) => ({ amount: currentValue(h) - Number(h.credit_amount ?? 0), currency: h.currency })));
  const homes = allHomes.filter((i) => i.credit_amount);
  const debt = sumByCurrency(homes.map((h) => ({ amount: h.credit_amount, currency: h.currency })));
  const cuotas = sumByCurrency(
    homes.flatMap((h) => {
      const c = monthlyPayment(h);
      return c ? [{ amount: c, currency: h.currency }] : [];
    }),
  );
  const invMain = invested.find((t) => t.currency === "COP")?.currency ?? invested[0]?.currency;
  const byType = invMain ? groupSum(financial, invMain, (i) => categoryLabel(i.category)) : [];
  const byPlatform = invMain ? groupSum(financial, invMain, (i) => i.platform || "Sin plataforma") : [];
  const find = (list: { currency: string; total: number }[], c: string) => list.find((t) => t.currency === c)?.total ?? 0;

  // Próximos pagos: cuotas de crédito (mi parte) + pagos registrados + gastos mensuales/únicos con fecha.
  const localDate = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const dueRows = [
    ...homes.flatMap((h) => {
      const cuota = monthlyPayment(h);
      const next = nextPaymentDate(h.payment_day, now);
      const progress = creditProgress(h, now);
      if (!cuota || !next || (progress && progress.paid >= (h.credit_term_months ?? 0))) return [];
      return [{ key: `c-${h.id}`, date: next, type: "Cuota crédito", concept: h.platform ? `Crédito ${h.platform}` : "Crédito vivienda", apto: h.name as string | null, amount: cuota, currency: h.currency }];
    }),
    ...(payments ?? []).map((p) => ({
      key: `p-${p.id}`,
      date: localDate(p.due_date),
      type: p.category || "Pago",
      concept: p.name,
      apto: null as string | null,
      amount: Number(p.amount),
      currency: p.currency,
    })),
    ...flows.flatMap((f) => {
      if (f.kind !== "expense" || !f.flow_date) return [];
      const date =
        f.frequency === "monthly" ? nextPaymentDate(Number(f.flow_date.slice(8, 10)), now) : f.frequency === "once" ? localDate(f.flow_date) : null;
      if (!date || date < today) return [];
      return [{ key: `f-${f.id}`, date, type: f.category || "Gasto", concept: f.name, apto: f.property, amount: Number(f.amount), currency: f.currency }];
    }),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 12);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Resumen</h1>
        <p className="mt-1 text-sm text-ink-soft">Toca una tarjeta para ver el detalle.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Tile href="/ingresos#ingresos" label="Ingresos del mes" tone="bg-teal-soft text-teal" icon={<ArrowDownRight className="h-5 w-5" />}>
          {mainIncome?.income ? (
            <>
              <Big>{formatMoneyShort(mainIncome.income, incomeMain)}</Big>
              <Breakdown data={earning} currency={incomeMain} />
              <div className="flex flex-wrap gap-2">
                {flowTotals
                  .filter((t) => t.currency !== incomeMain && t.income)
                  .map((t) => (
                    <Chip key={t.currency} tone="bg-teal-soft text-teal">
                      + {formatMoneyShort(t.income, t.currency)}
                    </Chip>
                  ))}
              </div>
            </>
          ) : (
            <Empty>Agrega honorarios, sueldos, arriendos…</Empty>
          )}
        </Tile>

        <Tile href="/ingresos#gastos" label="Gastos del mes" tone="bg-mustard-soft text-mustard" icon={<ArrowUpRight className="h-5 w-5" />}>
          {mainSpend?.expenses ? (
            <>
              <Big>{formatMoneyShort(mainSpend.expenses, flowMain)}</Big>
              <Breakdown data={spending} currency={flowMain} />
              {mainSpend.income > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Chip tone={mainSpend.left >= 0 ? "bg-teal-soft text-teal" : "bg-mustard-soft text-mustard"}>
                    Te queda {formatMoneyShort(mainSpend.left, flowMain)} · {Math.round((mainSpend.left / mainSpend.income) * 100)} %
                  </Chip>
                </div>
              )}
            </>
          ) : (
            <Empty>Agrega alquiler, mercado, servicios…</Empty>
          )}
        </Tile>

        <Tile href="/inversiones#financieras" label="Inversiones" tone="bg-stamp-soft text-stamp-dark" icon={<TrendingUp className="h-5 w-5" />}>
          {invMain ? (
            <>
              <Big>{formatMoneyShort(find(todayValue, invMain), invMain)}</Big>
              <Breakdown data={byType} currency={invMain} />
              <div className="flex flex-wrap gap-2">
                {invested.map(({ currency, total }) => {
                  const gain = find(todayValue, currency) - total;
                  return (
                    <Chip key={currency} tone={gain >= 0 ? "bg-teal-soft text-teal" : "bg-mustard-soft text-mustard"}>
                      {currency !== invMain && `${formatMoneyShort(find(todayValue, currency), currency)} · `}
                      {gain >= 0 ? "+" : ""}
                      {formatMoneyCompact(gain, currency)}
                      {total > 0 && ` · ${((gain / total) * 100).toFixed(1)} %`}
                    </Chip>
                  );
                })}
              </div>
            </>
          ) : (
            <Empty>Registra CDT, fondos o acciones.</Empty>
          )}
        </Tile>

        <Tile href="/inversiones#vivienda" label="Vivienda" tone="bg-violet-100 text-violet-700" icon={<Home className="h-5 w-5" />}>
          {equity.length ? (
            equity.map(({ currency, total }) => {
              const owed = find(debt, currency);
              const mineShare = total + owed > 0 ? Math.max(0, total / (total + owed)) : 0;
              return (
                <div key={currency} className="space-y-3">
                  <Big>{formatMoneyShort(total, currency)}</Big>
                  {owed > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-mustard">
                        <div className="bg-teal" style={{ width: `${mineShare * 100}%` }} />
                      </div>
                      <p className="flex justify-between text-xs text-ink-soft">
                        <span>Tuyo {Math.round(mineShare * 100)} %</span>
                        <span>Del banco {Math.round((1 - mineShare) * 100)} %</span>
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Chip>
                      {allHomes.length} {allHomes.length === 1 ? "inmueble" : "inmuebles"}
                    </Chip>
                    {owed > 0 && <Chip tone="bg-mustard-soft text-mustard">Deuda {formatMoneyCompact(owed, currency)}</Chip>}
                    {find(cuotas, currency) > 0 && <Chip>Cuotas {formatMoneyCompact(find(cuotas, currency), currency)}/mes</Chip>}
                  </div>
                </div>
              );
            })
          ) : (
            <Empty>Registra tus apartamentos y créditos.</Empty>
          )}
        </Tile>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Próximos pagos</h2>
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/ingresos#gastos" className="text-stamp-dark hover:underline">
              Gastos
            </Link>
            <Link href="/pagos" className="text-stamp-dark hover:underline">
              Pagos
            </Link>
          </div>
        </div>

        {dueRows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line px-5 py-10 text-center">
            <p className="text-sm text-ink-soft">
              Nada por pagar todavía. Los gastos mensuales con día, las cuotas de crédito y los pagos aparecen aquí.
            </p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-3 py-3 font-medium">Tipo</th>
                  <th className="px-3 py-3 font-medium">Concepto</th>
                  <th className="px-3 py-3 font-medium">Apartamento</th>
                  <th className="px-5 py-3 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {dueRows.map((r) => {
                  const days = Math.round((r.date.getTime() - today.getTime()) / 86_400_000);
                  return (
                    <tr key={r.key} className="transition hover:bg-stamp-soft/50">
                      <td className="tabular whitespace-nowrap px-5 py-3.5">
                        <span className="font-medium text-ink">{r.date.toLocaleDateString("es-CO")}</span>
                        <span className={`block text-xs ${days <= 5 ? "font-medium text-mustard" : "text-ink-soft"}`}>
                          {days === 0 ? "hoy" : days > 0 ? `en ${days} días` : `vencido hace ${-days} días`}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="rounded-full bg-stamp-soft px-2 py-0.5 text-xs font-medium text-stamp-dark">{r.type}</span>
                      </td>
                      <td className="px-3 py-3.5 text-ink">{r.concept}</td>
                      <td className="px-3 py-3.5 text-ink-soft">{r.apto ?? "—"}</td>
                      <td className="tabular whitespace-nowrap px-5 py-3.5 text-right font-semibold text-ink">{formatMoney(r.amount, r.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(spending.length > 0 || byType.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {spending.length > 0 && <AllocationChart title="Gastos por categoría" subtitle={`Este mes, en ${flowMain}`} data={spending} />}
          {invMain && <AllocationChart title="Inversiones por tipo" subtitle={`Distribución en ${invMain}`} data={byType} />}
          {invMain && <AllocationChart title="Por plataforma" subtitle={`Dónde está tu dinero en ${invMain}`} data={byPlatform} />}
        </div>
      )}
    </div>
  );
}
