import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { sumByCurrency, paymentsByMonth, groupSum } from "@/lib/aggregations";
import { categoryLabel, currentValue, monthlyPayment, myShare, nextPaymentDate } from "@/lib/investments";
import { AllocationChart, InvestmentsByCurrencyChart, PaymentsByMonthChart } from "@/components/DashboardCharts";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: investments, error }, { data: upcomingPayments }, { data: allPayments }] =
    await Promise.all([
      supabase
        .from("investments")
        .select("name, amount, currency, category, platform, project_name, credit_amount, interest_rate, credit_term_months, payment_day, ownership_pct, purchase_price, current_value, start_date, maturity_date"),
      supabase
        .from("recurring_payments")
        .select("id, name, amount, currency, due_date")
        .order("due_date", { ascending: true })
        .limit(5),
      supabase.from("recurring_payments").select("amount, currency, due_date"),
    ]);

  if (error) throw new Error(error.message);

  // Todo el dashboard usa solo tu parte (ownership_pct) de cada inversión.
  const mine = (investments ?? []).map(myShare);
  // Lo financiero (CDT, fondos…) va separado de la vivienda.
  const financial = mine.filter((i) => i.category !== "vivienda");
  const investmentTotals = sumByCurrency(financial);
  const todayTotals = sumByCurrency(financial.map((i) => ({ amount: currentValue(i), currency: i.currency })));
  const allHomes = mine.filter((i) => i.category === "vivienda");
  const equityTotals = sumByCurrency(
    allHomes.map((h) => ({ amount: currentValue(h) - Number(h.credit_amount ?? 0), currency: h.currency }))
  );
  const homes = allHomes.filter((i) => i.credit_amount);
  const debtTotals = sumByCurrency(homes.map((h) => ({ amount: h.credit_amount, currency: h.currency })));
  const cuotaTotals = sumByCurrency(
    homes.flatMap((h) => {
      const c = monthlyPayment(h);
      return c ? [{ amount: c, currency: h.currency }] : [];
    })
  );
  // Las monedas no se suman: las gráficas de distribución usan la moneda principal.
  const main = investmentTotals.find((t) => t.currency === "COP")?.currency ?? investmentTotals[0]?.currency;
  const byCategory = main ? groupSum(financial, main, (i) => categoryLabel(i.category)) : [];
  const byPlatform = main ? groupSum(financial, main, (i) => i.platform || "Sin plataforma") : [];
  const { data: monthlyData, currencies } = paymentsByMonth(allPayments ?? []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Resumen</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Lo esencial de tu situación financiera, de un vistazo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {investmentTotals.map(({ currency, total }) => (
          <div
            key={currency}
            className="rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-500/30"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              Invertido en {currency}
            </p>
            <p className="tabular mt-2 text-3xl font-semibold">{formatMoney(total, currency)}</p>
            <p className="tabular mt-1 text-xs text-white/70">
              Hoy ≈ {formatMoney(todayTotals.find((t) => t.currency === currency)?.total ?? total, currency)}
            </p>
          </div>
        ))}
        {equityTotals.map(({ currency, total }) => (
          <div key={`e${currency}`} className="card p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              Patrimonio en vivienda ({currency})
            </p>
            <p className="tabular mt-2 text-3xl font-semibold text-ink">{formatMoney(total, currency)}</p>
            <p className="text-xs text-ink-soft">Valor de mi parte menos mi deuda</p>
          </div>
        ))}
        {debtTotals.map(({ currency, total }) => (
          <div key={`d${currency}`} className="card p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              Deuda de vivienda en {currency}
            </p>
            <p className="tabular mt-2 text-3xl font-semibold text-ink">{formatMoney(total, currency)}</p>
            <p className="tabular mt-1 text-xs text-ink-soft">
              Cuotas ≈ {formatMoney(cuotaTotals.find((c) => c.currency === currency)?.total ?? 0, currency)} / mes
            </p>
          </div>
        ))}
        <div className="card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Inversiones registradas
          </p>
          <p className="tabular mt-2 text-3xl font-semibold text-ink">{investments?.length ?? 0}</p>
        </div>
        <div className="card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            Pagos próximos
          </p>
          <p className="tabular mt-2 text-3xl font-semibold text-ink">
            {upcomingPayments?.length ?? 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InvestmentsByCurrencyChart data={investmentTotals} />
        <PaymentsByMonthChart data={monthlyData} currencies={currencies} />
      </div>

      {main && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AllocationChart title="Por tipo" subtitle={`Distribución en ${main}`} data={byCategory} />
          <AllocationChart title="Por plataforma" subtitle={`Dónde está tu dinero en ${main}`} data={byPlatform} />
        </div>
      )}

      {homes.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink">Créditos de vivienda</h2>
          <ul className="card divide-y divide-line overflow-hidden">
            {homes.map((h, i) => {
              const cuota = monthlyPayment(h);
              const next = nextPaymentDate(h.payment_day);
              return (
                <li key={i} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{h.project_name || h.name}</p>
                    <p className="tabular text-sm text-ink-soft">
                      {[h.platform, h.interest_rate != null && `${h.interest_rate}% E.A.`, next && `próx. pago ${next.toLocaleDateString("es-CO")}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="tabular shrink-0 text-right">
                    <p className="font-semibold text-ink">{formatMoney(Number(h.credit_amount), h.currency)}</p>
                    {cuota && <p className="text-xs text-ink-soft">cuota ≈ {formatMoney(cuota, h.currency)}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Próximos pagos</h2>
          <Link href="/pagos" className="text-sm font-medium text-stamp-dark hover:underline">
            Ver todos
          </Link>
        </div>

        {!upcomingPayments || upcomingPayments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line px-5 py-10 text-center">
            <p className="text-sm text-ink-soft">No tienes pagos registrados todavía.</p>
            <Link
              href="/pagos"
              className="mt-3 inline-block text-sm font-medium text-stamp-dark underline underline-offset-4"
            >
              Agregar el primero
            </Link>
          </div>
        ) : (
          <ul className="card divide-y divide-line overflow-hidden">
            {upcomingPayments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-stamp-soft/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{p.name}</p>
                  <p className="tabular text-sm text-ink-soft">
                    {new Date(p.due_date).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <span className="tabular shrink-0 text-base font-semibold text-ink">
                  {formatMoney(Number(p.amount), p.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
