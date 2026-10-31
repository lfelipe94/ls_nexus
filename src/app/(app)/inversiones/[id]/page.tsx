import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { addMovement, deleteMovement } from "../actions";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { appreciation, categoryLabel, impliedRate, withMovements, type Movement,creditProgress, currentValue, monthlyPayment, myShare, nextPaymentDate } from "@/lib/investments";

const inputClass =
  "w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="tabular mt-1.5 text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="tabular mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export default async function InvestmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: raw } = await supabase.from("investments").select("*").eq("id", id).single();
  if (!raw) notFound();
  const { data: movementRows } = await supabase
    .from("investment_movements")
    .select("*")
    .eq("investment_id", id)
    .order("movement_date", { ascending: true });
  const movements = (movementRows ?? []) as Movement[];
  const inv = withMovements(raw, movements);
  const hasMovements = movements.length > 0;
  const trackMovements = inv.category !== "vivienda" && inv.category !== "cdt";

  const money = (n: number) => formatMoney(n, inv.currency);
  const isHome = inv.category === "vivienda";

  // Arriendo: ingresos mensuales con el mismo nombre de apartamento y moneda (coincidencia por texto).
  let rent = 0;
  if (isHome) {
    const { data: flows } = await supabase
      .from("cash_flows")
      .select("amount, currency, property, kind, frequency")
      .not("property", "is", null);
    rent = (flows ?? [])
      .filter(
        (f) =>
          f.kind === "income" &&
          f.frequency === "monthly" &&
          f.currency === inv.currency &&
          f.property.toLowerCase() === inv.name.toLowerCase()
      )
      .reduce((total, f) => total + Number(f.amount), 0);
  }
  // Con un valor actual real (del extracto) se despeja la tasa E.A. que explica lo que llevas.
  const implied =
    trackMovements && raw.current_value != null
      ? impliedRate(raw, movements, Number(raw.current_value))
      : null;
  const growth = isHome ? appreciation(inv) : null;
  const pctFmt = (n: number) => `${(n * 100).toFixed(1)} %`;
  const pct = Number(inv.ownership_pct);
  const mine = myShare(inv);
  const home = inv.category === "vivienda" && inv.credit_amount;
  const cuota = home ? monthlyPayment(inv) : null;
  const next = home ? nextPaymentDate(inv.payment_day) : null;
  const progress = home ? creditProgress(inv) : null;
  const totalPaid = cuota && inv.credit_term_months ? cuota * inv.credit_term_months : null;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/inversiones" className="text-sm text-stamp-dark underline underline-offset-4">
          ← Volver a inversiones
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">{inv.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
              <span className="rounded-full bg-stamp-soft px-2 py-0.5 text-xs font-medium text-stamp-dark">
                {categoryLabel(inv.category)}
              </span>
              {inv.platform && <span>{inv.platform}</span>}
              {inv.project_name && <span>· {inv.project_name}</span>}
            </p>
          </div>
          <Link
            href={`/inversiones/${inv.id}/editar`}
            className="flex shrink-0 items-center gap-1.5 rounded border border-line px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper-raised"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isHome ? (
          <>
            <Stat label="Mi parte del valor hoy" value={money(currentValue(mine))} hint={`${pct}% de ${money(currentValue(inv))}`} />
            <Stat label="Aportado (mi parte)" value={money(mine.amount)} hint="Cuota inicial + abonos" />
            <Stat
              label="Patrimonio neto"
              value={money(currentValue(mine) - Number(mine.credit_amount ?? 0))}
              hint="Mi parte del valor menos mi deuda"
            />
            {inv.purchase_price != null && (
              <Stat
                label="Valorización"
                value={money(currentValue(mine) - Number(mine.purchase_price))}
                hint={
                  growth
                    ? `${pctFmt(growth.total)} total${growth.yearly != null ? ` · ${pctFmt(growth.yearly)} anual` : ""}`
                    : `Compra ${money(Number(mine.purchase_price))} (mi parte)`
                }
              />
            )}
            {growth && (
              <Stat
                label="Tiempo de tenencia"
                value={`${growth.years} años, ${growth.months} meses`}
                hint={`Compra ${new Date(inv.purchase_date).toLocaleDateString("es-CO")} · ${growth.days} días`}
              />
            )}
          </>
        ) : (
          <>
            <Stat label="Mi parte invertida" value={money(mine.amount)} hint={`${pct}% de ${money(Number(inv.amount))}`} />
            <Stat
              label={inv.category === "cdt" ? "Valor estimado hoy" : "Valor hoy"}
              value={money(currentValue(mine))}
              hint={`Rendimiento ${money(currentValue(mine) - mine.amount)}`}
            />
            {inv.interest_rate != null && <Stat label="Tasa" value={`${inv.interest_rate}% E.A.`} />}
            {implied != null && (
              <Stat
                label="Tasa E.A. real estimada"
                value={`${(implied * 100).toFixed(2)} % E.A.`}
                hint="Según tu valor actual, aportes y retiros"
              />
            )}
            {inv.start_date && <Stat label="Inicio" value={new Date(inv.start_date).toLocaleDateString("es-CO")} />}
            {inv.maturity_date && (
              <Stat
                label="Vencimiento"
                value={new Date(inv.maturity_date).toLocaleDateString("es-CO")}
                hint={`${Math.ceil((new Date(inv.maturity_date).getTime() - new Date().getTime()) / 86_400_000)} días restantes`}
              />
            )}
          </>
        )}
      </div>

      {home && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Crédito de vivienda</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              label="Mi deuda"
              value={money(Number(mine.credit_amount))}
              hint={`Crédito total ${money(Number(inv.credit_amount))}`}
            />
            {cuota && (
              <Stat
                label="Mi cuota mensual"
                value={money(cuota * (pct / 100))}
                hint={`Cuota total ≈ ${money(cuota)}`}
              />
            )}
            {next && (
              <Stat
                label="Próximo pago"
                value={next.toLocaleDateString("es-CO")}
                hint={`Día ${inv.payment_day} de cada mes`}
              />
            )}
            {inv.interest_rate != null && <Stat label="Tasa" value={`${inv.interest_rate}% E.A.`} />}
            {inv.credit_term_months && (
              <Stat
                label="Plazo"
                value={`${inv.credit_term_months} meses`}
                hint={`${(inv.credit_term_months / 12).toFixed(1)} años`}
              />
            )}
            {totalPaid && (
              <Stat
                label="Intereses de mi parte"
                value={money((totalPaid - Number(inv.credit_amount)) * (pct / 100))}
                hint="Estimado de todo el plazo, sin seguros"
              />
            )}
            {progress && (
              <>
                <Stat
                  label="Saldo de mi deuda hoy"
                  value={money(progress.balance * (pct / 100))}
                  hint={`${progress.paid} de ${inv.credit_term_months} cuotas pagadas`}
                />
                <Stat
                  label="Intereses ya pagados (mi parte)"
                  value={money(progress.interestPaid * (pct / 100))}
                />
              </>
            )}
          </div>
        </section>
      )}

      {isHome && cuota && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Arriendo y bolsillo</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="Mi cuota" value={money(cuota * (pct / 100))} />
            <Stat
              label="Arriendo que recibo"
              value={money(rent)}
              hint={rent ? undefined : `Regístralo en Ingresos con apartamento "${inv.name}"`}
            />
            <Stat label="Sale de mi bolsillo" value={money(Math.max(0, cuota * (pct / 100) - rent))} />
          </div>
        </section>
      )}

      {trackMovements && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Aportes, retiros y tasa E.A.</h2>
          <p className="text-sm text-ink-soft">
            {hasMovements
              ? `El monto invertido y el valor de hoy se estiman con estos movimientos y la tasa vigente en cada tramo${raw.current_value != null ? " (tienes un valor actual escrito a mano: ese manda sobre la estimación)" : ""}.`
              : "Registra cada vez que pones o sacas dinero, y cómo cambia la tasa E.A., para estimar cuánto ha crecido."}
          </p>
          <form
            action={addMovement.bind(null, inv.id)}
            className="card grid grid-cols-1 gap-3 p-5 sm:grid-cols-5"
          >
            <select name="kind" className={inputClass} aria-label="Tipo de movimiento">
              <option value="deposit">Aporte</option>
              <option value="withdrawal">Retiro</option>
              <option value="rate">Cambio de tasa E.A.</option>
            </select>
            <input name="movement_date" type="date" required className={inputClass} aria-label="Fecha" />
            <input name="amount" type="number" step="0.01" min="0" placeholder="Monto (aporte/retiro)" className={`tabular ${inputClass}`} />
            <input name="ea_rate" type="number" step="0.001" placeholder="Tasa E.A. % (si es tasa)" className={`tabular ${inputClass}`} />
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110"
            >
              Agregar
            </button>
          </form>
          {hasMovements && (
            <ul className="card divide-y divide-line overflow-hidden">
              {movements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {m.kind === "deposit" ? "Aporte" : m.kind === "withdrawal" ? "Retiro" : "Tasa E.A."}
                    </p>
                    <p className="text-xs text-ink-soft">{new Date(m.movement_date).toLocaleDateString("es-CO")}</p>
                  </div>
                  <span className="tabular ml-auto text-sm font-semibold text-ink">
                    {m.kind === "rate"
                      ? `${m.ea_rate} % E.A.`
                      : `${m.kind === "withdrawal" ? "−" : "+"}${money(Number(m.amount))}`}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await deleteMovement(m.id, inv.id);
                    }}
                  >
                    <ConfirmDeleteButton label="Eliminar" confirmMessage="¿Eliminar este movimiento?" />
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {inv.notes && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">Notas</h2>
          <p className="card p-5 text-sm text-ink">{inv.notes}</p>
        </section>
      )}
    </div>
  );
}
